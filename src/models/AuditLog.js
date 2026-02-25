// src/models/AuditLog.js
// Modelo Sequelize para registro de auditoría (migrado de Mongoose a PostgreSQL)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // WHO: Quién realizó la acción
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Puede ser null para acciones del sistema o anónimas
        field: 'user_id'
    },
    userRole: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'user_role'
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'ip_address'
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent'
    },

    // WHAT: Qué acción se realizó
    action: {
        type: DataTypes.STRING,
        allowNull: false
        // Ejemplos: 'LOGIN', 'OPEN_GATE', 'PAYMENT', 'UPDATE_RATE'
    },
    resource: {
        type: DataTypes.STRING,
        allowNull: false
        // Ejemplos: 'Auth', 'ParkingLot', 'User', 'System'
    },
    status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILURE', 'WARNING'),
        defaultValue: 'SUCCESS'
    },

    // DETAILS: Metadata adicional del evento (JSONB permite objetos flexibles)
    details: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },

    // WHEN: Cuándo ocurrió
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'timestamp'
    }
}, {
    tableName: 'audit_logs',
    timestamps: false // Usamos nuestro propio campo timestamp
});

module.exports = AuditLog;
