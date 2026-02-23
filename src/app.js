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
        message: '¡API de Parqueo UMG funcionando!',
        version: '2.0.0',
        status: 'active',
        docs: '/api-docs',
        endpoints: {
            auth: { base: '/api/auth', routes: ['POST /register', 'POST /login', 'POST /refresh', 'POST /logout', 'GET /me', 'POST /google'] },
            parking: { base: '/api/parking', routes: ['GET /lots', 'POST /lots', 'POST /assign', 'POST /pay', 'POST /release', 'GET /status', 'POST /gate/open'] },
            solvency: { base: '/api/parking', routes: ['PUT /solvency/:userId', 'GET /solvency/:cardId', 'GET /solvency-report'] },
            simulate: { base: '/api/parking', routes: ['POST /simulate/fill', 'POST /simulate/empty'] },
            invoices: { base: '/api/invoices', routes: ['POST /generate'] },
            iot: { base: '/api/iot', routes: ['POST /lpr/event'] },
            health: { base: '/health', routes: ['GET /', 'GET /liveness', 'GET /readiness'] },
        },
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
