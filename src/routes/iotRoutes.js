// src/routes/iotRoutes.js
const express = require('express');
const router = express.Router();
const { handleLprEvent } = require('../controllers/iot/lpr.controller');
const { validateIotApiKey } = require('../middleware/iotAuthMiddleware');

// Protegido por API Key — solo cámaras/dispositivos autorizados pueden enviar eventos.
// Header requerido: X-IoT-Api-Key: <valor de IOT_API_KEY en .env>
router.post('/lpr/event', validateIotApiKey, handleLprEvent);

module.exports = router;

