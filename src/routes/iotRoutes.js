// src/routes/iotRoutes.js
const express = require('express');
const router = express.Router();
const { handleLprEvent } = require('../controllers/iotController');

// En producción, esto debería tener un middleware de validación de API Key o firma HMAC
// para asegurar que solo las cámaras autorizadas puedan llamar a este endpoint.
router.post('/lpr/event', handleLprEvent);

module.exports = router;
