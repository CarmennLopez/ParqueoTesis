// src/config/logger.js
const winston = require('winston');
const path = require('path');

// Definir niveles de log
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Definir colores para cada nivel
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Agregar colores a winston
winston.addColors(colors);

// Formato de logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Definir qué logs se guardan en qué archivos
const transports = [
    // Consola - todos los logs
    new winston.transports.Console(),

    // Archivo para errores
    new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
    }),

    // Archivo para todos los logs
    new winston.transports.File({
        filename: path.join('logs', 'combined.log')
    }),
];

// Crear el logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
});

module.exports = logger;
