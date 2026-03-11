// src/utils/auditLogger.js
const { AuditLog } = require('../models');
const logger = require('../config/logger');

/**
 * Registra un evento de auditoría en la base de datos (PostgreSQL) de forma asíncrona.
 * 
 * @param {Object} req - Objeto Request de Express
 * @param {String} action - Nombre de la acción
 * @param {String} resource - Recurso afectado
 * @param {Object} details - Detalles adicionales
 * @param {String} status - Estado del evento
 */
const logAudit = async (req, action, resource, details = {}, status = 'SUCCESS') => {
    try {
        const userId = req.user ? req.user.id : (req.userId || null);
        const userRole = req.user ? req.user.role : (req.userRole || null);

        // Obtener IP y User Agent de forma robusta
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Crear el registro de auditoría - SIN AWAIT para no bloquear el login si falla Mongo
        AuditLog.create({
            userId,
            userRole,
            ipAddress,
            userAgent,
            action,
            resource,
            status,
            details
        }).catch(err => {
            logger.error('CRITICAL: Failed to save Audit Log (Async)', {
                error: err.message,
                auditData: { action, resource, status, details }
            });
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
