// src/utils/auditLogger.js
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * Registra un evento de auditoría en la base de datos de forma asíncrona.
 * No bloquea el flujo principal si falla, pero loguea el error.
 * 
 * @param {Object} req - Objeto Request de Express (para extraer IP, UserAgent, User)
 * @param {String} action - Nombre de la acción (ej: 'LOGIN', 'PAYMENT')
 * @param {String} resource - Recurso afectado (ej: 'Auth', 'ParkingLot')
 * @param {Object} details - Detalles adicionales del evento
 * @param {String} status - Estado del evento ('SUCCESS', 'FAILURE', 'WARNING')
 */
const logAudit = async (req, action, resource, details = {}, status = 'SUCCESS') => {
    try {
        // Extraer información del contexto (si existe)
        const userId = req.user ? req.user._id : (req.userId || null);
        const userRole = req.user ? req.user.role : (req.userRole || null);

        // Obtener IP y User Agent de forma robusta
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Crear el registro de auditoría
        await AuditLog.create({
            userId,
            userRole,
            ipAddress,
            userAgent,
            action,
            resource,
            status,
            details
        });

        // También loguear en Winston para redundancia y debug en consola
        logger.info(`AUDIT [${action}] - ${status}`, {
            userId,
            resource,
            details
        });

    } catch (error) {
        // Fallback: Si falla guardar en Mongo, al menos loguearlo en archivo/consola
        logger.error('CRITICAL: Failed to save Audit Log', {
            error: error.message,
            auditData: { action, resource, status, details }
        });
    }
};

module.exports = { logAudit };
