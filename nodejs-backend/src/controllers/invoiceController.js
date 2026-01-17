// src/controllers/invoiceController.js
const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const User = require('../models/user');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * @desc Genera una factura simulada (FEL) para un usuario
 * @route POST /api/invoices/generate
 * @access Private
 */
const generateInvoice = asyncHandler(async (req, res) => {
    const { amount, items } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    // Simulación de datos de certificación FEL
    const felData = {
        authorizationUUID: 'A1B2C3D4-E5F6-7890-1234-567890ABCDEF',
        serie: 'FEL-SIM',
        number: Math.floor(Math.random() * 1000000).toString(),
        certificationDate: new Date()
    };

    const invoiceNumber = `${felData.serie}-${felData.number}`;

    // Crear registro de factura
    const invoice = await Invoice.create({
        invoiceNumber,
        userId,
        amount,
        felData,
        items: items || [{ description: 'Servicio de Parqueo', quantity: 1, unitPrice: amount, total: amount }],
        status: 'PAID'
    });

    // Generar PDF (Simulado - en realidad crea un archivo básico)
    try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        page.drawText('FACTURA ELECTRÓNICA (SIMULACIÓN)', {
            x: 50,
            y: height - 50,
            size: 20,
            font,
            color: rgb(0, 0, 0),
        });

        page.drawText(`Cliente: ${user.name}`, { x: 50, y: height - 100, size: 12, font });
        page.drawText(`NIT: ${user.nit || 'CF'}`, { x: 50, y: height - 120, size: 12, font });
        page.drawText(`Total: Q${amount.toFixed(2)}`, { x: 50, y: height - 150, size: 15, font });
        page.drawText(`UUID: ${felData.authorizationUUID}`, { x: 50, y: height - 200, size: 10, font });

        const pdfBytes = await pdfDoc.save();

        // En un caso real, subiríamos esto a S3 o similar.
        // Aquí solo devolvemos los bytes en base64 para descarga directa o guardamos en tmp
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

        res.status(201).json({
            message: 'Factura generada exitosamente',
            invoice,
            pdfBase64: pdfBase64 // El frontend puede decodificar y descargar
        });

    } catch (error) {
        logger.error('Error generando PDF:', error);
        // Aún si falla el PDF, la factura se creó
        res.status(201).json({
            message: 'Factura creada, pero falló la generación del PDF',
            invoice
        });
    }
});

module.exports = { generateInvoice };
