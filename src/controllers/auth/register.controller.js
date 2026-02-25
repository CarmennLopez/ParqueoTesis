const asyncHandler = require('express-async-handler');
const { User } = require('../../models');
const { generateAccessToken } = require('../../utils/tokenUtils');
const { logAudit } = require('../../utils/auditLogger');
const { USER_ROLES } = require('../../config/constants');

const register = asyncHandler(async (req, res) => {
    const { name, email, password, cardId, vehiclePlate, role } = req.body;

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        res.status(400);
        throw new Error('El usuario ya existe');
    }

    const user = await User.create({
        name, email, password, cardId, vehiclePlate,
        role: role || USER_ROLES.STUDENT
    });

    if (user) {
        logAudit(req, 'REGISTER', 'User', { userId: user.id, email: user.email });
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateAccessToken({ ...user.toJSON(), _id: user.id })
        });
    } else {
        res.status(400); throw new Error('Datos de usuario inválidos');
    }
});

module.exports = { register };
