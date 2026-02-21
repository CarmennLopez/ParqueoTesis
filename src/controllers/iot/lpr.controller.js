const asyncHandler = require('express-async-handler');
const { User, ParkingLot } = require('../../models');
const mqttService = require('../../services/mqttService');
const logger = require('../../config/logger');
const { logAudit } = require('../../utils/auditLogger');

const PARKING_LOT_NAME = process.env.PARKING_LOT_NAME || 'Parqueo Principal';

const handleLprEvent = asyncHandler(async (req, res) => {
    const { plate, cameraLocation, timestamp } = req.body;
    if (!plate || !cameraLocation) { res.status(400); throw new Error('Datos incompletos'); }

    logger.info(`📸 Evento LPR: Placa ${plate} en ${cameraLocation}`);
    const user = await User.findOne({ where: { vehiclePlate: plate } });

    if (!user) {
        logAudit(req, 'LPR_DENIED', 'IoT_LPR', { plate, reason: 'No registrado', location: cameraLocation });
        return res.status(200).json({ action: 'DENY', message: 'Vehículo no registrado' });
    }

    const isEntry = cameraLocation.toLowerCase().match(/entry|entrada/);
    const isExit = cameraLocation.toLowerCase().match(/exit|salida/);
    let action = 'NONE', message = 'Sin acción';

    if (isEntry) {
        if (user.currentParkingSpace) {
            message = 'Usuario ya tiene espacio asignado'; action = 'DENY';
        } else {
            const parkingLot = await ParkingLot.findOne({ where: { name: PARKING_LOT_NAME } });
            if (parkingLot && parkingLot.availableSpaces > 0) {
                // TODO: Auto-assign logic here
                action = 'OPEN_GATE'; message = 'Bienvenido';
                await mqttService.openGate('GATE_MAIN_ENTRY', user.id);
            } else { action = 'DENY'; message = 'Parqueo lleno'; }
        }
    } else if (isExit) {
        if (!user.currentParkingSpace) { message = 'No tiene registro entrada'; action = 'DENY'; }
        else if (!user.hasPaid) { action = 'DENY'; message = 'Pago pendiente'; }
        else {
            action = 'OPEN_GATE'; message = 'Buen viaje';
            await mqttService.openGate('GATE_MAIN_EXIT', user.id);
        }
    }

    logAudit(req, isEntry ? 'LPR_ENTRY' : 'LPR_EXIT', 'IoT_LPR', { plate, userId: user.id, action });
    res.status(200).json({ success: true, plate, identifiedUser: user.name, action, message });
});

module.exports = { handleLprEvent };
