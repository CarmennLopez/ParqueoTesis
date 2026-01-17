// src/models/AuditLog.js
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    // WHO: Quién realizó la acción
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Puede ser null para acciones del sistema o anónimas
    },
    userRole: {
        type: String,
        required: false
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },

    // WHAT: Qué acción se realizó
    action: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
        // Ejemplos: 'LOGIN', 'OPEN_GATE', 'PAYMENT', 'UPDATE_RATE'
    },
    resource: {
        type: String,
        required: true,
        trim: true
        // Ejemplos: 'Auth', 'ParkingLot', 'User', 'System'
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE', 'WARNING'],
        default: 'SUCCESS'
    },

    // DETAILS: Metadata adicional del evento
    details: {
        type: mongoose.Schema.Types.Mixed, // Permite guardar objetos JSON flexibles
        default: {}
    },

    // WHEN: Cuándo ocurrió (inmutable)
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, {
    // Opciones de esquema
    timestamps: false, // Usamos nuestro propio timestamp inmutable
    versionKey: false
});

// Índice para búsquedas rápidas por fecha y acción
AuditLogSchema.index({ timestamp: -1, action: 1 });
AuditLogSchema.index({ userId: 1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
