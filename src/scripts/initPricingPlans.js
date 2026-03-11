// src/scripts/initPricingPlans.js
const mongoose = require('mongoose');
const PricingPlan = require('../models/PricingPlan');
const logger = require('../config/logger');

const defaultPlans = [
    {
        code: 'STANDARD_HOURLY',
        name: 'Tarifa Estándar por Hora',
        type: 'HOURLY',
        baseRate: 10.00, // Q10.00
        currency: 'GTQ',
        billingInterval: 'HOUR',
        description: 'Tarifa base para visitantes y estudiantes sin suscripción.',
        isActive: true,
        rules: {
            gracePeriodMinutes: 15,
            maxDailyCap: 100.00 // Tope de Q100 al día
        }
    },
    {
        code: 'MONTHLY_SUB',
        name: 'Suscripción Mensual',
        type: 'SUBSCRIPTION',
        baseRate: 250.00, // Q250.00
        currency: 'GTQ',
        billingInterval: 'MONTH',
        description: 'Acceso ilimitado por un mes.',
        isActive: true
    },
    {
        code: 'FACULTY_SPECIAL',
        name: 'Tarifa Preferencial Catedráticos',
        type: 'HOURLY',
        baseRate: 5.00, // Q5.00
        currency: 'GTQ',
        billingInterval: 'HOUR',
        description: 'Tarifa reducida para personal docente.',
        isActive: true,
        rules: {
            gracePeriodMinutes: 30, // Más tiempo de gracia
            maxDailyCap: 50.00
        }
    }
];

const initPricingPlans = async () => {
    try {
        for (const plan of defaultPlans) {
            const exists = await PricingPlan.findOne({ code: plan.code });
            if (!exists) {
                await PricingPlan.create(plan);
                logger.info(`Plan de precios creado: ${plan.name}`);
            } else {
                // Opcional: Actualizar si ya existe para asegurar consistencia en dev
                // await PricingPlan.findOneAndUpdate({ code: plan.code }, plan);
            }
        }
        logger.info('Inicialización de planes de precios completada.');
    } catch (error) {
        logger.error('Error inicializando planes de precios:', error);
    }
};

module.exports = initPricingPlans;
