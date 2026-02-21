const { redisClient } = require('./connection');
const logger = require('../logger');

async function isRedisHealthy() {
    try {
        const response = await redisClient.ping();
        return response === 'PONG';
    } catch (error) {
        logger.error('Health check de Redis falló:', error.message);
        return false;
    }
}

module.exports = { isRedisHealthy };
