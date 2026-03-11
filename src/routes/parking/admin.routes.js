const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/roleMiddleware');
const parkingController = require('../../controllers/parking');
const { USER_ROLES } = require('../../config/constants');

const router = express.Router();

/**
 * @swagger
 * /api/parking/admin/lots:
 *   post:
 *     tags: [Parqueo - Admin]
 *     summary: Crear un nuevo lote de parqueo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, totalSpaces, location]
 *             properties:
 *               name: { type: string }
 *               totalSpaces: { type: integer }
 *               location: { type: object }
 *     responses:
 *       201:
 *         description: Parqueo creado
 */
router.post('/lots',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.createParkingLot
);

/**
 * @swagger
 * /api/parking/admin/lots/{id}:
 *   patch:
 *     tags: [Parqueo - Admin]
 *     summary: Actualizar datos de un parqueo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Actualizado con éxito
 */
router.patch('/lots/:id',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.updateParkingLot
);

/**
 * @swagger
 * /api/parking/admin/lots/{id}:
 *   delete:
 *     tags: [Parqueo - Admin]
 *     summary: Eliminar un parqueo permanentemente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.delete('/lots/:id',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.deleteParkingLot
);

/**
 * @swagger
 * /api/parking/admin/lots/{id}/stats:
 *   get:
 *     tags: [Parqueo - Admin]
 *     summary: Analíticas de uso por parqueo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.get('/lots/:id/stats',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.getLotStats
);

/**
 * @swagger
 * /api/parking/admin/users:
 *   get:
 *     tags: [Parqueo - Admin]
 *     summary: Listar todos los usuarios del sistema
 *     responses:
 *       200:
 *         description: Lista de usuarios con sus roles y estados
 */
router.get('/users',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.getUsers
);

/**
 * @swagger
 * /api/parking/admin/users/{id}/role:
 *   patch:
 *     tags: [Parqueo - Admin]
 *     summary: Cambiar el rol asignado a un usuario
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 */
router.patch('/users/:id/role',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.updateUserRole
);

/**
 * @swagger
 * /api/parking/admin/users/{id}/payment:
 *   patch:
 *     tags: [Parqueo - Admin]
 *     summary: Alternar estado de pago manual (Estudiantes)
 */
router.patch('/users/:id/payment',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.togglePaymentStatus
);

/**
 * @swagger
 * /api/parking/admin/stats/revenue:
 *   get:
 *     tags: [Parqueo - Admin]
 *     summary: Reporte financiero de ingresos acumulados
 */
router.get('/stats/revenue',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.getRevenueStats
);

/**
 * @swagger
 * /api/parking/admin/stats/dashboard:
 *   get:
 *     tags: [Parqueo - Admin]
 *     summary: Resumen ejecutivo para el dashboard principal
 */
router.get('/stats/dashboard',
    protect,
    authorize(USER_ROLES.ADMIN),
    parkingController.getAdminStatsDashboard
);

module.exports = router;
