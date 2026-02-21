const asyncHandler = require('express-async-handler');
const { ParkingLot, ParkingSpace, User } = require('../../models');
const { getCache, setCache } = require('../../config/redis');

const CACHE_KEY_STATUS = 'parking_status_';

const getParkingLots = asyncHandler(async (req, res) => {
    const parkingLots = await ParkingLot.findAll({
        attributes: ['id', 'name', 'location', 'totalSpaces'],
        include: [{
            model: ParkingSpace,
            as: 'spaces',
            attributes: ['id', 'spaceNumber', 'isOccupied', 'entryTime', 'occupiedByUserId']
        }]
    });

    if (!parkingLots || parkingLots.length === 0) {
        res.status(404);
        throw new Error('No hay parqueos disponibles');
    }

    const lotsWithStatus = parkingLots.map(lot => ({
        id: lot.id,
        name: lot.name,
        location: lot.location,
        totalSpaces: lot.totalSpaces,
        occupiedSpaces: lot.spaces.filter(s => s.isOccupied).length,
        availableSpaces: lot.spaces.filter(s => !s.isOccupied).length,
        spaces: lot.spaces.map(space => ({
            id: space.id,
            spaceNumber: space.spaceNumber,
            isOccupied: space.isOccupied,
            occupiedBy: space.occupiedByUserId,
            entryTime: space.entryTime
        }))
    }));

    res.status(200).json({ message: 'Parqueos disponibles', data: lotsWithStatus });
});

const getParkingStatus = asyncHandler(async (req, res) => {
    const { parkingLotId } = req.query;
    let lotId = parkingLotId;

    if (!lotId) {
        const first = await ParkingLot.findOne();
        if (!first) throw new Error('No parking lots');
        lotId = first.id;
    }

    const cacheKey = CACHE_KEY_STATUS + lotId;
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const parkingLot = await ParkingLot.findByPk(lotId, {
        include: [{
            model: ParkingSpace,
            as: 'spaces',
            include: [{ model: User, as: 'occupant', attributes: ['name', 'email', 'vehiclePlate'] }]
        }]
    });

    if (!parkingLot) {
        res.status(404);
        throw new Error('Parqueo no encontrado');
    }

    const response = {
        parkingLotId: parkingLot.id,
        parkingLotName: parkingLot.name,
        totalSpaces: parkingLot.totalSpaces,
        occupiedSpaces: parkingLot.spaces.filter(s => s.isOccupied).length,
        availableSpaces: parkingLot.totalSpaces - parkingLot.spaces.filter(s => s.isOccupied).length,
        occupiedDetails: parkingLot.spaces.filter(s => s.isOccupied).map(s => ({
            spaceNumber: s.spaceNumber,
            occupiedBy: s.occupant ? { name: s.occupant.name, email: s.occupant.email, vehiclePlate: s.occupant.vehiclePlate } : null,
            entryTime: s.entryTime
        }))
    };

    await setCache(cacheKey, response, 5);
    res.status(200).json(response);
});

module.exports = { getParkingLots, getParkingStatus };
