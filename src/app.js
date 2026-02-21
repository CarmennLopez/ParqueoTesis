const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');

const parkingRoutes = require('./routes/parkingRoutes');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const iotRoutes = require('./routes/iotRoutes');

const errorHandler = require('./middleware/errorHandler');
const versionMiddleware = require('./middleware/versionMiddleware');
const idempotency = require('./middleware/idempotencyMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

dotenv.config();

const app = express();

// Security & Optimization
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middlewares
app.use(versionMiddleware);
app.use('/health', healthRoutes); // High priority
app.use(idempotency);

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

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Error Handling
app.use((req, res) => res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` }));
app.use(errorHandler);

module.exports = app;
