# 📘 Guía de Pruebas con Swagger UI — Sistema de Parqueo UMG

> **URL de Swagger:** `http://localhost:3000/api-docs`  
> **Versión API:** v2.0.0  
> **Stack:** Node.js + Express + PostgreSQL + Sequelize

---

## 🚀 Inicio Rápido

### 1. Levantar el servidor
```bash
# En la carpeta del proyecto
npm run dev
```

Debes ver:
```
✅ Conexión a PostgreSQL establecida correctamente.
🔄 Modelos sincronizados con la base de datos.
🚀 Servidor escuchando en http://localhost:3000
```

### 2. Abrir Swagger UI
Ve a: **http://localhost:3000/api-docs**

Verás la interfaz con todos los endpoints agrupados por categoría.

---

## 🔐 Autenticación en Swagger

La mayoría de endpoints requieren un **JWT Bearer Token**. Para autenticarte en Swagger:

1. Primero obtén un token haciendo **Login** (ver sección abajo)
2. Copia el valor de `accessToken` de la respuesta
3. Haz clic en el botón **🔓 Authorize** (esquina superior derecha de Swagger)
4. Escribe: `Bearer <TU_TOKEN>` en el campo `bearerAuth`
5. Haz clic en **Authorize** y luego **Close**

A partir de este punto, todos los requests incluirán el token automáticamente.

---

## 📋 Flujo Completo de Prueba (Estudiante)

Este es el flujo principal que debes probar en orden:

```
Registro → Login → Ver Parqueos → Asignar Espacio → Pagar → Liberar Espacio
```

---

## 1️⃣ AUTH — Autenticación

### `POST /api/auth/register` — Registrar usuario

**Body de ejemplo (Estudiante):**
```json
{
  "name": "Carlos López",
  "email": "carlos@estudiante.umg.edu.gt",
  "password": "Student@12345",
  "cardId": "STU-2024-001",
  "vehiclePlate": "ABC1234",
  "role": "student",
  "nit": "CF"
}
```

**Body de ejemplo (Admin):**
```json
{
  "name": "Admin Prueba",
  "email": "admin@umg.edu.gt",
  "password": "Admin@12345",
  "cardId": "ADMIN-001",
  "vehiclePlate": "XYZ9999",
  "role": "admin",
  "nit": "1234567-8",
  "fiscalAddress": "Campus UMG Central"
}
```

**Body de ejemplo (Guard):**
```json
{
  "name": "Guard Principal",
  "email": "guard@umg.edu.gt",
  "password": "Guard@12345",
  "cardId": "GUARD-001",
  "vehiclePlate": "GRD0001",
  "role": "guard",
  "nit": "CF"
}
```

**Respuesta esperada `201`:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "Carlos López",
    "email": "carlos@estudiante.umg.edu.gt",
    "role": "student",
    "cardId": "STU-2024-001"
  }
}
```

---

### `POST /api/auth/login` — Iniciar sesión

**Body:**
```json
{
  "email": "carlos@estudiante.umg.edu.gt",
  "password": "Student@12345"
}
```

**Respuesta esperada `200`:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "Carlos López",
    "role": "student",
    "email": "carlos@estudiante.umg.edu.gt"
  }
}
```

> ⚠️ **Importante:** Copia el `accessToken` y autentícate en Swagger con él antes de continuar.

---

### `GET /api/auth/me` — Ver perfil propio

No requiere body. Solo necesita el token en el header.

**Respuesta esperada `200`:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Carlos López",
    "email": "carlos@estudiante.umg.edu.gt",
    "role": "student",
    "cardId": "STU-2024-001",
    "vehiclePlate": "ABC1234",
    "hasPaid": false,
    "isSolvent": false,
    "currentParkingSpace": null
  }
}
```

---

### `POST /api/auth/refresh` — Renovar Access Token

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

### `POST /api/auth/logout` — Cerrar sesión

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

### `POST /api/auth/google` — Login con Google

**Body:**
```json
{
  "idToken": "TOKEN_DE_GOOGLE_OBTENIDO_DEL_FRONTEND"
}
```

---

## 2️⃣ PARKING — Flujo Principal

### `GET /api/parking/lots` — Ver parqueos disponibles

No requiere body. Requiere token JWT.

**Respuesta esperada `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Parqueo Principal UMG",
      "availableSpaces": 148,
      "totalSpaces": 150,
      "isActive": true
    }
  ]
}
```

---

### `POST /api/parking/assign` — Entrar al parqueo (asignar espacio)

> 🔒 **Estudiantes sin solvencia recibirán error 402.**

**Body:**
```json
{
  "parkingLotId": 1
}
```

**Respuesta esperada `200`:**
```json
{
  "success": true,
  "message": "Espacio asignado correctamente",
  "space": {
    "id": 5,
    "spaceNumber": 5,
    "parkingLotId": 1
  },
  "entryTime": "2026-02-24T19:30:00.000Z"
}
```

**Error si estudiante sin solvencia `402`:**
```json
{
  "success": false,
  "code": "SOLVENCY_REQUIRED",
  "message": "Acceso denegado. No tiene solvencia registrada para este mes."
}
```

---

### `POST /api/parking/pay` — Pagar tarifa

> 💳 Debe llamarse **antes** de liberar el espacio.

**Body:** *(vacío o con método de pago)*
```json
{}
```

**Respuesta esperada `200`:**
```json
{
  "success": true,
  "message": "Pago procesado exitosamente",
  "amount": 10.50,
  "currency": "GTQ",
  "duration": "2h 6m",
  "invoice": {
    "id": 12,
    "total": 10.50
  }
}
```

---

### `POST /api/parking/release` — Salir del parqueo (liberar espacio)

> ⚠️ Requiere haber pagado primero con `/pay`. Si no pagó, retorna `402`.

**Body:** *(vacío)*
```json
{}
```

**Respuesta esperada `200`:**
```json
{
  "success": true,
  "message": "Espacio liberado correctamente",
  "duration": "2h 6m",
  "totalCharged": 10.50
}
```

**Error sin pago previo `402`:**
```json
{
  "success": false,
  "message": "Debe pagar antes de salir. Usa POST /api/parking/pay"
}
```

---

## 3️⃣ SOLVENCIA — Solo admin/guard

### `PUT /api/parking/solvency/:userId` — Marcar usuario como solvente

**URL param:** `:userId` = ID del estudiante (ej: `2`)

**Body:**
```json
{
  "months": 1
}
```

**Respuesta esperada `200`:**
```json
{
  "success": true,
  "message": "Solvencia actualizada correctamente por 1 mes(es)",
  "user": {
    "id": 2,
    "name": "Carlos López",
    "isSolvent": true,
    "solvencyExpires": "2026-03-24T19:00:00.000Z"
  }
}
```

---

### `GET /api/parking/solvency/:cardId` — Consultar solvencia por carné

**URL param:** `:cardId` = carné del estudiante (ej: `STU-2024-001`)

**Respuesta esperada `200`:**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "name": "Carlos López",
    "cardId": "STU-2024-001",
    "vehiclePlate": "ABC1234"
  },
  "solvency": {
    "isSolvent": true,
    "solvencyExpires": "2026-03-24T19:00:00.000Z",
    "daysRemaining": 28,
    "status": "VIGENTE (28 días restantes)"
  }
}
```

---

### `GET /api/parking/solvency-report` — Reporte de solvencia (solo admin)

No requiere body.

**Respuesta esperada `200`:**
```json
{
  "success": true,
  "summary": {
    "total": 5,
    "solvent": 3,
    "expired": 2
  },
  "data": [
    {
      "id": 2,
      "name": "Carlos López",
      "cardId": "STU-2024-001",
      "isSolvent": true,
      "daysRemaining": 28,
      "status": "VIGENTE"
    }
  ]
}
```

---

## 4️⃣ ADMIN — Panel de Administración

> 🔒 Todos requieren rol `admin`.

### `GET /api/parking/status` — Estado del parqueo

**Respuesta:**
```json
{
  "success": true,
  "lots": [
    {
      "id": 1,
      "name": "Parqueo Principal",
      "totalSpaces": 150,
      "availableSpaces": 148,
      "occupiedSpaces": 2
    }
  ],
  "activeUsers": 2
}
```

---

### `GET /api/parking/admin/active-vehicles` — Vehículos activos

**Respuesta:**
```json
{
  "success": true,
  "count": 2,
  "vehicles": [
    {
      "userId": 2,
      "userName": "Carlos López",
      "vehiclePlate": "ABC1234",
      "spaceNumber": 5,
      "entryTime": "2026-02-24T17:30:00.000Z",
      "duration": "2h 0m"
    }
  ]
}
```

---

### `POST /api/parking/admin/assign` — Asignar espacio manualmente (guard)

> 🔒 Rol: `admin` o `guard`

**Body:**
```json
{
  "userId": 2,
  "parkingLotId": 1
}
```

---

### `POST /api/parking/admin/release` — Liberar espacio manualmente (guard)

> 🔒 Rol: `admin` o `guard`

**Body:**
```json
{
  "userId": 2
}
```

---

### `POST /api/parking/lots` — Crear nuevo parqueo

> 🔒 Rol: `admin`

**Body:**
```json
{
  "name": "Parqueo Norte UMG",
  "totalSpaces": 50,
  "location": {
    "type": "Point",
    "coordinates": [-90.2866, 14.7592]
  }
}
```

---

### `PUT /api/parking/lots/:id` — Actualizar parqueo

**URL param:** `:id` = ID del parqueo

**Body:**
```json
{
  "name": "Parqueo Norte UMG (Actualizado)",
  "totalSpaces": 60
}
```

---

### `DELETE /api/parking/lots/:id` — Eliminar parqueo

**URL param:** `:id` = ID del parqueo. No requiere body.

---

### `GET /api/parking/admin/revenue` — Estadísticas de ingresos

**Respuesta:**
```json
{
  "success": true,
  "period": "monthly",
  "revenue": {
    "total": 1250.00,
    "currency": "GTQ",
    "transactions": 120
  }
}
```

---

## 5️⃣ FACTURAS — Invoices

### `POST /api/invoices/generate` — Generar factura

**Body:**
```json
{
  "parkingSessionId": 12
}
```

---

### `GET /api/invoices/my` — Mis facturas

No requiere body.

**Respuesta:**
```json
{
  "success": true,
  "invoices": [
    {
      "id": 1,
      "total": 10.50,
      "currency": "GTQ",
      "status": "PAID",
      "createdAt": "2026-02-24T19:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/invoices/:id/pdf` — Descargar factura en PDF

**URL param:** `:id` = ID de la factura. Descarga directa del PDF.

---

## 6️⃣ IoT — Dispositivos (Cámaras LPR)

> 🔒 Requiere header adicional: `X-IoT-Api-Key: iot-dev-key-umg-parking-2026`

En Swagger, agrega este header manualmente en el campo de "Headers" del endpoint.

### `POST /api/iot/lpr/event` — Evento de cámara LPR

**Headers adicionales:**
```
X-IoT-Api-Key: iot-dev-key-umg-parking-2026
```

**Body (vehículo detectado en entrada):**
```json
{
  "plate": "ABC1234",
  "eventType": "ENTRY",
  "cameraId": "CAM-ENTRADA-01",
  "confidence": 0.98,
  "timestamp": "2026-02-24T19:30:00.000Z"
}
```

**Body (vehículo detectado en salida):**
```json
{
  "plate": "ABC1234",
  "eventType": "EXIT",
  "cameraId": "CAM-SALIDA-01",
  "confidence": 0.95,
  "timestamp": "2026-02-24T21:30:00.000Z"
}
```

---

## 7️⃣ HEALTH — Estado del Servidor

### `GET /health` — Health check básico

No requiere autenticación.

**Respuesta `200`:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-24T19:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## 🧪 Escenarios de Prueba Completos

### Escenario A: Flujo Estudiante Solvente

```
1. POST /api/auth/register          → Crear estudiante
2. POST /api/auth/login             → Obtener token → Autorizar en Swagger
3. [Login como admin]
4. PUT  /api/parking/solvency/2     → Marcar al estudiante como solvente
5. [Volver al token del estudiante]
6. GET  /api/parking/lots           → Ver parqueos
7. POST /api/parking/assign         → { "parkingLotId": 1 }
8. POST /api/parking/pay            → Pagar
9. POST /api/parking/release        → Salir
10. GET /api/invoices/my            → Ver factura generada
```

---

### Escenario B: Estudiante Sin Solvencia

```
1. POST /api/auth/register          → Crear estudiante (role: "student")
2. POST /api/auth/login             → Obtener token → Autorizar
3. POST /api/parking/assign         → ❌ Error 402: SOLVENCY_REQUIRED
```

---

### Escenario C: Guard asigna manualmente

```
1. [Login como admin/guard]
2. GET  /api/parking/admin/active-vehicles  → Ver vehículos actuales
3. POST /api/parking/admin/assign           → { "userId": 3, "parkingLotId": 1 }
4. POST /api/parking/admin/release          → { "userId": 3 }
```

---

### Escenario D: IoT Cámara LPR

```
1. POST /api/iot/lpr/event          → Sin header X-IoT-Api-Key → ❌ 401
2. POST /api/iot/lpr/event          → Con header correcto + body ENTRY → ✅ 200
```

---

## ⚡ Códigos de Error Comunes

| Código | Significado | Solución |
|--------|------------|---------|
| `400` | Datos inválidos o faltantes | Revisa el body del request |
| `401` | No autenticado / Token inválido | Autoriza en Swagger con el token |
| `402` | Pago requerido / Sin solvencia | Paga primero o registra solvencia |
| `403` | Sin permisos (rol incorrecto) | Usa un usuario con el rol adecuado |
| `404` | Recurso no encontrado | Verifica el ID en la URL |
| `409` | Conflicto (duplicado) | El email/carné ya existe |
| `429` | Demasiadas requests | Espera un momento y vuelve a intentar |
| `500` | Error interno del servidor | Revisa los logs: `logs/combined.log` |

---

## 🔑 Usuarios de Prueba Predefinidos

Si ejecutaste `npm run seed:users`, estos usuarios ya existen:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| `admin` | admin@umg.edu.gt | Admin@12345 |
| `guard` | guard@umg.edu.gt | Guard@12345 |
| `faculty` | juan.perez@umg.edu.gt | Faculty@12345 |
| `student` | carlos.lopez@estudiante.umg.edu.gt | Student@12345 |
| `visitor` | maria.garcia@external.com | Visitor@12345 |

---

## 📌 Notas Importantes

- **Idempotencia:** Algunos endpoints (pago, release) usan middleware de idempotencia. Si recibes error `409 DUPLICATE_REQUEST`, espera 30 segundos y vuelve a intentar.
- **Rate Limiting:** Login está limitado a 5 intentos/15 min. Pay está limitado a 3 intentos/min.
- **JWT Expiry:** El `accessToken` expira en **1 hora**. Si expira, usa `POST /api/auth/refresh` con el `refreshToken`.
- **Solvencia:** Solo aplica a rol `student`. Los roles `admin`, `guard`, `faculty` y `visitor` están exentos.
- **IoT Key:** El valor de desarrollo es `iot-dev-key-umg-parking-2026`. En producción, cámbialo en el `.env`.
