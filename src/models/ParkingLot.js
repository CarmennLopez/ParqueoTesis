const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ParkingLot = sequelize.define('ParkingLot', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // Location stored as JSON (lat, lon) - without PostGIS dependency
  location: {
    type: DataTypes.JSON, // Simplified: removes PostGIS requirement
    allowNull: false,
    defaultValue: { lat: 0, lon: 0 }
  },
  totalSpaces: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_spaces'
  },
  availableSpaces: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'available_spaces'
  }
}, {
  tableName: 'parking_lots',
  timestamps: true
});

module.exports = ParkingLot;