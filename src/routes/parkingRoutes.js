// src/routes/parkingRoutes.js

// Importaciones necesarias
const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Middleware de protección JWT
const parkingController = require('../controllers/parkingController'); // Controlador con la lógica de negocio

const router = express.Router();

// ----------------------------------------------------------------------
// RUTAS PRINCIPALES DEL FLUJO DE PARQUEO (Todas requieren autenticación JWT)
// ----------------------------------------------------------------------

/**
 * @route POST /api/parking/assign
 * @desc Asigna un espacio libre al usuario (ENTRADA)
 * @access Private
 */
router.post('/assign', protect, parkingController.assignSpace);

/**
 * @route POST /api/parking/pay
 * @desc Simula el pago de la tarifa del parqueo (Actualiza hasPaid a true)
 * @access Private
 */
router.post('/pay', protect, parkingController.payParking);

/**
 * @route POST /api/parking/release
 * @desc Libera el espacio, calcula el costo y verifica el pago (SALIDA)
 * @access Private
 */
router.post('/release', protect, parkingController.releaseSpace);

// ----------------------------------------------------------------------
// RUTA DE ADMINISTRACIÓN / DASHBOARD
// ----------------------------------------------------------------------

/**
 * @route GET /api/parking/status
 * @desc Obtiene el estado actual de ocupación del parqueo.
 * @access Private (Requiere autenticación, idealmente de un rol Admin)
 */
router.get('/status', protect, parkingController.getParkingStatus);

module.exports = router;
