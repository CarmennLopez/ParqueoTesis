// src/services/socketService.js
const { Server } = require('socket.io');
const logger = require('../config/logger');

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        logger.info(`🔌 Cliente conectado: ${socket.id}`);

        // Unirse a sala personal si se autentica (simplificado)
        socket.on('join_user_room', (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                logger.info(`👤 Socket ${socket.id} unido a sala user_${userId}`);
            }
        });

        // Unirse a sala de estado global (para dashboard)
        socket.on('join_status_room', () => {
            socket.join('parking_status');
            logger.info(`📊 Socket ${socket.id} unido a sala parking_status`);
        });

        socket.on('disconnect', () => {
            logger.info(`❌ Cliente desconectado: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io no inicializado!');
    }
    return io;
};

/**
 * Emite una actualización de estado del parqueo a todos los clientes suscritos
 * @param {Object} statusData - Datos actualizados del parqueo
 */
const emitParkingStatus = (statusData) => {
    try {
        getIO().to('parking_status').emit('parking_update', statusData);
        logger.info('📡 Evento parking_update emitido');
    } catch (error) {
        logger.warn('No se pudo emitir parking_update (Socket no listo)');
    }
};

/**
 * Notifica a un usuario específico
 * @param {string} userId - ID del usuario
 * @param {string} event - Nombre del evento
 * @param {Object} data - Datos a enviar
 */
const notifyUser = (userId, event, data) => {
    try {
        getIO().to(`user_${userId}`).emit(event, data);
        logger.info(`🔔 Notificación enviada a user_${userId}: ${event}`);
    } catch (error) {
        logger.warn(`No se pudo notificar a user_${userId}`);
    }
};

module.exports = {
    initSocket,
    getIO,
    emitParkingStatus,
    notifyUser
};
