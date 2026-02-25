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
        if (!user.hasPaid) { await t.rollback(); res.status(402); throw new Error('Debe pagar antes de salir. Usa POST /api/parking/pay'); }

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

/**
 * POST /api/parking/guard/assign
 * Guard manually assigns a space to a visitor (lookup by vehiclePlate or email).
 */
const guardAssignSpace = asyncHandler(async (req, res) => {
    const { parkingLotId, vehiclePlate, email, guestName } = req.body;
    if (!parkingLotId) { res.status(400); throw new Error('Debe proporcionar el ID del parqueo'); }

    let user = null;
    if (vehiclePlate) user = await User.findOne({ where: { vehiclePlate } });
    else if (email) user = await User.findOne({ where: { email } });

    if (!user) { res.status(404); throw new Error('Usuario no encontrado. Verifique la placa o el correo.'); }
    if (user.currentParkingSpace) { res.status(400); throw new Error(`Este vehículo ya tiene el espacio ${user.currentParkingSpace} asignado.`); }

    const t = await sequelize.transaction();
    try {
        const availableSpace = await ParkingSpace.findOne({ where: { parkingLotId, isOccupied: false }, lock: true, transaction: t, order: [['id', 'ASC']] });
        if (!availableSpace) { await t.rollback(); res.status(404); throw new Error('No hay espacios disponibles en este parqueo'); }

        const parkingLot = await ParkingLot.findByPk(parkingLotId, { transaction: t });
        const entryTime = new Date();

        availableSpace.isOccupied = true;
        availableSpace.occupiedByUserId = user.id;
        availableSpace.entryTime = entryTime;
        await availableSpace.save({ transaction: t });

        user.currentParkingLotId = parkingLot.id;
        user.currentParkingSpace = availableSpace.spaceNumber;
        user.entryTime = entryTime;
        user.hasPaid = false;
        await user.save({ transaction: t });
        await t.commit();

        logAudit(req, 'GUARD_ASSIGN_SPACE', 'ParkingLot', { guardId: req.userId, userId: user.id, space: availableSpace.spaceNumber });
        const countAvailable = await ParkingSpace.count({ where: { parkingLotId, isOccupied: false } });
        emitParkingStatus({ availableSpaces: countAvailable, lastAction: 'GUARD_ASSIGN', space: availableSpace.spaceNumber });
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);

        res.status(200).json({ message: 'Espacio asignado por el oficial', parkingLot: parkingLot.name, space: availableSpace.spaceNumber, entryTime, user: { name: user.name, vehiclePlate: user.vehiclePlate } });
    } catch (error) {
        if (t && !t.finished) await t.rollback();
        throw new Error(error.message);
    }
});

/**
 * POST /api/parking/guard/release
 * Guard forcefully releases any user's space by userId.
 */
const guardReleaseSpace = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) { res.status(400); throw new Error('Debe proporcionar el userId'); }

    const t = await sequelize.transaction();
    try {
        const user = await User.findByPk(userId, { transaction: t });
        if (!user || !user.currentParkingSpace) { await t.rollback(); res.status(400); throw new Error('Este usuario no tiene un espacio asignado'); }

        const space = await ParkingSpace.findOne({ where: { parkingLotId: user.currentParkingLotId, spaceNumber: user.currentParkingSpace }, transaction: t });
        if (space) { space.isOccupied = false; space.occupiedByUserId = null; space.entryTime = null; await space.save({ transaction: t }); }

        const releasedSpace = user.currentParkingSpace;
        const parkingLotId = user.currentParkingLotId;
        user.currentParkingLotId = null; user.currentParkingSpace = null; user.entryTime = null; user.hasPaid = false;
        await user.save({ transaction: t });
        await t.commit();

        logAudit(req, 'GUARD_RELEASE_SPACE', 'ParkingLot', { guardId: req.userId, userId, space: releasedSpace });
        const countAvailable = await ParkingSpace.count({ where: { parkingLotId, isOccupied: false } });
        emitParkingStatus({ availableSpaces: countAvailable, lastAction: 'GUARD_RELEASE', space: releasedSpace });
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);

        res.status(200).json({ message: `Espacio ${releasedSpace} liberado por el oficial.` });
    } catch (error) {
        if (t && !t.finished) await t.rollback();
        throw new Error(error.message);
    }
});

module.exports = { assignSpace, releaseSpace, guardAssignSpace, guardReleaseSpace };
