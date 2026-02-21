const { redisClient } = require('./connection');
const logger = require('../logger');

async function setCache(key, value, ttlSeconds = 300) {
    try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds > 0) return await redisClient.setex(key, ttlSeconds, serialized);
        return await redisClient.set(key, serialized);
    } catch (error) {
        logger.error('Error al guardar en caché:', { key, error: error.message });
        throw error;
    }
}

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

async function deleteCache(key) {
    try { return await redisClient.del(key); }
    catch (error) {
        logger.error('Error al eliminar del caché:', { key, error: error.message });
        throw error;
    }
}

async function deleteCachePattern(pattern) {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length === 0) return 0;
        return await redisClient.del(...keys);
    } catch (error) {
        logger.error('Error al eliminar patrón:', { pattern, error: error.message });
        throw error;
    }
}

module.exports = { setCache, getCache, deleteCache, deleteCachePattern };
