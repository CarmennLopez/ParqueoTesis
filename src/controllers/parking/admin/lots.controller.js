const asyncHandler = require('express-async-handler');
const { ParkingLot, ParkingSpace, sequelize } = require('../../../models');

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

        const spaces = [];
        for (let i = 1; i <= totalSpaces; i++) {
            spaces.push({
                parkingLotId: lot.id,
                spaceNumber: `A-${i.toString().padStart(2, '0')}`,
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

                    await ParkingSpace.destroy({
                        where: { id: spacesToRemove.map(s => s.id) }
                    });

                    lot.totalSpaces = newTotal;
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

    const occupiedCount = await ParkingSpace.count({ where: { parkingLotId: id, isOccupied: true } });
    if (occupiedCount > 0) {
        res.status(400);
        throw new Error(`No se puede eliminar el parqueo porque tiene ${occupiedCount} espacios ocupados actualmente.`);
    }

    const t = await sequelize.transaction();
    try {
        await ParkingSpace.destroy({ where: { parkingLotId: id }, transaction: t });
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
    deleteParkingLot
};
