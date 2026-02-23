// src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const {
    livenessProbe,
    readinessProbe,
    standardHealth,
} = require('../controllers/healthController');

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Estado general del servicio
 *     description: Endpoint de salud estándar (retrocompatibilidad). Verifica que la API está corriendo.
 *     responses:
 *       200:
 *         description: Servicio activo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 version:
 *                   type: string
 *                   example: "2.0.0"
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 *                   description: "Segundos desde que inició el proceso"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', standardHealth);

/**
 * @swagger
 * /health/liveness:
 *   get:
 *     tags: [Health]
 *     summary: Liveness probe (Kubernetes)
 *     description: |
 *       Verifica si el proceso Node.js está **vivo**.
 *       Si retorna error, Kubernetes reinicia el contenedor.
 *     responses:
 *       200:
 *         description: Proceso vivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "alive" }
 */
router.get('/liveness', livenessProbe);

/**
 * @swagger
 * /health/readiness:
 *   get:
 *     tags: [Health]
 *     summary: Readiness probe (Kubernetes)
 *     description: |
 *       Verifica si la aplicación está **lista para recibir tráfico**
 *       (conexión a base de datos y Redis activas).
 *       Si retorna error, el load balancer deja de enviar tráfico.
 *     responses:
 *       200:
 *         description: Servicio listo para recibir tráfico
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:   { type: string, example: "ready" }
 *                 database: { type: string, enum: [connected, disconnected], example: "connected" }
 *                 redis:    { type: string, enum: [connected, disconnected], example: "connected" }
 *       503:
 *         description: Servicio no disponible (DB o Redis desconectados)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:   { type: string, example: "not ready" }
 *                 database: { type: string, example: "disconnected" }
 *                 redis:    { type: string, example: "connected" }
 */
router.get('/readiness', readinessProbe);

module.exports = router;
