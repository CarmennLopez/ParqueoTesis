const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PricingPlan = sequelize.define('PricingPlan', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('HOURLY', 'FLAT_FEE', 'SUBSCRIPTION'),
        allowNull: false
    },
    baseRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        },
        field: 'base_rate'
    },
    currency: {
        type: DataTypes.ENUM('GTQ', 'USD'),
        defaultValue: 'GTQ'
    },
    billingInterval: {
        type: DataTypes.ENUM('HOUR', 'DAY', 'MONTH', 'ONE_TIME'),
        defaultValue: 'HOUR',
        field: 'billing_interval'
    },
    description: {
        type: DataTypes.TEXT
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    // Reglas almacenadas como JSON
    rules: {
        type: DataTypes.JSONB,
        defaultValue: {
            gracePeriodMinutes: 15,
            maxDailyCap: null,
            weekendMultiplier: 1.0
        }
    }
}, {
    tableName: 'pricing_plans',
    timestamps: true
});

module.exports = PricingPlan;
