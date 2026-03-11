const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Usamos nombres directos para evitar confusión con indices/constraints
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id'
        // Eliminamos references temporalmente para asegurar creación limpia
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
        type: DataTypes.STRING,
        allowNull: true,
        field: 'user_agent'
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false,
        set(val) {
            if (val) this.setDataValue('action', val.toUpperCase());
        }
    },
    resource: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILURE', 'WARNING'),
        defaultValue: 'SUCCESS'
    },
    details: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
}, {
    tableName: 'audit_logs',
    timestamps: false,
    indexes: [
        { fields: ['timestamp'] },
        { fields: ['action'] },
        { fields: ['user_id'] }
    ]
});

module.exports = AuditLog;
