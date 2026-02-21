const asyncHandler = require('express-async-handler');
const { User, PricingPlan, Invoice } = require('../../models');
const { logAudit } = require('../../utils/auditLogger');
const { calculateCost } = require('../../utils/pricingEngine');

const payParking = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const user = await User.findByPk(userId);

    if (!user.currentParkingSpace) {
        res.status(400);
        throw new Error('No tiene un espacio asignado actualmente');
    }

    if (user.hasPaid) {
        res.status(400);
        throw new Error('Ya ha realizado el pago para esta sesión');
    }

    // Determinar Plan (Simplificado para migración)
    let plan = await PricingPlan.findOne({ where: { type: 'HOURLY' } });
    if (!plan) plan = { baseRate: 10, type: 'HOURLY', rules: {} };

    const calculation = calculateCost(plan, user.entryTime, new Date());
    const totalCost = calculation.totalAmount;

    // Actualizar usuario
    user.hasPaid = true;
    user.lastPaymentAmount = totalCost;
    await user.save();

    // Crear Factura
    await Invoice.create({
        invoiceNumber: `INV-${Date.now()}`,
        userId: user.id,
        amount: totalCost,
        status: 'PAID',
        items: [{ description: 'Parking Fee', amount: totalCost }]
    });

    logAudit(req, 'PAYMENT', 'User', { amount: totalCost, space: user.currentParkingSpace });

    res.status(200).json({
        message: 'Pago realizado con éxito',
        amount: totalCost,
        space: user.currentParkingSpace,
        details: calculation
    });
});

module.exports = { payParking };
