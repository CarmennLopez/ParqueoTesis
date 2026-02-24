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

// Swagger Documentation — UI mejorada
const swaggerCustomCss = `
  /* ── Base ── */
  body { font-family: 'Segoe UI', system-ui, sans-serif; }
  .swagger-ui { font-family: 'Segoe UI', system-ui, sans-serif; }

  /* ── Topbar: azul UMG ── */
  .swagger-ui .topbar {
    background: linear-gradient(135deg, #1a237e 0%, #283593 60%, #1565c0 100%);
    padding: 12px 0;
    box-shadow: 0 2px 12px rgba(0,0,0,0.4);
  }
  .swagger-ui .topbar .download-url-wrapper { display: none; }
  .swagger-ui .topbar-wrapper { justify-content: center; }
  .swagger-ui .topbar-wrapper .link::after {
    content: '🅿️ Sistema de Parqueo UMG — API v2.0.0';
    font-size: 1.2rem;
    font-weight: 700;
    color: white;
    letter-spacing: 0.5px;
  }
  .swagger-ui .topbar-wrapper img { display: none; }

  /* ── Info block ── */
  .swagger-ui .info { margin: 30px 0 20px; }
  .swagger-ui .info .title {
    color: #1a237e;
    font-size: 2rem;
    font-weight: 800;
  }
  .swagger-ui .info .title small {
    background: #1565c0;
    color: white;
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 0.7rem;
    vertical-align: middle;
    margin-left: 8px;
  }
  .swagger-ui .info p, .swagger-ui .info li { color: #374151; line-height: 1.7; }

  /* ── Authorize button ── */
  .swagger-ui .btn.authorize {
    background: #1565c0;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    padding: 8px 20px;
    transition: background 0.2s;
  }
  .swagger-ui .btn.authorize:hover { background: #0d47a1; }
  .swagger-ui .btn.authorize svg { fill: white; }

  /* ── Tags (grupos de endpoints) ── */
  .swagger-ui .opblock-tag {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a237e;
    border-bottom: 2px solid #e3f2fd;
    padding: 10px 0;
    margin-top: 16px;
  }
  .swagger-ui .opblock-tag:hover { background: #f0f4ff; border-radius: 6px; }

  /* ── Colores por método HTTP ── */
  .swagger-ui .opblock.opblock-post {
    border-color: #1565c0;
    background: #e3f2fd22;
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #1565c0;
    border-radius: 6px;
    font-weight: 700;
    min-width: 70px;
  }
  .swagger-ui .opblock.opblock-get {
    border-color: #2e7d32;
    background: #e8f5e922;
  }
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #2e7d32;
    border-radius: 6px;
    min-width: 70px;
  }
  .swagger-ui .opblock.opblock-put {
    border-color: #e65100;
    background: #fff3e022;
  }
  .swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: #e65100;
    border-radius: 6px;
    min-width: 70px;
  }
  .swagger-ui .opblock.opblock-delete {
    border-color: #c62828;
    background: #ffebee22;
  }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #c62828;
    border-radius: 6px;
    min-width: 70px;
  }

  /* ── Endpoint cards ── */
  .swagger-ui .opblock {
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    margin-bottom: 10px;
    transition: box-shadow 0.2s;
  }
  .swagger-ui .opblock:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.14); }
  .swagger-ui .opblock-summary { border-radius: 10px; padding: 10px 16px; }
  .swagger-ui .opblock-summary-description {
    font-weight: 500;
    color: #374151;
  }

  /* ── Execute button ── */
  .swagger-ui .btn.execute {
    background: #1a237e;
    color: white;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    width: 100%;
    padding: 10px;
    font-size: 1rem;
    transition: background 0.2s;
  }
  .swagger-ui .btn.execute:hover { background: #0d47a1; }

  /* ── Response codes ── */
  .swagger-ui .response-col_status { font-weight: 700; }
  .swagger-ui table.responses-table { border-radius: 8px; overflow: hidden; }
  .swagger-ui .response { border-radius: 6px; }

  /* ── Models section ── */
  .swagger-ui section.models { border-radius: 10px; background: #f8faff; }
  .swagger-ui section.models h4 { color: #1a237e; font-weight: 700; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #1565c0; border-radius: 3px; }
`;

const swaggerUiOptions = {
    customCss: swaggerCustomCss,
    customSiteTitle: 'API Parqueo UMG — Documentación',
    customfavIcon: 'https://www.umg.edu.gt/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,      // El token JWT persiste entre recargas
        displayRequestDuration: true,    // Muestra el tiempo de respuesta
        defaultModelsExpandDepth: 1,     // Expande 1 nivel del modelo por defecto
        defaultModelExpandDepth: 2,
        docExpansion: 'none',            // Tags colapsados al inicio (más limpio)
        filter: true,                    // Barra de búsqueda de endpoints
        tryItOutEnabled: true,           // "Try it out" abierto siempre
        tagsSorter: 'alpha',             // Tags ordenados alfabéticamente
        syntaxHighlight: {
            activate: true,
            theme: 'nord'               // Tema de syntax highlight
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerUiOptions));

// Error Handling
app.use((req, res) => res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` }));
app.use(errorHandler);

module.exports = app;
