// src/controllers/healthController.js
const { isRedisHealthy } = require('../config/redis');
const { sequelize } = require('../config/database'); // Use Sequelize

const livenessProbe = async (req, res, next) => {
    try {
        res.status(200).json({ status: 'UP', timestamp: Date.now(), uptime: Math.floor(process.uptime()) });
    } catch (error) { next(error); }
};

const readinessProbe = async (req, res, next) => {
    try {
        const checks = {
            database: false,
            redis: false,
        };

        let overallStatus = 'UP';

        // Check 1: Database (PostgreSQL)
        try {
            await sequelize.authenticate();
            checks.database = true;
        } catch (error) {
            checks.database = false;
            overallStatus = 'DOWN';
        }

        // Check 2: Redis
        try {
            checks.redis = await isRedisHealthy();
            if (!checks.redis) {
                overallStatus = 'DOWN';
            }
        } catch (error) {
            checks.redis = false;
            overallStatus = 'DOWN';
        }

        // Información adicional
        const healthData = {
            status: overallStatus,
            checks,
            uptime: Math.floor(process.uptime()),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                unit: 'MB',
            },
            timestamp: Date.now(),
            environment: process.env.NODE_ENV || 'development',
        };

        // Retornar 503 si algún servicio crítico está caído
        const statusCode = overallStatus === 'UP' ? 200 : 503;
        res.status(statusCode).json(healthData);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Health check estándar (retrocompatibilidad)
 * @route GET /health
 * @access Public
 */
const standardHealth = async (req, res, next) => {
    try {
        // Versión simplificada para compatibilidad
        res.status(200).json({
            status: 'OK',
            uptime: process.uptime(),
            timestamp: Date.now(),
            environment: process.env.NODE_ENV || 'development',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    livenessProbe,
    readinessProbe,
    standardHealth,
};
