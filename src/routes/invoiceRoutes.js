// src/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { generateInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/invoices/generate:
 *   post:
 *     tags: [Facturación - FEL]
 *     summary: Generar factura electrónica de la última sesión
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Factura generada (Simulación FEL)
 */
router.post('/generate', protect, generateInvoice);

module.exports = router;
