const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../../models');
const { generateAccessToken, generateRefreshToken } = require('../../utils/tokenUtils');
const { logAudit } = require('../../utils/auditLogger');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const UNIVERSITY_DOMAIN = '@miumg.edu.gt';

const { USER_ROLES } = require('../../config/constants');

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * Login o registro con Google OAuth
 * Solo permite correos @miumg.edu.gt
 */
const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        res.status(400);
        throw new Error('Token de Google requerido');
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
        res.status(401);
        throw new Error('Token de Google inválido o expirado');
    }

    const { email, name, sub: googleId, picture } = payload;

    // 2. Validar dominio universitario (SEGURIDAD REAL en backend)
    if (!email.endsWith(UNIVERSITY_DOMAIN)) {
        res.status(403);
        throw new Error(`Solo se permiten correos institucionales ${UNIVERSITY_DOMAIN}`);
    }

    // 3. Buscar usuario existente
    let user = await User.findOne({ where: { email } });

    if (!user) {
        // 4. Crear usuario nuevo automáticamente
        // Para usuarios Google: cardId y vehiclePlate se generan como placeholder
        const uniqueSuffix = googleId.substring(0, 8);
        user = await User.create({
            name: name || email.split('@')[0],
            email,
            password: `google_${googleId}`, // No se usará para login, solo para cumplir el modelo
            role: USER_ROLES.STUDENT,
            cardId: `GOOGLE-${uniqueSuffix}`,
            vehiclePlate: `GOOG-${uniqueSuffix}`,
        });

        logAudit(req, 'REGISTER_GOOGLE', 'User', { userId: user.id, email });
    }

    // 5. Generar tokens JWT
    const userForToken = { ...user.toJSON(), _id: user.id };
    const accessToken = generateAccessToken(userForToken);
    const refreshToken = await generateRefreshToken(userForToken);

    let parkingLotName = null;
    if (user.currentParkingLotId) {
        const lot = await require('../../models').ParkingLot.findByPk(user.currentParkingLotId);
        if (lot) parkingLotName = lot.name;
    }

    logAudit(req, 'LOGIN_GOOGLE', 'User', { userId: user.id, email });

    res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPaid: user.hasPaid,
        currentParkingLot: parkingLotName,
        currentParkingSpace: user.currentParkingSpace,
        accessToken,
        refreshToken,
    });
});

module.exports = { googleLogin };
