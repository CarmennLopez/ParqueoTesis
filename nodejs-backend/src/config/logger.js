// src/config/logger.js
const winston = require('winston');
require('winston-daily-rotate-file');
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
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Transporte para rotación diaria de logs
const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

// Definir transportes
const transports = [
    // Consola - todos los logs (solo en dev o si se configura)
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }),

    // Archivo rotativo para todos los logs
    fileRotateTransport,

    // Archivo específico para errores (opcional, si se quiere separar)
    new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
    }),
];

// Crear el logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format: logFormat,
    defaultMeta: { service: 'parking-service' },
    transports,
});

module.exports = logger;
