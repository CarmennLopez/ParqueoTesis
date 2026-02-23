# Manual de Pruebas con Postman - API Sistema de Parqueo UMG

**Versión**: 2.0.0  
**URL Base**: `http://localhost:3000`  
**Swagger UI**: `http://localhost:3000/api-docs`

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Autenticación](#-autenticación)
3. [Parqueo — Flujo Principal](#-parqueo--flujo-principal)
4. [Solvencia](#-solvencia-mensual)
5. [Facturas](#-facturas)
6. [IoT / Cámaras LPR](#-iot--cámaras-lpr)
7. [Health Checks](#-health-checks)
8. [Flujo de Prueba Completo](#-flujo-de-prueba-completo)
9. [Automatización en Postman](#-automatización-en-postman)
10. [Errores Comunes](#-errores-comunes)

---

## 🚀 Configuración Inicial

### Requisitos Previos
- ✅ Servidor corriendo: `npm run dev`
- ✅ Base de datos inicializada: `npm run seed:all`
- ✅ Postman instalado (v10+)

### Configurar Environment en Postman

Crear un nuevo Environment llamado **"Parqueo UMG Local"** con estas variables:

| Variable | Valor Inicial | Descripción |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3000` | URL base del servidor |
| `token` | *(vacío)* | Access Token JWT (15 min) |
| `refreshToken` | *(vacío)* | Refresh Token (7 días) |

---

## 🔐 Autenticación

### 1. Registrar Usuario

**Endpoint**: `POST {{baseUrl}}/api/auth/register`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw — JSON):
```json
{
  "name": "Carmen Lopez",
  "email": "carmen@miumg.edu.gt",
  "password": "Password123!",
  "card_id": "12345678",
  "vehicle_plate": "UMG-001",
  "role": "student"
}
```

**Roles disponibles**: `student` | `faculty` | `guard` | `admin`  
*(el rol por defecto es `student`)*

**Validaciones**:
- Nombre: 2–50 caracteres
- Email: formato válido
- Password: mínimo 8 caracteres, debe incluir mayúscula, minúscula y número
- `card_id`: identificador único del carné
- `vehicle_plate`: identificador único de la placa

**Respuesta Exitosa** (201):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Carmen Lopez",
    "email": "carmen@miumg.edu.gt",
    "role": "student",
    "cardId": "12345678",
    "vehiclePlate": "UMG-001",
    "isSolvent": false
  }
}
```

---

### 2. Iniciar Sesión (Login)

**Endpoint**: `POST {{baseUrl}}/api/auth/login`

**Body** (raw — JSON):
```json
{
  "email": "carmen@miumg.edu.gt",
  "password": "Password123!"
}
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Carmen Lopez",
    "email": "carmen@miumg.edu.gt",
    "role": "student",
    "cardId": "12345678",
    "vehiclePlate": "UMG-001",
    "isSolvent": false
  }
}
```

> ⚠️ Rate limit: **5 intentos** por cada 15 minutos.

**Script de Postman** (pestaña *Tests*) para guardar tokens automáticamente:
```javascript
if (pm.response.code === 200) {
    const r = pm.response.json();
    pm.environment.set("token", r.token);
    pm.environment.set("refreshToken", r.refreshToken);
    console.log("✅ Tokens guardados");
}
```

---

### 3. Obtener Mi Perfil

**Endpoint**: `GET {{baseUrl}}/api/auth/me`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Carmen Lopez",
    "email": "carmen@miumg.edu.gt",
    "role": "student",
    "cardId": "12345678",
    "vehiclePlate": "UMG-001",
    "isSolvent": true,
    "solvencyExpires": "2026-03-21T17:00:00.000Z",
    "currentParkingSpace": null
  }
}
```

---

### 4. Renovar Access Token

**Endpoint**: `POST {{baseUrl}}/api/auth/refresh`

**Body** (raw — JSON):
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 5. Cerrar Sesión (Logout)

**Endpoint**: `POST {{baseUrl}}/api/auth/logout`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Body** (raw — JSON, opcional):
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "message": "Sesión cerrada"
}
```

---

### 6. Login con Google OAuth2

**Endpoint**: `POST {{baseUrl}}/api/auth/google`

**Body** (raw — JSON):
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

> ⚠️ Solo se aceptan correos institucionales `@miumg.edu.gt`.

---

## 🅿️ Parqueo — Flujo Principal

El flujo estándar es: **Assign → Pay → Release**.

### 7. Listar Lotes de Parqueo

**Endpoint**: `GET {{baseUrl}}/api/parking/lots`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Lote Norte",
      "totalSpaces": 50,
      "availableSpaces": 23,
      "hourlyRate": 5.00,
      "location": { "lat": 14.6349, "lng": -90.5069 }
    }
  ]
}
```

---

### 8. Asignar Espacio (Entrada)

**Endpoint**: `POST {{baseUrl}}/api/parking/assign`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Body** (raw — JSON):
```json
{
  "parkingLotId": 1
}
```

> ⚠️ Los estudiantes deben tener **solvencia mensual vigente** para acceder.

**Respuesta Exitosa** (200):
```json
{
  "message": "Espacio asignado con éxito",
  "parkingLot": "Lote Norte",
  "space": "A-5",
  "entryTime": "2026-02-21T17:00:00.000Z",
  "info": "Tarifa al salir."
}
```

**Errores posibles**:
- `400`: El usuario ya tiene un espacio asignado
- `402`: No tiene solvencia mensual vigente
- `404`: No hay espacios disponibles en el lote

---

### 9. Pagar Tarifa

**Endpoint**: `POST {{baseUrl}}/api/parking/pay`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Body** (raw — JSON):
```json
{
  "parkingLotId": 1
}
```

> ⚠️ Rate limit: **3 intentos** por minuto.

**Respuesta Exitosa** (200):
```json
{
  "message": "Pago realizado con éxito",
  "amount": 15.50,
  "space": "A-5",
  "details": {
    "totalAmount": 15.50,
    "duration": "3h 5min"
  }
}
```

---

### 10. Liberar Espacio (Salida)

**Endpoint**: `POST {{baseUrl}}/api/parking/release`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Body**: No requiere  

**Respuesta Exitosa** (200):
```json
{
  "message": "¡Salida exitosa! Espacio A-5 liberado."
}
```

---

### 11. Estado del Parqueo (Dashboard)

**Endpoint**: `GET {{baseUrl}}/api/parking/status`

**Headers**:
```
Authorization: Bearer {{token}}
```

> ⚠️ Requiere rol: `admin`, `guard` o `faculty`.

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": [
    {
      "lotId": 1,
      "name": "Lote Norte",
      "totalSpaces": 50,
      "occupiedSpaces": 27,
      "availableSpaces": 23,
      "occupancyRate": "54%"
    }
  ]
}
```

---

### 12. Abrir Barrera del Parqueo

**Endpoint**: `POST {{baseUrl}}/api/parking/gate/open`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Body** (raw — JSON, opcional):
```json
{
  "gate": "GATE_MAIN_ENTRY"
}
```

**Valores de `gate`**: `GATE_MAIN_ENTRY` | `GATE_MAIN_EXIT`  
> ⚠️ Rate limit: **5 aperturas** por minuto por usuario.

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "message": "Barrera abierta"
}
```

---

## 💳 Solvencia Mensual

### 13. Actualizar Solvencia de un Usuario

**Endpoint**: `PUT {{baseUrl}}/api/parking/solvency/:userId`

**Headers**:
```
Authorization: Bearer {{token}}
```

> ⚠️ Requiere rol: `admin` o `guard`.

**Body** (raw — JSON, opcional):
```json
{
  "months": 1
}
```

`months` puede ser entre 1 y 12. Por defecto: 1.

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "message": "Solvencia actualizada correctamente por 1 mes(es)",
  "user": {
    "id": 1,
    "name": "Carmen Lopez",
    "email": "carmen@miumg.edu.gt",
    "cardId": "12345678",
    "isSolvent": true,
    "solvencyExpires": "2026-03-21T17:11:00.000Z"
  }
}
```

---

### 14. Consultar Solvencia por Carné

**Endpoint**: `GET {{baseUrl}}/api/parking/solvency/:cardId`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Ejemplo**: `GET {{baseUrl}}/api/parking/solvency/12345678`

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Carmen Lopez",
    "email": "carmen@miumg.edu.gt",
    "role": "student",
    "cardId": "12345678",
    "vehiclePlate": "UMG-001",
    "currentParkingSpace": null
  },
  "solvency": {
    "isSolvent": true,
    "isExemptRole": false,
    "solvencyExpires": "2026-03-21T17:11:00.000Z",
    "daysRemaining": 28,
    "status": "VIGENTE (28 días restantes)"
  }
}
```

---

### 15. Reporte de Solvencia (Admin)

**Endpoint**: `GET {{baseUrl}}/api/parking/solvency-report`

**Headers**:
```
Authorization: Bearer {{token}}
```

> ⚠️ Requiere rol: `admin`.

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "summary": {
    "total": 120,
    "solvent": 95,
    "expired": 25
  },
  "data": [
    {
      "id": 1,
      "name": "Carmen Lopez",
      "cardId": "12345678",
      "vehiclePlate": "UMG-001",
      "isSolvent": true,
      "solvencyExpires": "2026-03-21T17:11:00.000Z",
      "daysRemaining": 28,
      "status": "VIGENTE"
    }
  ]
}
```

---

## 🧾 Facturas

### 16. Generar Factura / Comprobante de Pago

**Endpoint**: `POST {{baseUrl}}/api/invoices/generate`

**Headers**:
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

> ⚠️ Llamar después de registrar el pago con `/api/parking/pay`.

**Body** (raw — JSON):
```json
{
  "parkingLotId": 1,
  "amount": 15.50,
  "duration_minutes": 185
}
```

**Respuesta Exitosa** (201):
```json
{
  "message": "Factura generada exitosamente",
  "invoice": {
    "id": "FEL-SIM-839274",
    "userId": 1,
    "amount": 15.50,
    "status": "PAID",
    "issuedAt": "2026-02-21T18:00:00.000Z"
  },
  "pdfBase64": "JVBERi0xLjMK..."
}
```

> El campo `pdfBase64` contiene el PDF codificado en Base64. Puedes decodificarlo y descargarlo directamente desde el frontend.

---

## 📡 IoT / Cámaras LPR

### 17. Evento de Reconocimiento de Placa

**Endpoint**: `POST {{baseUrl}}/api/iot/lpr/event`

> ⚠️ Este endpoint es para las cámaras LPR (License Plate Recognition). En producción debe protegerse con API Key o firma HMAC.

**Body** (raw — JSON):
```json
{
  "plate": "UMG-001",
  "camera_id": "CAM-ENTRY-01",
  "event_type": "ENTRY",
  "timestamp": "2026-02-21T17:00:00Z"
}
```

**Valores de `event_type`**: `ENTRY` | `EXIT`

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "message": "Evento LPR procesado",
  "action": "ASSIGN",
  "space": "A-5"
}
```

---

## ❤️ Health Checks

### 18. Estado General

**Endpoint**: `GET {{baseUrl}}/health`

**Respuesta Exitosa** (200):
```json
{
  "status": "healthy",
  "uptime": 12345,
  "timestamp": "2026-02-21T17:00:00.000Z"
}
```

---

### 19. Liveness Probe

**Endpoint**: `GET {{baseUrl}}/health/liveness`

**Respuesta Exitosa** (200):
```json
{ "status": "alive" }
```

---

### 20. Readiness Probe

**Endpoint**: `GET {{baseUrl}}/health/readiness`

**Respuesta Exitosa** (200):
```json
{
  "status": "healthy",
  "checks": {
    "database": "connected (PostgreSQL)",
    "redis": "connected"
  },
  "timestamp": "2026-02-21T17:00:00.000Z"
}
```

---

## 🔄 Flujo de Prueba Completo

### Escenario 1: Estudiante — Ciclo Completo

```
1. POST /api/auth/register       → Crear cuenta
2. POST /api/auth/login          → Obtener JWT  ← guarda token
3. GET  /api/auth/me             → Ver perfil
4. (Admin) PUT /api/parking/solvency/:userId  → Marcar solvente
5. GET  /api/parking/lots        → Elegir lote (id: 1)
6. POST /api/parking/assign      → Entrar al parqueo  { "parkingLotId": 1 }
7. POST /api/parking/pay         → Pagar tarifa       { "parkingLotId": 1 }
8. POST /api/invoices/generate   → Generar comprobante
9. POST /api/parking/release     → Salir del parqueo
```

---

### Escenario 2: Admin — Monitoreo y Solvencia

Primero, promover un usuario a admin directamente en PostgreSQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@miumg.edu.gt';
```

```
1. POST /api/auth/login               → Login como admin
2. GET  /api/parking/status           → Ver dashboard de ocupación
3. GET  /api/parking/solvency-report  → Ver reporte de solvencias
4. PUT  /api/parking/solvency/5       → Marcar solvente al usuario id=5
5. GET  /api/parking/solvency/12345678 → Verificar solvencia por carné
```

---

### Escenario 3: Cámara LPR — Entrada/Salida Automática

```
1. POST /api/iot/lpr/event  { "plate": "UMG-001", "event_type": "ENTRY", "camera_id": "CAM-01" }
   → Asigna espacio automáticamente si el usuario es solvente
2. POST /api/iot/lpr/event  { "plate": "UMG-001", "event_type": "EXIT", "camera_id": "CAM-01" }
   → Libera espacio y calcula tarifa
```

---

## ⚙️ Automatización en Postman

### Auto-guardar Token al hacer Login

En la pestaña **Tests** del request de login:

```javascript
if (pm.response.code === 200) {
    const r = pm.response.json();
    pm.environment.set("token", r.token);
    pm.environment.set("refreshToken", r.refreshToken);
    console.log("✅ Tokens guardados");
}
```

### Verificar Token antes de cada Request

En la pestaña **Pre-request Script** de cualquier request protegido:

```javascript
if (!pm.environment.get("token")) {
    console.error("❌ No hay token. Debes hacer login primero.");
}
```

### Estructura Recomendada de la Colección

```
📁 Sistema de Parqueo UMG v2.0
  📁 1. Autenticación
    POST  - Registrar Usuario
    POST  - Login
    GET   - Mi Perfil
    POST  - Refresh Token
    POST  - Logout
    POST  - Google OAuth
  📁 2. Parqueo
    GET   - Listar Lotes
    POST  - Asignar Espacio (Entrada)
    POST  - Pagar Tarifa
    POST  - Liberar Espacio (Salida)
    GET   - Estado / Dashboard (Admin)
    POST  - Abrir Barrera
  📁 3. Solvencia
    PUT   - Actualizar Solvencia
    GET   - Consultar por Carné
    GET   - Reporte General (Admin)
  📁 4. Facturas
    POST  - Generar Factura
  📁 5. IoT / Cámaras
    POST  - Evento LPR
  📁 6. Simulación
    POST  - Simular Lote Lleno
    POST  - Vaciar Lote
  📁 7. Health
    GET   - Estado General
    GET   - Liveness
    GET   - Readiness
```

---

## 🐛 Errores Comunes

| Código | Causa | Solución |
|--------|-------|----------|
| `401 Unauthorized` | Token no enviado o vencido | Verifica `Authorization: Bearer {{token}}` o renueva con `/api/auth/refresh` |
| `402 Payment Required` | Estudiante sin solvencia mensual | Un admin/guard debe ejecutar `PUT /api/parking/solvency/:userId` |
| `403 Forbidden` | Rol insuficiente | Verifica que el usuario tenga el rol requerido |
| `409 Conflict` | Email o carné ya registrado | Usa otro email/carné |
| `429 Too Many Requests` | Rate limit excedido | Espera el tiempo indicado en el encabezado `Retry-After` |
| `400 Bad Request` | Datos inválidos | Revisa el mensaje de error en la respuesta |

---

## 📝 Notas Adicionales

### Duración de Tokens
- **Access Token**: 15 minutos
- **Refresh Token**: 7 días

### Roles y Permisos
| Rol | Parqueo | Solvencia | Dashboard | Admin |
|-----|---------|-----------|-----------|-------|
| `student` | ✅ (con solvencia) | Solo ver la propia | ❌ | ❌ |
| `faculty` | ✅ (exento) | Solo ver la propia | ✅ | ❌ |
| `guard` | ✅ (exento) | Actualizar y ver | ✅ | ❌ |
| `admin` | ✅ (exento) | Total | ✅ | ✅ |

### Acceso a la Documentación Completa
La documentación Swagger interactiva está disponible en:  
**[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

---

**Documentación actualizada**: 21 de febrero de 2026  
**Versión del Sistema**: 2.0.0  
**Soporte**: soporte@miumg.edu.gt
