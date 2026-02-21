const asyncHandler = require('express-async-handler');
const { User } = require('../../models');
const { generateAccessToken } = require('../../utils/tokenUtils');
const { logAudit } = require('../../utils/auditLogger');
const { USER_ROLES } = require('../../config/constants');

const register = asyncHandler(async (req, res) => {
    try {
        // Soporta både camelCase y snake_case
        const { name, email, password, role } = req.body;
        const cardId = req.body.cardId || req.body.card_id;
        const vehiclePlate = req.body.vehiclePlate || req.body.vehicle_plate;

        console.log('📝 Registro solicitado:', { name, email, cardId, vehiclePlate });

        // Validar campos requeridos
        if (!name || !email || !password || !cardId || !vehiclePlate) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: name, email, password, card_id, vehicle_plate'
            });
        }

        // Verificar si existe
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'El usuario ya existe con ese email'
            });
        }

        // Crear usuario
        const user = await User.create({
            name,
            email,
            password,
            cardId,
            vehiclePlate,
            role: role || USER_ROLES.STUDENT
        });

        console.log('✓ Usuario creado:', { id: user.id, email: user.email });

        logAudit(req, 'REGISTER', 'User', { userId: user.id, email: user.email });

        res.status(201).json({
            success: true,
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateAccessToken({ ...user.toJSON(), _id: user.id })
        });
    } catch (error) {
        console.error('❌ Error en registro:', error.message);
        throw error;
    }
});

module.exports = { register };
