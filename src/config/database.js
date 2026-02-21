const { Sequelize } = require('sequelize');
const logger = require('./logger');

// Usar variables de entorno separadas para mayor control
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;
const dbName = process.env.DB_NAME || 'parking_db';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';

// O usar DATABASE_URL si está disponible
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('✅ Conexión a PostgreSQL establecida correctamente.');

        // Sincronizar modelos (solo en desarrollo, usar migraciones en prod)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            logger.info('🔄 Modelos sincronizados con la base de datos.');
        }
    } catch (error) {
        logger.error('❌ No se pudo conectar a la base de datos:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
