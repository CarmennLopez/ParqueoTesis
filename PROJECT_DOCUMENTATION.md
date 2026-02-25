# 📚 Documentación del Proyecto — API de Parqueo UMG

> **Versión:** 2.0.0 · **Stack:** Node.js + Express 5 + PostgreSQL + Sequelize + Redis + Socket.io + MQTT  
> **Autor:** Carmen Lopez · **Actualizado:** 2026-02-24

---

## Índice

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Archivos](#3-estructura-de-archivos)
4. [Variables de Entorno (.env)](#4-variables-de-entorno-env)
5. [Roles de Usuario](#5-roles-de-usuario)
6. [Autenticación (JWT + Refresh Tokens)](#6-autenticación-jwt--refresh-tokens)
7. [Endpoints — Referencia Completa](#7-endpoints--referencia-completa)
   - [Auth — `/api/auth`](#71-auth----apiauth)
   - [Parking — `/api/parking`](#72-parking----apiparking)
   - [Invoices — `/api/invoices`](#73-invoices----apiinvoices)
   - [IoT — `/api/iot`](#74-iot----apiiot)
   - [Health — `/health`](#75-health----health)
8. [Modelos de Base de Datos](#8-modelos-de-base-de-datos)
9. [Middleware](#9-middleware)
10. [Flujo de Negocio Principal](#10-flujo-de-negocio-principal)
11. [Controladores — Responsabilidades](#11-controladores--responsabilidades)
12. [Servicios Externos](#12-servicios-externos)
13. [Rate Limiting](#13-rate-limiting)
14. [Scripts Disponibles](#14-scripts-disponibles)
15. [Estado de Implementación](#15-estado-de-implementación)

---

## 1. Descripción General

API REST para un **Sistema de Gestión de Parqueo Universitario** (Tesis UMG). Permite:

- Registro e inicio de sesión de usuarios universitarios (incluyendo Google Auth para cuentas `@miumg.edu.gt`)
- Asignación y liberación de espacios de parqueo en múltiples lotes
- Pago de tarifa (motor de precios por horas)
- Panel de administración y de garita (guard)
- Integración con IoT via **MQTT** (cámaras LPR — reconocimiento de placas)
- Tiempo real con **Socket.io**
- Generación de facturas (con soporte FEL)
- Historial de auditoría

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Runtime | Node.js + Express 5 |
| Base de Datos | PostgreSQL + Sequelize 6 |
| Caché | Redis (ioredis) |
| Autenticación | JWT (access 1h) + Refresh Token (7 días) + Redis |
| Google Auth | `google-auth-library` (solo cuentas `@miumg.edu.gt`) |
| Tiempo Real | Socket.io |
| IoT | MQTT (broker externo) + API Key (`X-IoT-Api-Key`) |
| Seguridad | Helmet, CORS, Rate Limiting, Idempotency Middleware |
| Logging | Winston + DailyRotateFile |
| PDF / Facturas | pdf-lib |
| Validación | express-validator |
| Documentación | Swagger UI (`/api-docs`) |

---

## 3. Estructura de Archivos

```
TesisProyect/
├── server.js                  # Entry point (HTTP + Socket.io)
├── seeders/                   # Seeders específicos
│   ├── seedUsers.js
│   ├── seedPricingPlans.js
│   ├── seedParkingLots.js
│   ├── checkData.js
│   ├── createStudentUser.js
│   ├── resetStudentPassword.js
│   └── updateCoordinates.js
└── src/
    ├── app.js                 # Configuración Express (rutas, middleware)
    ├── config/
    │   ├── constants.js       # Roles, tarifas, JWT expiry
    │   ├── database.js        # Conexión Sequelize/PostgreSQL
    │   ├── redis/             # Cliente Redis (getCache/setCache/deleteCache)
    │   ├── logger.js          # Winston logger
    │   └── swagger.js         # Configuración Swagger UI (/api-docs)
    ├── models/
    │   ├── index.js           # Asociaciones entre modelos
    │   ├── user.js            # isSolvent, solvencyExpires incluidos
    │   ├── ParkingLot.js      # location como JSONB (GeoJSON)
    │   ├── ParkingSpace.js
    │   ├── PricingPlan.js
    │   ├── Invoice.js
    │   └── AuditLog.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── parkingRoutes.js   # Incluye rutas de solvencia
    │   ├── invoiceRoutes.js
    │   ├── iotRoutes.js       # Protegido con X-IoT-Api-Key
    │   └── healthRoutes.js
    ├── controllers/
    │   ├── auth/
    │   │   ├── index.js
    │   │   ├── login.controller.js
    │   │   ├── register.controller.js
    │   │   ├── token.controller.js
    │   │   ├── profile.controller.js
    │   │   └── google.controller.js
    │   ├── parking/
    │   │   ├── index.js
    │   │   ├── assignment.controller.js   # assign, release, guard assign/release
    │   │   ├── payment.controller.js      # payParking
    │   │   ├── query.controller.js        # lots, status, active vehicles
    │   │   ├── simulation.controller.js   # fill, empty (demo)
    │   │   ├── admin.controller.js        # CRUD lotes, usuarios, revenue
    │   │   └── solvency.controller.js     # updateSolvency, checkSolvency, report
    │   ├── iot/
    │   │   └── lpr.controller.js          # Eventos de cámara LPR
    │   ├── invoiceController.js
    │   └── healthController.js
    ├── middleware/
    │   ├── authMiddleware.js        # protect (JWT)
    │   ├── authorize.js             # authorize(...roles)
    │   ├── roleMiddleware.js        # authorize (alias)
    │   ├── rateLimitMiddleware.js   # distributedRateLimit Redis
    │   ├── solvencyMiddleware.js    # checkSolvency — aplicado en POST /assign
    │   ├── iotAuthMiddleware.js     # validateIotApiKey (X-IoT-Api-Key)
    │   ├── idempotencyMiddleware.js
    │   ├── versionMiddleware.js
    │   ├── errorHandler.js
    │   ├── validationMiddleware.js
    │   └── validators/
    │       └── authValidators.js
    ├── services/
    │   ├── mqttService.js
    │   └── socketService.js
    └── utils/
        ├── tokenUtils.js       # generateAccessToken, generateRefreshToken, etc.
        ├── auditLogger.js
        ├── pricingEngine.js    # calculateCost()
        └── helpers.js
```

---

## 4. Variables de Entorno (.env)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno | `development` |
| `DB_HOST` | Host PostgreSQL | `localhost` |
| `DB_PORT` | Puerto PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la BD | `parking_db` |
| `DB_USER` | Usuario BD | `postgres` |
| `DB_PASSWORD` | Contraseña BD | `secret` |
| `JWT_SECRET` | Secreto Access Token | `your_jwt_secret` |
| `JWT_EXPIRATION` | Duración access token | `1h` |
| `JWT_REFRESH_EXPIRATION` | Duración refresh token | `7d` |
| `REDIS_URL` | URL de Redis | `redis://localhost:6379` |
| `ALLOWED_ORIGINS` | CORS (separados por coma) | `http://localhost:3000` |
| `IOT_API_KEY` | Clave para dispositivos IoT | `iot-key-umg-2026` |
| `PARKING_LOT_NAME` | Nombre lote principal (IoT) | `Parqueo Principal` |
| `GOOGLE_CLIENT_ID` | Client ID para Google Auth | `xxx.apps.googleusercontent.com` |
| `MQTT_BROKER_URL` | URL broker MQTT | `mqtt://localhost:1883` |
| `MQTT_SIMULATION_MODE` | Simular MQTT sin hardware | `true` |

---

## 5. Roles de Usuario

| Rol | Descripción | Solvencia requerida |
|---|---|:---:|
| `admin` | Acceso total al sistema | ❌ |
| `guard` | Operador de garita — asignar/liberar, ver vehículos activos | ❌ |
| `faculty` | Personal docente/administrativo | ❌ |
| `student` | Estudiantes activos (rol por defecto al registrar) | ✅ |
| `visitor` | Visitantes externos | ❌ |

---

## 6. Autenticación (JWT + Refresh Tokens)

### Flujo de Tokens
1. **Login/Register** → devuelve `accessToken` (1h) + `refreshToken` (7 días).
2. El **accessToken** se incluye en el header `Authorization: Bearer <token>` en cada request protegido.
3. Cuando el accessToken expira, se llama a `POST /api/auth/refresh` con el `refreshToken`.
4. El sistema genera **nuevos tokens** y revoca el anterior (rotación).

### Header requerido en rutas protegidas
```
Authorization: Bearer <accessToken>
```

### IoT — Autenticación por API Key
Las rutas `/api/iot/*` no usan JWT sino un header dedicado:
```
X-IoT-Api-Key: <IOT_API_KEY del .env>
```

---

## 7. Endpoints — Referencia Completa

### 7.1 Auth — `/api/auth`

#### `POST /api/auth/register`
**Body:**
```json
{
  "name": "Carmen Lopez",
  "email": "clopez@miumg.edu.gt",
  "password": "Password1",
  "cardId": "9999-2024",
  "vehiclePlate": "ABC1234",
  "role": "student"
}
```
**Respuesta 201:** usuario + `accessToken` + `refreshToken`

---

#### `POST /api/auth/login`
**Rate limit:** 5 intentos / 15 min.

**Body:**
```json
{ "email": "clopez@miumg.edu.gt", "password": "Password1" }
```
**Respuesta 200:** usuario + `accessToken` + `refreshToken`

---

#### `POST /api/auth/refresh`
**Body:** `{ "refreshToken": "eyJ..." }`  
**Respuesta 200:** `{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }`

---

#### `POST /api/auth/logout`
**Body:** `{ "refreshToken": "eyJ..." }`  
**Respuesta 200:** `{ "message": "Sesión cerrada exitosamente" }`

---

#### `GET /api/auth/me` 🔒
Devuelve perfil del usuario autenticado. Usa caché Redis (60 s).

---

#### `POST /api/auth/google`
Login con Google — **Solo cuentas `@miumg.edu.gt`**.  
**Body:** `{ "idToken": "<Google ID Token>" }`

---

#### `POST /api/auth/switch-role` 🔒
Cambia rol del usuario autenticado (testing/demo).  
**Body:** `{ "role": "admin" }` → devuelve nuevos tokens.

---

### 7.2 Parking — `/api/parking`

Todas requieren `Authorization: Bearer <token>`.

---

#### `GET /api/parking/lots` 🔒
Lista todos los lotes con estado de espacios.

---

#### `POST /api/parking/assign` 🔒
Entrada al parqueo. **Requiere solvencia para rol `student`.**

**Body:** `{ "parkingLotId": 1 }`

**Respuesta 200:**
```json
{
  "message": "Espacio asignado con éxito",
  "parkingLot": "Parqueo Principal",
  "space": 5,
  "entryTime": "2026-02-24T18:00:00.000Z"
}
```

**Error si sin solvencia → `402`:**
```json
{ "error": "SOLVENCY_REQUIRED", "message": "El estudiante no tiene solvencia vigente." }
```

---

#### `POST /api/parking/pay` 🔒
Pago de tarifa (Q2.50/hora por defecto).  
**Rate limit:** 3 intentos / 60 s.

**Respuesta 200:**
```json
{ "message": "Pago realizado con éxito", "amount": 5.00, "space": 5 }
```

---

#### `POST /api/parking/release` 🔒
Salida del parqueo. Abre barrera vía MQTT.  
Requiere haber pagado primero (`hasPaid = true`).

---

#### `GET /api/parking/status` 🔒
Estado de ocupación. Caché Redis 5 s.  
**Acceso:** `admin`, `guard`, `faculty` · **Query:** `?parkingLotId=1`

---

#### `GET /api/parking/guard/active-vehicles` 🔒
Vehículos activos con tiempo transcurrido y costo estimado.  
**Acceso:** `guard`, `admin`

---

#### `POST /api/parking/guard/assign` 🔒
Asignar espacio a usuario por placa o email.  
**Acceso:** `guard`, `admin`

**Body:** `{ "parkingLotId": 1, "vehiclePlate": "XYZ9876" }`

---

#### `POST /api/parking/guard/release` 🔒
Liberar forzosamente espacio de cualquier usuario.  
**Acceso:** `guard`, `admin` · **Body:** `{ "userId": 2 }`

---

#### `POST /api/parking/admin/lots` 🔒
Crear lote con espacios. **Acceso:** `admin`

**Body:** `{ "name": "Parqueo Norte", "latitude": 14.64, "longitude": -90.51, "totalSpaces": 30 }`

---

#### `PATCH /api/parking/admin/lots/:id` 🔒
Actualizar lote. **Acceso:** `admin`

#### `DELETE /api/parking/admin/lots/:id` 🔒
Eliminar lote (solo si sin espacios ocupados). **Acceso:** `admin`

#### `GET /api/parking/admin/users` 🔒
Listar todos los usuarios. **Acceso:** `admin`

#### `PATCH /api/parking/admin/users/:id/role` 🔒
Cambiar rol de un usuario. **Body:** `{ "role": "guard" }` **Acceso:** `admin`

#### `GET /api/parking/admin/stats/revenue` 🔒
Estadísticas de ingresos estimados. **Acceso:** `admin`

---

### Solvencia — `/api/parking/solvency`

#### `PUT /api/parking/solvency/:userId` 🔒
Marcar usuario como solvente. Si ya tiene solvencia vigente, la **extiende**.  
**Acceso:** `admin`, `guard`

**Body:** `{ "months": 1 }` (default 1, rango 1-12)

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Solvencia actualizada correctamente por 1 mes(es)",
  "user": {
    "id": 2, "name": "Juan Pérez", "cardId": "9999-2024",
    "isSolvent": true, "solvencyExpires": "2026-03-24T18:00:00.000Z"
  }
}
```

---

#### `GET /api/parking/solvency/:cardId` 🔒
Consultar solvencia por **carné universitario**.  
**Acceso:** `admin`, `guard`, `student`, `faculty`

**Respuesta 200:**
```json
{
  "success": true,
  "solvency": {
    "isSolvent": true,
    "solvencyExpires": "2026-03-24T18:00:00.000Z",
    "daysRemaining": 28,
    "status": "VIGENTE (28 días restantes)"
  }
}
```
> Roles exentos devuelven `status: "EXEMPT"`.

---

#### `GET /api/parking/solvency-report` 🔒
Reporte de solvencia de todos los estudiantes. **Acceso:** `admin`

**Respuesta 200:**
```json
{
  "summary": { "total": 50, "solvent": 38, "expired": 12 },
  "data": [{ "id": 2, "name": "Juan", "cardId": "9999-2024", "isSolvent": true, "daysRemaining": 28 }]
}
```

---

### 7.3 Invoices — `/api/invoices`

#### `POST /api/invoices/generate` 🔒
Genera una factura para el usuario autenticado.

#### `GET /api/invoices/my` 🔒
Lista facturas del usuario autenticado.

#### `GET /api/invoices/:id/pdf` 🔒
Descarga el PDF de una factura.

---

### 7.4 IoT — `/api/iot`

> Requiere header `X-IoT-Api-Key: <IOT_API_KEY>` (no JWT).

#### `POST /api/iot/lpr/event`
Recibe eventos de cámaras LPR (reconocimiento de placas).

**Body:**
```json
{
  "plate": "ABC1234",
  "cameraLocation": "entrada",
  "timestamp": "2026-02-24T18:00:00.000Z"
}
```

- `cameraLocation` con `entry`/`entrada` → abre barrera + asigna espacio
- `cameraLocation` con `exit`/`salida` → verifica pago + abre barrera de salida
- Placa no registrada → `action: "DENY"`

**Respuesta 200:**
```json
{ "success": true, "plate": "ABC1234", "action": "OPEN_GATE", "message": "Bienvenido" }
```

---

### 7.5 Health — `/health`

Sin autenticación. Para load balancers y Docker healthchecks.

| Endpoint | Descripción |
|---|---|
| `GET /health` | Estado general (DB + Redis) |
| `GET /health/liveness` | ¿Está vivo el proceso? |
| `GET /health/readiness` | ¿Puede recibir tráfico? |

---

## 8. Modelos de Base de Datos

### `users`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Nombre completo |
| `email` | STRING UNIQUE | Email universitario |
| `password` | STRING | Hasheado con bcrypt (salt=10) |
| `role` | STRING | `admin`, `guard`, `faculty`, `student`, `visitor` |
| `cardId` | STRING UNIQUE | Carné universitario |
| `vehiclePlate` | STRING UNIQUE | Placa del vehículo |
| `hasPaid` | BOOLEAN | Si pagó en la sesión actual |
| `currentParkingSpaceId` | INTEGER FK | Espacio asignado actualmente |
| `entryTime` | DATETIME | Hora de entrada |
| `lastPaymentAmount` | DECIMAL(10,2) | Último monto pagado |
| `refreshTokenVersion` | INTEGER | Para invalidación de tokens |
| `isSolvent` | BOOLEAN | Solvencia mensual vigente |
| `solvencyExpires` | DATETIME | Fecha de vencimiento de solvencia |
| `solvencyUpdatedBy` | INTEGER | ID del admin que actualizó |

---

### `parking_lots`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | STRING UNIQUE | Nombre del lote |
| `location` | JSONB | GeoJSON `{ type: "Point", coordinates: [lng, lat] }` |
| `totalSpaces` | INTEGER | Capacidad total |
| `availableSpaces` | INTEGER | Espacios disponibles |

---

### `parking_spaces`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `parkingLotId` | INTEGER FK | Lote al que pertenece |
| `spaceNumber` | INTEGER | Número del espacio |
| `isOccupied` | BOOLEAN | Estado del espacio |
| `entryTime` | DATETIME | Hora en que fue ocupado |
| `occupiedByUserId` | INTEGER FK | Usuario que lo ocupa |

---

### `pricing_plans`

| Campo | Tipo | Valores |
|---|---|---|
| `code` | STRING UNIQUE | `STANDARD_HOURLY`, `FACULTY_MONTHLY`, etc. |
| `type` | STRING | `HOURLY`, `FLAT_FEE`, `SUBSCRIPTION` |
| `baseRate` | DECIMAL(10,2) | Tarifa en GTQ |
| `billingInterval` | STRING | `HOUR`, `DAY`, `MONTH`, `ONE_TIME` |
| `rules` | JSONB | `gracePeriodMinutes`, `maxDailyCap`, `weekendMultiplier` |

---

### `invoices`

| Campo | Tipo | Notas |
|---|---|---|
| `invoiceNumber` | STRING UNIQUE | Ej: `INV-1708816800000` |
| `userId` | INTEGER FK | |
| `amount` | DECIMAL(10,2) | |
| `status` | STRING | `ISSUED`, `PAID`, `CANCELLED`, `FAILED` |
| `felData` | JSONB | Datos de factura electrónica |
| `items` | JSONB | Array de ítems `[{description, amount}]` |

---

### `audit_logs`

Registra todos los eventos: `LOGIN`, `REGISTER`, `ASSIGN_SPACE`, `PAYMENT`, `RELEASE_SPACE`, `SOLVENCY_UPDATE`, etc.

---

## 9. Middleware

| Middleware | Función |
|---|---|
| `protect` | Verifica JWT. Puebla `req.userId` y `req.userRole` |
| `authorize(...roles)` | Restringe acceso por rol |
| `checkSolvency` | Bloquea estudiantes sin solvencia en `POST /assign` |
| `validateIotApiKey` | Valida `X-IoT-Api-Key` en rutas IoT |
| `distributedRateLimit` | Rate limit distribuido con Redis |
| `idempotency` | Previene requests duplicados |
| `versionMiddleware` | Agrega header `X-API-Version: 2.0.0` |
| `errorHandler` | Manejador global de errores |
| `handleValidationErrors` | Procesa errores de `express-validator` |

---

## 10. Flujo de Negocio Principal

### Flujo de Usuario (Student/Faculty/Visitor)
```
1. POST /api/auth/register       → Crear cuenta
2. POST /api/auth/login          → Obtener accessToken + refreshToken
3. GET  /api/parking/lots        → Ver parqueos disponibles
4. POST /api/parking/assign      → Entrar (requiere solvencia si es student)
5. POST /api/parking/pay         → Pagar tarifa
6. POST /api/parking/release     → Salir (requiere haber pagado)
```

### Flujo de Guard
```
1. POST /api/auth/login (role: guard)
2. GET  /api/parking/guard/active-vehicles  → Ver vehículos activos
3. POST /api/parking/guard/assign           → Asignar por placa/email
4. POST /api/parking/guard/release          → Liberar por userId
5. PUT  /api/parking/solvency/:userId       → Marcar solvencia
```

### Flujo de Admin
```
1. POST /api/auth/login (role: admin)
2. POST /api/parking/admin/lots              → Crear lote
3. PATCH /api/parking/admin/lots/:id         → Modificar lote
4. GET  /api/parking/admin/users             → Ver usuarios
5. PATCH /api/parking/admin/users/:id/role   → Cambiar rol
6. GET  /api/parking/admin/stats/revenue     → Estadísticas
7. GET  /api/parking/solvency-report         → Reporte solvencia
```

### Flujo IoT (Cámara LPR)
```
1. Cámara detecta placa
2. POST /api/iot/lpr/event (header: X-IoT-Api-Key)
3. API identifica usuario por vehiclePlate
4. Si entrada → asigna espacio + abre barrera
5. Si salida → verifica pago + abre barrera
```

---

## 11. Controladores — Responsabilidades

| Archivo | Funciones |
|---|---|
| `auth/register.controller.js` | `register` |
| `auth/login.controller.js` | `login`, `logout` |
| `auth/token.controller.js` | `refreshToken` |
| `auth/profile.controller.js` | `getMe`, `switchRole` |
| `auth/google.controller.js` | `googleLogin` |
| `parking/assignment.controller.js` | `assignSpace`, `releaseSpace`, `guardAssignSpace`, `guardReleaseSpace` |
| `parking/payment.controller.js` | `payParking` |
| `parking/query.controller.js` | `getParkingLots`, `getParkingStatus`, `getActiveVehicles` |
| `parking/simulation.controller.js` | `simulateFill`, `simulateEmpty` |
| `parking/admin.controller.js` | `createParkingLot`, `updateParkingLot`, `deleteParkingLot`, `getUsers`, `updateUserRole`, `getRevenueStats` |
| `parking/solvency.controller.js` | `updateSolvency`, `checkSolvencyByCardId`, `getSolvencyReport` |
| `iot/lpr.controller.js` | `handleLprEvent` |
| `invoiceController.js` | `generateInvoice`, `getMyInvoices`, `getInvoicePdf` |
| `healthController.js` | `livenessProbe`, `readinessProbe`, `standardHealth` |

---

## 12. Servicios Externos

### MQTT (`mqttService.js`)
- Función principal: `openGate(gateId, userId)` — publica en topic MQTT para abrir la barrera.
- Llamado desde: `releaseSpace`, `guardReleaseSpace`, `lpr.controller`.
- **Modo simulación:** `MQTT_SIMULATION_MODE=true` — no requiere broker real.

### Socket.io (`socketService.js`)
- `emitParkingStatus(data)` — actualiza estado del parqueo en tiempo real.
- `notifyUser(userId, event, data)` — notificación personal.

### Redis (`config/redis/`)
- `getCache(key)` / `setCache(key, value, ttl)` / `deleteCache(key)`.
- Caché: perfil de usuario (60 s), estado de parqueo (5 s), idempotencia, rate limiting.

---

## 13. Rate Limiting

| Ruta | Límite | Ventana |
|---|---|---|
| `POST /api/auth/login` | 5 intentos | 15 minutos |
| `POST /api/parking/pay` | 3 intentos | 60 segundos |
| `POST /api/parking/gate/open` | 5 aperturas | 60 segundos |

---

## 14. Scripts Disponibles

```bash
npm start                          # Producción
npm run dev                        # Desarrollo con nodemon
npm test                           # Jest con cobertura
npm run test:auth                  # Solo tests de autenticación
node seeders/seedUsers.js          # Usuarios de prueba (5 roles)
node seeders/seedPricingPlans.js   # Planes de precios
node seeders/seedParkingLots.js    # Lotes + espacios
node seeders/checkData.js          # Verificar datos en BD
npm run docker:build
npm run docker:up
npm run docker:down
```

---

## 15. Estado de Implementación

### ✅ Completamente implementado y funcional

- Autenticación JWT + Refresh Token (rotación) + Google OAuth
- Registro / Login / Logout / Perfil / Switch-Role
- CRUD completo de lotes de parqueo (admin)
- Asignación y liberación de espacios (usuario y guard)
- **Pago de tarifa obligatorio antes de salir**
- Panel de guard (vehículos activos, asignación/liberación manual)
- **Solvencia mensual** — rutas activas: `PUT /solvency/:userId`, `GET /solvency/:cardId`, `GET /solvency-report`
- **Middleware `checkSolvency`** aplicado en `POST /api/parking/assign`
- **IoT LPR** protegido con `X-IoT-Api-Key`
- Rate limiting distribuido con Redis
- Idempotencia en operaciones críticas
- Socket.io (actualizaciones en tiempo real)
- MQTT (apertura de barreras, modo simulación disponible)
- Health checks (`/health`, `/health/liveness`, `/health/readiness`)
- Auditoría de eventos en `audit_logs`
- Logging con Winston
- **Swagger UI** en `/api-docs`

### 🔧 Pendiente / Mejoras futuras

- Proteger IoT con firma HMAC + timestamp (anti-replay) en producción
- Completar generación de facturas FEL con proveedor certificado
- Tests unitarios para solvencia, IoT y admin controllers
- Exportar reporte de solvencia a PDF/Excel

---

**Última actualización:** 2026-02-24 | **Versión:** 2.0.0
