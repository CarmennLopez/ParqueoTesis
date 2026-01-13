// src/models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { USER_ROLES } = require('../config/constants');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    hasPaid: {
        type: Boolean,
        default: false
    },
    cardId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    vehiclePlate: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    // Datos de Facturación (FEL)
    nit: {
        type: String,
        trim: true,
        default: 'CF'
    },
    fiscalAddress: {
        type: String,
        trim: true,
        default: 'Ciudad'
    },
    fiscalName: {
        type: String,
        trim: true
    },

    currentParkingLot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParkingLot',
        default: null
    },
    currentParkingSpace: {
        type: String,
        default: null
    },
    entryTime: {
        type: Date,
        default: null
    },
    lastPaymentAmount: {
        type: Number,
        default: 0
    },

    // Suscripciones
    subscriptionPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PricingPlan',
        default: null
    },
    subscriptionExpiresAt: {
        type: Date,
        default: null
    },

    // Auditoría
    createdAt: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.STUDENT
    },
    refreshTokenVersion: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Middleware PRE-SAVE: Encripta la contraseña antes de guardarla
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Método para comparar contraseñas
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);