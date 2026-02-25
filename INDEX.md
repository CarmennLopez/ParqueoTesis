# 📑 ÍNDICE COMPLETO DEL PROYECTO v2.0.0

## 🚀 Inicio Rápido (5 minutos)

```bash
npm install
cp .env.example .env   # Editar con tu DB_PASSWORD
npm run dev            # Las tablas se crean automáticamente
```

👉 Ver [INSTALL.md](INSTALL.md) para instrucciones detalladas.  
👉 Ver [SWAGGER_GUIDE.md](SWAGGER_GUIDE.md) para probar con Swagger UI.

---

## 📚 Documentación disponible

| Archivo | Para qué sirve |
|---|---|
| [README.md](README.md) | Introducción general, características, endpoints |
| [INSTALL.md](INSTALL.md) | Guía de instalación paso a paso (PostgreSQL + Redis) |
| [SWAGGER_GUIDE.md](SWAGGER_GUIDE.md) | Pruebas en Swagger UI — flujos completos con ejemplos |
| [DATABASE.md](DATABASE.md) | Esquema de tablas, SQL queries, Sequelize ORM |
| [SECURITY.md](SECURITY.md) | Seguridad, checklist de producción, vulnerabilidades |
| [TESTING.md](TESTING.md) | Cómo correr tests con Jest + Supertest |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Docker, Nginx, producción, backups |
| [VERIFICATION.md](VERIFICATION.md) | Checklist de verificación del sistema |
| [REDIS_INSTALL.md](REDIS_INSTALL.md) | Instalación de Redis / Memurai en Windows |
| [CHANGELOG.md](CHANGELOG.md) | Historial de versiones |

---

## 📂 Estructura del Proyecto

```
ParqueoTesis/
│
├── 📄 Documentación (RAÍZ)
│   ├── README.md               # Introducción y características
│   ├── INSTALL.md              # Instalación detallada
│   ├── SWAGGER_GUIDE.md        # Guía de pruebas Swagger
│   ├── DATABASE.md             # Schema PostgreSQL + queries SQL
│   ├── SECURITY.md             # Seguridad y best practices
│   ├── TESTING.md              # Testing con Jest
│   ├── DEPLOYMENT.md           # Docker y producción
│   ├── VERIFICATION.md         # Checklist de verificación
│   ├── REDIS_INSTALL.md        # Redis/Memurai setup
│   └── CHANGELOG.md            # Historial de cambios
│
├── 🔧 Configuración
│   ├── .env                    # Variables locales (NO versionar)
│   ├── .env.example            # Plantilla de .env
│   ├── .env.test               # Variables de testing
│   ├── .gitignore
│   ├── package.json
│   ├── jest.config.js
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── server.js               # Punto de entrada
│
├── 🧪 Testing
│   └── __tests__/
│       ├── auth.test.js        # Tests de autenticación
│       └── setup.js            # Setup global de Jest
│
├── 🌱 Seeders
│   └── seeders/
│       ├── seedUsers.js        # 5 usuarios de prueba (todos los roles)
│       ├── seedPricingPlans.js # Planes de precios
│       ├── seedParkingLots.js  # Lotes + espacios
│       ├── checkData.js        # Verificar datos en BD
│       ├── createStudentUser.js
│       ├── resetStudentPassword.js
│       └── updateCoordinates.js
│
├── 💻 Código Fuente (src/)
│   ├── config/
│   │   ├── constants.js        # Roles, tarifas, solvencia
│   │   ├── database.js         # Conexión Sequelize/PostgreSQL
│   │   ├── logger.js           # Winston
│   │   ├── swagger.js          # OpenAPI 3.0 spec
│   │   └── redis/              # Caché, rate limit, idempotencia
│   │
│   ├── controllers/
│   │   ├── auth/               # register, login, google, profile, token
│   │   ├── parking/            # assignment, payment, query, admin, solvency
│   │   ├── iot/                # lpr.controller
│   │   ├── invoiceController.js
│   │   └── healthController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect
│   │   ├── roleMiddleware.js   # authorize(roles)
│   │   ├── solvencyMiddleware.js # checkSolvency (estudiantes)
│   │   ├── iotAuthMiddleware.js  # X-IoT-Api-Key
│   │   ├── rateLimitMiddleware.js
│   │   ├── idempotencyMiddleware.js
│   │   └── errorHandler.js
│   │
│   ├── models/
│   │   ├── user.js             # isSolvent, solvencyExpires
│   │   ├── ParkingLot.js       # location JSONB
│   │   ├── ParkingSpace.js
│   │   ├── PricingPlan.js
│   │   ├── Invoice.js
│   │   ├── AuditLog.js
│   │   └── index.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── parkingRoutes.js    # + rutas solvencia
│   │   ├── iotRoutes.js
│   │   ├── invoiceRoutes.js
│   │   └── healthRoutes.js
│   │
│   ├── services/
│   │   ├── mqttService.js      # MQTT (modo simulación)
│   │   └── socketService.js    # Socket.io tiempo real
│   │
│   └── utils/
│       ├── auditLogger.js
│       ├── pricingEngine.js
│       └── tokenUtils.js
│
└── 📊 Datos
    └── logs/                   # Logs de aplicación (auto-generado)
```

---

## 🔑 Comandos Principales

### Desarrollo
```bash
npm install              # Instalar dependencias
npm run dev              # Servidor con hot-reload (nodemon)
```

### Testing
```bash
npm test                 # Todos los tests
npm run test:watch       # Modo watch
npm test -- --coverage   # Con cobertura
```

### Seeders
```bash
node seeders/seedUsers.js          # Crear usuarios de prueba
node seeders/seedPricingPlans.js   # Crear planes de precios
node seeders/seedParkingLots.js    # Crear lotes y espacios
node seeders/checkData.js          # Verificar datos en BD
```

### Docker
```bash
npm run docker:build    # Construir imagen
npm run docker:up       # Iniciar servicios
npm run docker:down     # Detener servicios
```

---

## 👥 Usuarios de Prueba

> Creados con `node seeders/seedUsers.js`

| Email | Contraseña | Rol | Solvencia requerida |
|-------|-----------|-----|:---:|
| admin@umg.edu.gt | Admin@12345 | ADMIN | ❌ |
| guard@umg.edu.gt | Guard@12345 | GUARD | ❌ |
| juan.perez@umg.edu.gt | Faculty@12345 | FACULTY | ❌ |
| carlos.lopez@estudiante.umg.edu.gt | Student@12345 | STUDENT | ✅ |
| maria.garcia@external.com | Visitor@12345 | VISITOR | ❌ |

---

## 🔐 Variables de Entorno Críticas

```env
# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=<tu_contraseña>

# JWT
JWT_SECRET=<32+ chars aleatorios>
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_URL=redis://localhost:6379

# IoT
IOT_API_KEY=<clave_secreta_iot>

# General
PORT=3000
NODE_ENV=development
```

> ⚠️ **Generar JWT_SECRET:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 🧪 Cobertura de Tests v2.0

| Módulo | Estado |
|---|---|
| Auth (register, login, refresh, logout) | ✅ |
| JWT middleware | ✅ |
| Parqueo (assign, pay, release) | ⏳ Próximo |
| Solvencia | ⏳ Próximo |
| Facturas | ⏳ Próximo |

---

## 🆘 Problemas Comunes

| Error | Causa | Solución |
|---|---|---|
| `password authentication failed` | `DB_PASSWORD` incorrecto | Corregir en `.env` |
| `EADDRINUSE :::3000` | Puerto ocupado | `taskkill /F /IM node.exe` |
| `Redis ECONNREFUSED` | Redis no corre | `net start Memurai` |
| `401 Unauthorized` | Token expirado | `POST /api/auth/refresh` |
| `402 SOLVENCY_REQUIRED` | Sin solvencia | Admin: `PUT /api/parking/solvency/:userId` |

---

## 🔗 Links Útiles

- **Swagger UI local**: http://localhost:3000/api-docs
- **GitHub**: https://github.com/CarmennLopez/ParqueoTesis
- **Express docs**: https://expressjs.com
- **Sequelize docs**: https://sequelize.org
- **PostgreSQL docs**: https://www.postgresql.org/docs/

---

**Proyecto**: Sistema de Gestión de Parqueo UMG  
**Versión**: 2.0.0 (PostgreSQL/Sequelize)  
**Última actualización**: Febrero 2026  
**Estado**: ✅ En desarrollo activo
