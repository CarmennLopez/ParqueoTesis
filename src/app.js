const express = require('express');
require('dotenv').config();
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const parkingRoutes = require('./routes/parkingRoutes');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const iotRoutes = require('./routes/iotRoutes');

const errorHandler = require('./middleware/errorHandler');
const versionMiddleware = require('./middleware/versionMiddleware');
const idempotency = require('./middleware/idempotencyMiddleware');
// const swaggerUi = require('swagger-ui-express');
// const swaggerSpecs = require('./config/swagger');

// Middlewares

const app = express();

console.log('-------------------------------------------');
console.log('🚀 INICIANDO API DE PARQUEO...');
console.log('📍 URL BASE: /api/parking');
console.log('📍 AMBIENTE:', process.env.NODE_ENV || 'development');
console.log('-------------------------------------------');

// Security & Optimization
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        const allowed = [
            'http://localhost:4200',
            'http://localhost:5000',
            'http://localhost:8100',
            'http://127.0.0.1:4200'
        ];
        if (!origin || allowed.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Middlewares
app.use(versionMiddleware);
app.use('/health', healthRoutes); // High priority
app.use(idempotency);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: '¡API de parqueo UMG funcionando!',
        version: '2.0.0',
        status: 'active',
        endpoints: { auth: '/api/auth', parking: '/api/parking' }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/iot', iotRoutes);

// Swagger (Can be moved to separate file if needed)
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Error Handling
app.use((req, res) => res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` }));
app.use(errorHandler);

module.exports = app;
