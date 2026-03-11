const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');
const { USER_ROLES } = require('../config/constants');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         email: { type: string }
 *         role: { type: string, enum: [student, faculty, visitor, guard, admin] }
 *         vehiclePlate: { type: string }
 *         currentParkingLotId: { type: integer, nullable: true }
 *         currentParkingSpace: { type: string, nullable: true }
 *         entryTime: { type: string, format: date-time, nullable: true }
 *         hasPaid: { type: boolean }
 */
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM,
        values: Object.values(USER_ROLES),
        defaultValue: USER_ROLES.STUDENT
    },
    cardId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        field: 'card_id'
    },
    vehiclePlate: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        field: 'vehicle_plate'
    },
    hasPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'has_paid'
    },
    // Datos de Facturación (FEL)
    nit: {
        type: DataTypes.STRING,
        defaultValue: 'CF'
    },
    fiscalAddress: {
        type: DataTypes.STRING,
        defaultValue: 'Ciudad',
        field: 'fiscal_address'
    },
    fiscalName: {
        type: DataTypes.STRING,
        field: 'fiscal_name'
    },
    // Estado actual del usuario
    currentParkingLotId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'current_parking_lot_id'
    },
    currentParkingSpace: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'current_parking_space'
    },
    entryTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'entry_time'
    },
    lastPaymentAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'last_payment_amount'
    },
    fcmToken: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'fcm_token'
    },
    refreshTokenVersion: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'refresh_token_version'
    },
    assignedParkingLotId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'assigned_parking_lot_id',
        comment: 'Para guardias: ID del parqueo asignado'
    }
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        },
        beforeUpdate: async (user) => {
            console.log(`[DIAGNOSTIC] Saving user ${user.id} (${user.email}). hasPaid current: ${user.hasPaid}, changed: ${user.changed('hasPaid')}`);
            if (user.changed('hasPaid') && user.hasPaid === false) {
                console.trace(`⚠️ [DIAGNOSTIC] !!!!!!!! ALERT !!!!!!!! hasPaid being SET TO FALSE for user ID: ${user.id}`);
                logger.warn(`⚠️ [DIAGNOSTIC] hasPaid being set to FALSE for user ID: ${user.id}. Data: ${JSON.stringify(user.toJSON())}`);
            }
        }
    }
});

// Método de instancia para verificar contraseña
User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;