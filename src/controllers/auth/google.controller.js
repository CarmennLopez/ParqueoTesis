const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../../models');
const { generateAccessToken, generateRefreshToken } = require('../../utils/tokenUtils');
const { logAudit } = require('../../utils/auditLogger');
const { USER_ROLES } = require('../../config/constants');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const UNIVERSITY_DOMAIN = '@miumg.edu.gt';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * Login o registro con Google OAuth
 * Solo permite correos @miumg.edu.gt
 */
const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({
            success: false,
            message: 'Token de Google requerido'
        });
    }

    // 1. Verificar el token con Google
    let payload;
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Token de Google inválido o expirado'
        });
    }

    const { email, name, sub: googleId } = payload;

    // 2. Validar dominio universitario
    if (!email.endsWith(UNIVERSITY_DOMAIN)) {
        return res.status(403).json({
            success: false,
            message: `Solo se permiten correos institucionales ${UNIVERSITY_DOMAIN}`
        });
    }

    // 3. Buscar usuario existente o crear uno nuevo
    let user = await User.findOne({ where: { email } });

    if (!user) {
        const uniqueSuffix = googleId.substring(0, 8);
        user = await User.create({
            name: name || email.split('@')[0],
            email,
            password: `google_${googleId}`,
            role: USER_ROLES.STUDENT,           // ← CORREGIDO: era 'estudiante'
            cardId: `GOOGLE-${uniqueSuffix}`,
            vehiclePlate: `GOOG-${uniqueSuffix}`,
        });

        logAudit(req, 'REGISTER_GOOGLE', 'User', { userId: user.id, email });
    }

    // 4. Generar tokens JWT (mismo formato que login normal)
    const userForToken = { ...user.toJSON(), _id: user.id };
    const accessToken = generateAccessToken(userForToken);
    const refreshToken = await generateRefreshToken(userForToken);

    logAudit(req, 'LOGIN_GOOGLE', 'User', { userId: user.id, email });

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
});

module.exports = { googleLogin };
