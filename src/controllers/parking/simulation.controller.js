const asyncHandler = require('express-async-handler');
const { ParkingLot, ParkingSpace, User } = require('../../models');
const { deleteCache } = require('../../config/redis');

const CACHE_KEY_STATUS = 'parking_status_';

const simulateFill = asyncHandler(async (req, res) => {
    const { parkingLotId, percentage } = req.body;
    const targetFill = percentage || 80;

    const lot = await ParkingLot.findByPk(parkingLotId, { include: ['spaces'] });
    const totalToFill = Math.floor(lot.totalSpaces * (targetFill / 100));

    let filled = 0;
    for (const space of lot.spaces) {
        if (!space.isOccupied && filled < totalToFill) {
            space.isOccupied = true;
            space.entryTime = new Date();
            await space.save();
            filled++;
        }
    }

    await deleteCache(CACHE_KEY_STATUS + parkingLotId);
    res.json({ message: `Filled ${filled} spaces` });
});

const simulateEmpty = asyncHandler(async (req, res) => {
    const { parkingLotId } = req.body;
    const t = await sequelize.transaction();
    try {
        // Clear User assignments for this lot
        await User.update(
            { currentParkingLotId: null, currentParkingSpace: null, entryTime: null },
            { where: { currentParkingLotId: parkingLotId }, transaction: t }
        );

        // Clear ParkingSpace assignments
        await ParkingSpace.update(
            { isOccupied: false, occupiedByUserId: null, entryTime: null },
            { where: { parkingLotId }, transaction: t }
        );

        // Update ParkingLot availableSpaces count
        const lot = await ParkingLot.findByPk(parkingLotId, { transaction: t });
        if (lot) {
            lot.availableSpaces = lot.totalSpaces;
            await lot.save({ transaction: t });
        }

        await t.commit();
        await deleteCache(CACHE_KEY_STATUS + parkingLotId);
        res.json({ message: 'Emptied lot and cleared user assignments' });
    } catch (error) {
        if (t) await t.rollback();
        throw error;
    }
});

const openGate = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.userId);
    res.json({ message: 'Gate command sent', user: user?.email });
});

module.exports = { simulateFill, simulateEmpty, openGate };
