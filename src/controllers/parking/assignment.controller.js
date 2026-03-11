const asyncHandler = require('express-async-handler');
const { ParkingLot, User, ParkingSpace, ParkingSession } = require('../../models');
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

        // VALIDACIÓN DE PAGO (Solo para estudiantes, administradores exentos)
        if (user.role === 'student' && !user.hasPaid) {
            await t.rollback();
            res.status(403);
            throw new Error(`Servicio suspendido. Su suscripción mensual no ha sido cancelada.`);
        }

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
        user.hasPaid = true;
        await user.save({ transaction: t });
        await t.commit();

        logAudit(req, 'ASSIGN_SPACE', 'ParkingLot', { space: availableSpace.spaceNumber, entryTime });
        const countAvailable = await ParkingSpace.count({ where: { parkingLotId, isOccupied: false } });

        emitParkingStatus({
            parkingLotId,
            availableSpaces: countAvailable,
            lastAction: 'ASSIGN',
            space: availableSpace.spaceNumber
        });
        notifyUser(userId, 'space_assigned', { space: availableSpace.spaceNumber, entryTime });
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);
        await deleteCache(`user_profile:${userId}`);

        res.status(200).json({ message: 'Espacio asignado con éxito', parkingLot: parkingLot.name, space: availableSpace.spaceNumber, entryTime, info: 'Tarifa al salir.' });
    } catch (error) {
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
        if (!user || !user.currentParkingSpace) { await t.rollback(); res.status(400); throw new Error('No tiene espacio asignado'); }

        const exitTime = new Date();
        const entryTime = user.entryTime || new Date();
        const durationMs = exitTime - entryTime;
        const durationMinutes = Math.max(1, Math.ceil(durationMs / (1000 * 60)));
        // Solo cobrar a visitantes; estudiantes, docentes y staff pagan suscripción mensual
        const isVisitor = user.role === 'visitor';
        const totalAmount = isVisitor ? (Math.ceil(durationMinutes / 60) * 2.50) : 0;

        const space = await ParkingSpace.findOne({ where: { parkingLotId: user.currentParkingLotId, spaceNumber: user.currentParkingSpace }, transaction: t });
        if (space) { space.isOccupied = false; space.occupiedByUserId = null; space.entryTime = null; await space.save({ transaction: t }); }

        // Create Parking Session Record
        await ParkingSession.create({
            userId,
            parkingLotId: user.currentParkingLotId,
            spaceNumber: user.currentParkingSpace,
            entryTime: entryTime,
            exitTime: exitTime,
            durationMinutes,
            totalAmount,
            status: 'COMPLETED'
        }, { transaction: t });

        const releasedSpaceNum = user.currentParkingSpace; const parkingLotId = user.currentParkingLotId;
        user.currentParkingLotId = null; user.currentParkingSpace = null; user.entryTime = null;
        user.hasPaid = true;
        await user.save({ transaction: t });
        await t.commit();

        try { await mqttService.openGate('GATE_MAIN_EXIT', userId); } catch (e) { logger.warn('IoT Gate failed'); }
        const countAvailable = await ParkingSpace.count({ where: { parkingLotId, isOccupied: false } });
        emitParkingStatus({
            parkingLotId,
            availableSpaces: countAvailable,
            lastAction: 'RELEASE',
            space: releasedSpaceNum
        });
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);
        await deleteCache(`user_profile:${userId}`);

        res.status(200).json({
            message: `¡Salida exitosa! Espacio ${releasedSpaceNum} liberado.`,
            summary: { durationMinutes, totalAmount }
        });
    } catch (error) { if (t && !t.finished) await t.rollback(); throw new Error(error.message); }
});

const guardAssignSpace = asyncHandler(async (req, res) => {
    const { parkingLotId, vehiclePlate, email, visitorName } = req.body;
    if (!parkingLotId) { res.status(400); throw new Error('Debe proporcionar el ID del parqueo'); }

    let user = null;
    if (vehiclePlate) user = await User.findOne({ where: { vehiclePlate } });
    else if (email) user = await User.findOne({ where: { email } });

    // Si no existe, creamos un visitante al vuelo
    if (!user) {
        if (!vehiclePlate) {
            res.status(400);
            throw new Error('Debe proporcionar al menos la placa para un nuevo registro.');
        }

        const tCreate = await sequelize.transaction();
        try {
            user = await User.create({
                name: visitorName || 'Visitante',
                email: `vis_${Date.now()}@parqueo.com`, // Email dummy único
                password: 'VisitorPassword123!', // Password por defecto
                role: 'visitor',
                vehiclePlate,
                cardId: `VIS_${Date.now()}`, // Card ID generado
                hasPaid: true
            }, { transaction: tCreate });
            await tCreate.commit();
            logger.info(`Visitante creado: ${user.name} (${user.vehiclePlate}) con rol: ${user.role}`);
        } catch (error) {
            await tCreate.rollback();
            throw new Error('Error al crear el registro para el visitante: ' + error.message);
        }
    }

    // BLOQUEO ESTUDIANTE (Admins exentos)
    if (user.role === 'student' && !user.hasPaid) {
        res.status(403);
        throw new Error(`Servicio suspendido para este estudiante por falta de pago.`);
    }

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
        user.hasPaid = true;

        await user.save({ transaction: t });
        await t.commit();

        logAudit(req, 'GUARD_ASSIGN_SPACE', 'ParkingLot', { guardId: req.userId, userId: user.id, space: availableSpace.spaceNumber });
        const countAvailable = await ParkingSpace.count({ where: { parkingLotId, isOccupied: false } });
        emitParkingStatus({
            parkingLotId,
            availableSpaces: countAvailable,
            lastAction: 'GUARD_ASSIGN',
            space: availableSpace.spaceNumber
        });
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);
        await deleteCache(`user_profile:${user.id}`);

        res.status(200).json({ message: 'Espacio asignado con éxito', parkingLot: parkingLot.name, space: availableSpace.spaceNumber, entryTime, user: { name: user.name, vehiclePlate: user.vehiclePlate } });
    } catch (error) {
        if (t && !t.finished) await t.rollback();
        throw new Error(error.message);
    }
});

const guardReleaseSpace = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) { res.status(400); throw new Error('Debe proporcionar el userId'); }

    const t = await sequelize.transaction();
    try {
        const user = await User.findByPk(userId, { transaction: t });
        if (!user || !user.currentParkingSpace) { await t.rollback(); res.status(400); throw new Error('Este usuario no tiene un espacio asignado'); }

        const exitTime = new Date();
        const entryTime = user.entryTime || new Date();
        const durationMs = exitTime - entryTime;
        const durationMinutes = Math.max(1, Math.ceil(durationMs / (1000 * 60)));
        // Solo cobrar a visitantes; usuarios regulares pagan suscripción mensual
        const isVisitorUser = user.role === 'visitor';
        const totalAmount = isVisitorUser ? (Math.ceil(durationMinutes / 60) * 2.50) : 0;

        const space = await ParkingSpace.findOne({ where: { parkingLotId: user.currentParkingLotId, spaceNumber: user.currentParkingSpace }, transaction: t });
        if (space) { space.isOccupied = false; space.occupiedByUserId = null; space.entryTime = null; await space.save({ transaction: t }); }

        // Create Parking Session Record
        await ParkingSession.create({
            userId: user.id,
            parkingLotId: user.currentParkingLotId,
            spaceNumber: user.currentParkingSpace,
            entryTime: entryTime,
            exitTime: exitTime,
            durationMinutes,
            totalAmount,
            status: 'COMPLETED'
        }, { transaction: t });

        const releasedSpace = user.currentParkingSpace;
        const parkingLotId = user.currentParkingLotId;
        user.currentParkingLotId = null; user.currentParkingSpace = null; user.entryTime = null;
        user.hasPaid = true;

        await user.save({ transaction: t });
        await t.commit();

        logAudit(req, 'GUARD_RELEASE_SPACE', 'ParkingLot', { guardId: req.userId, userId, space: releasedSpace });
        const countAvailable = await ParkingSpace.count({ where: { parkingLotId, isOccupied: false } });
        emitParkingStatus({
            parkingLotId,
            availableSpaces: countAvailable,
            lastAction: 'GUARD_RELEASE',
            space: releasedSpace
        });
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);
        await deleteCache(`user_profile:${userId}`);

        res.status(200).json({ message: `Espacio ${releasedSpace} liberado por el oficial.`, summary: { durationMinutes, totalAmount } });
    } catch (error) {
        if (t && !t.finished) await t.rollback();
        throw new Error(error.message);
    }
});

const manualGateControl = asyncHandler(async (req, res) => {
    const { parkingLotId, action } = req.body;
    if (!parkingLotId) { res.status(400); throw new Error('Debe proporcionar el ID del parqueo'); }
    if (action !== 'OPEN') { res.status(400); throw new Error('Acción no permitida'); }

    const parkingLot = await ParkingLot.findByPk(parkingLotId);
    if (!parkingLot) { res.status(404); throw new Error('Parqueo no encontrado'); }

    // SEGURIDAD: Verificar que el guardia esté asignado a este parqueo
    const guard = await User.findByPk(req.userId);
    if (guard.role === 'guard' && guard.assignedParkingLotId && guard.assignedParkingLotId !== parseInt(parkingLotId)) {
        res.status(403);
        throw new Error('Acceso denegado: No está asignado a este parqueo.');
    }

    try {
        // En un sistema real, el gateId podría venir del parkingLot o ser fijo por entrada/salida
        const gateId = 'GATE_MAIN_ENTRY';
        await mqttService.openGate(gateId, req.userId);

        logAudit(req, 'MANUAL_GATE_OPEN', 'IoT_Gate', { parkingLotId, gateId, guardId: req.userId });

        res.status(200).json({ success: true, message: `Comando de apertura enviado a ${parkingLot.name}` });
    } catch (error) {
        logger.error('Error en control manual de talanquera:', error);
        res.status(500).json({ success: false, message: 'Error de comunicación con el hardware' });
    }
});

const getCurrentAssignment = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const user = await User.findByPk(userId);
    if (!user || !user.currentParkingSpace) {
        return res.status(200).json({ data: null });
    }
    const lot = await ParkingLot.findByPk(user.currentParkingLotId);
    res.status(200).json({
        data: {
            currentParkingSpace: user.currentParkingSpace,
            currentParkingLotId: user.currentParkingLotId,
            currentParkingLotName: lot ? lot.name : 'Parqueo',
            entryTime: user.entryTime
        }
    });
});

module.exports = { assignSpace, releaseSpace, guardAssignSpace, guardReleaseSpace, manualGateControl, getCurrentAssignment };
