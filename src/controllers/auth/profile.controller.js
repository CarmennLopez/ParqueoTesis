const asyncHandler = require('express-async-handler');
const { User } = require('../../models');
const { getCache, setCache } = require('../../config/redis');

const getMe = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const cacheKey = `user_profile:${userId}`;

    const cachedUser = await getCache(cacheKey);
    if (cachedUser) return res.status(200).json(cachedUser);

    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
    if (!user) { res.status(404); throw new Error('Usuario no encontrado'); }

    const userResponse = { ...user.toJSON(), _id: user.id };

    // Add parking lot name
    if (user.currentParkingLotId) {
        const lot = await require('../../models').ParkingLot.findByPk(user.currentParkingLotId);
        if (lot) userResponse.currentParkingLot = lot.name;
    }

    await setCache(cacheKey, userResponse, 60);

    res.status(200).json(userResponse);
});

const switchRole = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const { role } = req.body;
    const cacheKey = `user_profile:${userId}`;

    const validRoles = ['admin', 'guard', 'student', 'faculty', 'visitor'];
    if (!validRoles.includes(role)) {
        res.status(400);
        throw new Error('Rol no válido');
    }

    const user = await User.findByPk(userId);
    if (!user) { res.status(404); throw new Error('Usuario no encontrado'); }

    user.role = role;
    await user.save();

    const { deleteCache } = require('../../config/redis');
    await deleteCache(cacheKey);

    const { generateAccessToken, generateRefreshToken } = require('../../utils/tokenUtils');
    const userForToken = { ...user.toJSON(), _id: user.id };
    const accessToken = generateAccessToken(userForToken);
    const refreshToken = await generateRefreshToken(userForToken);

    const userResponse = { ...user.toJSON(), _id: user.id };
    delete userResponse.password;

    res.status(200).json({
        success: true,
        message: `Rol cambiado a ${role}`,
        user: userResponse,
        accessToken,
        refreshToken
    });
});

module.exports = { getMe, switchRole };
