const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const parkingController = require('../../controllers/parking');
const distributedRateLimit = require('../../middleware/rateLimitMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/parking/lots:
 *   get:
 *     tags: [Parqueo - Usuario]
 *     summary: Obtener lista de todos los parqueos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de parqueos con disponibilidad
 */
router.get('/lots', protect, parkingController.getParkingLots);

/**
 * @swagger
 * /api/parking/current-assignment:
 *   get:
 *     tags: [Parqueo - Usuario]
 *     summary: Obtener la asignación actual del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de la asignación activa o null
 */
router.get('/current-assignment', protect, parkingController.getCurrentAssignment);

/**
 * @swagger
 * /api/parking/prediction/{lotId}:
 *   get:
 *     tags: [Parqueo - Usuario]
 *     summary: Obtener predicción de disponibilidad futura
 *     parameters:
 *       - in: path
 *         name: lotId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos predictivos basados en IA/Historial
 */
router.get('/prediction/:lotId', protect, parkingController.getPrediction);

/**
 * @swagger
 * /api/parking/history:
 *   get:
 *     tags: [Parqueo - Usuario]
 *     summary: Obtener historial de parqueos del usuario
 *     responses:
 *       200:
 *         description: Lista de sesiones pasadas
 */
router.get('/history', protect, parkingController.getParkingHistory);

/**
 * @swagger
 * /api/parking/assign:
 *   post:
 *     tags: [Parqueo - Usuario]
 *     summary: Solicitar asignación automática de un espacio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [parkingLotId]
 *             properties:
 *               parkingLotId: { type: integer }
 *     responses:
 *       200:
 *         description: Espacio asignado exitosamente
 */
router.post('/assign', protect, parkingController.assignSpace);

/**
 * @swagger
 * /api/parking/pay:
 *   post:
 *     tags: [Parqueo - Usuario]
 *     summary: Realizar pago de la sesión actual (Simulación/FEL)
 *     responses:
 *       200:
 *         description: Pago procesado
 */
router.post('/pay', protect, distributedRateLimit('pay', 3, 60), parkingController.payParking);

/**
 * @swagger
 * /api/parking/release:
 *   post:
 *     tags: [Parqueo - Usuario]
 *     summary: Liberar el espacio actual y finalizar la sesión
 *     responses:
 *       200:
 *         description: Espacio liberado
 */
router.post('/release', protect, parkingController.releaseSpace);

/**
 * @swagger
 * /api/parking/gate/open:
 *   post:
 *     tags: [Parqueo - Usuario]
 *     summary: Abrir talanquera vía IoT (si el usuario tiene permiso)
 *     responses:
 *       200:
 *         description: Comando enviado exitosamente
 */
router.post('/gate/open', protect, distributedRateLimit('gate_open', 5, 60), parkingController.openGate);

module.exports = router;
