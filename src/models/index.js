const { sequelize, connectDB } = require('../config/database');

const User = require('./user');
const ParkingLot = require('./ParkingLot');
const ParkingSpace = require('./ParkingSpace');
const PricingPlan = require('./PricingPlan');
const Invoice = require('./Invoice');
const ParkingSession = require('./ParkingSession');
const AuditLog = require('./AuditLog');

// ==========================================
// DEFINICIÓN DE RELACIONES (ASOCIACIONES)
// ==========================================

// --- User & ParkingLot ---
User.belongsTo(ParkingLot, { as: 'currentLot', foreignKey: 'currentParkingLotId' });
User.belongsTo(ParkingLot, { as: 'assignedLot', foreignKey: 'assignedParkingLotId' });

// --- User & PricingPlan ---
User.belongsTo(PricingPlan, { as: 'subscription', foreignKey: 'subscriptionPlanId' });
PricingPlan.hasMany(User, { foreignKey: 'subscriptionPlanId' });

// --- ParkingLot & ParkingSpace ---
ParkingLot.hasMany(ParkingSpace, { as: 'spaces', foreignKey: 'parkingLotId' });
ParkingSpace.belongsTo(ParkingLot, { foreignKey: 'parkingLotId' });

// --- ParkingSpace & User ---
ParkingSpace.belongsTo(User, { as: 'occupant', foreignKey: 'occupiedByUserId' });
User.hasOne(ParkingSpace, { as: 'occupiedSpace', foreignKey: 'occupiedByUserId' });

// --- Invoice & User ---
User.hasMany(Invoice, { foreignKey: 'userId' });
Invoice.belongsTo(User, { foreignKey: 'userId' });

// --- ParkingSession Relations ---
User.hasMany(ParkingSession, { foreignKey: 'userId', as: 'sessions' });
ParkingSession.belongsTo(User, { foreignKey: 'userId' });
ParkingLot.hasMany(ParkingSession, { foreignKey: 'parkingLotId' });
ParkingSession.belongsTo(ParkingLot, { foreignKey: 'parkingLotId' });

// --- AuditLog Relations ---
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    connectDB,
    User,
    ParkingLot,
    ParkingSpace,
    PricingPlan,
    Invoice,
    ParkingSession,
    AuditLog
};
