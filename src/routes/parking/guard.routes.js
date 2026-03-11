const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const parkingController = require('../../controllers/parking');
const { USER_ROLES } = require('../../config/constants');

const router = express.Router();

/**
 * @swagger
 * /api/parking/guard/active-vehicles:
 *   get:
 *     tags: [Parqueo - Guardia]
 *     summary: Listar vehículos con sesiones activas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vehículos, placa, tiempo y costo acumulado
 */
router.get('/active-vehicles',
    protect,
    authorize(USER_ROLES.GUARD, USER_ROLES.ADMIN),
    parkingController.getActiveVehicles
);

/**
 * @swagger
 * /api/parking/guard/assign:
 *   post:
 *     tags: [Parqueo - Guardia]
 *     summary: Asignar espacio manual (Visitantes/Al vuelo)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parkingLotId: { type: integer }
 *               vehiclePlate: { type: string }
 *               visitorName: { type: string }
 *     responses:
 *       200:
 *         description: Registro exitoso
 */
router.post('/assign',
    protect,
    authorize(USER_ROLES.GUARD, USER_ROLES.ADMIN),
    parkingController.guardAssignSpace
);

/**
 * @swagger
 * /api/parking/guard/release:
 *   post:
 *     tags: [Parqueo - Guardia]
 *     summary: Liberar espacio forzosamente (Oficial de Garita)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: integer }
 *     responses:
 *       200:
 *         description: Salida procesada
 */
router.post('/release',
    protect,
    authorize(USER_ROLES.GUARD, USER_ROLES.ADMIN),
    parkingController.guardReleaseSpace
);

/**
 * @swagger
 * /api/parking/guard/open-gate:
 *   post:
 *     tags: [Parqueo - Guardia]
 *     summary: Control manual de talanquera (IoT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [parkingLotId, action]
 *             properties:
 *               parkingLotId: { type: integer }
 *               action: { type: string, example: "OPEN" }
 *     responses:
 *       200:
 *         description: Comando enviado
 */
router.post('/open-gate',
    protect,
    authorize(USER_ROLES.GUARD, USER_ROLES.ADMIN),
    parkingController.manualGateControl
);

module.exports = router;
