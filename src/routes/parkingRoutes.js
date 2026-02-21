// src/routes/parkingRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const parkingController = require('../controllers/parking');
const { USER_ROLES } = require('../config/constants');
const distributedRateLimit = require('../middleware/rateLimitMiddleware');
const { checkSolvency } = require('../middleware/solvencyMiddleware');

const router = express.Router();

// ----------------------------------------------------------------------
// RUTAS PRINCIPALES DEL FLUJO DE PARQUEO (Todas requieren autenticación JWT)
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// RUTAS DE INFORMACIÓN DE PARQUEOS
// ----------------------------------------------------------------------

/**
 * @swagger
 * /api/parking/lots:
 *   get:
 *     tags: [Parqueo]
 *     summary: Listar todos los lotes de parqueo
 *     description: Obtiene la lista de todos los lotes disponibles con información de espacios disponibles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de lotes disponibles
 *       401:
 *         description: No autorizado
 *   post:
 *     tags: [Parqueo]
 *     summary: Crear nuevo lote de parqueo
 *     description: Crea un nuevo lote de parqueo en el sistema (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, total_spaces, hourly_rate]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Lote Centro"
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 14.6349
 *                   lng:
 *                     type: number
 *                     example: -90.5069
 *               total_spaces:
 *                 type: integer
 *                 example: 50
 *               hourly_rate:
 *                 type: number
 *                 format: decimal
 *                 example: 5.00
 *     responses:
 *       201:
 *         description: Lote creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.get('/lots', protect, parkingController.getParkingLots);
router.post('/lots', protect, authorize(USER_ROLES.ADMIN), parkingController.createParkingLot || ((req, res) => res.json({ message: "Endpoint en desarrollo" })));

// ----------------------------------------------------------------------
// RUTAS PRINCIPALES DEL FLUJO DE PARQUEO (Todas requieren autenticación JWT)
// ----------------------------------------------------------------------

/**
 * @route POST /api/parking/assign
 * @desc Asigna un espacio libre al usuario (ENTRADA)
 * @access Private - Usuarios autenticados y solventes
 */
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
// RUTAS DE SOLVENCIA MENSUAL
// ----------------------------------------------------------------------

/**
 * @route PUT /api/parking/solvency/:userId
 * @desc Marca a un usuario como solvente por N meses (default 1)
 * @access Private - Admin, Guard
 */
router.put('/solvency/:userId',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD),
    parkingController.updateSolvency
);

/**
 * @route GET /api/parking/solvency/:cardId
 * @desc Consulta el estado de solvencia de un usuario por su carné
 * @access Private - Admin, Guard, cualquier usuario autenticado
 */
router.get('/solvency/:cardId',
    protect,
    parkingController.checkSolvencyByCardId
);

/**
 * @route GET /api/parking/solvency-report
 * @desc Reporte de solvencia de todos los estudiantes
 * @access Private - Admin
 */
router.get('/solvency-report',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.getSolvencyReport
);

module.exports = router;
