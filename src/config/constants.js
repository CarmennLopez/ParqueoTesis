// src/config/constants.js
/**
 * Constantes centralizadas de la aplicación
 */

module.exports = {
    // Tarifas de parqueo
    RATE_PER_HOUR: 2.50,

    // Configuración de JWT
    JWT_EXPIRATION: '15m', // Access Token corto (15 min)
    REFRESH_TOKEN_EXPIRATION: '7d', // Refresh Token largo (7 días)

    // Rate limiting
    LOGIN_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS: 5,

    // Parqueo
    PARKING_LOT_NAME: process.env.PARKING_LOT_NAME || 'Parqueo Principal',

    // Validación de contraseñas
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,

    // Validación de placas
    VEHICLE_PLATE_REGEX: /^[A-Z0-9]{6,8}$/i,

    // Roles de usuario (Jerárquicos)
    USER_ROLES: {
        ADMIN: 'admin',      // Acceso total al sistema
        GUARD: 'guard',      // Operador de garita (verificar, liberar manual)
        FACULTY: 'faculty',  // Catedráticos y personal administrativo
        STUDENT: 'student',  // Estudiantes activos
        VISITOR: 'visitor'   // Visitantes externos
    },

    // Solvencia de parqueo
    SOLVENCY_MONTHS: 1,     // Duración de la solvencia (pago mensual)
    ROLES_EXEMPT_FROM_SOLVENCY: ['admin', 'guard', 'faculty', 'visitor']  // No requieren solvencia
};
