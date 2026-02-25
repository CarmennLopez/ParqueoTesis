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
| Base de Datos | PostgreSQL + PostGIS (geometría de puntos GPS) |
| ORM | Sequelize 6 |
| Caché | Redis (ioredis) |
| Autenticación | JWT (access 15 min) + Refresh Token (7 días) + Redis |
| Google Auth | `google-auth-library` (solo cuentas `@miumg.edu.gt`) |
| Tiempo Real | Socket.io |
| IoT | MQTT (broker externo) |
| Seguridad | Helmet, CORS, Rate Limiting, Idempotency Middleware |
| Logging | Winston + DailyRotateFile |
| PDF / Facturas | pdf-lib |
| Validación | express-validator |

---

## 3. Estructura de Archivos

```
TesisProyect/
├── server.js                  # Entry point (HTTP + Socket.io)
├── seed.js                    # Seed principal (parqueos)
├── seeders/                   # Seeders específicos
│   ├── seedUsers.js
│   └── seedPricingPlans.js
└── src/
    ├── app.js                 # Configuración Express (rutas, middleware)
    ├── config/
    │   ├── constants.js       # Roles, tarifas, JWT expiry
    │   ├── database.js        # Conexión Sequelize/PostgreSQL
    │   ├── redis.js           # Cliente Redis (getCache/setCache/deleteCache)
    │   ├── logger.js          # Winston logger
    │   └── swagger.js         # Configuración Swagger (deshabilitado)
    ├── models/
    │   ├── index.js           # Asociaciones entre modelos
    │   ├── user.js
    │   ├── ParkingLot.js
    │   ├── ParkingSpace.js
    │   ├── PricingPlan.js
    │   ├── Invoice.js
    │   └── AuditLog.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── parkingRoutes.js
    │   ├── invoiceRoutes.js
    │   ├── iotRoutes.js
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
    │   │   └── solvency.controller.js     # ⚠️ Implementado pero NO enrutado
    │   ├── iot/
    │   │   └── lpr.controller.js          # Eventos de cámara LPR
    │   ├── invoiceController.js
    │   └── healthController.js
    ├── middleware/
    │   ├── authMiddleware.js      # protect (JWT)
    │   ├── authorize.js           # authorize(...roles)
    │   ├── roleMiddleware.js      # authorize (alias)
    │   ├── rateLimitMiddleware.js # distributedRateLimit Redis
    │   ├── solvencyMiddleware.js  # ⚠️ Implementado pero NO aplicado
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
| `JWT_REFRESH_SECRET` | Secreto Refresh Token | `your_refresh_secret` |
| `REDIS_URL` | URL de Redis | `redis://localhost:6379` |
| `ALLOWED_ORIGINS` | CORS (separados por coma) | `http://localhost:3000` |
| `PARKING_LOT_NAME` | Nombre lote principal (IoT) | `Parqueo Principal` |
| `GOOGLE_CLIENT_ID` | Client ID para Google Auth | `xxx.apps.googleusercontent.com` |
| `MQTT_BROKER_URL` | URL broker MQTT | `mqtt://localhost:1883` |

---

## 5. Roles de Usuario

Los roles son **jerárquicos** y se controlan via el campo `role` en el modelo `User`.

| Rol | Constante | Descripción |
|---|---|---|
| `admin` | `USER_ROLES.ADMIN` | Acceso total al sistema |
| `guard` | `USER_ROLES.GUARD` | Operador de garita — asignar/liberar, ver vehículos activos |
| `faculty` | `USER_ROLES.FACULTY` | Personal docente/administrativo |
| `student` | `USER_ROLES.STUDENT` | Estudiantes activos (rol por defecto) |
| `visitor` | `USER_ROLES.VISITOR` | Visitantes externos |

> Los roles `admin` y `guard` tienen acceso a las rutas administrativas y de garita.

---

## 6. Autenticación (JWT + Refresh Tokens)

### Flujo de Tokens
1. **Login/Register** → devuelve `accessToken` (15 min) + `refreshToken` (7 días).
2. El **accessToken** se incluye en el header `Authorization: Bearer <token>` en cada request protegido.
3. Cuando el accessToken expira, se llama a `POST /api/auth/refresh` con el `refreshToken`.
4. El sistema genera **nuevos tokens** y revoca el anterior (rotación).

### Header requerido en rutas protegidas
```
Authorization: Bearer <accessToken>
```

---

## 7. Endpoints — Referencia Completa

### 7.1 Auth — `/api/auth`

#### `POST /api/auth/register`
Registra un nuevo usuario.

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
> `role` es opcional — por defecto `student`.

**Respuesta 201:**
```json
{
  "_id": 1,
  "name": "Carmen Lopez",
  "email": "clopez@miumg.edu.gt",
  "role": "student",
  "token": "<accessToken>"
}
```

---

#### `POST /api/auth/login`
Inicia sesión. **Rate limit:** 5 intentos / 15 min.

**Body:**
```json
{ "email": "clopez@miumg.edu.gt", "password": "Password1" }
```

**Respuesta 200:**
```json
{
  "_id": 1,
  "name": "Carmen Lopez",
  "email": "clopez@miumg.edu.gt",
  "role": "student",
  "hasPaid": false,
  "currentParkingSpace": null,
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

#### `POST /api/auth/refresh`
Renueva el access token usando el refresh token.

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Respuesta 200:**
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

---

#### `POST /api/auth/logout`
Cierra sesión (revoca el refresh token).

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Respuesta 200:**
```json
{ "message": "Sesión cerrada exitosamente" }
```

---

#### `GET /api/auth/me` 🔒
Devuelve el perfil del usuario autenticado. Usa caché Redis (60 s).

**Respuesta 200:**
```json
{
  "_id": 1, "name": "...", "email": "...", "role": "student",
  "cardId": "...", "vehiclePlate": "...",
  "currentParkingSpace": null, "currentParkingLotId": null,
  "hasPaid": false, "entryTime": null
}
```

---

#### `POST /api/auth/google`
Login con cuenta Google — **Solo acepta** cuentas `@miumg.edu.gt`.

**Body:**
```json
{ "idToken": "<Google ID Token>" }
```

---

#### `POST /api/auth/switch-role` 🔒
Cambia el rol del usuario autenticado (usado en testing/demo).

**Body:**
```json
{ "role": "admin" }
```
> Roles válidos: `admin`, `guard`, `student`, `faculty`, `visitor`.

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Rol cambiado a admin",
  "user": { ... },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### 7.2 Parking — `/api/parking`

Todas las rutas de parqueo requieren autenticación (`Authorization: Bearer <token>`).

---

#### `GET /api/parking/lots` 🔒
Lista todos los lotes de parqueo con estado de cada espacio.

**Respuesta 200:**
```json
{
  "message": "Parqueos disponibles",
  "data": [{
    "id": 1,
    "name": "Parqueo Principal",
    "location": { "type": "Point", "coordinates": [-90.5, 14.6] },
    "totalSpaces": 20,
    "occupiedSpaces": 3,
    "availableSpaces": 17,
    "spaces": [
      { "id": 1, "spaceNumber": 1, "isOccupied": false, "occupiedBy": null, "entryTime": null }
    ]
  }]
}
```

---

#### `POST /api/parking/assign` 🔒
Asigna un espacio libre al usuario (ENTRADA al parqueo).

**Body:**
```json
{ "parkingLotId": 1 }
```

**Respuesta 200:**
```json
{
  "message": "Espacio asignado con éxito",
  "parkingLot": "Parqueo Principal",
  "space": 5,
  "entryTime": "2026-02-24T18:00:00.000Z",
  "info": "Tarifa al salir."
}
```

---

#### `POST /api/parking/pay` 🔒
Paga la tarifa de parqueo en base al tiempo transcurrido desde la entrada.  
**Rate limit:** 3 intentos / 60 s.

> Tarifa base: **Q2.50/hora** (configurable en `constants.js`).  
> Requiere que el usuario tenga un espacio asignado y que **no haya pagado ya**.

**Respuesta 200:**
```json
{
  "message": "Pago realizado con éxito",
  "amount": 5.00,
  "space": 5,
  "details": { "totalAmount": 5.00, "hoursParked": 2, ... }
}
```

---

#### `POST /api/parking/release` 🔒
Libera el espacio (SALIDA del parqueo). También abre la barrera via MQTT.

> ⚠️ **Nota:** La validación de pago previo (`hasPaid`) está **comentada** en el código (`releaseSpace`). Actualmente se puede salir sin pagar.

**Respuesta 200:**
```json
{ "message": "¡Salida exitosa! Espacio 5 liberado." }
```

---

#### `GET /api/parking/status` 🔒
Estado de ocupación de un lote. Usa caché Redis (5 s).  
**Acceso:** `admin`, `guard`, `faculty`

**Query params:** `?parkingLotId=1`

**Respuesta 200:**
```json
{
  "parkingLotId": 1,
  "parkingLotName": "Parqueo Principal",
  "totalSpaces": 20,
  "occupiedSpaces": 3,
  "availableSpaces": 17,
  "occupiedDetails": [
    { "spaceNumber": 5, "occupiedBy": { "name": "Carmen", "email": "...", "vehiclePlate": "ABC1234" }, "entryTime": "..." }
  ]
}
```

---

#### `POST /api/parking/gate/open` 🔒
Abre la barrera del parqueo via MQTT.  
**Acceso:** `admin`, `guard`, `faculty`, `student`  
**Rate limit:** 5 aperturas / 60 s

---

#### `POST /api/parking/simulate/fill` 🔒
Simula llenar el parqueo (para demos/testing).

#### `POST /api/parking/simulate/empty` 🔒
Simula vaciar el parqueo (para demos/testing).

---

#### `GET /api/parking/guard/active-vehicles` 🔒
Lista todos los vehículos actualmente en el parqueo con tiempo transcurrido y costo estimado.  
**Acceso:** `guard`, `admin`

**Respuesta 200:**
```json
{
  "message": "Vehículos activos",
  "data": [{
    "userId": 2,
    "name": "Juan Pérez",
    "email": "jperez@miumg.edu.gt",
    "vehiclePlate": "XYZ9876",
    "parkingLotId": 1,
    "parkingLotName": "Parqueo Principal",
    "space": 3,
    "entryTime": "2026-02-24T15:00:00.000Z",
    "durationMinutes": 75,
    "cost": 3.13
  }]
}
```

---

#### `POST /api/parking/guard/assign` 🔒
El oficial asigna un espacio a un usuario buscado por **placa** o **email**.  
**Acceso:** `guard`, `admin`

**Body:**
```json
{
  "parkingLotId": 1,
  "vehiclePlate": "XYZ9876"
}
```
> También se puede usar `"email": "..."` en lugar de `vehiclePlate`.

---

#### `POST /api/parking/guard/release` 🔒
El oficial libera forzosamente el espacio de cualquier usuario.  
**Acceso:** `guard`, `admin`

**Body:**
```json
{ "userId": 2 }
```

---

#### `POST /api/parking/admin/lots` 🔒
Crea un nuevo lote de parqueo y genera sus espacios individuales automáticamente.  
**Acceso:** `admin`

**Body:**
```json
{
  "name": "Parqueo Norte",
  "latitude": 14.6407,
  "longitude": -90.5133,
  "totalSpaces": 30
}
```

---

#### `PATCH /api/parking/admin/lots/:id` 🔒
Actualiza nombre, coordenadas o capacidad de un lote. Si se reduce capacidad, verifica que los espacios a eliminar no estén ocupados.  
**Acceso:** `admin`

**Body (todos opcionales):**
```json
{ "name": "Nuevo Nombre", "latitude": 14.64, "longitude": -90.51, "totalSpaces": 25 }
```

---

#### `DELETE /api/parking/admin/lots/:id` 🔒
Elimina un lote de parqueo (solo si no tiene espacios ocupados).  
**Acceso:** `admin`

---

#### `GET /api/parking/admin/users` 🔒
Lista todos los usuarios registrados.  
**Acceso:** `admin`

**Respuesta 200:**
```json
{
  "success": true,
  "data": [{ "id": 1, "name": "...", "email": "...", "role": "student", "vehiclePlate": "...", "createdAt": "..." }]
}
```

---

#### `PATCH /api/parking/admin/users/:id/role` 🔒
Cambia el rol de cualquier usuario.  
**Acceso:** `admin`

**Body:**
```json
{ "role": "guard" }
```

---

#### `GET /api/parking/admin/stats/revenue` 🔒
Estadísticas de ingresos estimados (basado en vehículos activos).  
**Acceso:** `admin`

**Respuesta 200:**
```json
{
  "success": true,
  "summary": {
    "activeUsers": 5,
    "estimatedHourlyRevenue": 12.50,
    "simulatedDailyRevenue": "100.00"
  }
}
```

---

### 7.2.x Solvencia — `/api/parking/solvency`

Estas rutas controlan el pago mensual de parqueo (solvencia) de los estudiantes.

---

#### `PUT /api/parking/solvency/:userId` 🔒
Marca a un usuario como solvente por N meses. Si ya tiene solvencia vigente, la **extiende** desde la fecha de vencimiento actual.  
**Acceso:** `admin`, `guard`

**URL param:** `:userId` — ID del usuario a marcar como solvente.

**Body:**
```json
{ "months": 1 }
```
> `months` es opcional — por defecto `1`. Rango válido: 1-12.

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Solvencia actualizada correctamente por 1 mes(es)",
  "user": {
    "id": 2,
    "name": "Juan Pérez",
    "email": "jperez@miumg.edu.gt",
    "cardId": "9999-2024",
    "isSolvent": true,
    "solvencyExpires": "2026-03-24T18:00:00.000Z"
  }
}
```

---

#### `GET /api/parking/solvency/:cardId` 🔒
Consulta el estado de solvencia de un usuario por su **carné universitario**.  
**Acceso:** `admin`, `guard`, `student`, `faculty`

**URL param:** `:cardId` — Carné universitario del alumno.

**Respuesta 200:**
```json
{
  "success": true,
  "user": { "id": 2, "name": "Juan", "email": "...", "role": "student", "cardId": "9999-2024", "vehiclePlate": "XYZ9876", "currentParkingSpace": null },
  "solvency": {
    "isSolvent": true,
    "isExemptRole": false,
    "solvencyExpires": "2026-03-24T18:00:00.000Z",
    "daysRemaining": 28,
    "status": "VIGENTE (28 días restantes)"
  }
}
```
> Roles exentos (`admin`, `guard`, `faculty`, `visitor`) devuelven `status: "EXEMPT"`.

---

#### `GET /api/parking/solvency-report` 🔒
Reporte completo de solvencia de todos los estudiantes registrados.  
**Acceso:** `admin`

**Respuesta 200:**
```json
{
  "success": true,
  "summary": { "total": 50, "solvent": 38, "expired": 12 },
  "data": [
    { "id": 2, "name": "Juan", "cardId": "9999-2024", "isSolvent": true, "daysRemaining": 28, "status": "VIGENTE" }
  ]
}
```

---


#### `POST /api/invoices/generate` 🔒
Genera una factura para el usuario autenticado.

---

### 7.4 IoT — `/api/iot`

> ⚠️ Esta ruta **no requiere autenticación JWT** actualmente. En producción debe protegerse con API Key o firma HMAC.

#### `POST /api/iot/lpr/event`
Recibe eventos de cámaras LPR (reconocimiento de placas). Automatiza apertura de barrera vía MQTT.

**Body:**
```json
{
  "plate": "ABC1234",
  "cameraLocation": "entrada",
  "timestamp": "2026-02-24T18:00:00.000Z"
}
```

**Lógica:**
- `cameraLocation` contiene `entry`/`entrada` → intenta abrir la barrera de entrada y luego asignar espacio.
- `cameraLocation` contiene `exit`/`salida` → verifica pago, abre barrera de salida.
- Si el vehículo no está registrado → devuelve `action: "DENY"`.

**Respuesta 200:**
```json
{
  "success": true,
  "plate": "ABC1234",
  "identifiedUser": "Carmen Lopez",
  "action": "OPEN_GATE",
  "message": "Bienvenido"
}
```

---

### 7.5 Health — `/health`

Sin autenticación. Usados por load balancers / Docker healthchecks.

| Endpoint | Descripción |
|---|---|
| `GET /health/liveness` | ¿Está vivo el proceso? |
| `GET /health/readiness` | ¿Puede recibir tráfico? (verifica DB y Redis) |
| `GET /health` | Health estándar (retrocompatibilidad) |

---

## 8. Modelos de Base de Datos

### `users`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Nombre completo |
| `email` | STRING UNIQUE | Email universitario |
| `password` | STRING | Hasheado con bcrypt (salt=10) |
| `role` | ENUM | `admin`, `guard`, `faculty`, `student`, `visitor` |
| `card_id` | STRING UNIQUE | Carné universitario |
| `vehicle_plate` | STRING UNIQUE | Placa del vehículo |
| `has_paid` | BOOLEAN | Si pagó en la sesión actual |
| `nit` | STRING | Para facturación FEL (default `CF`) |
| `fiscal_address` | STRING | Dirección fiscal |
| `fiscal_name` | STRING | Nombre fiscal |
| `current_parking_lot_id` | INTEGER FK | Lote actual |
| `current_parking_space` | STRING | Número de espacio actual |
| `entry_time` | DATETIME | Hora de entrada |
| `last_payment_amount` | DECIMAL(10,2) | Último monto pagado |
| `refresh_token_version` | INTEGER | Para invalidación de tokens |
| `isSolvent` | BOOLEAN | Solvencia mensual (campo existe en User) |
| `solvencyExpires` | DATETIME | Vencimiento de solvencia |
| `solvencyUpdatedBy` | INTEGER | Admin que actualizó |

---

### `parking_lots`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | STRING UNIQUE | Nombre del lote |
| `location` | GEOMETRY(POINT, 4326) | Coordenadas GPS (PostGIS) |
| `total_spaces` | INTEGER | Capacidad total |
| `available_spaces` | INTEGER | Espacios disponibles |

---

### `parking_spaces`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `parking_lot_id` | INTEGER FK | Lote al que pertenece |
| `space_number` | STRING | Número del espacio |
| `is_occupied` | BOOLEAN | Estado del espacio |
| `entry_time` | DATETIME | Hora en que fue ocupado |
| `occupied_by_user_id` | INTEGER FK | Usuario que lo ocupa |

> Índice único: `(parking_lot_id, space_number)`

---

### `pricing_plans`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `code` | STRING UNIQUE | Identificador del plan |
| `name` | STRING | Nombre descriptivo |
| `type` | ENUM | `HOURLY`, `FLAT_FEE`, `SUBSCRIPTION` |
| `base_rate` | DECIMAL(10,2) | Tarifa base (GTQ) |
| `currency` | ENUM | `GTQ`, `USD` |
| `billing_interval` | ENUM | `HOUR`, `DAY`, `MONTH`, `ONE_TIME` |
| `is_active` | BOOLEAN | |
| `rules` | JSONB | `gracePeriodMinutes`, `maxDailyCap`, `weekendMultiplier` |

---

### `invoices`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK | |
| `invoice_number` | STRING UNIQUE | Ej: `INV-1708816800000` |
| `user_id` | INTEGER FK | |
| `amount` | DECIMAL(10,2) | |
| `currency` | STRING | Default `GTQ` |
| `status` | ENUM | `ISSUED`, `PAID`, `CANCELLED`, `FAILED` |
| `fel_data` | JSONB | Datos de factura electrónica |
| `items` | JSONB | Array de items `[{description, amount}]` |
| `pdf_url` | STRING | URL del PDF generado |

---

### `audit_logs`

Tabla de auditoría con todos los eventos relevantes del sistema (LOGIN, ASSIGN_SPACE, PAYMENT, etc.).

---

## 9. Middleware

| Middleware | Archivo | Función |
|---|---|---|
| `protect` | `authMiddleware.js` | Verifica JWT. Pobla `req.userId` y `req.userRole` |
| `authorize(...roles)` | `roleMiddleware.js` | Restringe acceso por rol |
| `distributedRateLimit` | `rateLimitMiddleware.js` | Rate limit distribuido usando Redis |
| `loginLimiter` | `authRoutes.js` | Rate limit express para login (5/15min) |
| `idempotency` | `idempotencyMiddleware.js` | Previene requests duplicados |
| `versionMiddleware` | `versionMiddleware.js` | Agrega header `X-API-Version: 2.0.0` |
| `errorHandler` | `errorHandler.js` | Manejador global de errores |
| `handleValidationErrors` | `validationMiddleware.js` | Procesa errores de `express-validator` |
| `solvencyMiddleware` | `solvencyMiddleware.js` | ⚠️ Implementado pero NO aplicado en rutas |

---

## 10. Flujo de Negocio Principal

```
1. POST /api/auth/register   → Crear cuenta
2. POST /api/auth/login      → Obtener accessToken + refreshToken
3. GET  /api/parking/lots    → Ver parqueos disponibles y sus IDs
4. POST /api/parking/assign  → Entrar al parqueo (parkingLotId en body)
5. POST /api/parking/pay     → Pagar (calcula costo por tiempo)
6. POST /api/parking/release → Salir (libera el espacio)
```

### Flujo de Guard

```
1. POST /api/auth/login (role: guard)
2. GET  /api/parking/guard/active-vehicles  → Ver todos los vehículos activos
3. POST /api/parking/guard/assign           → Asignar espacio a visitante por placa/email
4. POST /api/parking/guard/release          → Liberar espacio por userId
```

### Flujo de Admin

```
1. POST /api/auth/login (role: admin)
2. POST /api/parking/admin/lots              → Crear nuevo lote
3. PATCH /api/parking/admin/lots/:id         → Modificar lote
4. DELETE /api/parking/admin/lots/:id        → Eliminar lote
5. GET  /api/parking/admin/users             → Ver usuarios
6. PATCH /api/parking/admin/users/:id/role   → Cambiar rol
7. GET  /api/parking/admin/stats/revenue     → Ver estadísticas
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
| `parking/solvency.controller.js` | `updateSolvency`, `checkSolvencyByCardId`, `getSolvencyReport` (**no enrutado**) |
| `iot/lpr.controller.js` | `handleLprEvent` |
| `invoiceController.js` | `generateInvoice` |
| `healthController.js` | `livenessProbe`, `readinessProbe`, `standardHealth` |

---

## 12. Servicios Externos

### MQTT (`mqttService.js`)
- Conectado al broker configurado en `MQTT_BROKER_URL`.
- Función principal: `openGate(gateId, userId)` — publica en el topic MQTT para abrir la barrera.
- Llamado desde: `releaseSpace`, `guardReleaseSpace`, `lpr.controller`.

### Socket.io (`socketService.js`)
- Emite eventos en tiempo real al cliente web/app.
- `emitParkingStatus(data)` — actualiza estado del parqueo en tiempo real.
- `notifyUser(userId, event, data)` — notificación personal para un usuario.

### Redis (`config/redis.js`)
- `getCache(key)` / `setCache(key, value, ttlSeconds)` / `deleteCache(key)`.
- Usado para: perfil de usuario (60 s), estado de parqueo (5 s), rate limiting distribuido.

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
npm start           # Producción
npm run dev         # Desarrollo con nodemon
npm run seed        # Seed principal (parqueos)
npm run seed:users  # Seed de usuarios de prueba
npm run seed:pricing # Seed de planes de precios
npm run seed:all    # Todos los seeds encadenados
npm test            # Jest con cobertura
npm run test:auth   # Solo tests de autenticación
npm run lint        # ESLint
npm run docker:build
npm run docker:up
npm run docker:down
```

---

## 15. Estado de Implementación

### ✅ Completamente implementado y funcional
- Autenticación JWT + Refresh Token + Google OAuth
- Registro / Login / Logout / Perfil
- CRUD completo de lotes de parqueo (admin)
- Asignación y liberación de espacios (usuario y guard)
- **Pago de tarifa obligatorio antes de salir** (reactivado)
- Panel de guard (vehículos activos, asignación/liberación manual)
- **Solvencia mensual** — 3 rutas activas: `PUT /solvency/:userId`, `GET /solvency/:cardId`, `GET /solvency-report`
- **Middleware `checkSolvency`** aplicado en `POST /api/parking/assign` (solo bloquea a estudiantes)
- **IoT LPR protegido** con `X-IoT-Api-Key` header (`IOT_API_KEY` en `.env`)
- Socket.io (actualizaciones en tiempo real)
- MQTT (apertura de barreras)
- Health checks
- Auditoría de eventos
- Rate limiting distribuido (Redis)
- Middleware de idempotencia
- Logging con Winston
- **Swagger UI** disponible en `GET /api-docs`

### 🔧 Pendiente / Mejoras futuras
- Proteger IoT con firma HMAC + timestamp (anti-replay) en producción
- Completar generación de facturas FEL (felData) con proveedor certificado
- Implementar tests unitarios para solvencia y IoT
- Agregar ruta para que el propio estudiante consulte su solvencia (`GET /api/auth/me` ya incluye los campos)

