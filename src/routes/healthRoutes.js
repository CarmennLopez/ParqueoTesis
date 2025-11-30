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

// Liveness Probe: ¿Está vivo el proceso?
router.get('/liveness', livenessProbe);

// Readiness Probe: ¿Puede recibir tráfico?
router.get('/readiness', readinessProbe);

// Health Endpoint estándar (retrocompatibilidad)
router.get('/', standardHealth);

module.exports = router;
