// src/routes/parkingRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const parkingController = require('../controllers/parkingController');
const { USER_ROLES } = require('../config/constants');
const distributedRateLimit = require('../middleware/rateLimitMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/parking/lots:
 *   get:
 *     tags:
 *       - Parqueo
 *     summary: Listar parqueos disponibles
 *     description: Obtiene la lista de todos los parqueos con su estado actual de ocupación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de parqueos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "6987dd9f789b210520c8c5d8"
 *                   name:
 *                     type: string
 *                     example: "Campus Central"
 *                   location:
 *                     type: string
 *                     example: "Cercano al campus central"
 *                   totalSpaces:
 *                     type: integer
 *                     example: 10
 *                   availableSpaces:
 *                     type: integer
 *                     example: 7
 *                   spaces:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         spaceNumber:
 *                           type: string
 *                           example: "A1"
 *                         isOccupied:
 *                           type: boolean
 *                         occupiedBy:
 *                           type: string
 *                           nullable: true
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/lots', protect, parkingController.getParkingLots);

/**
 * @swagger
 * /api/parking/assign:
 *   post:
 *     tags:
 *       - Parqueo
 *     summary: Asignar espacio de parqueo (ENTRADA)
 *     description: Asigna un espacio libre al usuario autenticado. Registra la hora de entrada.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parkingLotId
 *             properties:
 *               parkingLotId:
 *                 type: string
 *                 description: ID del parqueo donde se desea estacionar
 *                 example: "6987dd9f789b210520c8c5d8"
 *     responses:
 *       200:
 *         description: Espacio asignado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Espacio asignado exitosamente"
 *                 space:
 *                   type: string
 *                   example: "A1"
 *                 parkingLot:
 *                   type: string
 *                   example: "Campus Central"
 *                 entryTime:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Usuario ya tiene un espacio asignado o no hay espacios disponibles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/assign', protect, parkingController.assignSpace);

/**
 * @swagger
 * /api/parking/pay:
 *   post:
 *     tags:
 *       - Parqueo
 *     summary: Pagar tarifa de parqueo
 *     description: Simula el pago de la tarifa. Rate limit 3 intentos por minuto.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pago procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Pago procesado exitosamente"
 *                 amount:
 *                   type: number
 *                   example: 15.50
 *       400:
 *         description: Usuario no tiene espacio asignado o ya pagó
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Demasiados intentos de pago
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/pay',
    protect,
    distributedRateLimit('pay', 3, 60),
    parkingController.payParking
);

/**
 * @swagger
 * /api/parking/release:
 *   post:
 *     tags:
 *       - Parqueo
 *     summary: Liberar espacio de parqueo (SALIDA)
 *     description: Libera el espacio, calcula el costo total y verifica el pago
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Espacio liberado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Espacio liberado exitosamente"
 *                 totalCost:
 *                   type: number
 *                   example: 15.50
 *                 duration:
 *                   type: string
 *                   example: "2 horas 15 minutos"
 *       400:
 *         description: Usuario no tiene espacio asignado o no ha pagado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/release', protect, parkingController.releaseSpace);

/**
 * @swagger
 * /api/parking/status:
 *   get:
 *     tags:
 *       - Parqueo
 *     summary: Estado de ocupación del parqueo
 *     description: Obtiene el estado actual de todos los espacios. Solo para Admin, Guard y Faculty.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del parqueo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSpaces:
 *                   type: integer
 *                   example: 10
 *                 availableSpaces:
 *                   type: integer
 *                   example: 7
 *                 occupiedSpaces:
 *                   type: integer
 *                   example: 3
 *                 spaces:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       spaceNumber:
 *                         type: string
 *                         example: "A1"
 *                       isOccupied:
 *                         type: boolean
 *                       occupiedBy:
 *                         type: string
 *                         nullable: true
 *                       entryTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No autorizado (rol insuficiente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/status',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD, USER_ROLES.FACULTY),
    parkingController.getParkingStatus
);

/**
 * @swagger
 * /api/parking/gate/open:
 *   post:
 *     tags:
 *       - Parqueo
 *     summary: Abrir barrera de entrada/salida
 *     description: Abre la barrera del parqueo. Rate limit 5 intentos por minuto.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gateId:
 *                 type: string
 *                 description: ID de la barrera a abrir (opcional, por defecto GATE_MAIN_EXIT)
 *                 example: "GATE_MAIN_EXIT"
 *     responses:
 *       200:
 *         description: Barrera abierta exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Barrera abierta exitosamente"
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No autorizado (rol insuficiente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Demasiados intentos de apertura
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/gate/open',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.GUARD, USER_ROLES.FACULTY, USER_ROLES.STUDENT),
    distributedRateLimit('gate_open', 5, 60),
    parkingController.openGate
);

module.exports = router;
