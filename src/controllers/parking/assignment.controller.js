const asyncHandler = require('express-async-handler');
const { ParkingLot, User, ParkingSpace } = require('../../models');
const { sequelize } = require('../../config/database');
const logger = require('../../config/logger');
const { logAudit } = require('../../utils/auditLogger');
const mqttService = require('../../services/mqttService');
const { emitParkingStatus, notifyUser } = require('../../services/socketService');
const { deleteCache } = require('../../config/redis');

const CACHE_KEY_STATUS = 'parking_status_';

const assignSpace = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { parkingLotId } = req.body;
    if (!parkingLotId) { res.status(400); throw new Error('Debe proporcionar el ID del parqueo'); }
    const t = await sequelize.transaction();
    try {
        const user = await User.findByPk(userId, { transaction: t });
        if (user.currentParkingSpace) {
            await t.rollback();
            res.status(400);
            throw new Error(`Usuario ya tiene espacio asignado`);
        }
        const availableSpace = await ParkingSpace.findOne({
            where: { parkingLotId, isOccupied: false }, lock: true, transaction: t, order: [['id', 'ASC']]
        });
        if (!availableSpace) {
            await t.rollback();
            res.status(404);
            throw new Error('No hay espacios disponibles');
        }
        const parkingLot = await ParkingLot.findByPk(parkingLotId, { transaction: t });
        const entryTime = new Date();

        availableSpace.isOccupied = true;
        availableSpace.occupiedByUserId = userId;
        availableSpace.entryTime = entryTime;
        await availableSpace.save({ transaction: t });

        user.currentParkingLotId = parkingLot.id;
        user.currentParkingSpace = availableSpace.spaceNumber;
        user.entryTime = entryTime;
        user.hasPaid = false;
        await user.save({ transaction: t });
        await t.commit();

        logAudit(req, 'ASSIGN_SPACE', 'ParkingLot', { space: availableSpace.spaceNumber, entryTime });
        const countAvailable = await ParkingSpace.count({ where: { parkingLotId, isOccupied: false } });

        emitParkingStatus({ availableSpaces: countAvailable, lastAction: 'ASSIGN', space: availableSpace.spaceNumber });
        notifyUser(userId, 'space_assigned', { space: availableSpace.spaceNumber, entryTime });
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);

        res.status(200).json({ message: 'Espacio asignado con éxito', parkingLot: parkingLot.name, space: availableSpace.spaceNumber, entryTime, info: 'Tarifa al salir.' });
    } catch (error) {
        // Only rollback if transaction is still pending
        if (t && !t.finished) {
            await t.rollback();
        }
        throw new Error(error.message);
    }
});

const releaseSpace = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const t = await sequelize.transaction();
    try {
        const user = await User.findByPk(userId, { transaction: t });
        if (!user.currentParkingSpace) { await t.rollback(); res.status(400); throw new Error('No tiene espacio asignado'); }
        /* if (!user.hasPaid) { await t.rollback(); res.status(402); throw new Error('Debe pagar antes de salir.'); } */

        const space = await ParkingSpace.findOne({ where: { parkingLotId: user.currentParkingLotId, spaceNumber: user.currentParkingSpace }, transaction: t });
        if (space) { space.isOccupied = false; space.occupiedByUserId = null; space.entryTime = null; await space.save({ transaction: t }); }

        const releasedSpaceNum = user.currentParkingSpace; const parkingLotId = user.currentParkingLotId;
        user.currentParkingLotId = null; user.currentParkingSpace = null; user.entryTime = null; user.hasPaid = false;
        await user.save({ transaction: t });
        await t.commit();

        try { await mqttService.openGate('GATE_MAIN_EXIT', userId); } catch (e) { logger.warn('IoT Gate failed'); }
        const countAvailable = await ParkingSpace.count({ where: { parkingLotId, isOccupied: false } });
        emitParkingStatus({ availableSpaces: countAvailable, lastAction: 'RELEASE', space: releasedSpaceNum });
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);

        res.status(200).json({ message: `¡Salida exitosa! Espacio ${releasedSpaceNum} liberado.` });
    } catch (error) { if (t) await t.rollback(); throw new Error(error.message); }
});

module.exports = { assignSpace, releaseSpace };
