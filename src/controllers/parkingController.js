const asyncHandler = require('express-async-handler');
const ParkingLot = require('../models/ParkingLot');
const User = require('../models/user');
const PricingPlan = require('../models/PricingPlan');
const logger = require('../config/logger');
const { logAudit } = require('../utils/auditLogger');
const { calculateCost } = require('../utils/pricingEngine');
const { USER_ROLES } = require('../config/constants');
const mqttService = require('../services/mqttService');
const { emitParkingStatus, notifyUser } = require('../services/socketService');
const { getCache, setCache, deleteCache } = require('../config/redisClient');

const CACHE_KEY_STATUS = 'parking_status_';
const RATE_PER_HOUR = 10.00; // Tarifa base por hora

/**
 * @desc Lista todos los parqueos disponibles con su estado
 * @route GET /api/parking/lots
 * @access Private
 */
const getParkingLots = asyncHandler(async (req, res) => {
    const parkingLots = await ParkingLot.find()
        .select('name location totalSpaces');

    if (!parkingLots || parkingLots.length === 0) {
        res.status(404);
        throw new Error('No hay parqueos disponibles');
    }

    const lotsWithStatus = parkingLots.map(lot => ({
        id: lot._id,
        name: lot.name,
        location: lot.location,
        totalSpaces: lot.totalSpaces,
        occupiedSpaces: lot.spaces.filter(s => s.isOccupied).length,
        availableSpaces: lot.spaces.filter(s => !s.isOccupied).length
    }));

    res.status(200).json({
        message: 'Parqueos disponibles',
        data: lotsWithStatus
    });
});

/**
 * @desc Asigna un espacio de parqueo disponible al usuario autenticado.
 * @route POST /api/parking/assign
 * @access Private
 */
const assignSpace = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { parkingLotId } = req.body;

    if (!parkingLotId) {
        res.status(400);
        throw new Error('Debe proporcionar el ID del parqueo (parkingLotId)');
    }

    // 1. Verificar si el usuario ya tiene un espacio asignado
    const user = await User.findById(userId);
    if (user.currentParkingSpace) {
        res.status(400);
        throw new Error(`Usuario ya tiene asignado el espacio ${user.currentParkingSpace} en otro parqueo`);
    }

    // 2. Buscar parqueo y espacio disponible
    // Usamos transacción para garantizar atomicidad (si MongoDB está en réplica set, sino simular)
    const session = await ParkingLot.startSession();
    session.startTransaction();

    try {
        const parkingLot = await ParkingLot.findById(parkingLotId).session(session);

        if (!parkingLot) {
            throw new Error('Parqueo no encontrado');
        }

        const availableSpace = parkingLot.spaces.find(s => !s.isOccupied);

        if (!availableSpace) {
            res.status(404);
            throw new Error('No hay espacios disponibles en este parqueo');
        }

        // 3. Asignar espacio
        availableSpace.isOccupied = true;
        availableSpace.occupiedBy = userId;
        availableSpace.entryTime = new Date();

        // Actualizar usuario
        user.currentParkingLot = parkingLot._id;
        user.currentParkingSpace = availableSpace.spaceNumber;
        user.entryTime = availableSpace.entryTime;
        user.hasPaid = false;

        await parkingLot.save({ session });
        await user.save({ session });

        await session.commitTransaction();

        const entryTime = availableSpace.entryTime;

        // AUDIT LOG
        logAudit(req, 'ASSIGN_SPACE', 'ParkingLot', {
            space: availableSpace.spaceNumber,
            entryTime: entryTime
        });

        // NOTIFICAR POR SOCKET
        emitParkingStatus({
            availableSpaces: parkingLot.availableSpaces, // Esto podría necesitar recalcularse o usarse un getter virtual
            lastAction: 'ASSIGN',
            space: availableSpace.spaceNumber
        });

        notifyUser(userId, 'space_assigned', {
            space: availableSpace.spaceNumber,
            entryTime
        });

        // INVALIDAR CACHÉ
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);

        res.status(200).json({
            message: 'Espacio asignado con éxito',
            parkingLot: parkingLot.name,
            space: availableSpace.spaceNumber,
            entryTime: entryTime,
            info: 'La tarifa se calculará al salir según su plan.'
        });

    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error asignando espacio: ${error.message}`);
        res.status(500);
        throw new Error(error.message);
    } finally {
        session.endSession();
    }
});

/**
 * @desc Simula el pago del parqueo.
 * @route POST /api/parking/pay
 * @access Private
 */
const payParking = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user.currentParkingSpace || !user.currentParkingLot) {
        res.status(400);
        throw new Error('No tiene un espacio asignado actualmente');
    }

    if (user.hasPaid) {
        res.status(400);
        throw new Error('Ya ha realizado el pago para esta sesión');
    }

    // Determinar Plan de Precios
    let plan = null;
    if (user.subscriptionPlan && user.subscriptionExpiresAt > new Date()) {
        plan = await PricingPlan.findById(user.subscriptionPlan);
    }

    if (!plan) {
        // Buscar plan por defecto o por rol
        // Por ahora usamos lógica simple o buscamos un plan 'HOURLY' por defecto
        plan = await PricingPlan.findOne({ type: 'HOURLY' }); // Asumiendo que existe

        // Fallback si no hay planes en DB
        if (!plan) {
            plan = { baseRate: 10, type: 'HOURLY', rules: {} };
        }

        // Override para catedráticos si no tienen plan específico
        if (user.role === USER_ROLES.FACULTY) {
            // Podríamos buscar un plan FACULTY_SPECIAL
            const facultyPlan = await PricingPlan.findOne({ type: 'FACULTY_SPECIAL' });
            if (facultyPlan) plan = facultyPlan;
        }
    }

    const calculation = calculateCost(plan, user.entryTime, new Date());
    const totalCost = calculation.totalAmount;

    // Simular procesamiento de pago...
    // Aquí iría la integración con Stripe/Pasarela

    user.hasPaid = true;
    user.lastPaymentAmount = totalCost;
    await user.save();

    logAudit(req, 'PAYMENT', 'User', {
        amount: totalCost,
        space: user.currentParkingSpace,
        plan: plan.name || 'Standard'
    });

    res.status(200).json({
        message: 'Pago realizado con éxito',
        amount: totalCost,
        space: user.currentParkingSpace,
        details: calculation
    });
});

/**
 * @desc Libera el espacio de parqueo (Salida).
 * @route POST /api/parking/release
 * @access Private
 */
const releaseSpace = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user.currentParkingSpace) {
        res.status(400);
        throw new Error('No tiene un espacio asignado para liberar');
    }

    // Verificar pago (excepto si es Admin/Guardia que pueden forzar salida, o si el costo es 0)
    // Para simplificar, requerimos pago si no es 0.
    // En un flujo real, la barrera no se abre si no ha pagado.

    // Recalcular costo para asegurar
    // ... (lógica omitida por brevedad, asumimos que payParking ya manejó esto o es gratis)

    if (!user.hasPaid) {
        // Verificar si es gratis (ej. suscripción activa)
        let isFree = false;
        if (user.subscriptionPlan && user.subscriptionExpiresAt > new Date()) {
            isFree = true;
        }

        if (!isFree) {
            res.status(402); // Payment Required
            throw new Error('Debe pagar el parqueo antes de salir.');
        }
    }

    const session = await ParkingLot.startSession();
    session.startTransaction();

    try {
        const parkingLot = await ParkingLot.findOne({ name: PARKING_LOT_NAME }).session(session);
        const spaceIndex = parkingLot.spaces.findIndex(s => s.spaceNumber === user.currentParkingSpace);

        if (spaceIndex === -1) {
            throw new Error('Espacio no encontrado en el mapa del parqueo');
        }

        const space = parkingLot.spaces[spaceIndex];
        const releasedSpace = space.spaceNumber;

        // Calcular duración final
        const exitTime = new Date();
        const durationMs = exitTime - space.entryTime;
        const durationMinutes = Math.ceil(durationMs / (1000 * 60));

        // Liberar espacio
        space.isOccupied = false;
        space.occupiedBy = null;
        space.entryTime = null;

        // Limpiar usuario
        user.currentParkingSpace = null;
        user.entryTime = null;
        user.hasPaid = false;

        await parkingLot.save({ session });
        await user.save({ session });

        await session.commitTransaction();

        // 6. Abrir Barrera (IoT)
        // Intentar abrir barrera de salida
        try {
            await mqttService.openGate('GATE_MAIN_EXIT', userId);
        } catch (mqttError) {
            logger.warn(`No se pudo abrir barrera automáticamente: ${mqttError.message}`);
            // No fallamos la transacción por esto, pero avisamos
        }

        // AUDIT LOG
        logAudit(req, 'RELEASE_SPACE', 'ParkingLot', {
            space: releasedSpace,
            durationMinutes
        });

        // NOTIFICAR POR SOCKET
        emitParkingStatus({
            availableSpaces: parkingLot.availableSpaces, // Recalcular si es necesario
            lastAction: 'RELEASE',
            space: releasedSpace
        });

        notifyUser(userId, 'payment_success', {
            message: 'Salida registrada. Barrera abierta.',
            space: releasedSpace
        });

        // INVALIDAR CACHÉ
        await deleteCache(CACHE_KEY_STATUS);

        // 7. Respuesta de Salida Exitosa
        res.status(200).json({
            message: `¡Salida exitosa! Espacio ${releasedSpace} liberado. Barrera abierta.`,
            timeSpent: `${durationMinutes} minutos`,
            info: 'Gracias por su visita.'
        });

    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error liberando espacio: ${error.message}`);
        res.status(500);
        throw new Error(error.message);
    } finally {
        session.endSession();
    }
});

/**
 * @desc Obtiene el estado actual del parqueo (Espacios ocupados/disponibles)
 * @route GET /api/parking/status
 * @access Private (Solo administradores)
 */
const getParkingStatus = asyncHandler(async (req, res) => {
    // 1. Intentar obtener de caché
    const cachedData = await getCache(CACHE_KEY_STATUS);
    if (cachedData) {
        // logger.info('Cache HIT: parking_status'); 
        return res.status(200).json(cachedData);
    }

    // Soportar búsqueda por ID o nombre (para compatibilidad)
    const { parkingLotId, parkingLotName } = req.query;
    let query = {};
    
    if (parkingLotId) {
        query._id = parkingLotId;
    } else if (parkingLotName) {
        query.name = parkingLotName;
    } else {
        // Si no especifica, obtener el primer parqueo o lanzar error
        const firstLot = await ParkingLot.findOne();
        if (!firstLot) {
            res.status(404);
            throw new Error('No hay parqueos disponibles');
        }
        query._id = firstLot._id;
    }

    // 2. Si no hay caché, consultar DB
    const parkingLot = await ParkingLot.findOne(query)
        .populate('spaces.occupiedBy', 'name email vehiclePlate'); // Incluir detalles del usuario

    if (!parkingLot) {
        res.status(404);
        throw new Error('No se encontró la configuración del parqueo.');
    }

    // Calcular el número de espacios ocupados y disponibles
    const totalSpaces = parkingLot.spaces.length;
    const occupiedSpaces = parkingLot.spaces.filter(space => space.isOccupied).length;
    const availableSpaces = totalSpaces - occupiedSpaces;

    // Crear un resumen de los espacios ocupados con información del usuario
    const occupiedDetails = parkingLot.spaces
        .filter(space => space.isOccupied)
        .map(space => {
            const durationMs = new Date() - space.entryTime;
            const durationMinutes = Math.ceil(durationMs / (1000 * 60));
            const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
            const estimatedCost = (durationHours * RATE_PER_HOUR).toFixed(2);

            return {
                spaceNumber: space.spaceNumber,
                occupiedBy: space.occupiedBy ? {
                    name: space.occupiedBy.name,
                    email: space.occupiedBy.email,
                    vehiclePlate: space.occupiedBy.vehiclePlate
                } : null,
                entryTime: space.entryTime,
                durationMinutes: durationMinutes,
                estimatedCost: `$${estimatedCost}`
            };
        });

    const responseData = {
        parkingLotId: parkingLot._id,
        parkingLotName: parkingLot.name,
        location: parkingLot.location,
        totalSpaces,
        occupiedSpaces,
        availableSpaces,
        occupiedDetails,
        ratePerHour: `$${RATE_PER_HOUR}`
    };

    // 3. Guardar en caché (TTL 5 segundos)
    await setCache(CACHE_KEY_STATUS + parkingLot._id, responseData, 5);

    res.status(200).json(responseData);
});

/**
 * @desc Abre la barrera manualmente (Admin/Guardia) o automáticamente al pagar.
 * @route POST /api/parking/gate/open
 * @access Private (Admin, Guard, o Usuario Pagado)
 */
const openGate = asyncHandler(async (req, res) => {
    const { gateId } = req.body;
    const userId = req.userId;
    const userRole = req.user.role; // Asumiendo que authMiddleware popula req.user

    // Validar permisos: Solo Admin/Guardia pueden abrir cualquier barrera.
    // Usuarios normales solo pueden abrir si han pagado y están en salida (lógica simplificada aquí)
    if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.GUARD) {
        // Verificar si es usuario normal intentando salir
        // Aquí podríamos validar si ya pagó, etc.
        // Por ahora, permitimos para demo si envía su propio ID
    }

    const targetGate = gateId || 'GATE_MAIN_EXIT';

    try {
        const result = await mqttService.openGate(targetGate, userId);

        logAudit(req, 'OPEN_GATE', 'IoT_Gate', {
            gateId: targetGate,
            simulated: result.simulated
        });

        res.status(200).json({
            message: `Comando de apertura enviado a ${targetGate}`,
            details: result
        });
    } catch (error) {
        res.status(500);
        throw new Error(`Falló la apertura de barrera: ${error.message}`);
    }
});

module.exports = {
    getParkingLots,
    assignSpace,
    payParking,
    releaseSpace,
    getParkingStatus,
    openGate
};
