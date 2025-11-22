// src/middleware/authorize.js
/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga el rol necesario para acceder a la ruta
 * 
 * @param {...string} roles - Roles permitidos para acceder a la ruta
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(401).json({
                message: 'No autorizado, rol de usuario no disponible'
            });
        }

        if (!roles.includes(req.userRole)) {
            return res.status(403).json({
                message: 'Acceso denegado. No tienes permisos suficientes para acceder a este recurso',
                requiredRoles: roles,
                yourRole: req.userRole
            });
        }

        next();
    };
};

module.exports = authorize;
