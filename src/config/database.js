const { Sequelize } = require('sequelize');
const logger = require('./logger');

// Usar variables individuales del .env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
// Si no existen, intenta con DATABASE_URL como fallback
let sequelize;

if (process.env.DB_HOST) {
    sequelize = new Sequelize(
        process.env.DB_NAME || 'parking_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            dialect: 'postgres',
            logging: (msg) => logger.debug(msg),
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            retry: {
                match: [
                    /SequelizeConnectionError/,
                    /SequelizeConnectionRefusedError/,
                    /SequelizeHostNotFoundError/,
                    /SequelizeHostNotReachableError/,
                    /SequelizeInvalidConnectionError/,
                    /SequelizeConnectionTimedOutError/
                ],
                max: 5
            }
        }
    );
} else {
    // Fallback a DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/parking_db';
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        retry: {
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/
            ],
            max: 5
        }
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('✅ Conexión a PostgreSQL establecida correctamente.');

        // Sincronizar modelos en desarrollo
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
