# 🅿️ Sistema de Gestión de Parqueo UMG — API REST v2.0

Sistema completo de gestión de parqueo desarrollado con **Node.js, Express 5 y PostgreSQL (Sequelize)**. Permite el control de entrada, pago y salida de vehículos con autenticación JWT, roles de usuario, solvencia mensual para estudiantes e integración con dispositivos IoT.

[![Node.js](https://img.shields.io/badge/Node.js-22+-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://postgresql.org)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey)](https://expressjs.com)

---

## 🚀 Características

- ✅ Autenticación JWT con **Access Token (1h) + Refresh Token (7d)**
- ✅ Login con **Google OAuth 2.0**
- ✅ Sistema de **5 roles**: `admin`, `guard`, `faculty`, `student`, `visitor`
- ✅ **Solvencia mensual** para estudiantes (control de pago de cuota de parqueo)
- ✅ Gestión de espacios de parqueo en **tiempo real** (Socket.io)
- ✅ Cálculo automático de tarifas por tiempo (motor de precios)
- ✅ **Validación de pago** obligatoria antes de salida
- ✅ Apertura de barreras por **MQTT** (modo simulación disponible)
- ✅ **IoT LPR** — reconocimiento de placas con autenticación por API Key
- ✅ **Swagger UI** interactivo en `/api-docs`
- ✅ Rate limiting distribuido con **Redis**
- ✅ Middleware de **idempotencia** para evitar requests duplicados
- ✅ **Auditoría** de eventos en PostgreSQL
- ✅ Logging profesional con **Winston**
- ✅ Tests con **Jest + Supertest**

---

## 📋 Requisitos Previos

| Tecnología | Versión mínima |
|---|---|
| Node.js | 18+ |
| PostgreSQL | 14+ |
| Redis / Memurai | 6+ |
| npm | 8+ |

---

## 🛠️ Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/CarmennLopez/ParqueoTesis.git
cd ParqueoTesis
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear base de datos en PostgreSQL

```sql
-- En psql o pgAdmin:
CREATE DATABASE parking_db;
```

### 4. Configurar variables de entorno

```bash
# Copiar plantilla
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=clave_aleatoria_minimo_32_chars
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_URL=redis://localhost:6379

# IoT (cámaras LPR)
IOT_API_KEY=clave-secreta-iot

# Configuración
NODE_ENV=development
PORT=3000
PARKING_LOT_NAME=Parqueo Principal UMG
MQTT_SIMULATION_MODE=true
```

### 5. Iniciar el servidor

```bash
npm run dev
```

Las tablas se crean automáticamente con `sync({ alter: true })` al arrancar.

### 6. Poblar datos de prueba (opcional)

```bash
node seeders/seedUsers.js         # Usuarios de prueba
node seeders/seedPricingPlans.js  # Planes de precios
node seeders/seedParkingLots.js   # Lotes de parqueo
```

---

## 📖 Documentación Interactiva

Con el servidor corriendo, abre:

**http://localhost:3000/api-docs**

Swagger UI muestra todos los endpoints con ejemplos de request/response y permite probarlos directamente.

> Ver también: [`SWAGGER_GUIDE.md`](./SWAGGER_GUIDE.md) para flujos de prueba paso a paso.

---

## 📚 Endpoints Principales

### Auth — `/api/auth`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/register` | Registrar usuario | Público |
| POST | `/login` | Iniciar sesión | Público |
| POST | `/google` | Login con Google | Público |
| POST | `/refresh` | Renovar access token | Público |
| POST | `/logout` | Cerrar sesión | JWT |
| GET | `/me` | Ver perfil propio | JWT |

### Parqueo — `/api/parking`

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/lots` | Ver parqueos disponibles | JWT |
| POST | `/assign` | Entrar al parqueo | JWT + Solvencia* |
| POST | `/pay` | Pagar tarifa | JWT |
| POST | `/release` | Salir del parqueo | JWT |
| GET | `/status` | Estado del sistema | admin |
| GET | `/admin/active-vehicles` | Vehículos activos | admin, guard |
| POST | `/admin/assign` | Asignar manualmente | admin, guard |
| POST | `/admin/release` | Liberar manualmente | admin, guard |

*`/assign` requiere solvencia solo para rol `student`.

### Solvencia — `/api/parking/solvency`

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| PUT | `/:userId` | Marcar usuario como solvente | admin, guard |
| GET | `/:cardId` | Consultar solvencia por carné | admin, guard, student, faculty |
| GET | `/solvency-report` | Reporte de solvencia | admin |

### IoT — `/api/iot`

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/lpr/event` | Evento de cámara LPR | `X-IoT-Api-Key` header |

### Facturas — `/api/invoices`

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/generate` | Generar factura | JWT |
| GET | `/my` | Mis facturas | JWT |
| GET | `/:id/pdf` | Descargar PDF | JWT |

---

## 👥 Roles y Permisos

| Rol | Puede entrar al parqueo | Requiere solvencia | Puede abrir barrera | Admin |
|---|:---:|:---:|:---:|:---:|
| `student` | ✅ | ✅ | ❌ | ❌ |
| `faculty` | ✅ | ❌ | ❌ | ❌ |
| `visitor` | ✅ | ❌ | ❌ | ❌ |
| `guard` | ✅ | ❌ | ✅ | Parcial |
| `admin` | ✅ | ❌ | ✅ | ✅ |

---

## 🔒 Seguridad

- **JWT** con access token de corta vida (1h) + refresh token (7d) con rotación
- **Helmet** — headers HTTP seguros
- **CORS** — orígenes configurables via `ALLOWED_ORIGINS`
- **Rate Limiting** — login: 5 intentos/15min · pay: 3/min (Redis distribuido)
- **Idempotencia** — previene requests duplicados en operaciones críticas
- **IoT API Key** — header `X-IoT-Api-Key` requerido en endpoints IoT
- **Bcrypt** — contraseñas hasheadas (salt rounds 10)
- **Auditoría** — todos los eventos importantes se registran en `audit_logs`

---

## 📁 Estructura del Proyecto

```
TesisProyect/
├── src/
│   ├── config/
│   │   ├── constants.js          # Roles, tarifas, solvencia
│   │   ├── database.js           # Conexión Sequelize/PostgreSQL
│   │   ├── logger.js             # Winston
│   │   ├── swagger.js            # OpenAPI 3.0 spec
│   │   └── redis/                # Caché, rate limit, idempotencia
│   ├── controllers/
│   │   ├── auth/                 # register, login, google, profile, token
│   │   ├── parking/              # assignment, payment, query, admin, solvency
│   │   ├── iot/                  # lpr.controller
│   │   ├── invoiceController.js
│   │   └── healthController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT protect
│   │   ├── roleMiddleware.js     # authorize(roles)
│   │   ├── solvencyMiddleware.js # checkSolvency
│   │   ├── iotAuthMiddleware.js  # validateIotApiKey
│   │   ├── rateLimitMiddleware.js
│   │   ├── idempotencyMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── user.js               # isSolvent, solvencyExpires incluidos
│   │   ├── ParkingLot.js         # location como JSONB
│   │   ├── ParkingSpace.js
│   │   ├── PricingPlan.js
│   │   ├── Invoice.js
│   │   ├── AuditLog.js
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── parkingRoutes.js      # incluye rutas de solvencia
│   │   ├── iotRoutes.js
│   │   ├── invoiceRoutes.js
│   │   └── healthRoutes.js
│   ├── services/
│   │   ├── mqttService.js        # MQTT (modo simulación)
│   │   └── socketService.js      # Socket.io tiempo real
│   └── utils/
│       ├── auditLogger.js
│       ├── pricingEngine.js
│       └── tokenUtils.js
├── seeders/                      # Scripts de datos iniciales
│   ├── seedUsers.js
│   ├── seedPricingPlans.js
│   └── seedParkingLots.js
├── __tests__/
│   ├── auth.test.js
│   └── setup.js
├── logs/                         # Generado automáticamente
├── .env                          # Variables locales (NO versionar)
├── .env.example                  # Plantilla
├── SWAGGER_GUIDE.md              # Guía de pruebas en Swagger
├── INSTALL.md                    # Guía de instalación detallada
├── TESTING.md                    # Guía de testing
├── VERIFICATION.md               # Lista de verificación
├── package.json
└── server.js
```

---

## 🧪 Testing

```bash
npm test              # Todos los tests
npm run test:watch    # Modo watch
npm test -- --coverage  # Con cobertura de código
```

---

## 📝 Scripts Disponibles

```bash
npm start                           # Producción
npm run dev                         # Desarrollo (nodemon)
npm test                            # Tests Jest
node seeders/seedUsers.js           # Poblar usuarios
node seeders/seedPricingPlans.js    # Poblar planes de precios
node seeders/seedParkingLots.js     # Poblar lotes de parqueo
```

---

## 🐛 Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| `password authentication failed` | `DB_PASSWORD` incorrecto en `.env` | Corregir contraseña en `.env` |
| `EADDRINUSE :::3000` | Puerto 3000 ocupado | `taskkill /F /IM node.exe` o cambiar `PORT` |
| `no existe el tipo «geometry»` | PostGIS no instalado | Ya corregido — ahora usa JSONB |
| `Redis connection failed` | Redis no está corriendo | Iniciar Memurai: `net start Memurai` |
| `401 Unauthorized` | Token JWT expirado | Usar `POST /api/auth/refresh` |
| `402 SOLVENCY_REQUIRED` | Estudiante sin solvencia | Admin debe ejecutar `PUT /api/parking/solvency/:userId` |

---

## 📄 Licencia

ISC

## 👤 Autora

**Carmen Lopez** — Proyecto de Tesis UMG

---

**Versión:** 2.0.0 | **Última actualización:** Febrero 2026
