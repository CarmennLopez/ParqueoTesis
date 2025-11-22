// src/middleware/errorHandler.js
/**
 * Middleware centralizado de manejo de errores
 * Captura todos los errores y formatea respuestas consistentes
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || res.statusCode || 500;

    // Si el statusCode es 200 (éxito) pero hay un error, usar 500
    if (statusCode === 200) {
        statusCode = 500;
    }

    // Determinar si mostrar el stack trace
    const showStackTrace = process.env.NODE_ENV !== 'production';

    // Respuesta de error
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Error del servidor',
        ...(showStackTrace && { stack: err.stack }),
        // Información adicional del error si está disponible
        ...(err.errors && { errors: err.errors })
    });

    // Log del error (en producción se debería usar Winston)
    if (process.env.NODE_ENV === 'production') {
        console.error('Error:', {
            message: err.message,
            statusCode,
            stack: err.stack,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        });
    }
};

module.exports = errorHandler;
