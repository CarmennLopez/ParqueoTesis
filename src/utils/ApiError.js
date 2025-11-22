// src/utils/ApiError.js
/**
 * Clase de error personalizada para errores de API
 * Permite crear errores con códigos de estado HTTP específicos
 */
class ApiError extends Error {
    /**
     * @param {number} statusCode - Código de estado HTTP
     * @param {string} message - Mensaje de error
     */
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Indica que es un error operacional (esperado)

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApiError;
