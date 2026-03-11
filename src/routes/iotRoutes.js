// src/routes/iotRoutes.js
const express = require('express');
const router = express.Router();
const { handleLprEvent } = require('../controllers/iot/lpr.controller');

// En producción, esto debería tener un middleware de validación de API Key o firma HMAC
// para asegurar que solo las cámaras autorizadas puedan llamar a este endpoint.
/**
 * @swagger
 * /api/iot/lpr/event:
 *   post:
 *     tags: [IoT - Hardware]
 *     summary: Notificar evento de reconocimiento de placas (LPR)
 *     description: Endpoint para cámaras inteligentes que detectan ingreso/salida automática.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plate: { type: string }
 *               gateId: { type: string }
 *               confidence: { type: number }
 *     responses:
 *       200:
 *         description: Evento procesado exitosamente
 */
router.post('/lpr/event', handleLprEvent);

module.exports = router;
