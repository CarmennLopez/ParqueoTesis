const asyncHandler = require('express-async-handler');
const { User } = require('../../models');
const { getCache, setCache } = require('../../config/redis');

const getMe = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const cacheKey = `user_profile:${userId}`;

    const cachedUser = await getCache(cacheKey);
    if (cachedUser) return res.status(200).json({ success: true, user: cachedUser });

    const user = await User.findByPk(userId, {
        attributes: [
            'id', 'name', 'email', 'role',
            'cardId', 'vehiclePlate',
            'hasPaid', 'currentParkingSpace', 'currentParkingLotId',
            'isSolvent', 'solvencyExpires',
            'entryTime', 'lastPaymentAmount',
            'nit', 'fiscalName', 'fiscalAddress'
        ]
    });

    if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const userResponse = {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cardId: user.cardId,
        vehiclePlate: user.vehiclePlate,
        hasPaid: user.hasPaid,
        currentParkingSpace: user.currentParkingSpace ?? null,
        currentParkingLotId: user.currentParkingLotId ?? null,
        isSolvent: user.isSolvent,
        solvencyExpires: user.solvencyExpires ?? null,
        entryTime: user.entryTime ?? null,
        lastPaymentAmount: user.lastPaymentAmount,
        nit: user.nit,
        fiscalName: user.fiscalName ?? null,
        fiscalAddress: user.fiscalAddress
    };

    await setCache(cacheKey, userResponse, 60);

    res.status(200).json({ success: true, user: userResponse });
});

module.exports = { getMe };
