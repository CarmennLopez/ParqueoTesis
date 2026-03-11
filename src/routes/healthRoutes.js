// src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const {
    livenessProbe,
    readinessProbe,
    standardHealth,
} = require('../controllers/healthController');

/**
 * Health Check Routes
 * Usado por load balancers, Kubernetes, y monitoring tools
 */

/**
 * @swagger
 * /health/liveness:
 *   get:
 *     tags: [Mantenimiento - Health]
 *     summary: Liveness Probe (¿Está vivo?)
 *     responses:
 *       200:
 *         description: El proceso está vivo
 */
router.get('/liveness', livenessProbe);

/**
 * @swagger
 * /health/readiness:
 *   get:
 *     tags: [Mantenimiento - Health]
 *     summary: Readiness Probe (¿Listo para recibir tráfico?)
 *     responses:
 *       200:
 *         description: El servidor está listo y conectado a DB/Redis
 */
router.get('/readiness', readinessProbe);

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Mantenimiento - Health]
 *     summary: Health Check Estándar
 *     responses:
 *       200:
 *         description: Estado general del sistema
 */
router.get('/', standardHealth);

module.exports = router;
