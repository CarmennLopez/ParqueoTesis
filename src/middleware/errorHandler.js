// src/middleware/errorHandler.js
const logger = require('../config/logger');

/**
 * Middleware centralizado de manejo de errores
 * Implementa RFC 7807: Problem Details for HTTP APIs
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || res.statusCode || 500;

    // Si el statusCode es 200 (éxito) pero hay un error, usar 500
    if (statusCode === 200) {
        statusCode = 500;
    }

    // Determinar si mostrar el stack trace
    const showStackTrace = process.env.NODE_ENV !== 'production';

    // Estructura RFC 7807
    const problemDetails = {
        type: 'about:blank', // URI que identifica el tipo de problema (opcional)
        title: getTitleForStatus(statusCode),
        status: statusCode,
        detail: err.message || 'Ocurrió un error inesperado en el servidor.',
        instance: req.originalUrl,
        timestamp: new Date().toISOString(),
        ...(showStackTrace && { stack: err.stack }),
        ...(err.errors && { invalidParams: err.errors }) // Extension para errores de validación
    };

    // Log del error con Winston
    logger.error(`${problemDetails.title}: ${problemDetails.detail}`, {
        ...problemDetails,
        method: req.method,
        ip: req.ip
    });

    res.status(statusCode).json(problemDetails);
};

// Helper para títulos estándar HTTP
const getTitleForStatus = (status) => {
    const titles = {
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        409: 'Conflict',
        422: 'Unprocessable Entity',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        503: 'Service Unavailable'
    };
    return titles[status] || 'Unknown Error';
};

module.exports = errorHandler;
