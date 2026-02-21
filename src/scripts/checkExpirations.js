// src/scripts/checkExpirations.js
const { User } = require('../models');
const { Op } = require('sequelize');
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
        // Sequelize: where currentParkingSpace is NOT NULL AND hasPaid is FALSE
        const activeUsers = await User.findAll({
            where: {
                currentParkingSpace: { [Op.ne]: null },
                hasPaid: false
            }
        });

        for (const user of activeUsers) {
            if (!user.entryTime) continue;

            const entryTime = new Date(user.entryTime);
            const now = new Date();
            const durationMs = now - entryTime;
            const durationMinutes = Math.floor(durationMs / (1000 * 60));

            // Lógica de ejemplo: Notificar cada hora
            if (durationMinutes > 0 && durationMinutes % 60 === 0) {
                notifyUser(user.id, 'parking_reminder', {
                    message: `Llevas ${durationMinutes / 60} horas estacionado.`,
                    durationMinutes,
                    type: 'INFO'
                });
            }

            // Límite de 4 horas (240 mins)
            const TIME_LIMIT_MINUTES = 240;
            const WARNING_THRESHOLD = 15; // Avisar 15 min antes

            if (durationMinutes >= (TIME_LIMIT_MINUTES - WARNING_THRESHOLD) && durationMinutes < TIME_LIMIT_MINUTES) {
                notifyUser(user.id, 'expiration_warning', {
                    message: `Tu tiempo límite de 4 horas expira pronto.`,
                    minutesLeft: TIME_LIMIT_MINUTES - durationMinutes,
                    type: 'WARNING'
                });
            }
        }

    } catch (error) {
        logger.error(`Error verificando expiraciones: ${error.message}`);
    }
};

module.exports = checkExpirations;
