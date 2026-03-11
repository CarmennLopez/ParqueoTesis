const { Sequelize } = require('sequelize');
const logger = require('./logger');

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/parking_db';

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    logQueryParameters: true,
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
        logger.error('❌ No se pudo conectar a la base de datos (Habilitando Modo Demo):', error.message);
        // process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
