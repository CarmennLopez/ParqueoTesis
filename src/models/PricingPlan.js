// src/models/PricingPlan.js
const mongoose = require('mongoose');

const PricingPlanSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
        // Ej: 'STANDARD_HOURLY', 'MONTHLY_SUB', 'FACULTY_PRO'
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['HOURLY', 'FLAT_FEE', 'SUBSCRIPTION'],
        required: true
    },
    baseRate: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'GTQ', // Quetzales
        enum: ['GTQ', 'USD']
    },
    billingInterval: {
        type: String,
        enum: ['HOUR', 'DAY', 'MONTH', 'ONE_TIME'],
        default: 'HOUR'
    },
    description: String,
    isActive: {
        type: Boolean,
        default: true
    },
    // Reglas avanzadas (opcional para futuro)
    rules: {
        gracePeriodMinutes: { type: Number, default: 15 },
        maxDailyCap: { type: Number }, // Tope diario
        weekendMultiplier: { type: Number, default: 1.0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.PricingPlan || mongoose.model('PricingPlan', PricingPlanSchema);
