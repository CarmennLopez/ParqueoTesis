// src/middleware/roleMiddleware.js
const { USER_ROLES } = require('../config/constants');

/**
 * Middleware para verificar roles (RBAC)
 * @param {...String} allowedRoles - Roles permitidos para acceder a la ruta
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('No autorizado, usuario no encontrado');
        }

        // Admin siempre tiene acceso
        if (req.user.role === USER_ROLES.ADMIN) {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}`);
        }

        next();
    };
};

module.exports = { authorize };
