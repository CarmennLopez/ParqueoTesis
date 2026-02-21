const Redis = require('ioredis');
const logger = require('../logger');

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Reintentando conexión Redis... Intento ${times} (delay: ${delay}ms)`);
        return delay;
    },
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    showFriendlyErrorStack: process.env.NODE_ENV === 'development',
};

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => logger.info('🔗 Conectando a Redis/Memurai...'));
redisClient.on('ready', () => logger.info('✅ Redis conectado y listo'));
redisClient.on('error', (err) => logger.error('❌ Error de conexión Redis:', { message: err.message }));
redisClient.on('close', () => logger.warn('⚠️  Conexión Redis cerrada'));
redisClient.on('reconnecting', (time) => logger.info(`🔄 Reconectando a Redis (delay: ${time}ms)...`));

async function connect() {
    try { await redisClient.connect(); logger.info('Cliente Redis inicializado'); }
    catch (error) { logger.error('Fallo al conectar Redis:', error.message); throw error; }
}

async function disconnect() {
    try { await redisClient.quit(); logger.info('Conexión Redis cerrada'); }
    catch (error) { logger.error('Error al cerrar Redis:', error.message); throw error; }
}

process.on('SIGINT', async () => { await disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await disconnect(); process.exit(0); });

module.exports = { redisClient, connect, disconnect };
