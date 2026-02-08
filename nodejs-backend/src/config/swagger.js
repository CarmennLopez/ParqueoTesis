const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'API Gateway - Sistema de Parqueo UMG',
            version: '1.1.1',
            description: `
<details>
<summary><strong>📖 Información del API - Click para expandir</strong></summary>

## API Gateway para Sistema de Gestión de Parqueo

API REST completa para la gestión de parqueo de la Universidad Mariano Gálvez.

### Características

- ✅ Autenticación JWT con refresh tokens
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Rate limiting distribuido con Redis
- ✅ Health checks para Kubernetes/Docker
- ✅ Integración IoT (cámaras LPR)
- ✅ Generación de facturas electrónicas (FEL)
- ✅ WebSockets para notificaciones en tiempo real
- ✅ Soporte multi-parqueo

### Autenticación

La mayoría de endpoints requieren autenticación mediante JWT.

**Cómo autenticarse:**

1. Registrarse usando \`POST /auth/register\`
2. Iniciar sesión usando \`POST /auth/login\` para obtener tokens
3. Incluir el \`accessToken\` en el header: \`Authorization: Bearer {token}\`
4. Usar el botón **Authorize** 🔓 arriba para configurar tu token

**Tokens:**
- **Access Token:** Válido por 15 minutos
- **Refresh Token:** Válido por 7 días

### Roles de Usuario

- **student**: Estudiantes (rol por defecto)
- **faculty**: Catedráticos y personal administrativo
- **guard**: Operadores de garita
- **admin**: Administradores del sistema
- **visitor**: Visitantes externos

### Rate Limiting

Algunos endpoints tienen límites de peticiones:
- Login: 5 intentos cada 15 minutos
- Pago: 3 intentos por minuto
- Apertura de barrera: 5 intentos por minuto

</details>
            `,
            contact: {
                name: 'Equipo de Desarrollo',
                email: 'soporte@umg.edu.gt',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'API Gateway',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingresa el access token obtenido del login. Formato: `Bearer {token}`',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            example: 'Error al procesar la solicitud',
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    msg: { type: 'string' },
                                    param: { type: 'string' },
                                    location: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Autenticación',
                description: 'Endpoints para registro, login y gestión de sesiones',
            },
            {
                name: 'Parqueo',
                description: 'Operaciones de gestión de espacios de parqueo',
            },
            {
                name: 'Health',
                description: 'Endpoints de monitoreo y salud del sistema',
            },
            {
                name: 'Facturas',
                description: 'Generación de facturas electrónicas (FEL)',
            },
            {
                name: 'IoT',
                description: 'Endpoints para dispositivos IoT (cámaras LPR, sensores)',
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/models/*.js'], // Archivos donde buscar anotaciones
};

const specs = swaggerJsdoc(options);
module.exports = specs;
