// src/controllers/healthController.js
const { isRedisHealthy } = require('../config/redisClient');
const mongoose = require('mongoose');

/**
 * @desc Health check simple - Liveness Probe
 * @route GET /health/liveness
 * @access Public
 * @purpose Indica si el proceso está vivo (para Kubernetes/Load Balancers)
 */
const livenessProbe = async (req, res, next) => {
    try {
        // Simple check: Si este endpoint responde, el proceso está vivo
        res.status(200).json({
            status: 'UP',
            timestamp: Date.now(),
            uptime: Math.floor(process.uptime()),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Health check profundo - Readiness Probe
 * @route GET /health/readiness
 * @access Public
 * @purpose Indica si el servicio puede recibir tráfico (chequea dependencias)
 */
const readinessProbe = async (req, res, next) => {
    try {
        const checks = {
            mongodb: false,
            redis: false,
        };

        let overallStatus = 'UP';

        // Check 1: MongoDB
        try {
            checks.mongodb = mongoose.connection.readyState === 1; // 1 = connected
            if (!checks.mongodb) {
                overallStatus = 'DOWN';
            }
        } catch (error) {
            checks.mongodb = false;
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
