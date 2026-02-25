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
  // Ubicación almacenada como GeoJSON (no requiere PostGIS)
  // Formato esperado: { type: "Point", coordinates: [lng, lat] }
  location: {
    type: DataTypes.JSONB,
    allowNull: true
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