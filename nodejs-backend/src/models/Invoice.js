// src/models/Invoice.js
const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'GTQ'
    },
    status: {
        type: String,
        enum: ['ISSUED', 'PAID', 'CANCELLED', 'FAILED'],
        default: 'ISSUED'
    },
    // Datos FEL simulados
    felData: {
        authorizationUUID: String,
        serie: String,
        number: String,
        certificationDate: Date
    },
    items: [{
        description: String,
        quantity: Number,
        unitPrice: Number,
        total: Number
    }],
    pdfUrl: String // URL simulada o path local
}, {
    timestamps: true
});

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
