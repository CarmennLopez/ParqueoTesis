// src/controllers/iotController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const ParkingLot = require('../models/ParkingLot');
const mqttService = require('../services/mqttService');
const logger = require('../config/logger');
const { logAudit } = require('../utils/auditLogger');
const { USER_ROLES } = require('../config/constants');

const PARKING_LOT_NAME = process.env.PARKING_LOT_NAME || 'Parqueo Principal';

/**
 * @desc Webhook para eventos de cámaras LPR (License Plate Recognition)
 * @route POST /api/iot/lpr/event
 * @access Public (Protegido por API Key en headers en producción)
 */
const handleLprEvent = asyncHandler(async (req, res) => {
    const { plate, cameraLocation, confidence, timestamp } = req.body;

    // Validación básica
    if (!plate || !cameraLocation) {
        res.status(400);
        throw new Error('Datos incompletos: plate y cameraLocation son requeridos');
    }

    logger.info(`📸 Evento LPR recibido: Placa ${plate} en ${cameraLocation} (${confidence}%)`);

    // 1. Buscar usuario por placa
    const user = await User.findOne({ vehiclePlate: plate });

    if (!user) {
        logger.warn(`LPR: Placa ${plate} no registrada en el sistema.`);
        // Podríamos registrar un evento de "Intento de acceso no autorizado"
        logAudit(req, 'LPR_DENIED', 'IoT_LPR', {
            plate,
            reason: 'Placa no registrada',
            location: cameraLocation
        });

        return res.status(200).json({
            action: 'DENY',
            message: 'Vehículo no registrado'
        });
    }

    // 2. Determinar acción basada en ubicación de cámara (Entrada vs Salida)
    const isEntry = cameraLocation.toLowerCase().includes('entry') || cameraLocation.toLowerCase().includes('entrada');
    const isExit = cameraLocation.toLowerCase().includes('exit') || cameraLocation.toLowerCase().includes('salida');

    let action = 'NONE';
    let message = 'Sin acción determinada';

    if (isEntry) {
        // Lógica de ENTRADA AUTOMÁTICA
        if (user.currentParkingSpace) {
            message = 'Usuario ya tiene un espacio asignado. Posible error de lectura o doble entrada.';
            action = 'DENY';
        } else {
            // Verificar disponibilidad
            const parkingLot = await ParkingLot.findOne({ name: PARKING_LOT_NAME });
            if (parkingLot && parkingLot.availableSpaces > 0) {
                // TODO: Aquí idealmente llamaríamos a assignSpace internamente, 
                // pero assignSpace requiere req.user. 
                // Para simplificar la simulación, solo abrimos la barrera y notificamos.
                // En producción, refactorizaríamos assignSpace para ser reutilizable.

                action = 'OPEN_GATE';
                message = 'Bienvenido. Proceda a buscar espacio.';

                // Abrir barrera
                await mqttService.openGate('GATE_MAIN_ENTRY', user._id);
            } else {
                action = 'DENY';
                message = 'Parqueo lleno.';
            }
        }
    } else if (isExit) {
        // Lógica de SALIDA AUTOMÁTICA
        if (!user.currentParkingSpace) {
            message = 'El vehículo no tiene registro de entrada.';
            action = 'DENY';
        } else if (!user.hasPaid) {
            // Verificar si tiene suscripción activa para permitir salida
            // (Lógica simplificada, similar a parkingController)
            if (user.subscriptionPlan && user.subscriptionExpiresAt > new Date()) {
                action = 'OPEN_GATE';
                message = 'Suscripción válida. Buen viaje.';
                await mqttService.openGate('GATE_MAIN_EXIT', user._id);
            } else {
                action = 'DENY';
                message = 'Pago pendiente. Por favor pase a caja o pague en la app.';
            }
        } else {
            action = 'OPEN_GATE';
            message = 'Pago verificado. Buen viaje.';
            await mqttService.openGate('GATE_MAIN_EXIT', user._id);
        }
    }

    // 3. Registrar evento
    logAudit(req, isEntry ? 'LPR_ENTRY_ATTEMPT' : 'LPR_EXIT_ATTEMPT', 'IoT_LPR', {
        plate,
        userId: user._id,
        action,
        location: cameraLocation
    });

    res.status(200).json({
        success: true,
        plate,
        identifiedUser: user.name,
        action,
        message
    });
});

module.exports = { handleLprEvent };
