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
    await ParkingSpace.update(
        { isOccupied: false, occupiedByUserId: null, entryTime: null },
        { where: { parkingLotId } }
    );
    await deleteCache(CACHE_KEY_STATUS + parkingLotId);
    res.json({ message: 'Emptied lot' });
});

const openGate = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.userId);
    res.json({ message: 'Gate command sent', user: user?.email });
});

module.exports = { simulateFill, simulateEmpty, openGate };
