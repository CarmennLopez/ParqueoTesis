// src/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { generateInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/invoices/generate:
 *   post:
 *     tags: [Facturas]
 *     summary: Generar factura/comprobante de pago
 *     description: |
 *       Genera un comprobante de pago por el uso del parqueo.
 *       Debe llamarse después de registrar el pago con `/api/parking/pay`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceRequest'
 *     responses:
 *       200:
 *         description: Factura generada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 invoice:
 *                   type: object
 *                   properties:
 *                     id:               { type: string,  example: "INV-2026-00001" }
 *                     userId:           { type: integer, example: 1 }
 *                     userName:         { type: string,  example: "Carmen Lopez" }
 *                     parkingLotId:     { type: integer, example: 1 }
 *                     amount:           { type: number,  example: 15.50 }
 *                     duration_minutes: { type: integer, example: 185 }
 *                     issuedAt:         { type: string,  format: date-time }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/generate', protect, generateInvoice);

module.exports = router;
