// src/controllers/parkingController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const ParkingLot = require('../models/ParkingLot');

// TARIFA DE PARQUEO: $2.50 por hora (valor realista)
const RATE_PER_HOUR = 2.50;
const PARKING_LOT_NAME = process.env.PARKING_LOT_NAME || 'Parqueo Principal';

/**
 * @desc Asigna un espacio de parqueo disponible al usuario autenticado.
 * @route POST /api/parking/assign
 * @access Private
 */
const assignSpace = asyncHandler(async (req, res) => {
    const userId = req.userId; // Obtenido del middleware de protección

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // 1. Verificar si el usuario ya tiene un espacio asignado
    if (user.currentParkingSpace) {
        res.status(400);
        throw new Error(`Ya tienes el espacio ${user.currentParkingSpace} asignado.`);
    }

    // 2. Buscar y actualizar atómicamente el primer espacio disponible
    const entryTime = new Date();
    const parkingLot = await ParkingLot.findOneAndUpdate(
        {
            name: PARKING_LOT_NAME,
            "spaces.isOccupied": false
        },
        {
            $set: {
                "spaces.$.isOccupied": true,
                "spaces.$.occupiedBy": userId,
                "spaces.$.entryTime": entryTime,
            },
            $inc: { availableSpaces: -1 }
        },
        { new: true }
    );

    if (!parkingLot) {
        res.status(503);
        throw new Error('Parqueo lleno. Intente más tarde.');
    }

    // 3. Encontrar el espacio que acabamos de asignar
    const assignedSpace = parkingLot.spaces.find(s => s.occupiedBy && s.occupiedBy.equals(userId));

    if (!assignedSpace) {
        res.status(500);
        throw new Error('Error al asignar espacio. Contacte al administrador.');
    }

    // 4. Actualizar el usuario
    user.currentParkingSpace = assignedSpace.spaceNumber;
    user.entryTime = entryTime;
    user.hasPaid = false;

    await user.save();

    res.status(200).json({
        message: 'Espacio asignado con éxito',
        space: assignedSpace.spaceNumber,
        entryTime: user.entryTime,
        rate: `$${RATE_PER_HOUR} por hora`
    });
});

/**
 * @desc Simula el proceso de pago del usuario.
 * @route POST /api/parking/pay
 * @access Private
 */
const payParking = asyncHandler(async (req, res) => {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Verificar si el usuario tiene un espacio asignado para pagar
    if (!user.currentParkingSpace) {
        res.status(400);
        throw new Error('No tienes un vehículo registrado en el parqueo para pagar.');
    }

    // Verificar si ya ha pagado
    if (user.hasPaid) {
        res.status(400);
        throw new Error('Ya has realizado el pago para este estacionamiento.');
    }

    // Calcular el costo basado en horas
    const entryTime = user.entryTime;
    const currentTime = new Date();
    const durationMs = currentTime - entryTime;
    const durationHours = durationMs / (1000 * 60 * 60); // Tiempo en horas
    const durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Para mostrar al usuario

    // Cobrar por hora completa o fracción (redondear hacia arriba)
    const hoursToCharge = Math.ceil(durationHours);
    const totalCost = (hoursToCharge * RATE_PER_HOUR).toFixed(2);

    // Actualizar el estado de pago del usuario
    user.hasPaid = true;
    await user.save();

    res.status(200).json({
        message: 'Pago registrado con éxito. Puede proceder a la salida.',
        costoPagado: `$${totalCost}`,
        tiempoEstancia: `${durationMinutes} minutos`,
        horasCobradas: hoursToCharge,
        tarifaPorHora: `$${RATE_PER_HOUR}`,
        hasPaid: user.hasPaid
    });
});

/**
 * @desc Libera el espacio de parqueo, calcula el costo total y valida el pago.
 * @route POST /api/parking/release
 * @access Private
 */
const releaseSpace = asyncHandler(async (req, res) => {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // 1. Verificar si el usuario tiene un vehículo registrado
    if (!user.currentParkingSpace) {
        res.status(400);
        throw new Error('No tienes un vehículo registrado para salir.');
    }

    const entryTime = user.entryTime;
    const currentTime = new Date();

    // Calcular la duración y el costo TOTAL
    const durationMs = currentTime - entryTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const hoursToCharge = Math.ceil(durationHours);
    const totalCost = (hoursToCharge * RATE_PER_HOUR).toFixed(2);

    // 2. LÓGICA CRÍTICA: Validar Pago
    if (!user.hasPaid) {
        res.status(402).json({
            message: 'Salida denegada. Debe pagar el servicio de parqueo.',
            requiredAction: 'Pagar en /api/parking/pay',
            timeSpent: `${durationMinutes} minutos`,
            horasCobrar: hoursToCharge,
            totalCost: `$${totalCost}`
        });
        return;
    }

    // 3. Liberar el espacio en el Lote
    const parkingLot = await ParkingLot.findOne({ name: PARKING_LOT_NAME });

    if (!parkingLot) {
        res.status(500);
        throw new Error('Error: No se encontró la configuración del parqueo.');
    }

    const spaceToRelease = parkingLot.spaces.find(s => s.spaceNumber === user.currentParkingSpace);

    if (spaceToRelease) {
        spaceToRelease.isOccupied = false;
        spaceToRelease.occupiedBy = null;
        spaceToRelease.entryTime = null;

        // CORRECCIÓN CRÍTICA: Incrementar el contador de espacios disponibles
        parkingLot.availableSpaces += 1;

        await parkingLot.save();
    }

    // 4. Limpiar los campos del usuario
    const releasedSpace = user.currentParkingSpace;
    user.currentParkingSpace = null;
    user.entryTime = null;
    user.hasPaid = false; // Resetear para el próximo uso

    await user.save();

    // 5. Respuesta de Salida Exitosa
    res.status(200).json({
        message: `¡Salida exitosa! Espacio ${releasedSpace} liberado. Barrera abierta.`,
        timeSpent: `${durationMinutes} minutos`,
        horasCobradas: hoursToCharge,
        costFinal: `$${totalCost}`
    });
});

/**
 * @desc Obtiene el estado actual del parqueo (para vista de administrador/dashboard).
 * @route GET /api/parking/status
 * @access Private (Solo administradores)
 */
const getParkingStatus = asyncHandler(async (req, res) => {
    const parkingLot = await ParkingLot.findOne({ name: PARKING_LOT_NAME })
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

    res.status(200).json({
        parkingLotName: parkingLot.name,
        location: parkingLot.location,
        totalSpaces,
        occupiedSpaces,
        availableSpaces,
        occupiedDetails,
        ratePerHour: `$${RATE_PER_HOUR}`
    });
});

module.exports = {
    assignSpace,
    payParking,
    releaseSpace,
    getParkingStatus,
};
