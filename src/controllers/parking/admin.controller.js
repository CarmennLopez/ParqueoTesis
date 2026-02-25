const asyncHandler = require('express-async-handler');
const { ParkingLot, ParkingSpace, User, sequelize } = require('../../models');
const { USER_ROLES } = require('../../config/constants');

/**
 * @desc    Crear nuevo lote de parqueo
 * @route   POST /api/parking/admin/lots
 * @access  Private/Admin
 */
const createParkingLot = asyncHandler(async (req, res) => {
    const { name, latitude, longitude, totalSpaces } = req.body;

    const t = await sequelize.transaction();
    try {
        const lot = await ParkingLot.create({
            name,
            location: { type: 'Point', coordinates: [longitude, latitude] },
            totalSpaces,
            availableSpaces: totalSpaces
        }, { transaction: t });

        // Crear los espacios individuales
        const spaces = [];
        for (let i = 1; i <= totalSpaces; i++) {
            spaces.push({
                parkingLotId: lot.id,
                spaceNumber: i,
                isOccupied: false
            });
        }
        await ParkingSpace.bulkCreate(spaces, { transaction: t });

        await t.commit();
        res.status(201).json({ success: true, data: lot });
    } catch (error) {
        await t.rollback();
        res.status(400);
        throw new Error('Error al crear el parqueo: ' + error.message);
    }
});

/**
 * @desc    Actualizar lote de parqueo
 * @route   PATCH /api/parking/admin/lots/:id
 * @access  Private/Admin
 */
const updateParkingLot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, latitude, longitude, totalSpaces } = req.body;

    const lot = await ParkingLot.findByPk(id);
    if (!lot) {
        res.status(404);
        throw new Error('Parqueo no encontrado');
    }

    try {
        if (name && name !== lot.name) lot.name = name;

        if (latitude !== undefined && longitude !== undefined) {
            const newLat = parseFloat(latitude);
            const newLng = parseFloat(longitude);

            if (isNaN(newLat) || isNaN(newLng)) {
                res.status(400);
                throw new Error('Las coordenadas deben ser números válidos');
            }

            // Update only if coordinates changed significantly
            const [currentLng, currentLat] = lot.location.coordinates;
            if (Math.abs(newLat - currentLat) > 0.000001 || Math.abs(newLng - currentLng) > 0.000001) {
                lot.location = { type: 'Point', coordinates: [newLng, newLat] };
            }
        }

        if (totalSpaces !== undefined) {
            const newTotal = parseInt(totalSpaces);
            if (isNaN(newTotal)) {
                res.status(400);
                throw new Error('La capacidad debe ser un número válido');
            }

            if (newTotal !== lot.totalSpaces) {
                if (newTotal < lot.totalSpaces) {
                    const diff = lot.totalSpaces - newTotal;
                    // Buscar los últimos 'diff' espacios (los de número más alto)
                    const spacesToRemove = await ParkingSpace.findAll({
                        where: { parkingLotId: id },
                        order: [['spaceNumber', 'DESC']],
                        limit: diff
                    });

                    const occupied = spacesToRemove.filter(s => s.isOccupied);
                    if (occupied.length > 0) {
                        res.status(400);
                        throw new Error(`No se puede reducir la capacidad a ${newTotal} porque los espacios ${occupied.map(s => s.spaceNumber).join(', ')} están ocupados actualmente.`);
                    }

                    // Eliminar los espacios
                    await ParkingSpace.destroy({
                        where: {
                            id: spacesToRemove.map(s => s.id)
                        }
                    });

                    lot.totalSpaces = newTotal;
                    // Recalcular espacios disponibles tras eliminación
                    const currentOccupied = await ParkingSpace.count({ where: { parkingLotId: id, isOccupied: true } });
                    lot.availableSpaces = newTotal - currentOccupied;
                } else {
                    const diff = newTotal - lot.totalSpaces;
                    const lastSpace = await ParkingSpace.max('spaceNumber', { where: { parkingLotId: id } }) || 0;
                    const newSpaces = [];
                    for (let i = 1; i <= diff; i++) {
                        newSpaces.push({ parkingLotId: id, spaceNumber: lastSpace + i, isOccupied: false });
                    }
                    await ParkingSpace.bulkCreate(newSpaces);
                    lot.totalSpaces = newTotal;
                    lot.availableSpaces = (lot.availableSpaces || 0) + diff;
                }
            }
        }

        await lot.save();
        res.status(200).json({ success: true, data: lot });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400);
            throw new Error(`Ya existe un parqueo con el nombre "${name}". Por favor use un nombre diferente.`);
        }
        if (!res.statusCode || res.statusCode === 200) res.status(400);
        throw error;
    }
});

/**
 * @desc    Listar usuarios para administración
 * @route   GET /api/parking/admin/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'vehiclePlate', 'createdAt']
    });
    res.status(200).json({ success: true, data: users });
});

/**
 * @desc    Cambiar rol de usuario
 * @route   PATCH /api/parking/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(USER_ROLES).includes(role)) {
        res.status(400);
        throw new Error('Rol no válido');
    }

    const user = await User.findByPk(id);
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    user.role = role;
    await user.save();
    res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Obtener analíticas de ingresos
 * @route   GET /api/parking/admin/stats/revenue
 * @access  Private/Admin
 */
const getRevenueStats = asyncHandler(async (req, res) => {
    // Implementación básica: Sumar costos de vehículos activos + historial (si existiera)
    // Por ahora simularemos datos basados en la ocupación actual
    const activeVehicles = await User.count({ where: { currentParkingSpace: { [require('sequelize').Op.ne]: null } } });

    res.status(200).json({
        success: true,
        summary: {
            activeUsers: activeVehicles,
            estimatedHourlyRevenue: activeVehicles * 2.50,
            simulatedDailyRevenue: (activeVehicles * 2.50 * 8).toFixed(2)
        }
    });
});

/**
 * @desc    Eliminar lote de parqueo
 * @route   DELETE /api/parking/admin/lots/:id
 * @access  Private/Admin
 */
const deleteParkingLot = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lot = await ParkingLot.findByPk(id);
    if (!lot) {
        res.status(404);
        throw new Error('Parqueo no encontrado');
    }

    // Verificar si hay espacios ocupados
    const occupiedCount = await ParkingSpace.count({ where: { parkingLotId: id, isOccupied: true } });
    if (occupiedCount > 0) {
        res.status(400);
        throw new Error(`No se puede eliminar el parqueo porque tiene ${occupiedCount} espacios ocupados actualmente.`);
    }

    const t = await sequelize.transaction();
    try {
        // Eliminar espacios asociados primero
        await ParkingSpace.destroy({ where: { parkingLotId: id }, transaction: t });
        // Eliminar el lote
        await lot.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ success: true, message: 'Parqueo eliminado correctamente' });
    } catch (error) {
        await t.rollback();
        res.status(400);
        throw new Error('Error al eliminar el parqueo: ' + error.message);
    }
});

module.exports = {
    createParkingLot,
    updateParkingLot,
    deleteParkingLot,
    getUsers,
    updateUserRole,
    getRevenueStats
};
