const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const ParkingLot = require('./ParkingLot');
const User = require('./user'); // Para relación de ocupación

const ParkingSpace = sequelize.define('ParkingSpace', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    spaceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'space_number'
    },
    isOccupied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_occupied'
    },
    entryTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'entry_time'
    },
    // Foreign Keys se definen en las asociaciones, pero es bueno tener los campos explícitos si se quiere
    parkingLotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'parking_lot_id',
        references: {
            model: ParkingLot,
            key: 'id'
        }
    },
    occupiedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'occupied_by_user_id',
        references: {
            model: User,
            key: 'id'
        }
    }
}, {
    tableName: 'parking_spaces',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['parking_lot_id', 'space_number'] // Evitar duplicados de número en el mismo parqueo
        }
    ]
});

// Associations defined in index.js
module.exports = ParkingSpace;
