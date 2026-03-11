const asyncHandler = require('express-async-handler');
const { User } = require('../../../models');
const { USER_ROLES } = require('../../../config/constants');

/**
 * @desc    Listar usuarios para administración
 * @route   GET /api/parking/admin/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'vehiclePlate', 'hasPaid', 'createdAt']
    });
    res.status(200).json({ success: true, data: users });
});

/**
 * @desc    Cambiar rol de usuario
 * @route   PATCH /api/parking/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(USER_ROLES).includes(role)) {
        res.status(400);
        throw new Error('Rol no válido');
    }

    const user = await User.findByPk(id);
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    user.role = role;
    await user.save();
    res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Alternar estado de pago (Mensualidad)
 * @route   PATCH /api/parking/admin/users/:id/payment
 * @access  Private/Admin
 */
const togglePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { hasPaid } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    user.hasPaid = hasPaid;
    await user.save();
    
    res.status(200).json({ 
        success: true, 
        message: `Estado de pago actualizado para ${user.name}`,
        data: { id: user.id, hasPaid: user.hasPaid }
    });
});

module.exports = {
    getUsers,
    updateUserRole,
    togglePaymentStatus
};
