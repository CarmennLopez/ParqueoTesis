const asyncHandler = require('express-async-handler');
const { ParkingLot, User, ParkingSession } = require('../../../models');
const { RATE_PER_HOUR } = require('../../../config/constants');

/**
 * GET /api/parking/guard/active-vehicles
 * Returns all users currently parked for the guard's dashboard.
 */
const getActiveVehicles = asyncHandler(async (req, res) => {
    const { Op } = require('sequelize');
    const activeUsers = await User.findAll({
        where: { currentParkingSpace: { [Op.ne]: null } },
        attributes: ['id', 'name', 'email', 'vehiclePlate', 'currentParkingLotId', 'currentParkingSpace', 'entryTime'],
        include: [{
            model: ParkingLot,
            as: 'currentLot',
            attributes: ['id', 'name'],
            required: false
        }]
    });

    const now = new Date();
    const vehicles = activeUsers.map(u => {
        const entry = u.entryTime ? new Date(u.entryTime) : null;
        const durationMs = entry ? now - entry : 0;
        const durationHours = durationMs / (1000 * 60 * 60);
        const cost = Math.max(parseFloat((durationHours * RATE_PER_HOUR).toFixed(2)), 0);

        return {
            userId: u.id,
            name: u.name,
            email: u.email,
            vehiclePlate: u.vehiclePlate,
            parkingLotId: u.currentParkingLotId,
            parkingLotName: u.currentLot?.name || 'Desconocido',
            space: u.currentParkingSpace,
            entryTime: u.entryTime,
            durationMinutes: Math.floor(durationMs / 60000),
            cost
        };
    });

    res.status(200).json({ message: 'Vehículos activos', data: vehicles });
});

/**
 * GET /api/parking/history
 * Returns the parking history for the logged-in user.
 */
const getParkingHistory = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const history = await ParkingSession.findAll({
        where: { userId },
        include: [{
            model: ParkingLot,
            attributes: ['id', 'name']
        }],
        order: [['exitTime', 'DESC']]
    });

    res.status(200).json({ message: 'Historial de parqueo', data: history });
});

module.exports = { getActiveVehicles, getParkingHistory };
