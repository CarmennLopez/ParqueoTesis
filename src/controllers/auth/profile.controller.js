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
    await setCache(cacheKey, userResponse, 60);

    res.status(200).json(userResponse);
});

module.exports = { getMe };
