// server.js
const express = require('express');
const { connect } = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const parkingRoutes = require('./src/routes/parkingRoutes');
const authRoutes = require('./src/routes/authRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/config/logger');

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

// Sanitización contra inyección NoSQL
app.use(mongoSanitize());

// Compresión de respuestas
app.use(compression());

// Middleware para parsear JSON
app.use(express.json());

// Middleware para parsear URL-encoded
app.use(express.urlencoded({ extended: true }));

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

// ========================================
// RUTAS
// ========================================

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: '¡API de parqueo funcionando!',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      parking: '/api/parking',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de parqueo
app.use('/api/parking', parkingRoutes);

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
// SERVIDOR
// ========================================

app.listen(port, () => {
  logger.info(`🚀 Servidor escuchando en http://localhost:${port}`);
  logger.info(`📝 Modo: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de rechazos no capturados
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Apagando...');
  logger.error(err.name, err.message);
  process.exit(1);
});
