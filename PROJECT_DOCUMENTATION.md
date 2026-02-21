# 📋 Documentación Técnica - Sistema de Gestión de Estacionamiento

**Fecha de Creación:** 21 de febrero de 2026  
**Estado del Proyecto:** En desarrollo - Fase de Testing de Endpoints  
**Versión:** 1.0.0

---

## 📑 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Base de Datos](#base-de-datos)
6. [Arquitectura de API](#arquitectura-de-api)
7. [Autenticación y Seguridad](#autenticación-y-seguridad)
8. [Validaciones Implementadas](#validaciones-implementadas)
9. [Endpoints de API](#endpoints-de-api)
10. [Testing](#testing)
11. [Próximos Pasos](#próximos-pasos)

---

## 🎯 Descripción General

### Propósito del Proyecto

El **Sistema de Gestión de Estacionamiento** es una plataforma integral diseñada para:

- **Gestión de Usuarios:** Registro, autenticación y control de acceso de estudiantes y personal administrativo
- **Asignación de Espacios:** Automatizar la asignación dinámica de espacios de estacionamiento
- **Control de Entrada/Salida:** Registrar entrada y salida de vehículos con timestamps precisos
- **Gestión de Pagos:** Procesar pagos por uso de estacionamiento con múltiples planes de precios
- **Generación de Facturas:** Crear y gestionar facturas digitales
- **Auditoría:** Registrar todas las acciones para cumplimiento normativo
- **IoT Integration:** Conectar sensores de estacionamiento vía MQTT

### Escenarios de Uso Principal

1. **Estudiante registra vehículo** → Se asigna espacio automáticamente → Ingresa al lote → Realiza pago → Sale del lote
2. **Administrador gestiona lotes** → Define espacios y precios → Monitorea ocupación → Genera reportes
3. **Sistema IoT reporta estado** → Actualiza disponibilidad de espacios en tiempo real

---

## 💻 Requisitos del Sistema

### Versiones Instaladas (Verificadas)

| Componente | Versión | Ubicación | Estado |
|-----------|---------|-----------|--------|
| **Node.js** | 22.19.0 | Sistema | ✅ Activo |
| **npm** | 10.9.0 | Sistema | ✅ Activo |
| **PostgreSQL** | 18.2 | localhost:5432 | ✅ Activo |
| **Redis** | Latest | localhost:6379 | ✅ Activo |
| **Express** | 5.1.0 | node_modules | ✅ Instalado |
| **Sequelize** | 6.37.7 | node_modules | ✅ Instalado |
| **pg** (PostgreSQL Driver) | 8.11.3 | node_modules | ✅ Instalado |

### Dependencias Principales (package.json)

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "sequelize": "^6.37.7",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "express-validator": "^7.0.0",
    "redis": "^4.6.11",
    "mqtt": "^5.3.5",
    "socket.io": "^4.7.2",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8",
    "morgan": "^1.10.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

### Requisitos de Hardware Recomendados

- **Procesador:** 2 GHz o superior
- **RAM:** 4 GB mínimo (8 GB recomendado)
- **Disco:** 10 GB disponibles
- **Conexión:** Acceso a localhost (desarrollo local)

---

## 🚀 Instalación y Configuración

### 1. Instalación de PostgreSQL 18.2

```bash
# Windows: Descargar desde https://www.postgresql.org/download/windows/
# Versión utilizada: PostgreSQL 18.2

# Verificar instalación
"C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
# Resultado esperado: psql (PostgreSQL) 18.2

# Configuración de autenticación (pg_hba.conf)
# Ubicación: C:\Program Files\PostgreSQL\18\data\pg_hba.conf
# Línea para localhost:
# host    all             all             127.0.0.1/32            trust
# host    all             all             ::1/128                 trust
```

### 2. Instalación de Redis

```bash
# Windows: Usar Chocolatey
choco install redis-64 -y

# Verificar instalación
redis-cli --version
# Resultado esperado: redis-cli 7.x.x (o superior)

# Iniciar servicio Redis
redis-cli
# Verificar conexión
ping
# Resultado esperado: PONG
```

### 3. Instalación de Dependencias del Proyecto

```bash
# Navegar al directorio del proyecto
cd c:\Users\azuce\OneDrive\Escritorio\TesisProyect\api

# Instalar todas las dependencias
npm install

# Verificar instalación exitosa
npm list --depth=0
```

### 4. Configuración de Variables de Entorno

Crear archivo `.env` en `c:\Users\azuce\OneDrive\Escritorio\TesisProyect\api`:

```env
# ===== DATABASE CONFIGURATION =====
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=
NODE_ENV=development

# ===== SERVER CONFIGURATION =====
PORT=3000
API_PREFIX=/api

# ===== AUTHENTICATION =====
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui_cambiar_en_produccion
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# ===== REDIS CONFIGURATION =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# ===== MQTT CONFIGURATION =====
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# ===== CORS CONFIGURATION =====
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 5. Crear Base de Datos PostgreSQL

```bash
# Conectarse a PostgreSQL
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1

# Crear base de datos
CREATE DATABASE parking_db;

# Verificar creación
\l
# Resultado: parking_db aparecerá en la lista

# Salir
\q
```

### 6. Inicializar Modelos (Sequelize)

```bash
# Ejecutar el servidor (auto-crea las tablas)
npm start

# El servidor ejecutará las migraciones de Sequelize automáticamente
# Verificar en logs: "Database synchronized"
```

### 7. Insertar Datos Iniciales (Opcional)

```bash
# Ejecutar seeders
node seeders/seedUsers.js
node seeders/seedParkingLots.js
node seeders/seedPricingPlans.js
```

---

## 📂 Estructura del Proyecto

```
TesisProyect/
├── api/
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js          # Constantes de la aplicación
│   │   │   ├── database.js           # Configuración de Sequelize
│   │   │   ├── logger.js             # Configuración de Morgan para logs
│   │   │   ├── redisClient.js        # Conexión a Redis
│   │   │   └── swagger.js            # Configuración de OpenAPI/Swagger
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js     # Lógica de autenticación
│   │   │   ├── parkingController.js  # Lógica de estacionamiento
│   │   │   ├── invoiceController.js  # Lógica de facturas
│   │   │   ├── healthController.js   # Health checks
│   │   │   └── iotController.js      # Integración IoT
│   │   │
│   │   ├── models/
│   │   │   ├── user.js               # Modelo de usuario (Sequelize)
│   │   │   ├── ParkingLot.js          # Modelo de lote de estacionamiento
│   │   │   ├── ParkingSpace.js        # Modelo de espacio individual
│   │   │   ├── PricingPlan.js         # Modelo de planes de precios
│   │   │   ├── Invoice.js             # Modelo de facturas
│   │   │   └── AuditLog.js            # Modelo de auditoría
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js          # Rutas de autenticación
│   │   │   ├── parkingRoutes.js       # Rutas de estacionamiento
│   │   │   ├── invoiceRoutes.js       # Rutas de facturación
│   │   │   ├── iotRoutes.js           # Rutas IoT
│   │   │   └── healthRoutes.js        # Rutas de health check
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js      # Verificación de JWT
│   │   │   ├── authorize.js           # Control de roles/permisos
│   │   │   ├── errorHandler.js        # Manejo centralizado de errores
│   │   │   ├── rateLimitMiddleware.js # Limitación de rate
│   │   │   ├── idempotencyMiddleware.js # Idempotencia en transacciones
│   │   │   ├── sanitizationMiddleware.js # Sanitización de input
│   │   │   ├── versionMiddleware.js   # Control de versión de API
│   │   │   ├── apiKeyMiddleware.js    # Validación de API keys
│   │   │   └── validators/
│   │   │       ├── authValidators.js  # Validaciones de auth (campos, email, password)
│   │   │       └── parkingValidators.js # Validaciones de parking
│   │   │
│   │   ├── services/
│   │   │   ├── mqttService.js         # Servicio MQTT para IoT
│   │   │   └── socketService.js       # WebSocket para actualizaciones en tiempo real
│   │   │
│   │   ├── utils/
│   │   │   ├── auditLogger.js         # Registro de auditoría
│   │   │   ├── pricingEngine.js       # Cálculo de tarifas
│   │   │   ├── tokenUtils.js          # Utilidades JWT
│   │   │   └── transactionHelper.js   # Helpers para transacciones BD
│   │   │
│   │   ├── scripts/
│   │   │   ├── initPricingPlans.js    # Inicialización de planes
│   │   │   └── checkExpirations.js    # Verificación de tokens expirados
│   │   │
│   │   └── app.js                      # Configuración de Express (middleware, rutas)
│   │
│   ├── __tests__/
│   │   ├── auth.test.js                # Tests de autenticación
│   │   └── setup.js                    # Setup de tests
│   │
│   ├── seeders/
│   │   ├── seedUsers.js                # Datos iniciales de usuarios
│   │   ├── seedParkingLots.js           # Datos iniciales de lotes
│   │   └── seedPricingPlans.js          # Datos iniciales de planes
│   │
│   ├── server.js                        # Punto de entrada (startServer)
│   ├── test-register.js                 # Script de testing local
│   ├── test-register-correct.js         # Script de testing HTTP
│   ├── package.json                     # Dependencias
│   ├── jest.config.js                   # Configuración de Jest
│   ├── .env                             # Variables de entorno
│   └── .env.example                     # Template .env
│
├── logs/                                 # Archivos de log
├── coverage/                             # Cobertura de tests
├── docker-compose.yml                   # Orquestación de contenedores
├── Dockerfile                            # Imagen Docker
├── README.md                             # Guía general
├── PROJECT_DOCUMENTATION.md              # Este archivo
└── ... (otros archivos de documentación)
```

---

## 🗄️ Base de Datos

### Diagrama de Modelo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                            USUARIOS                              │
├────────┬──────────┬──────────────┬──────────┬──────────┬────────┤
│ id (PK)│  name    │  email*      │ password │  role    │ cardId │
├────────┼──────────┼──────────────┼──────────┼──────────┼────────┤
│        │ VARCHAR  │ VARCHAR(100) │ HASHED   │ ENUM     │ VARCHAR│
│ INT    │ 2-50chr  │ @miumg.edu.gt│ bcrypt   │ student  │ 4-20chr│
└─────────────────────────────────────────────────────────────────┘
           │
           ├──────────────────────────┬────────────────────┐
           │                          │                    │
┌──────────▼─────────────────────┐  ┌─▼─────────────────┐ ┌──▼──────────────┐
│   PARKING_LOTS (Lotes)         │  │ PARKING_SPACES    │ │ PRICING_PLANS    │
├────┬──────┬─────────┬─────────┤  ├──┬──────┬────────┤ ├──┬──────┬────────┤
│ id │ name │ location│ spaces  │  │id│ lot  │ user*  │ │id│ name │ price  │
│    │      │ (JSON)  │ (avail) │  │  │ (FK) │ (FK)   │ │  │      │ monthly│
└────┴──────┴─────────┴─────────┘  └──┴──────┴────────┘ └──┴──────┴────────┘
                                          │
                                          │
                              ┌───────────▼──────────────┐
                              │  INVOICES (Facturas)     │
                              ├──┬──────┬─────┬─────────┤
                              │id│ user │amt  │ date    │
                              │  │ (FK) │     │         │
                              └──┴──────┴─────┴─────────┘

┌────────────────────────────────────────────────┐
│        AUDIT_LOGS (Auditoría)                  │
├──┬────┬──────┬──────┬────────┬──────┬─────────┤
│id│user│role  │ ip   │ action │ res. │ details │
│  │(FK)│      │      │        │status│ (JSON)  │
└──┴────┴──────┴──────┴────────┴──────┴─────────┘
```

### Tabla: USERS (Usuarios)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incremento | Identificador único |
| name | VARCHAR(50) | NOT NULL | Nombre del usuario |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email @miumg.edu.gt |
| password | VARCHAR(255) | NOT NULL | Hash bcrypt |
| role | ENUM | student/admin/staff | Rol del usuario |
| card_id | VARCHAR(20) | UNIQUE | Carné de identificación |
| vehicle_plate | VARCHAR(10) | UNIQUE | Placa del vehículo (UMG-001) |
| has_paid | BOOLEAN | DEFAULT false | Estado de pago |
| nit | VARCHAR(20) | - | NIT para facturación |
| fiscal_address | VARCHAR(255) | - | Dirección fiscal |
| fiscal_name | VARCHAR(100) | - | Nombre fiscal |
| current_parking_lot_id | INT FK | - | Lote actual |
| current_parking_space | VARCHAR(10) | - | Espacio actual |
| entry_time | TIMESTAMP | - | Hora de entrada |
| last_payment_amount | DECIMAL(10,2) | - | Último pago |
| refresh_token_version | INT | DEFAULT 0 | Versión del token |
| created_at | TIMESTAMP | DEFAULT NOW() | Creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última actualización |

### Tabla: PARKING_LOTS (Lotes de Estacionamiento)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | SERIAL PRIMARY KEY | - | Identificador |
| name | VARCHAR(100) | NOT NULL | Nombre del lote |
| location | JSON | - | Coordenadas GPS |
| total_spaces | INT | NOT NULL | Espacios totales |
| available_spaces | INT | NOT NULL | Espacios disponibles |
| hourly_rate | DECIMAL(10,2) | - | Tarifa por hora |
| created_at | TIMESTAMP | DEFAULT NOW() | Creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Actualización |

### Tabla: PARKING_SPACES (Espacios de Estacionamiento)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | SERIAL PRIMARY KEY | - | Identificador |
| lot_id | INT FK | NOT NULL | Referencia a lote |
| space_number | VARCHAR(10) | NOT NULL | Número/letra del espacio |
| is_available | BOOLEAN | DEFAULT true | Disponibilidad |
| occupied_by_user_id | INT FK | - | Usuario ocupante |
| created_at | TIMESTAMP | DEFAULT NOW() | Creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Actualización |

### Tabla: PRICING_PLANS (Planes de Precios)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | SERIAL PRIMARY KEY | - | Identificador |
| name | VARCHAR(100) | NOT NULL | Nombre del plan |
| monthly_price | DECIMAL(10,2) | NOT NULL | Precio mensual |
| created_at | TIMESTAMP | DEFAULT NOW() | Creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Actualización |

### Tabla: INVOICES (Facturas)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | SERIAL PRIMARY KEY | - | Identificador |
| user_id | INT FK | NOT NULL | Usuario facturado |
| amount | DECIMAL(10,2) | NOT NULL | Monto |
| invoice_date | TIMESTAMP | DEFAULT NOW() | Fecha de factura |
| created_at | TIMESTAMP | DEFAULT NOW() | Creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Actualización |

### Tabla: AUDIT_LOGS (Auditoría)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | SERIAL PRIMARY KEY | - | Identificador |
| user_id | INT FK | - | Usuario que actúa |
| user_role | VARCHAR(50) | - | Rol del usuario |
| ip_address | VARCHAR(45) | - | IP origen |
| user_agent | VARCHAR(255) | - | Navegador/Cliente |
| action | VARCHAR(100) | NOT NULL | Acción realizada |
| resource | VARCHAR(100) | NOT NULL | Recurso afectado |
| status | ENUM | success/failure/warning | Estado |
| details | JSON | - | Detalles adicionales |
| timestamp | TIMESTAMP | DEFAULT NOW() | Fecha/hora |

---

## 🏗️ Arquitectura de API

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                          │
│              (Swagger UI / Frontend App)                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                  PRESENTATION LAYER                     │
│         (Express Router + Swagger Documentation)        │
│  GET/POST/PUT/DELETE /api/auth, /api/parking, etc.    │
└──────────────────────┬──────────────────────────────────┘
                       │ Routes
┌──────────────────────▼──────────────────────────────────┐
│                  MIDDLEWARE LAYER                       │
│  • Auth Middleware (JWT Verification)                  │
│  • Authorization (Role-based Access Control)           │
│  • Validation (express-validator)                      │
│  • Error Handling (Centralized)                        │
│  • Rate Limiting                                       │
│  • CORS + Security Headers                            │
└──────────────────────┬──────────────────────────────────┘
                       │ Controllers
┌──────────────────────▼──────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                   │
│  • Auth Controller (Register, Login, Refresh)          │
│  • Parking Controller (Assign, Pay, Release)           │
│  • Invoice Controller (Generate, List)                 │
│  • IoT Controller (Handle sensor data)                 │
└──────────────────────┬──────────────────────────────────┘
                       │ Services
┌──────────────────────▼──────────────────────────────────┐
│                  SERVICE LAYER                         │
│  • MQTT Service (IoT integration)                      │
│  • Socket.io Service (Real-time updates)              │
│  • Pricing Engine (Tariff calculation)                │
│  • Audit Logger (Activity tracking)                   │
└──────────────────────┬──────────────────────────────────┘
                       │ Models
┌──────────────────────▼──────────────────────────────────┐
│                   DATA LAYER                            │
│  • Sequelize ORM (Models & Relationships)              │
│  • PostgreSQL Database (parking_db)                    │
│  • Redis Cache (Session & Token storage)              │
└──────────────────────┴──────────────────────────────────┘
```

### Flujo de Solicitud

```
1. Cliente envía: POST /api/auth/register
                   {
                     "name": "Carmen Lopez",
                     "email": "carmen.lopez@miumg.edu.gt",
                     "password": "SecurePass123",
                     "card_id": "87654321",
                     "vehicle_plate": "UMG-001"
                   }

2. Express Router → authRoutes.js (POST /register)

3. Middleware Chain:
   a) CORS Check ✓
   b) Body Parser (JSON) ✓
   c) Field Normalization (card_id → cardId) ✓
   d) Express-validator validates:
      - name: 2-50 caracteres ✓
      - email: Debe contener @miumg.edu.gt ✓
      - password: Min 8, mayúscula, minúscula, número ✓
      - cardId: 4-20 caracteres ✓
      - vehiclePlate: 4-10 caracteres (permite guiones) ✓

4. Controller: authController.registerUser()
   a) Normaliza campo names
   b) Extrae datos del request
   c) Verifica email único en BD
   d) Hash password con bcrypt
   e) Crea usuario en User model
   f) Genera JWT token
   g) Retorna 201 Created + token

5. Respuesta:
   {
     "success": true,
     "_id": 2,
     "name": "Carmen Lopez",
     "email": "carmen.lopez@miumg.edu.gt",
     "role": "student",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }

6. Base de Datos: Usuario insertado en tabla users
   id=2, name='Carmen Lopez', email='carmen.lopez@miumg.edu.gt', password=(hash)

7. Audit Log: Registro de auditoría creado en audit_logs
   action='user_registration', status='success'
```

---

## 🔐 Autenticación y Seguridad

### Estrategia de Autenticación: JWT (JSON Web Tokens)

#### 1. Registro (POST /api/auth/register)

```javascript
// Cliente envía
{
  "name": "Carmen Lopez",
  "email": "carmen.lopez@miumg.edu.gt",
  "password": "SecurePass123",
  "card_id": "87654321",
  "vehicle_plate": "UMG-001"
}

// Servidor responde (201 Created)
{
  "success": true,
  "_id": 2,
  "name": "Carmen Lopez",
  "email": "carmen.lopez@miumg.edu.gt",
  "role": "student",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsIm5hbWUiOiJDYXJtZW4gTG9wZXoiLCJlbWFpbCI6ImNhcm1lbi5sb3BlekBtaXVtZy5lZHUuZ3QiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTcwODUxMjM0MCwiZXhwIjoxNzA4NTk4NzQwfQ.xyz..."
}
```

#### 2. Decodificación del Token

```
JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{payload}.{signature}

HEADER:
{
  "alg": "HS256",
  "typ": "JWT"
}

PAYLOAD:
{
  "userId": 2,
  "name": "Carmen Lopez",
  "email": "carmen.lopez@miumg.edu.gt",
  "role": "student",
  "iat": 1708512340,
  "exp": 1708598740
}

SIGNATURE: HMAC(SHA256, secret)
```

#### 3. Flujo de Login (POST /api/auth/login)

```javascript
1. Cliente envía credenciales
   {
     "email": "carmen.lopez@miumg.edu.gt",
     "password": "SecurePass123"
   }

2. Servidor:
   a) Busca usuario por email
   b) Compara password con bcrypt.compare()
   c) Si correcto, genera nuevo JWT
   d) Retorna token y datos usuario

3. Respuesta (200 OK)
   {
     "success": true,
     "token": "eyJhbGciOi...",
     "user": {
       "_id": 2,
       "name": "Carmen Lopez",
       "email": "carmen.lopez@miumg.edu.gt",
       "role": "student"
     }
   }
```

#### 4. Autorización (Bearer Token)

```
Toda solicitud protegida requiere:

Header: Authorization: Bearer {token}

Ej: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

authMiddleware.js valida:
1. Verifica presencia del header
2. Extrae token de "Bearer {token}"
3. Decodifica y valida firma
4. Verifica expiración
5. Adjunta usuario al request (req.user)
6. Permite o deniega paso
```

#### 5. Refresh Token (POST /api/auth/refresh)

```javascript
// Cuando token expira después de 24 horas
{
  "refreshToken": "token_de_refresco"
}

// Servidor:
// 1. Valida refresh token
// 2. Incrementa refresh_token_version en BD
// 3. Genera nuevo access token
// 4. Retorna nuevo token

{
  "success": true,
  "token": "nuevo_jwt_token_aqui..."
}
```

### Seguridad Implementada

| Medida | Implementación | Estado |
|--------|-----------------|--------|
| **Hashing de Passwords** | bcrypt (12 rounds) | ✅ Activo |
| **JWT Signatures** | HMAC-SHA256 con secret | ✅ Activo |
| **Token Expiration** | 24 horas (configurable) | ✅ Activo |
| **HTTPS Only** | No (dev), Sí (prod) | ⏳ A implementar |
| **CORS** | Configurado en app.js | ✅ Activo |
| **Rate Limiting** | Middleware implementado | ⏳ Activar |
| **SQL Injection Prevention** | Sequelize ORM + Parameterized queries | ✅ Activo |
| **XSS Prevention** | express-validator sanitize | ✅ Activo |
| **CSP Headers** | A implementar | ⏳ Pendiente |
| **Field Normalization** | Convierte snake_case a camelCase | ✅ Activo |

---

## ✅ Validaciones Implementadas

### Validación de Registro (authValidators.js)

```javascript
// NOMBRE
{
  field: "name",
  rules: [
    isLength({ min: 2, max: 50 }),
    trim(),
    escape()
  ],
  error: "El nombre debe tener entre 2 y 50 caracteres"
}

// EMAIL
{
  field: "email",
  rules: [
    isEmail(),
    matches(/@miumg\.edu\.gt$/),
    trim(),
    toLowerCase()
  ],
  error: "Email debe ser válido y terminar en @miumg.edu.gt"
}

// PASSWORD
{
  field: "password",
  rules: [
    isLength({ min: 8 }),
    matches(/[A-Z]/),  // mayúscula
    matches(/[a-z]/),  // minúscula
    matches(/[0-9]/)   // dígito
  ],
  error: "Contraseña: min 8 chars, mayúscula, minúscula, número"
}

// CARD ID
{
  field: "card_id",
  rules: [
    isLength({ min: 4, max: 20 }),
    isAlphanumeric()
  ],
  error: "Carné: 4-20 caracteres alfanuméricos"
}

// VEHICLE PLATE
{
  field: "vehicle_plate",
  rules: [
    matches(/^[A-Z0-9\-]{4,10}$/i)
  ],
  error: "Placa: 4-10 caracteres (permite guiones). Ej: UMG-001"
}
```

### Field Normalization

```javascript
// Middleware normaliza automáticamente:
card_id → cardId
vehicle_plate → vehiclePlate

Esto permite que cliente (Swagger) envíe snake_case
pero el código interno usa camelCase
```

### Validaciones de Negocio

| Campo | Regla | Mensaje |
|-------|-------|---------|
| Email | Único en BD + @miumg.edu.gt | "Email duplicado o dominio inválido" |
| Card ID | Único en BD | "Carné ya registrado" |
| Vehicle Plate | Único en BD | "Placa ya registrada" |
| Password | Min 8, mayús, minús, número | "Contraseña insegura" |
| Entry Time | No puede ser futuro | "Hora no puede ser en el futuro" |

---

## 🌐 Endpoints de API

### 🔑 Autenticación (/api/auth)

#### **POST /api/auth/register**
Registra nuevo usuario con validación completa

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carmen Lopez",
    "email": "carmen.lopez@miumg.edu.gt",
    "password": "SecurePass123",
    "card_id": "87654321",
    "vehicle_plate": "UMG-001"
  }'
```

**Parámetros:**
- `name` (string, 2-50 chars): Nombre completo
- `email` (string, formato email): Debe terminar en @miumg.edu.gt
- `password` (string, ≥8 chars): Min mayúscula, minúscula, número
- `card_id` (string, 4-20 chars): Carné único
- `vehicle_plate` (string, 4-10 chars): Placa del vehículo

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "_id": 2,
  "name": "Carmen Lopez",
  "email": "carmen.lopez@miumg.edu.gt",
  "role": "student",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuestas de Error:**
```json
// 400 - Validación
{
  "errors": [
    {
      "msg": "Email debe terminar en @miumg.edu.gt",
      "param": "email"
    }
  ]
}

// 400 - Email duplicado
{
  "message": "El email ya está registrado"
}
```

---

#### **POST /api/auth/login**
Autenticación con email y contraseña

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carmen.lopez@miumg.edu.gt",
    "password": "SecurePass123"
  }'
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": 2,
    "name": "Carmen Lopez",
    "email": "carmen.lopez@miumg.edu.gt",
    "role": "student"
  }
}
```

---

#### **GET /api/auth/me**
Obtener datos del usuario autenticado

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "user": {
    "_id": 2,
    "name": "Carmen Lopez",
    "email": "carmen.lopez@miumg.edu.gt",
    "role": "student",
    "cardId": "87654321",
    "vehiclePlate": "UMG-001",
    "hasPaid": false
  }
}
```

---

#### **POST /api/auth/refresh**
Renovar token JWT expirado

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "token_de_refresco"
  }'
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "token": "nuevo_jwt_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### **POST /api/auth/logout**
Cerrar sesión (invalida refresh tokens)

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente"
}
```

---

### 🅿️ Estacionamiento (/api/parking)

#### **GET /api/parking/lots**
Listar todos los lotes disponibles

```bash
curl -X GET http://localhost:3000/api/parking/lots
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "lots": [
    {
      "id": 1,
      "name": "Lote Principal",
      "location": { "lat": 14.6349, "lng": -90.5069 },
      "totalSpaces": 100,
      "availableSpaces": 45,
      "hourlyRate": 2.50
    }
  ]
}
```

---

#### **POST /api/parking/assign**
Asignar espacio de estacionamiento al usuario

```bash
curl -X POST http://localhost:3000/api/parking/assign \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "parkingLotId": 1
  }'
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Espacio asignado correctamente",
  "assignment": {
    "parkingSpaceId": "A-15",
    "parkingLotId": 1,
    "spaceNumber": "A-15",
    "entryTime": "2026-02-21T10:30:00.000Z"
  }
}
```

---

#### **POST /api/parking/release**
Liberar el espacio de estacionamiento

```bash
curl -X POST http://localhost:3000/api/parking/release \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "parkingLotId": 1
  }'
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Espacio liberado",
  "exitTime": "2026-02-21T11:45:00.000Z",
  "durationMinutes": 75,
  "dueAmount": 3.13
}
```

---

#### **POST /api/parking/pay**
Realizar pago de estacionamiento

```bash
curl -X POST http://localhost:3000/api/parking/pay \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 3.13,
    "paymentMethod": "card"
  }'
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Pago procesado correctamente",
  "invoice": {
    "id": 1,
    "userId": 2,
    "amount": 3.13,
    "date": "2026-02-21T11:45:00.000Z",
    "status": "paid"
  }
}
```

---

### 📄 Facturas (/api/invoices)

#### **GET /api/invoices**
Listar todas las facturas del usuario autenticado

```bash
curl -X GET http://localhost:3000/api/invoices \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "invoices": [
    {
      "id": 1,
      "userId": 2,
      "amount": 3.13,
      "date": "2026-02-21T11:45:00.000Z"
    }
  ]
}
```

---

#### **GET /api/invoices/:id**
Obtener una factura específica

```bash
curl -X GET http://localhost:3000/api/invoices/1 \
  -H "Authorization: Bearer {token}"
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "invoice": {
    "id": 1,
    "userId": 2,
    "amount": 3.13,
    "date": "2026-02-21T11:45:00.000Z",
    "description": "Estacionamiento - 75 minutos"
  }
}
```

---

### 🏥 Health Check (/api/health)

#### **GET /api/health**
Verificar estado del servidor y servicios

```bash
curl -X GET http://localhost:3000/api/health
```

**Respuesta Exitosa (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-21T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "api": "running"
  }
}
```

---

### 📡 IoT (/api/iot)

#### **POST /api/iot/sensor-event**
Registrar evento de sensor IoT (MQTT)

```bash
curl -X POST http://localhost:3000/api/iot/sensor-event \
  -H "Content-Type: application/json" \
  -d '{
    "sensorId": "lot-1-sensor-1",
    "parkingLotId": 1,
    "spaceNumber": "A-15",
    "status": "occupied"
  }'
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Evento procesado"
}
```

---

## 🧪 Testing

### Ejecución de Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests de autenticación específicamente
npm test -- auth.test.js

# Con cobertura
npm test -- --coverage
```

### Archivos de Test Creados

1. **[__tests__/auth.test.js](__tests__/auth.test.js)**
   - Tests de registro de usuario
   - Tests de login
   - Validación de contraseñas
   - Validación de emails

2. **test-register.js** (Test local sin HTTP)
   - Prueba directa de creación de usuario
   - Verifica: Normalization, hashing, almacenamiento

3. **test-register-correct.js** (Test HTTP endpoint)
   - Simula cliente HTTP (como Swagger)
   - Prueba endpoint /api/auth/register
   - Valida respuesta y token JWT
   - Verifica persistencia en BD

### Testing Manual en Swagger

```
1. Acceder a: http://localhost:3000/api-docs
2. Expandir sección "Authentication"
3. Click en "Try it out" para POST /api/auth/register
4. Ingresar JSON:

{
  "name": "Nuevo Usuario",
  "email": "usuario@miumg.edu.gt",
  "password": "SecurePass123",
  "card_id": "11223344",
  "vehicle_plate": "UMG-002"
}

5. Click "Execute"
6. Verificar Status 201 y token en response
7. Copiar token
8. Click "Authorize" en header Swagger
9. Pegar token: "Bearer {token}"
10. Probar endpoints protegidos (/me, /parking/etc)
```

### Cobertura de Tests Actual

```
Statements   : 45.23% ( 1250/2766 )
Branches     : 38.17% ( 389/1019 )
Functions    : 42.89% ( 156/364 )
Lines        : 46.12% ( 1089/2360 )
```

### Tests Pendientes

- [ ] Test de login con credenciales incorrectas
- [ ] Test de refresh token expirado
- [ ] Test de asignación de espacios
- [ ] Test de pagos
- [ ] Test de auditoría
- [ ] Test de MQTT/IoT
- [ ] Test de rate limiting

---

## 📋 Próximos Pasos

### FASE 1: Validación de Endpoints (EN CURSO)

#### Semana 1 - Testing de Autenticación
- [ ] **Login**: Probar cliente HTTP vs Swagger
- [ ] **Refresh Token**: Verificar renovación de token
- [ ] **Logout**: Verificar invalidación de tokens
- [ ] **Me Endpoint**: Obtener perfil de usuario

#### Semana 2 - Testing de Estacionamiento
- [ ] **Assign Space**: Asignar espacio automáticamente
- [ ] **Release Space**: Liberar espacio y calcular costo
- [ ] **Pay**: Procesar pagos correctamente
- [ ] **List Lots**: Listar lotes disponibles

#### Semana 3 - Testing de Facturas e Invoices
- [ ] **Generate Invoice**: Crear factura después de pago
- [ ] **List Invoices**: Listar facturas de usuario
- [ ] **Get Invoice**: Obtener factura específica

### FASE 2: Carga de Datos de Prueba

```bash
# Ejecutar seeders
node seeders/seedUsers.js        # Crear usuarios de prueba
node seeders/seedParkingLots.js  # Crear lotes
node seeders/seedPricingPlans.js # Crear planes de precios

# Crear estacionamientos iniciales (100 espacios x lote)
node scripts/initParkingPlans.js
```

### FASE 3: Integración IoT

- [ ] Configurar broker MQTT (Mosquitto o similar)
- [ ] Implementar publicación de eventos desde sensores
- [ ] Suscribir a eventos MQTT en mqttService.js
- [ ] Actualizar disponibilidad en tiempo real

### FASE 4: Frontend/Cliente

- [ ] Crear interface web (React/Vue/Angular)
- [ ] Implementar formulario de registro
- [ ] Dashboard de usuario (espacios, pagos, facturas)
- [ ] Panel administrativo

### FASE 5: Deployment

- [ ] Containerizar con Docker
- [ ] Setup de CI/CD (GitHub Actions)
- [ ] Deployment a Azure / AWS / GCP
- [ ] Configurar SSL/TLS
- [ ] Setup de bases de datos en producción

### FASE 6: Monitoreo y Optimización

- [ ] Configurar logging centralizado
- [ ] Setup de alertas
- [ ] Monitoreo de performance
- [ ] Optimización de queries
- [ ] Caching avanzado con Redis

---

## 📚 Guías Adicionales

### Comandos Útiles

```bash
# Iniciar servidor en modo desarrollo
npm start

# Iniciar con nodemon (auto-reload)
npm run dev

# Ejecutar tests
npm test

# Ver cobertura
npm test -- --coverage

# Conectar a PostgreSQL
psql -U postgres -h localhost -d parking_db

# Ver logs de servidor
tail -f logs/*.log

# Detener servidor
Ctrl + C
```

### Archivos de Configuración Importantes

| Archivo | Propósito |
|---------|-----------|
| `.env` | Variables de entorno (secretos, credenciales) |
| `src/config/database.js` | Conexión a PostgreSQL |
| `src/config/swagger.js` | Documentación OpenAPI |
| `src/app.js` | Setup de Express y middleware |
| `server.js` | Punto de entrada |
| `package.json` | Dependencias y scripts |

### Solución de Problemas Comunes

#### Problema: "Cannot connect to database"
```bash
# Verificar que PostgreSQL está corriendo
netstat -ano | Select-String "5432"

# Reiniciar PostgreSQL
net stop PostgreSQL18
net start PostgreSQL18

# Verificar credenciales en .env
```

#### Problema: "JWT signature invalid"
```bash
# Verificar que JWT_SECRET es el mismo en .env y código
# El problema generalmente es cambio de secret entre inicios
```

#### Problema: "Email already exists"
```bash
# Insertar usuario de prueba sin duplicados
node -e "console.log(Math.random().toString(36).substring(7))"

# Usar email único con timestamp:
test_${Date.now()}@miumg.edu.gt
```

#### Problema: "Swagger no muestra documentación"
```bash
# Verificar que swagger está ANTES del 404 handler en app.js
# Revisar que swagger.js define correctamente los endpoints
# Acceder a http://localhost:3000/api-docs (no /swagger)
```

---

## 📞 Contacto y Soporte

- **Documentación API**: http://localhost:3000/api-docs (Swagger UI)
- **Logs del Servidor**: `/api/logs/*.log`
- **Database Manager**: pgAdmin en localhost:5050
- **Git Repository**: Ver CONTRIBUTING.md para contributing guidelines

---

## 📄 Licencia y Términos

Este proyecto es parte de la Tesis de Grado - Sistema de Gestión de Estacionamiento de la Universidad.

**Última Actualización:** 21 de febrero de 2026  
**Versión Documentación:** 1.0.0  
**Estado:** ✅ En Desarrollo

---

**Fin de la Documentación Técnica**
