// src/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { setCache, getCache, deleteCache } = require('../config/redis');
const { JWT_EXPIRATION, REFRESH_TOKEN_EXPIRATION } = require('../config/constants');
const logger = require('../config/logger');

/**
 * Genera un Access Token (JWT)
 * @param {Object} user - Usuario para el que se genera el token
 * @returns {String} Access Token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );
};

/**
 * Genera un Refresh Token opaco y lo guarda en Redis
 * @param {Object} user - Usuario
 * @returns {Promise<String>} Refresh Token
 */
const generateRefreshToken = async (user) => {
    // Generar un token aleatorio seguro
    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Clave para Redis: refresh_token:<token> -> userId
    const key = `refresh_token:${refreshToken}`;

    // Calcular TTL en segundos (asumiendo formato '7d', '24h', etc. en constantes, convertimos a segundos)
    // Por simplicidad, usaremos un valor fijo en segundos si la constante es string complejo
    // REFRESH_TOKEN_EXPIRATION debería ser en segundos para Redis o parsearlo.
    // Vamos a asumir que en constants.js definiremos REFRESH_TOKEN_EXPIRATION_SEC
    const ttlSeconds = 7 * 24 * 60 * 60; // 7 días por defecto

    // Guardar en Redis con TTL
    // Guardamos el ID del usuario y la versión del token (para invalidación masiva)
    const payload = {
        userId: user._id.toString(),
        version: user.refreshTokenVersion || 0
    };

    await setCache(key, payload, ttlSeconds);

    // También guardamos una referencia inversa para poder invalidar todos los tokens de un usuario
    // user_refresh_tokens:<userId> -> [token1, token2, ...] (Set)
    // Nota: Redis Sets no tienen TTL individual, así que esto requiere manejo cuidadoso.
    // Para simplificar en esta fase, solo usaremos la validación directa del token.

    return refreshToken;
};

/**
 * Verifica y consume un Refresh Token (Rotación)
 * @param {String} token - Refresh Token recibido
 * @returns {Promise<Object>} Payload del usuario si es válido
 */
const verifyAndRotateRefreshToken = async (token) => {
    const key = `refresh_token:${token}`;
    const payload = await getCache(key);

    if (!payload) {
        throw new Error('Refresh token inválido o expirado');
    }

    // Borrar el token usado (Rotación de tokens)
    // Esto previene ataques de replay. Si alguien trata de usarlo de nuevo, fallará.
    await deleteCache(key);

    return payload;
};

/**
 * Revoca un Refresh Token (Logout)
 * @param {String} token 
 */
const revokeRefreshToken = async (token) => {
    const key = `refresh_token:${token}`;
    await deleteCache(key);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAndRotateRefreshToken,
    revokeRefreshToken
};
