const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'invoice_number'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: User,
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'GTQ'
    },
    status: {
        type: DataTypes.ENUM('ISSUED', 'PAID', 'CANCELLED', 'FAILED'),
        defaultValue: 'ISSUED'
    },
    // Datos FEL como JSONB
    felData: {
        type: DataTypes.JSONB,
        field: 'fel_data'
    },
    // Items como JSONB (array de objetos)
    items: {
        type: DataTypes.JSONB
    },
    pdfUrl: {
        type: DataTypes.STRING,
        field: 'pdf_url'
    }
}, {
    tableName: 'invoices',
    timestamps: true
});

module.exports = Invoice;
