// src/config/constants.js
/**
 * Constantes centralizadas de la aplicación
 */

module.exports = {
    // Tarifas de parqueo
    RATE_PER_HOUR: 2.50,

    // Configuración de JWT
    JWT_EXPIRATION: '24h',

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

    // Roles de usuario
    USER_ROLES: {
        USER: 'user',
        ADMIN: 'admin',
        OPERATOR: 'operator'
    }
};
