// src/utils/pricingEngine.js
const moment = require('moment'); // Asegurarse de tener moment o usar Date nativo
// Usaremos Date nativo para no añadir dependencias si no es necesario, pero moment ayuda en diferencias.
// Usaremos matemáticas simples con Date por ahora.

/**
 * Calcula el costo de parqueo basado en un plan de precios.
 * @param {Object} plan - El objeto PricingPlan
 * @param {Date} entryTime - Fecha de entrada
 * @param {Date} exitTime - Fecha de salida (o actual)
 * @returns {Object} Desglose del cálculo { totalAmount, durationMinutes, hoursCharged }
 */
const calculateCost = (plan, entryTime, exitTime) => {
    const start = new Date(entryTime);
    const end = new Date(exitTime);
    const durationMs = end - start;

    // Evitar tiempos negativos
    if (durationMs < 0) return { totalAmount: 0, durationMinutes: 0, hoursCharged: 0 };

    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    let totalAmount = 0;
    let hoursCharged = 0;

    // Aplicar periodo de gracia si existe
    if (plan.rules && plan.rules.gracePeriodMinutes && durationMinutes <= plan.rules.gracePeriodMinutes) {
        return {
            totalAmount: 0.00,
            durationMinutes,
            hoursCharged: 0,
            isGracePeriod: true
        };
    }

    switch (plan.type) {
        case 'HOURLY':
            // Cobro por hora o fracción
            const durationHours = durationMs / (1000 * 60 * 60);
            hoursCharged = Math.ceil(durationHours);
            totalAmount = hoursCharged * plan.baseRate;
            break;

        case 'FLAT_FEE':
            // Tarifa plana por evento
            totalAmount = plan.baseRate;
            hoursCharged = 0; // No aplica
            break;

        case 'SUBSCRIPTION':
            // Los suscriptores no pagan por uso individual (normalmente)
            totalAmount = 0;
            hoursCharged = 0;
            break;

        default:
            // Fallback a tarifa por hora estándar si tipo desconocido
            const defaultHours = Math.ceil(durationMs / (1000 * 60 * 60));
            totalAmount = defaultHours * (plan.baseRate || 0);
    }

    // Aplicar tope diario si existe (Solo para HOURLY)
    if (plan.type === 'HOURLY' && plan.rules && plan.rules.maxDailyCap) {
        if (totalAmount > plan.rules.maxDailyCap) {
            totalAmount = plan.rules.maxDailyCap;
        }
    }

    return {
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        durationMinutes,
        hoursCharged,
        currency: plan.currency
    };
};

module.exports = { calculateCost };
