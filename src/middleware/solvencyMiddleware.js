// src/middleware/solvencyMiddleware.js
/**
 * Middleware que verifica si el usuario estudiante tiene solvencia mensual vigente.
 * - Roles exentos (admin, guard, faculty, visitor) pasan sin restricción.
 * - Estudiantes deben tener isSolvent = true Y solvencyExpires > ahora.
 */
const { User } = require('../models');
const { ROLES_EXEMPT_FROM_SOLVENCY } = require('../config/constants');

const checkSolvency = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'role', 'isSolvent', 'solvencyExpires']
        });

        if (!user) {
            res.status(401);
            throw new Error('Usuario no encontrado');
        }

        // Roles exentos no requieren verificación de solvencia
        if (ROLES_EXEMPT_FROM_SOLVENCY.includes(user.role)) {
            return next();
        }

        const now = new Date();
        const hasSolvency = user.isSolvent === true;
        const isNotExpired = user.solvencyExpires && new Date(user.solvencyExpires) > now;

        if (!hasSolvency || !isNotExpired) {
            const expiredMsg = (hasSolvency && !isNotExpired)
                ? `Su solvencia venció el ${new Date(user.solvencyExpires).toLocaleDateString('es-GT')}.`
                : 'No tiene solvencia registrada para este mes.';

            return res.status(402).json({
                success: false,
                code: 'SOLVENCY_REQUIRED',
                message: `Acceso denegado. ${expiredMsg} Contacte al departamento de caja para realizar su pago mensual.`,
                solvencyExpires: user.solvencyExpires || null
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { checkSolvency };
