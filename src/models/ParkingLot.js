const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     ParkingLot:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         totalSpaces: { type: integer }
 *         availableSpaces: { type: integer }
 *         location:
 *           type: object
 *           properties:
 *             type: { type: string, example: "Point" }
 *             coordinates: { type: array, items: { type: number }, example: [-90.5, 14.6] }
 */
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
  // PostGIS: Location stored as a Geometry Point
  location: {
    type: DataTypes.GEOMETRY('POINT', 4326), // SRID 4326 for standard GPS coords
    allowNull: false
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