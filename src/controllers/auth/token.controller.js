const asyncHandler = require('express-async-handler');
const { User } = require('../../models');
const { generateAccessToken, generateRefreshToken, verifyAndRotateRefreshToken } = require('../../utils/tokenUtils');

const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400); throw new Error('Refresh Token es requerido'); }

    try {
        const payload = await verifyAndRotateRefreshToken(refreshToken);
        const user = await User.findByPk(payload.userId);
        if (!user) { res.status(401); throw new Error('Usuario no encontrado'); }

        const userForToken = { ...user.toJSON(), _id: user.id };
        const newAccessToken = generateAccessToken(userForToken);
        const newRefreshToken = await generateRefreshToken(userForToken);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(403); throw new Error('Refresh Token inválido o expirado');
    }
});

module.exports = { refreshToken };
