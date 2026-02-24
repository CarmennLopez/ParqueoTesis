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
            success: true,
            accessToken,
            refreshToken,
            user: {
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
                solvencyExpires: user.solvencyExpires ?? null
            }
        });
    } else {
        logAudit(req, 'LOGIN_FAILED', 'User', { email });
        res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }
});

const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente' });
});

module.exports = { login, logout };
