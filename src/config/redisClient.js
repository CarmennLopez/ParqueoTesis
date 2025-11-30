// src/config/redisClient.js
const Redis = require('ioredis');
const logger = require('./logger');

/**
 * Cliente Redis para caché distribuido y sesiones
 * Compatible con Memurai en Windows y Redis en Linux/Mac
 */

// Configuración del cliente Redis
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    // Password solo en producción
    password: process.env.REDIS_PASSWORD || undefined,
    // Reintentos automáticos de conexión
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Reintentando conexión Redis... Intento ${times} (delay: ${delay}ms)`);
        return delay;
    },
    // Configuración de timeouts
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
    // Lazy connect para evitar bloquear el inicio
    lazyConnect: true,
    // Logging de comandos en desarrollo
    showFriendlyErrorStack: process.env.NODE_ENV === 'development',
};

// Crear cliente Redis
const redisClient = new Redis(redisConfig);

// ========================================
// EVENT HANDLERS
// ========================================

redisClient.on('connect', () => {
    logger.info('🔗 Conectando a Redis/Memurai...');
});

redisClient.on('ready', () => {
    logger.info('✅ Redis conectado y listo');
});

redisClient.on('error', (err) => {
    logger.error('❌ Error de conexión Redis:', {
        message: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

redisClient.on('close', () => {
    logger.warn('⚠️  Conexión Redis cerrada');
});

redisClient.on('reconnecting', (time) => {
    logger.info(`🔄 Reconectando a Redis (delay: ${time}ms)...`);
});

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Almacena un valor en caché con TTL
 * @param {string} key - Clave del caché
 * @param {any} value - Valor a almacenar (se serializa a JSON)
 * @param {number} ttlSeconds - Tiempo de vida en segundos
 * @returns {Promise<string>} OK si fue exitoso
 */
async function setCache(key, value, ttlSeconds = 300) {
    try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds > 0) {
            return await redisClient.setex(key, ttlSeconds, serialized);
        }
        return await redisClient.set(key, serialized);
    } catch (error) {
        logger.error('Error al guardar en caché:', { key, error: error.message });
        throw error;
    }
}

/**
 * Obtiene un valor del caché
 * @param {string} key - Clave del caché
 * @returns {Promise<any|null>} Valor deserializado o null si no existe
 */
async function getCache(key) {
    try {
        const cached = await redisClient.get(key);
        if (!cached) return null;
        return JSON.parse(cached);
    } catch (error) {
        logger.error('Error al leer del caché:', { key, error: error.message });
        return null;
    }
}

/**
 * Elimina una clave del caché
 * @param {string} key - Clave a eliminar
 * @returns {Promise<number>} Número de claves eliminadas
 */
async function deleteCache(key) {
    try {
        return await redisClient.del(key);
    } catch (error) {
        logger.error('Error al eliminar del caché:', { key, error: error.message });
        throw error;
    }
}

/**
 * Elimina múltiples claves que coincidan con un patrón
 * @param {string} pattern - Patrón (ej: 'user:*')
 * @returns {Promise<number>} Número de claves eliminadas
 */
async function deleteCachePattern(pattern) {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length === 0) return 0;
        return await redisClient.del(...keys);
    } catch (error) {
        logger.error('Error al eliminar patrón del caché:', { pattern, error: error.message });
        throw error;
    }
}

/**
 * Verifica si Redis está conectado y funcionando
 * @returns {Promise<boolean>}
 */
async function isRedisHealthy() {
    try {
        const response = await redisClient.ping();
        return response === 'PONG';
    } catch (error) {
        logger.error('Health check de Redis falló:', error.message);
        return false;
    }
}

// ========================================
// FUNCIONES PARA RATE LIMITING
// ========================================

/**
 * Incrementa contador para rate limiting
 * @param {string} key - Identificador único (ej: IP, userId)
 * @param {number} windowSeconds - Ventana de tiempo en segundos
 * @returns {Promise<number>} Número de intentos actual
 */
async function incrementRateLimit(key, windowSeconds = 60) {
    try {
        const current = await redisClient.incr(key);
        // Solo establecer TTL en el primer intento
        if (current === 1) {
            await redisClient.expire(key, windowSeconds);
        }
        return current;
    } catch (error) {
        logger.error('Error en rate limit:', { key, error: error.message });
        throw error;
    }
}

// ========================================
// FUNCIONES PARA IDEMPOTENCIA (Pagos)
// ========================================

/**
 * Guarda resultado de operación idempotente
 * @param {string} idempotencyKey - UUID único del cliente
 * @param {any} result - Resultado de la operación
 * @param {number} ttlSeconds - TTL (default 24 horas)
 * @returns {Promise<string>}
 */
async function saveIdempotentResult(idempotencyKey, result, ttlSeconds = 86400) {
    const key = `idempotency:${idempotencyKey}`;
    return await setCache(key, result, ttlSeconds);
}

/**
 * Obtiene resultado de operación idempotente previa
 * @param {string} idempotencyKey - UUID único del cliente
 * @returns {Promise<any|null>}
 */
async function getIdempotentResult(idempotencyKey) {
    const key = `idempotency:${idempotencyKey}`;
    return await getCache(key);
}

// ========================================
// CONEXIÓN Y CIERRE GRACEFUL
// ========================================

/**
 * Conecta al cliente Redis
 * @returns {Promise<void>}
 */
async function connect() {
    try {
        await redisClient.connect();
        logger.info('Cliente Redis inicializado correctamente');
    } catch (error) {
        logger.error('Fallo al conectar Redis:', error.message);
        throw error;
    }
}

/**
 * Cierra la conexión Redis de forma ordenada
 * @returns {Promise<void>}
 */
async function disconnect() {
    try {
        await redisClient.quit();
        logger.info('Conexión Redis cerrada correctamente');
    } catch (error) {
        logger.error('Error al cerrar Redis:', error.message);
        throw error;
    }
}

// Manejo de señales de terminación
process.on('SIGINT', async () => {
    await disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await disconnect();
    process.exit(0);
});

// ========================================
// EXPORTS
// ========================================

module.exports = {
    redisClient,
    connect,
    disconnect,
    // Caché básico
    setCache,
    getCache,
    deleteCache,
    deleteCachePattern,
    // Health
    isRedisHealthy,
    // Rate Limiting
    incrementRateLimit,
    // Idempotencia
    saveIdempotentResult,
    getIdempotentResult,
};
