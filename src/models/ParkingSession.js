const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     ParkingSession:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         userId: { type: integer }
 *         parkingLotId: { type: integer }
 *         spaceNumber: { type: string }
 *         entryTime: { type: string, format: date-time }
 *         exitTime: { type: string, format: date-time }
 *         durationMinutes: { type: integer }
 *         totalAmount: { type: number }
 *         status: { type: string, enum: [COMPLETED, CANCELLED] }
 */
const ParkingSession = sequelize.define('ParkingSession', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },
    parkingLotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'parking_lot_id'
    },
    spaceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'space_number'
    },
    entryTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'entry_time'
    },
    exitTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'exit_time'
    },
    durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'duration_minutes'
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'total_amount'
    },
    status: {
        type: DataTypes.ENUM('COMPLETED', 'CANCELLED'),
        defaultValue: 'COMPLETED'
    }
}, {
    tableName: 'parking_sessions',
    timestamps: true
});

module.exports = ParkingSession;
