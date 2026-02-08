// src/routes/iotRoutes.js
const express = require('express');
const router = express.Router();
const { handleLprEvent } = require('../controllers/iotController');

/**
 * @swagger
 * /api/iot/lpr/event:
 *   post:
 *     tags:
 *       - IoT
 *     summary: Evento de cámara LPR
 *     description: |
 *       Recibe eventos de reconocimiento de placas desde cámaras IoT.
 *       
 *       **Nota de Seguridad:** En producción, este endpoint debería tener un middleware 
 *       de validación de API Key o firma HMAC para asegurar que solo las cámaras 
 *       autorizadas puedan llamar a este endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plate
 *               - timestamp
 *             properties:
 *               plate:
 *                 type: string
 *                 description: Placa detectada por la cámara
 *                 example: "ABC123"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Momento de la detección
 *                 example: "2024-02-07T19:30:00Z"
 *               confidence:
 *                 type: number
 *                 description: Nivel de confianza de la detección (0-1)
 *                 example: 0.95
 *                 minimum: 0
 *                 maximum: 1
 *               cameraId:
 *                 type: string
 *                 description: ID de la cámara que detectó la placa
 *                 example: "CAM-001"
 *     responses:
 *       200:
 *         description: Evento procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Evento procesado exitosamente"
 *                 user:
 *                   type: object
 *                   description: Información del usuario asociado a la placa (si existe)
 *                   nullable: true
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/lpr/event', handleLprEvent);

module.exports = router;
