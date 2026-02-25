const http = require('http');
const dotenv = require('dotenv');
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const logger = require('./src/config/logger');
const { initSocket } = require('./src/services/socketService');
const checkExpirations = require('./src/scripts/checkExpirations');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');

dotenv.config();

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Swagger (Optional to keep here or app.js, keeping here for clean app.js)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

const { connect: connectRedis } = require('./src/config/redis');

// Database & Server Start
connectRedis().then(() => {
  connectDB().then(() => {
    const io = initSocket(server);

    server.listen(port, () => {
      logger.info(`🚀 Servidor escuchando en http://localhost:${port}`);
      logger.info(`📝 Modo: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔌 Socket.io listo para conexiones`);

      // Background Tasks
      setInterval(() => {
        checkExpirations();
      }, 60000);
    });
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Apagando...');
  logger.error(err.name, err.message);
  process.exit(1);
});
