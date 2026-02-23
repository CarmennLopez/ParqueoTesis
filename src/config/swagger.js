const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Sistema de Parqueo UMG',
            version: '2.0.0',
            description: `
## API REST para el Sistema de Gestión de Parqueo - Universidad Mariano Gálvez

### Flujo Principal:
1. **Registrarse** → \`POST /api/auth/register\`
2. **Iniciar sesión** → \`POST /api/auth/login\` (obtiene JWT)
3. **Entrar al parqueo** → \`POST /api/parking/assign\`
4. **Pagar tarifa** → \`POST /api/parking/pay\`
5. **Salir del parqueo** → \`POST /api/parking/release\`

### Roles:
- \`student\`: Estudiante — puede estacionar si es solvente
- \`faculty\`: Docente — exento de solvencia
- \`guard\`: Guardia — aprueba solvencias, controla puertas
- \`admin\`: Administrador — acceso total
            `,
            contact: {
                name: 'Soporte Técnico UMG',
                email: 'soporte@miumg.edu.gt',
            },
            license: {
                name: 'MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de Desarrollo Local',
            },
            {
                url: 'https://api.parqueo.umg.edu.gt',
                description: 'Servidor de Producción',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingresa el token JWT obtenido en /api/auth/login. Formato: **Bearer {token}**',
                },
            },
            schemas: {
                // ─── Auth ───────────────────────────────────────────
                RegisterRequest: {
                    type: 'object',
                    required: ['name', 'email', 'password', 'card_id', 'vehicle_plate'],
                    properties: {
                        name: { type: 'string', example: 'Carmen Lopez' },
                        email: { type: 'string', format: 'email', example: 'carmen@miumg.edu.gt' },
                        password: { type: 'string', format: 'password', example: 'Password123!' },
                        card_id: { type: 'string', example: '12345678' },
                        vehicle_plate: { type: 'string', example: 'UMG-001' },
                        role: { type: 'string', enum: ['student', 'faculty', 'guard', 'admin'], default: 'student', example: 'student' },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'carmen@miumg.edu.gt' },
                        password: { type: 'string', format: 'password', example: 'Password123!' },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    description: 'Respuesta de login y registro exitoso',
                    properties: {
                        success: { type: 'boolean', example: true },
                        accessToken: { type: 'string', description: 'JWT de acceso (válido 15 min)', example: 'eyJhbGciOiJIUzI1NiIs...' },
                        refreshToken: { type: 'string', description: 'Token para renovar el access token', example: '6f0077924016468cd17...' },
                        _id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Carmen Lopez' },
                        email: { type: 'string', example: 'carmen@miumg.edu.gt' },
                        role: { type: 'string', enum: ['student', 'faculty', 'guard', 'admin'], example: 'student' },
                        hasPaid: { type: 'boolean', example: false },
                        currentParkingSpace: { type: 'string', nullable: true, example: null },
                    },
                },
                // ─── Parking ─────────────────────────────────────────
                AssignRequest: {
                    type: 'object',
                    required: ['parkingLotId'],
                    properties: {
                        parkingLotId: { type: 'integer', example: 1, description: 'ID del lote de parqueo' },
                    },
                },
                PayRequest: {
                    type: 'object',
                    required: ['parkingLotId'],
                    properties: {
                        parkingLotId: { type: 'integer', example: 1, description: 'ID del lote de parqueo' },
                    },
                },
                ParkingLotRequest: {
                    type: 'object',
                    required: ['name', 'total_spaces', 'hourly_rate'],
                    properties: {
                        name: { type: 'string', example: 'Lote Norte' },
                        total_spaces: { type: 'integer', example: 50 },
                        hourly_rate: { type: 'number', format: 'float', example: 5.00 },
                        location: {
                            type: 'object',
                            properties: {
                                lat: { type: 'number', example: 14.6349 },
                                lng: { type: 'number', example: -90.5069 },
                            },
                        },
                    },
                },
                SolvencyUpdateRequest: {
                    type: 'object',
                    properties: {
                        months: { type: 'integer', minimum: 1, maximum: 12, default: 1, example: 1, description: 'Número de meses de solvencia a agregar' },
                    },
                },
                InvoiceRequest: {
                    type: 'object',
                    required: ['parkingLotId', 'amount', 'duration_minutes'],
                    properties: {
                        parkingLotId: { type: 'integer', example: 1 },
                        amount: { type: 'number', format: 'float', example: 15.50 },
                        duration_minutes: { type: 'integer', example: 185 },
                    },
                },
                // ─── IoT ──────────────────────────────────────────────
                LprEventRequest: {
                    type: 'object',
                    required: ['plate', 'camera_id', 'event_type'],
                    properties: {
                        plate: { type: 'string', example: 'UMG-001', description: 'Placa del vehículo detectada' },
                        camera_id: { type: 'string', example: 'CAM-ENTRY-01' },
                        event_type: { type: 'string', enum: ['ENTRY', 'EXIT'], example: 'ENTRY' },
                        timestamp: { type: 'string', format: 'date-time', example: '2026-02-21T16:00:00Z' },
                    },
                },
                // ─── Common ───────────────────────────────────────────
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Descripción del error' },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Operación exitosa' },
                    },
                },
            },
            responses: {
                Unauthorized: {
                    description: 'No autorizado — Token JWT inválido o expirado',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { success: false, message: 'Token inválido o expirado' },
                        },
                    },
                },
                Forbidden: {
                    description: 'Prohibido — No tiene permisos para esta acción',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { success: false, message: 'Acceso denegado' },
                        },
                    },
                },
                NotFound: {
                    description: 'No encontrado',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
                BadRequest: {
                    description: 'Datos de entrada inválidos',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
            },
        },
        tags: [
            { name: 'Autenticación', description: 'Registro, login, tokens y perfil' },
            { name: 'Parqueo', description: 'Gestión de lotes, espacios, flujo de entrada/salida' },
            { name: 'Solvencia', description: 'Control de solvencia mensual de estudiantes' },
            { name: 'Facturas', description: 'Generación de comprobantes de pago' },
            { name: 'IoT / Cámaras', description: 'Eventos de reconocimiento de placas (LPR)' },
            { name: 'Simulación', description: 'Rutas de testing/demo para simular ocupación' },
            { name: 'Health', description: 'Monitoreo y disponibilidad del servicio' },
        ],
    },
    apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
