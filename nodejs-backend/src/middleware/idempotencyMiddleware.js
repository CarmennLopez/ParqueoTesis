// src/middleware/idempotencyMiddleware.js
const { getCache, setCache } = require('../config/redisClient');
const logger = require('../config/logger');

/**
 * Middleware para garantizar idempotencia en operaciones críticas (pagos).
 * Requiere el header 'Idempotency-Key'.
 * Si la clave ya existe, devuelve la respuesta almacenada previamente.
 */
const idempotency = async (req, res, next) => {
    const key = req.headers['idempotency-key'];

    // Solo aplicar para métodos que modifican estado (POST, PUT, PATCH, DELETE)
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        return next();
    }

    if (!key) {
        // Opcional: Forzar requerimiento de key para ciertas rutas
        // Por ahora solo logueamos warning si es una ruta de pago
        if (req.path.includes('/pay')) {
            logger.warn('Solicitud de pago sin Idempotency-Key');
        }
        return next();
    }

    const redisKey = `idempotency:${key}`;

    try {
        const cachedResponse = await getCache(redisKey);

        if (cachedResponse) {
            logger.info(`Idempotency hit: ${key}`);
            // Devolver respuesta cacheada
            return res.status(cachedResponse.statusCode).json(cachedResponse.body);
        }

        // Interceptar la respuesta para guardarla en Redis antes de enviarla
        const originalSend = res.json;
        res.json = function (body) {
            // Guardar en Redis (TTL 24h)
            setCache(redisKey, {
                statusCode: res.statusCode,
                body: body
            }, 24 * 60 * 60).catch(err => logger.error('Error guardando idempotency key:', err));

            // Llamar al método original
            originalSend.call(this, body);
        };

        next();
    } catch (error) {
        logger.error('Error en middleware de idempotencia:', error);
        next();
    }
};

module.exports = idempotency;
