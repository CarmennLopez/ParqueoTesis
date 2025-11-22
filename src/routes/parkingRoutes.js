// src/routes/parkingRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const parkingController = require('../controllers/parkingController');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// ----------------------------------------------------------------------
// RUTAS PRINCIPALES DEL FLUJO DE PARQUEO (Todas requieren autenticación JWT)
// ----------------------------------------------------------------------

/**
 * @route POST /api/parking/assign
 * @desc Asigna un espacio libre al usuario (ENTRADA)
 * @access Private - Usuarios autenticados
 */
router.post('/assign', protect, parkingController.assignSpace);

/**
 * @route POST /api/parking/pay
 * @desc Simula el pago de la tarifa del parqueo
 * @access Private - Usuarios autenticados
 */
router.post('/pay', protect, parkingController.payParking);

/**
 * @route POST /api/parking/release
 * @desc Libera el espacio, calcula el costo y verifica el pago (SALIDA)
 * @access Private - Usuarios autenticados
 */
router.post('/release', protect, parkingController.releaseSpace);

// ----------------------------------------------------------------------
// RUTA DE ADMINISTRACIÓN / DASHBOARD
// ----------------------------------------------------------------------

/**
 * @route GET /api/parking/status
 * @desc Obtiene el estado actual de ocupación del parqueo
 * @access Private - Solo administradores
 */
router.get('/status', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.OPERATOR), parkingController.getParkingStatus);

module.exports = router;
