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
 * /api/health/liveness:
 *   get:
 *     tags:
 *       - Health
 *     summary: Liveness probe
 *     description: |
 *       Verifica si el servicio está vivo y respondiendo.
 *       Usado por Kubernetes, Docker, load balancers y herramientas de monitoreo.
 *       
 *       Este endpoint solo verifica que el proceso esté ejecutándose.
 *     responses:
 *       200:
 *         description: Servicio vivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "UP"
 *                 timestamp:
 *                   type: integer
 *                   description: Timestamp Unix en milisegundos
 *                   example: 1770513063910
 *                 uptime:
 *                   type: integer
 *                   description: Tiempo de actividad en segundos
 *                   example: 1392
 */
router.get('/liveness', livenessProbe);

/**
 * @swagger
 * /api/health/readiness:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness probe
 *     description: |
 *       Verifica si el servicio puede recibir tráfico.
 *       Comprueba las conexiones a dependencias críticas (MongoDB, Redis, etc.).
 *       
 *       Usado por Kubernetes para determinar si el pod puede recibir tráfico.
 *     responses:
 *       200:
 *         description: Servicio listo para recibir tráfico
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 mongodb:
 *                   type: boolean
 *                   description: Estado de conexión a MongoDB
 *                   example: true
 *                 redis:
 *                   type: boolean
 *                   description: Estado de conexión a Redis
 *                   example: true
 *                 timestamp:
 *                   type: integer
 *                   example: 1770513063910
 *                 environment:
 *                   type: string
 *                   example: "development"
 *       503:
 *         description: Servicio no listo (dependencias no disponibles)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 mongodb:
 *                   type: boolean
 *                   example: false
 *                 redis:
 *                   type: boolean
 *                   example: false
 */
router.get('/readiness', readinessProbe);

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check estándar
 *     description: |
 *       Endpoint de salud estándar para retrocompatibilidad.
 *       Retorna un estado simple del servicio.
 *     responses:
 *       200:
 *         description: Servicio saludable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 */
router.get('/', standardHealth);

module.exports = router;
