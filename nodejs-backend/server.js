// server.js
const express = require('express');
const { connect } = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
// const mongoSanitize = require('express-mongo-sanitize'); // Comentado por incompatibilidad con Express 5
const compression = require('compression');
const parkingRoutes = require('./src/routes/parkingRoutes');
const authRoutes = require('./src/routes/authRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/config/logger');
const { connect: connectRedis, isRedisHealthy } = require('./src/config/redisClient');

// Cargar variables de entorno
dotenv.config();

// Validar variables de entorno críticas
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    logger.error(`Variable de entorno ${varName} no definida`);
    process.exit(1);
  }
});

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGODB_URI;

// ========================================
// CONFIGURACIÓN DE SEGURIDAD
// ========================================

// Helmet - Configurar headers HTTP seguros
app.use(helmet());

// CORS - Configurar orígenes permitidos
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*', // En desarrollo permite todos, en producción especifica dominios
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Versionado de API (Antes de las rutas)
const versionMiddleware = require('./src/middleware/versionMiddleware');
app.use(versionMiddleware);

// Health check routes (Antes de otros middlewares para máxima disponibilidad)
app.use('/health', healthRoutes);

// Sanitización contra inyección NoSQL
// app.use(mongoSanitize()); // TODO: Buscar alternativa compatible con Express 5

// Compresión de respuestas
app.use(compression());

// Middleware para parsear JSON
app.use(express.json());

// Middleware para parsear URL-encoded
app.use(express.urlencoded({ extended: true }));

// Middleware de Idempotencia (después de body parser)
const idempotency = require('./src/middleware/idempotencyMiddleware');
app.use(idempotency);

// ========================================
// CONEXIÓN A MONGODB
// ========================================

connect(mongoURI)
  .then(() => {
    logger.info('✅ Conectado a la base de datos de MongoDB');
  })
  .catch((err) => {
    logger.error('❌ Error de conexión a la base de datos:', err);
    process.exit(1);
  });


// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: '¡API de parqueo UMG funcionando!',
    version: '2.0.0',
    status: 'active',
    features: [
      'Redis Caching',
      'ACID Transactions',
      'Health Checks Avanzados',
      'Simulación IoT/FEL/LDAP'
    ],
    endpoints: {
      auth: '/api/auth',
      parking: '/api/parking',
      health: '/health',
      healthLiveness: '/health/liveness',
      healthReadiness: '/health/readiness'
    }
  });
});

// Rutas de autenticación
app.use('/auth', authRoutes);

// Rutas de parqueo
app.use('/parking', parkingRoutes);

// Rutas de facturación
const invoiceRoutes = require('./src/routes/invoiceRoutes');
app.use('/invoices', invoiceRoutes);

// Rutas IoT (LPR, Sensores)
const iotRoutes = require('./src/routes/iotRoutes');
app.use('/iot', iotRoutes);

// Documentación Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// ========================================
// MANEJO DE ERRORES
// ========================================

// Ruta no encontrada
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.originalUrl}`
  });
});

// Middleware centralizado de errores (debe ser el último)
app.use(errorHandler);

// ========================================
// SERVIDOR HTTP & SOCKET.IO
// ========================================
const http = require('http');
const { initSocket } = require('./src/services/socketService');

const server = http.createServer(app);
const io = initSocket(server);

server.listen(port, () => {
  logger.info(`🚀 Servidor escuchando en http://localhost:${port}`);
  logger.info(`📝 Modo: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔌 Socket.io listo para conexiones`);

  // Simulación de Cron Job para notificaciones (cada 60 segundos)
  const checkExpirations = require('./src/scripts/checkExpirations');
  setInterval(() => {
    checkExpirations();
  }, 60000);
});

// Manejo de rechazos no capturados
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Apagando...');
  logger.error(err.name, err.message);
  process.exit(1);
});
