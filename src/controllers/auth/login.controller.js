const asyncHandler = require('express-async-handler');
const { User } = require('../../models');
const { generateAccessToken, generateRefreshToken, revokeRefreshToken } = require('../../utils/tokenUtils');
const { logAudit } = require('../../utils/auditLogger');

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user && (await user.matchPassword(password))) {
        const userForToken = { ...user.toJSON(), _id: user.id };
        const accessToken = generateAccessToken(userForToken);
        const refreshToken = await generateRefreshToken(userForToken);

        logAudit(req, 'LOGIN', 'User', { userId: user.id, email: user.email });

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hasPaid: user.hasPaid,
            currentParkingSpace: user.currentParkingSpace,
            accessToken,
            refreshToken
        });
    } else {
        logAudit(req, 'LOGIN_FAILED', 'User', { email });
        res.status(401); throw new Error('Credenciales inválidas');
    }
});

const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.status(200).json({ message: 'Sesión cerrada exitosamente' });
});

module.exports = { login, logout };
