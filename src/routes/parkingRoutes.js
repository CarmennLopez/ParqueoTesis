// src/routes/parkingRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const parkingController = require('../controllers/parking');
const solvencyController = require('../controllers/parking/solvency.controller');
const { checkSolvency } = require('../middleware/solvencyMiddleware');
const { USER_ROLES } = require('../config/constants');
const distributedRateLimit = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// ----------------------------------------------------------------------
// RUTAS PRINCIPALES DEL FLUJO DE PARQUEO (Todas requieren autenticación JWT)
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// RUTAS DE INFORMACIÓN DE PARQUEOS
// ----------------------------------------------------------------------

/**
 * @route GET /api/parking/lots
 * @desc Lista todos los parqueos disponibles con su estado
 * @access Private - Usuarios autenticados
 */
router.get('/lots', protect, parkingController.getParkingLots);

// ----------------------------------------------------------------------
// RUTAS PRINCIPALES DEL FLUJO DE PARQUEO (Todas requieren autenticación JWT)
// ----------------------------------------------------------------------

/**
 * @route POST /api/parking/assign
 * @desc Asigna un espacio libre al usuario (ENTRADA)
 * @access Private - Usuarios autenticados
 */
// checkSolvency: estudiantes deben estar solventes para asignar espacio
router.post('/assign', protect, checkSolvency, parkingController.assignSpace);

/**
 * @route POST /api/parking/pay
 * @desc Simula el pago de la tarifa del parqueo
 * @access Private - Usuarios autenticados
 */
router.post('/pay',
    protect,
    distributedRateLimit('pay', 3, 60), // Máx 3 intentos por minuto
    parkingController.payParking
);

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
    distributedRateLimit('gate_open', 5, 60), // Máx 5 aperturas por minuto
    parkingController.openGate
);

// ----------------------------------------------------------------------
// RUTAS DE SIMULACIÓN (Solo para Demo/Testing)
// ----------------------------------------------------------------------

router.post('/simulate/fill',
    protect,
    // authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD), // Comentado para facilitar testing
    parkingController.simulateFill
);

router.post('/simulate/empty',
    protect,
    // authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD),
    parkingController.simulateEmpty
);

// ----------------------------------------------------------------------
// RUTAS DEL OFICIAL DE GARITA (Guard)
// ----------------------------------------------------------------------

/**
 * @route GET /api/parking/guard/active-vehicles
 * @desc Lista todos los vehículos actualmente en el parqueo con tiempo y costo
 * @access Private - Guard, Admin
 */
router.get('/guard/active-vehicles',
    protect,
    authorize(USER_ROLES.GUARD, USER_ROLES.ADMIN),
    parkingController.getActiveVehicles
);

/**
 * @route POST /api/parking/guard/assign
 * @desc El oficial asigna un espacio a un visitante (por placa o email)
 * @access Private - Guard, Admin
 */
router.post('/guard/assign',
    protect,
    authorize(USER_ROLES.GUARD, USER_ROLES.ADMIN),
    parkingController.guardAssignSpace
);

/**
 * @route POST /api/parking/guard/release
 * @desc El oficial libera forzosamente cualquier espacio
 * @access Private - Guard, Admin
 */
router.post('/guard/release',
    protect,
    authorize(USER_ROLES.GUARD, USER_ROLES.ADMIN),
    parkingController.guardReleaseSpace
);

// ----------------------------------------------------------------------
// RUTAS ADMINISTRATIVAS (Solo Admin)
// ----------------------------------------------------------------------

/**
 * @route POST /api/parking/admin/lots
 * @desc Crear nuevo lote de parqueo
 */
router.post('/admin/lots',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.createParkingLot
);

/**
 * @route PATCH /api/parking/admin/lots/:id
 * @desc Actualizar lote de parqueo
 */
router.patch('/admin/lots/:id',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.updateParkingLot
);

/**
 * @route DELETE /api/parking/admin/lots/:id
 * @desc Eliminar lote de parqueo
 */
router.delete('/admin/lots/:id',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.deleteParkingLot
);

/**
 * @route GET /api/parking/admin/users
 * @desc Listar todos los usuarios
 */
router.get('/admin/users',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.getUsers
);

/**
 * @route PATCH /api/parking/admin/users/:id/role
 * @desc Cambiar rol de un usuario
 */
router.patch('/admin/users/:id/role',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.updateUserRole
);

/**
 * @route GET /api/parking/admin/stats/revenue
 * @desc Obtener estadísticas de ingresos
 */
router.get('/admin/stats/revenue',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.getRevenueStats
);

// ----------------------------------------------------------------------
// RUTAS DE SOLVENCIA MENSUAL
// ----------------------------------------------------------------------

/**
 * @route PUT /api/parking/solvency/:userId
 * @desc Marcar a un usuario como solvente (N meses)
 * @access Private - Admin, Guard
 */
router.put('/solvency/:userId',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD),
    solvencyController.updateSolvency
);

/**
 * @route GET /api/parking/solvency/:cardId
 * @desc Consultar solvencia de un usuario por su carné
 * @access Private - Admin, Guard, Student, Faculty
 */
router.get('/solvency/:cardId',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD, USER_ROLES.STUDENT, USER_ROLES.FACULTY),
    solvencyController.checkSolvencyByCardId
);

/**
 * @route GET /api/parking/solvency-report
 * @desc Reporte de solvencia de todos los estudiantes
 * @access Private - Admin
 */
router.get('/solvency-report',
    protect,
    authorize(USER_ROLES.ADMIN),
    solvencyController.getSolvencyReport
);

module.exports = router;
