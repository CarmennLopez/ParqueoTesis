// src/routes/parkingRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const parkingController = require('../controllers/parkingController');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// ----------------------------------------------------------------------
// RUTAS PRINCIPALES DEL FLUJO DE PARQUEO (Todas requieren autenticaci├│n JWT)
// ----------------------------------------------------------------------

/**
// src/routes/parkingRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const parkingController = require('../controllers/parkingController');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// ----------------------------------------------------------------------
// RUTAS DE INFORMACI├ôN DE PARQUEOS
// ----------------------------------------------------------------------

/**
 * @route GET /api/parking/lots
 * @desc Lista todos los parqueos disponibles con su estado
 * @access Private - Usuarios autenticados
 */
router.get('/lots', protect, parkingController.getParkingLots);

// ----------------------------------------------------------------------
// RUTAS PRINCIPALES DEL FLUJO DE PARQUEO (Todas requieren autenticaci├│n JWT)
// ----------------------------------------------------------------------

/**
 * @route POST /api/parking/assign
 * @desc Asigna un espacio libre al usuario (ENTRADA)
 * @access Private - Usuarios autenticados
 */
router.post('/assign', protect, parkingController.assignSpace);

const distributedRateLimit = require('../middleware/rateLimitMiddleware');

/**
 * @route POST /api/parking/pay
 * @desc Simula el pago de la tarifa del parqueo
 * @access Private - Usuarios autenticados
 */
router.post('/pay',
    protect,
    distributedRateLimit('pay', 3, 60), // M├íx 3 intentos por minuto
    parkingController.payParking
);

/**
 * @route POST /api/parking/release
 * @desc Libera el espacio, calcula el costo y verifica el pago (SALIDA)
 * @access Private - Usuarios autenticados
 */
router.post('/release', protect, parkingController.releaseSpace);

// ----------------------------------------------------------------------
// RUTA DE ADMINISTRACI├ôN / DASHBOARD
// ----------------------------------------------------------------------

/**
 * @route GET /api/parking/status
 * @desc Obtiene el estado actual de ocupaci├│n del parqueo
 * @access Private - Admin, Guardias y Operadores
 */
router.get('/status',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD, USER_ROLES.FACULTY),
    parkingController.getParkingStatus
);

// Rutas protegidas por rol
/**
 * @route POST /api/parking/gate/open
 * @desc Abre la barrera de entrada/salida del parqueo
 * @access Private - Admin, Guardias, Operadores, Docentes, Estudiantes
 */
router.post('/gate/open',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD, USER_ROLES.FACULTY, USER_ROLES.STUDENT),
    distributedRateLimit('gate_open', 5, 60), // M├íx 5 aperturas por minuto
    parkingController.openGate
);

module.exports = router;
