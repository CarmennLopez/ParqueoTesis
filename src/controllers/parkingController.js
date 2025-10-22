// src/controllers/parkingController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const ParkingLot = require('../models/ParkingLot');

// TARIFA DE PARQUEO: $1.50 por minuto (solo para el ejemplo)
const RATE_PER_MINUTE = 1.50;

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
        { "spaces.isOccupied": false }, // Condición de búsqueda: un lote con al menos un espacio libre
        {
            $set: {
                "spaces.$.isOccupied": true, // Marca el espacio encontrado como ocupado
                "spaces.$.occupiedBy": userId,
                "spaces.$.entryTime": entryTime,
            },
            $inc: { availableSpaces: -1 } // Decrementa el contador de espacios disponibles
        },
        { new: true } // Devuelve el documento actualizado
    );

    if (!parkingLot) {
        res.status(503); // Service Unavailable (Parqueo lleno)
        throw new Error('Parqueo lleno. Intente más tarde.');
    }

    // Encontrar el espacio que acabamos de asignar para obtener su número
    const assignedSpace = parkingLot.spaces.find(s => s.occupiedBy && s.occupiedBy.equals(userId));

    // 4. Actualizar el usuario
    user.currentParkingSpace = assignedSpace.spaceNumber;
    user.entryTime = entryTime;
    user.hasPaid = false; // Resetear el estado de pago al ingresar

    await user.save();

    res.status(200).json({
        message: 'Espacio asignado con éxito',
        space: assignedSpace.spaceNumber,
        entryTime: user.entryTime
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

    // 1. Calcular el costo (Lógica simplificada: simula que el costo se calculó en un paso previo)

    // Calculamos el tiempo de estancia actual para mostrar un recibo
    const entryTime = user.entryTime;
    const currentTime = new Date();
    const durationMs = currentTime - entryTime;
    const durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Tiempo en minutos
    const totalCost = (durationMinutes * RATE_PER_MINUTE).toFixed(2);

    // 2. Actualizar el estado de pago del usuario
    user.hasPaid = true;
    await user.save();

    res.status(200).json({
        message: 'Pago registrado con éxito. Puede proceder a la salida.',
        costoPagado: `$${totalCost}`,
        tiempo: `${durationMinutes} minutos`,
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
    const durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Redondea al minuto superior
    const totalCost = (durationMinutes * RATE_PER_MINUTE).toFixed(2);

    // 2. LÓGICA CRÍTICA: Validar Pago
    if (!user.hasPaid) {
        // Barrera denegada: Pide el pago
        res.status(402).json({
            message: 'Salida denegada. Debe pagar el servicio de parqueo.',
            requiredAction: 'Pagar en /api/parking/pay',
            timeSpent: `${durationMinutes} minutos`,
            totalCost: `$${totalCost}`
        });
        return; // Detiene la ejecución
    }

    // 3. Liberar el espacio en el Lote
    const parkingLot = await ParkingLot.findOne({});
    const spaceToRelease = parkingLot.spaces.find(s => s.spaceNumber === user.currentParkingSpace);

    if (spaceToRelease) {
        spaceToRelease.isOccupied = false;
        spaceToRelease.occupiedBy = null;
        spaceToRelease.entryTime = null;
        await parkingLot.save();
    }

    // 4. Limpiar los campos del usuario
    const releasedSpace = user.currentParkingSpace;
    user.currentParkingSpace = null; // Usar null para limpiar el campo
    user.entryTime = null;         // Usar null para limpiar el campo
    // user.hasPaid ya se reinicia al entrar, pero podemos asegurarlo aquí también.

    await user.save();

    // 5. Respuesta de Salida Exitosa
    res.status(200).json({
        message: `¡Salida exitosa! Espacio ${releasedSpace} liberado. Barrera abierta.`,
        timeSpent: `${durationMinutes} minutos`,
        costFinal: `$${totalCost}`
    });
});

/**
 * @desc Obtiene el estado actual del parqueo (para vista de administrador/dashboard).
 * @route GET /api/parking/status
 * @access Private
 */
const getParkingStatus = asyncHandler(async (req, res) => {
    // Nota: Aquí no verificamos rol de administrador por simplicidad, solo la autenticación
    const parkingLot = await ParkingLot.findOne({});

    if (!parkingLot) {
        res.status(404);
        throw new Error('No se encontró la configuración del parqueo.');
    }

    // Calcular el número de espacios ocupados y disponibles
    const totalSpaces = parkingLot.spaces.length;
    const occupiedSpaces = parkingLot.spaces.filter(space => space.isOccupied).length;
    const availableSpaces = totalSpaces - occupiedSpaces;

    // Crear un resumen de los espacios ocupados
    const occupiedDetails = parkingLot.spaces
        .filter(space => space.isOccupied)
        .map(space => ({
            spaceNumber: space.spaceNumber,
            occupiedBy: space.occupiedBy,
            entryTime: space.entryTime,
        }));

    res.status(200).json({
        parkingLotName: parkingLot.name,
        totalSpaces,
        occupiedSpaces,
        availableSpaces,
        occupiedDetails,
        // Nota: Si quieres los detalles de los usuarios (email, etc.), necesitarías hacer otra consulta a la colección User.
    });
});


module.exports = {
    assignSpace,
    payParking,
    releaseSpace,
    getParkingStatus, // Exportar la nueva función
};
