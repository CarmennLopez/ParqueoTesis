// src/routes/iotRoutes.js
const express = require('express');
const router = express.Router();
const { handleLprEvent } = require('../controllers/iot/lpr.controller');

/**
 * @swagger
 * /api/iot/lpr/event:
 *   post:
 *     tags: [IoT / Cámaras]
 *     summary: Evento de reconocimiento de placa (LPR)
 *     description: |
 *       Recibe eventos de las cámaras de reconocimiento de placas (License Plate Recognition).
 *       Busca al usuario por placa y dispara la lógica de entrada/salida automática.
 *
 *       > **Seguridad**: En producción este endpoint debe protegerse con
 *       > una **API Key** o firma **HMAC** para validar que la petición
 *       > proviene de una cámara autorizada.
 *
 *       **Flujo automático**:
 *       - `ENTRY` → Se asigna un espacio si el usuario es solvente
 *       - `EXIT` → Se libera el espacio y se calcula la tarifa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LprEventRequest'
 *     responses:
 *       200:
 *         description: Evento procesado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 message:  { type: string,  example: "Evento LPR procesado" }
 *                 action:   { type: string,  enum: [ASSIGN, RELEASE], example: "ASSIGN" }
 *                 space:    { type: string,  example: "A-5", nullable: true }
 *       400:
 *         description: Placa no encontrada o datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No se encontró usuario con la placa: UMG-999"
 *       402:
 *         description: Usuario no solvente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/lpr/event', handleLprEvent);

module.exports = router;
