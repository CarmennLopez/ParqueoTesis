const { redisClient } = require('./connection');
const logger = require('../logger');

async function incrementRateLimit(key, windowSeconds = 60) {
    try {
        const current = await redisClient.incr(key);
        if (current === 1) await redisClient.expire(key, windowSeconds);
        return current;
    } catch (error) {
        logger.error('Error en rate limit:', { key, error: error.message });
        throw error;
    }
}

module.exports = { incrementRateLimit };
