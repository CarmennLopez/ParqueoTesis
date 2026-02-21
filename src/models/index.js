const { sequelize, connectDB } = require('../config/database');

const User = require('./user');
const ParkingLot = require('./ParkingLot');
const ParkingSpace = require('./ParkingSpace');
const PricingPlan = require('./PricingPlan');
const Invoice = require('./Invoice');

// ==========================================
// DEFINICIÓN DE RELACIONES (ASOCIACIONES)
// ==========================================

// --- User & ParkingLot ---
// Un usuario puede estar en un parqueo (currentParkingLot)
User.belongsTo(ParkingLot, { as: 'currentLot', foreignKey: 'currentParkingLotId' });

// --- User & PricingPlan ---
// Un usuario tiene un plan de suscripción
User.belongsTo(PricingPlan, { as: 'subscription', foreignKey: 'subscriptionPlanId' });
PricingPlan.hasMany(User, { foreignKey: 'subscriptionPlanId' });

// --- ParkingLot & ParkingSpace ---
ParkingLot.hasMany(ParkingSpace, { as: 'spaces', foreignKey: 'parkingLotId' });
ParkingSpace.belongsTo(ParkingLot, { foreignKey: 'parkingLotId' });

// --- ParkingSpace & User ---
// Un espacio puede estar ocupado por un usuario
ParkingSpace.belongsTo(User, { as: 'occupant', foreignKey: 'occupiedByUserId' });
User.hasOne(ParkingSpace, { as: 'occupiedSpace', foreignKey: 'occupiedByUserId' });

// --- Invoice & User ---
User.hasMany(Invoice, { foreignKey: 'userId' });
Invoice.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    connectDB,
    User,
    ParkingLot,
    ParkingSpace,
    PricingPlan,
    Invoice
};
