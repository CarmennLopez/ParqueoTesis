// src/scripts/checkExpirations.js
const mongoose = require('mongoose');
const User = require('../models/user');
const PricingPlan = require('../models/PricingPlan');
const logger = require('../config/logger');
const { notifyUser } = require('../services/socketService');

/**
 * Script para verificar sesiones de parqueo próximas a expirar o que exceden límites.
 * Idealmente ejecutado por un cron job cada minuto.
 */
const checkExpirations = async () => {
    try {
        logger.info('⏳ Verificando expiraciones de parqueo...');

        // Buscar usuarios con parqueo activo
        const activeUsers = await User.find({
            currentParkingSpace: { $ne: null },
            hasPaid: false
        });

        for (const user of activeUsers) {
            const entryTime = new Date(user.entryTime);
            const now = new Date();
            const durationMs = now - entryTime;
            const durationMinutes = Math.floor(durationMs / (1000 * 60));

            // Lógica de ejemplo: Notificar si lleva más de 4 horas (o límite de su plan)
            // En un caso real, esto dependería de si compró un ticket de tiempo fijo.
            // Para el modelo "pago al salir", notificamos cada hora para control de gastos.

            if (durationMinutes > 0 && durationMinutes % 60 === 0) {
                notifyUser(user._id, 'parking_reminder', {
                    message: `Llevas ${durationMinutes / 60} horas estacionado.`,
                    durationMinutes,
                    type: 'INFO'
                });
            }

            // Si tuviera un límite de tiempo (ej. visita de 2 horas), notificaríamos antes.
            // Ejemplo simulado: Límite de 4 horas para todos por defecto en esta demo
            const TIME_LIMIT_MINUTES = 240;
            const WARNING_THRESHOLD = 15; // Avisar 15 min antes

            if (durationMinutes >= (TIME_LIMIT_MINUTES - WARNING_THRESHOLD) && durationMinutes < TIME_LIMIT_MINUTES) {
                notifyUser(user._id, 'expiration_warning', {
                    message: `Tu tiempo límite de 4 horas expira pronto.`,
                    minutesLeft: TIME_LIMIT_MINUTES - durationMinutes,
                    type: 'WARNING'
                });
            }
        }

    } catch (error) {
        logger.error('Error verificando expiraciones:', error);
    }
};

module.exports = checkExpirations;
