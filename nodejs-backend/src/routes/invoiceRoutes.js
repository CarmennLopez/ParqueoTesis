// src/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { generateInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/invoices/generate:
 *   post:
 *     tags:
 *       - Facturas
 *     summary: Generar factura electrónica (FEL)
 *     description: Genera una factura electrónica para el pago del parqueo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Monto a facturar
 *                 example: 15.50
 *               description:
 *                 type: string
 *                 description: Descripción del servicio
 *                 example: "Servicio de parqueo - 2 horas"
 *     responses:
 *       200:
 *         description: Factura generada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Factura generada exitosamente"
 *                 invoice:
 *                   type: object
 *                   properties:
 *                     invoiceNumber:
 *                       type: string
 *                       example: "FEL-2024-00001"
 *                     amount:
 *                       type: number
 *                       example: 15.50
 *                     date:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate', protect, generateInvoice);

module.exports = router;
