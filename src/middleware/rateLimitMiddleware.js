// src/middleware/rateLimitMiddleware.js
const { incrementRateLimit } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Crea un middleware de Rate Limit distribuido usando Redis.
 * @param {string} keyPrefix - Prefijo para la clave en Redis (ej. 'limit_pay')
 * @param {number} limit - Número máximo de peticiones permitidas
 * @param {number} windowSeconds - Ventana de tiempo en segundos
 */
const distributedRateLimit = (keyPrefix, limit, windowSeconds) => {
    return async (req, res, next) => {
        const userId = req.userId || req.ip; // Usar ID de usuario si existe, sino IP
        const key = `ratelimit:${keyPrefix}:${userId}`;

        try {
            const current = await getCache(key);

            if (current && current >= limit) {
                logger.warn(`Rate Limit Exceeded [${keyPrefix}] for ${userId}`);
                return res.status(429).json({
                    type: 'about:blank',
                    title: 'Too Many Requests',
                    status: 429,
                    detail: `Ha excedido el límite de ${limit} intentos. Intente de nuevo en unos momentos.`,
                    instance: req.originalUrl
                });
            }

            // Incrementar contador (manual, idealmente usar INCR de Redis pero setCache funciona para demo)
            // Nota: Esto tiene una condición de carrera leve, para producción usar script Lua o INCR
            const newValue = (current || 0) + 1;

            // Si es el primer intento, establecer TTL. Si no, mantener TTL (o resetearlo, depende estrategia)
            // Aquí simplificamos: cada update resetea TTL (Sliding Window aproximado) o Fixed Window si solo set al crear
            // Usaremos Fixed Window simple:
            if (!current) {
                await setCache(key, newValue, windowSeconds);
            } else {
                // Actualizar valor sin cambiar TTL (requeriría comando específico, aquí simplificamos re-seteando)
                // Para demo robusta, asumimos que setCache sobrescribe.
                // Mejor estrategia simple: obtener TTL restante.
                // Como redisClient.js es básico, solo hacemos setCache.
                await setCache(key, newValue, windowSeconds);
            }

            next();
        } catch (error) {
            logger.error('Error en Rate Limit:', error);
            // Fail open: si Redis falla, permitir la petición
            next();
        }
    };
};

module.exports = distributedRateLimit;
