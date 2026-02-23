# 📑 ÍNDICE COMPLETO DEL PROYECTO v1.1.0

## 🎯 Inicio Rápido

```bash
npm install
npm run docker:up
docker-compose exec api npm run seed:all
curl http://localhost:3000/health/liveness
```

👉 **[Ver QUICKSTART.md](QUICKSTART.md)** para más detalles.

---

## 📚 Documentación Principal

### Para Nuevo Desarrollador
1. **[README.md](README.md)** - Introducción y configuración básica
2. **[QUICKSTART.md](QUICKSTART.md)** - Los primeros 5 minutos
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** (si existe) - Diseño del sistema

### Para Desarrollador Activo
1. **[TESTING.md](TESTING.md)** - Cómo escribir y ejecutar tests
2. **[SECURITY.md](SECURITY.md)** - Seguridad y mejores prácticas
3. **[MULTI_PARKING.md](MULTI_PARKING.md)** - Soporte para múltiples parqueos
4. **[API Documentation](swagger.yml)** (swagger en `/api-docs`)

### Para DevOps/Cloud
1. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Despliegue local, Docker, producción
2. **[SECURITY.md](SECURITY.md)** - Checklist de seguridad
3. **[DATABASE.md](DATABASE.md)** - Configuración de PostgreSQL

### Para Mantenimiento
1. **[CHANGELOG.md](CHANGELOG.md)** - Historial de versiones
2. **[IMPROVEMENTS-SUMMARY.md](IMPROVEMENTS-SUMMARY.md)** - Resumen v1.1.0

---

## 📂 Estructura del Proyecto

```
TesisProyect/
│
├── 📄 Documentación (RAÍZ)
│   ├── README.md                    # Introducción general
│   ├── QUICKSTART.md                # 5 minutos para empezar
│   ├── SECURITY.md                  # Seguridad y best practices
│   ├── TESTING.md                   # Guía de testing
│   ├── DEPLOYMENT.md                # Despliegue y producción
│   ├── CHANGELOG.md                 # Historial de cambios
│   ├── IMPROVEMENTS-SUMMARY.md      # Resumen v1.1.0
│   ├── MULTI_PARKING.md             # Soporte múltiples parqueos
│   ├── DATABASE.md                  # PostgreSQL setup
│   ├── INSTALL.md                   # Instalación detallada
│   ├── MANUAL_POSTMAN.md            # Testing manual con Postman
│   ├── REDIS_INSTALL.md             # Redis setup
│   └── VERIFICATION.md              # Verificación del sistema
│
├── 🔧 Configuración
│   ├── .env                         # Variables de entorno (desarrollo)
│   ├── .env.example                 # Plantilla de .env
│   ├── .env.test                    # Variables de testing
│   ├── .gitignore                   # Archivos a ignorar en Git
│   ├── package.json                 # Dependencias y scripts
│   ├── package-lock.json            # Lock de dependencias
│   ├── Dockerfile                   # Imagen Docker
│   ├── docker-compose.yml           # Orquestación Docker
│   ├── jest.config.js               # Configuración Jest
│   └── server.js                    # Entrada principal
│
├── 🧪 Testing
│   └── __tests__/
│       ├── auth.test.js             # Tests de autenticación
│       └── setup.js                 # Setup global
│
├── 🌱 Seeders
│   └── seeders/
│       ├── seedUsers.js             # Crear usuarios de prueba
│       ├── seedPricingPlans.js      # Crear planes de precios
│       └── seedParkingLots.js       # Crear espacios de parqueo
│
├── 💻 Código Fuente
│   └── src/
│       ├── config/
│       │   ├── constants.js         # Constantes de aplicación
│       │   ├── logger.js            # Winston logging
│       │   ├── redisClient.js       # Configuración Redis
│       │   └── swagger.js           # Swagger/OpenAPI
│       │
│       ├── controllers/
│       │   ├── authController.js    # Autenticación y login
│       │   ├── healthController.js  # Health checks
│       │   ├── invoiceController.js # Facturas
│       │   ├── iotController.js     # IoT/Sensores
│       │   └── parkingController.js # Gestión de parqueo
│       │
│       ├── models/
│       │   ├── user.js              # Modelo de Usuario
│       │   ├── AuditLog.js          # Auditoría
│       │   ├── Invoice.js           # Facturas
│       │   ├── ParkingLot.js        # Lotes de parqueo
│       │   └── PricingPlan.js       # Planes de precios
│       │
│       ├── routes/
│       │   ├── authRoutes.js        # Rutas de autenticación
│       │   ├── healthRoutes.js      # Rutas de salud
│       │   ├── invoiceRoutes.js     # Rutas de facturas
│       │   ├── iotRoutes.js         # Rutas IoT
│       │   └── parkingRoutes.js     # Rutas de parqueo
│       │
│       ├── middleware/
│       │   ├── authMiddleware.js    # Verificación JWT
│       │   ├── authorize.js         # Autorización por roles
│       │   ├── errorHandler.js      # Manejo de errores
│       │   ├── idempotencyMiddleware.js # Idempotencia
│       │   ├── rateLimitMiddleware.js   # Rate limiting
│       │   ├── roleMiddleware.js    # Validación de roles
│       │   └── versionMiddleware.js # Versionado API
│       │
│       ├── services/
│       │   ├── mqttService.js       # MQTT/IoT
│       │   └── socketService.js     # WebSockets/Socket.io
│       │
│       ├── utils/
│       │   ├── ApiError.js          # Clase de errores
│       │   ├── auditLogger.js       # Registro de auditoría
│       │   ├── pricingEngine.js     # Cálculo de tarifas
│       │   └── tokenUtils.js        # Manejo de JWT
│       │
│       ├── scripts/
│       │   ├── checkExpirations.js  # Verificar expiración
│       │   └── initPricingPlans.js  # Inicializar precios
│       │
│       └── server.js/               # Punto de entrada de rutas
│
├── 📊 Datos
│   └── logs/                        # Logs de aplicación
│
└── 🧹 Otros
    ├── seed.js                      # Script principal de seeding
    ├── test-auth.js                 # Test manual de auth
    ├── test-results.txt             # Resultados de tests
    └── node_modules/                # Dependencias (gitignored)
```

---

## 🔑 Comandos Principales

### Desarrollo
```bash
npm install              # Instalar dependencias
npm run dev              # Servidor con hot-reload
npm run lint             # Validar código
```

### Testing
```bash
npm test                 # Ejecutar todos los tests
npm run test:watch      # Modo watch
npm run test:auth       # Tests de autenticación
npm test -- --coverage  # Con cobertura
```

### Seeding
```bash
npm run seed             # Crear espacios de parqueo
npm run seed:users       # Crear usuarios de prueba
npm run seed:pricing     # Crear planes de precios
npm run seed:all         # Todo lo anterior
```

### Docker
```bash
npm run docker:build    # Construir imagen
npm run docker:up       # Iniciar servicios
npm run docker:down     # Detener servicios
```

### Producción
```bash
npm start                # Iniciar servidor
npm test -- --coverage   # Validar tests
npm run lint             # Validar código
```

---

## 👥 Usuarios de Prueba

Generados con `npm run seed:users`:

| Email | Contraseña | Rol | Acceso |
|-------|-----------|-----|--------|
| admin@miumg.edu.gt | Admin@12345 | ADMIN | Todas las rutas |
| guard@miumg.edu.gt | Guard@12345 | GUARD | Verificación y liberación |
| juan.perez@miumg.edu.gt | Faculty@12345 | FACULTY | Estacionamiento sin límite |
| carlos.lopez@estudiante.umg.edu.gt | Student@12345 | STUDENT | Estacionamiento estándar |
| maria.garcia@external.com | Visitor@12345 | VISITOR | Estacionamiento visitante |

---

## 🔐 Variables de Entorno Críticas

```env
# Autenticación
JWT_SECRET=8f9d7e3c5b2a1f6e9d4c8b1a7f3e2d5c9b6a1f4e8d3c7b2a5f1e9d6c4b8a
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parqueo_umg
DB_USER=postgres
DB_PASSWORD=tu_password_seguro
REDIS_URL=redis://localhost:6379

# Servidor
PORT=3000
NODE_ENV=development

# Seguridad
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

⚠️ **Cambiar en producción**: Generar nuevo `JWT_SECRET` con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 Testing

### Cobertura de Tests (v1.1.0)
- ✅ Autenticación (register, login, refresh)
- ⏳ Parqueo (próximo)
- ⏳ Facturas (próximo)
- ⏳ Middleware (próximo)

### Ejecutar Tests
```bash
npm test                      # Todos
npm run test:auth            # Autenticación
npm test -- --coverage       # Con cobertura
npm run test:watch          # Modo watch
```

---

## 📊 Planes de Precios

Generados con `npm run seed:pricing`:

| Plan | Tipo | Precio | Roles Aplicables |
|------|------|--------|------------------|
| Tarifa Estándar | hourly | Q2.50/hr | Student, Visitor |
| Tarifa Personal | monthly | Q150/mes | Faculty |
| Tarifa VIP | monthly | Q300/mes | Admin, Faculty |
| Promoción Invierno | hourly | Q1.50/hr | Todos (temporal) |

---

## 🚀 Despliegue

### Desarrollo
```bash
npm install
npm run dev
```

### Testing
```bash
npm test
```

### Docker (Recomendado)
```bash
npm run docker:up
docker-compose exec api npm run seed:all
```

### Producción
Ver **[DEPLOYMENT.md](DEPLOYMENT.md)** para:
- Setup en servidor Linux
- Nginx como reverse proxy
- SSL/TLS con Let's Encrypt
- Backups automatizados
- Monitoreo

---

## 📈 Métricas v1.1.0

| Métrica | Valor |
|---------|-------|
| Tests implementados | 8+ |
| Cobertura de código | 50%+ |
| Seeders | 3 |
| Documentación | 7 archivos |
| Scripts npm | 14 comandos |
| Usuarios de prueba | 5 |
| Planes de precios | 4 |

---

## 🔗 Enlaces Rápidos

### Documentación
- [README](README.md) - Introducción
- [QUICKSTART](QUICKSTART.md) - 5 minutos
- [SECURITY](SECURITY.md) - Seguridad
- [TESTING](TESTING.md) - Testing
- [DEPLOYMENT](DEPLOYMENT.md) - Producción
- [CHANGELOG](CHANGELOG.md) - Cambios

### Código
- [Controladores](src/controllers/)
- [Modelos](src/models/)
- [Rutas](src/routes/)
- [Middleware](src/middleware/)
- [Tests](https://github.com/your-org/TesisProyect/tree/__tests__)

### Recursos
- [API Docs](http://localhost:3000/api-docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express Docs](https://expressjs.com/)
- [JWT Docs](https://jwt.io/)

---

## 🆘 Soporte

### Problemas Comunes
1. **"Connection refused"** → `npm run docker:up`
2. **"Tests fallan"** → `npm test -- --clearCache`
3. **"Port in use"** → Cambiar PORT en .env

### Más Información
- Ver [QUICKSTART.md](QUICKSTART.md) para troubleshooting
- Ver [SECURITY.md](SECURITY.md) para seguridad
- Ver [TESTING.md](TESTING.md) para testing
- Ver [DEPLOYMENT.md](DEPLOYMENT.md) para producción

---

## 📞 Contacto

Para preguntas sobre el proyecto:
- 📧 Email: development@miumg.edu.gt
- 🔗 GitHub: (agregar URL)
- 📋 Issues: (agregar URL)

---

**Proyecto**: Sistema de Gestión de Parqueo UMG
**Versión**: 1.1.0
**Última actualización**: 12 de enero de 2026
**Estado**: ✅ En desarrollo activo
