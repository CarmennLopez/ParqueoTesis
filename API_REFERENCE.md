# API Reference — Sistema de Parqueo UMG

**Versión**: 2.0.0  
**Base URL**: `http://localhost:3000`  
**Swagger UI**: [`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)  
**Formato**: JSON (`Content-Type: application/json`)

---

## Índice

| # | Módulo | Método | Ruta | Auth |
|---|--------|--------|------|------|
| 1 | Auth | `POST` | `/api/auth/register` | ❌ |
| 2 | Auth | `POST` | `/api/auth/login` | ❌ |
| 3 | Auth | `POST` | `/api/auth/refresh` | ❌ |
| 4 | Auth | `POST` | `/api/auth/logout` | ✅ |
| 5 | Auth | `GET` | `/api/auth/me` | ✅ |
| 6 | Auth | `POST` | `/api/auth/google` | ❌ |
| 7 | Parqueo | `GET` | `/api/parking/lots` | ✅ |
| 8 | Parqueo | `POST` | `/api/parking/lots` | ✅ Admin |
| 9 | Parqueo | `POST` | `/api/parking/assign` | ✅ |
| 10 | Parqueo | `POST` | `/api/parking/pay` | ✅ |
| 11 | Parqueo | `POST` | `/api/parking/release` | ✅ |
| 12 | Parqueo | `GET` | `/api/parking/status` | ✅ Admin/Guard/Faculty |
| 13 | Parqueo | `POST` | `/api/parking/gate/open` | ✅ Todos |
| 14 | Solvencia | `PUT` | `/api/parking/solvency/:userId` | ✅ Admin/Guard |
| 15 | Solvencia | `GET` | `/api/parking/solvency/:cardId` | ✅ |
| 16 | Solvencia | `GET` | `/api/parking/solvency-report` | ✅ Admin |
| 17 | Simulación | `POST` | `/api/parking/simulate/fill` | ✅ |
| 18 | Simulación | `POST` | `/api/parking/simulate/empty` | ✅ |
| 19 | Facturas | `POST` | `/api/invoices/generate` | ✅ |
| 20 | IoT | `POST` | `/api/iot/lpr/event` | ❌ |
| 21 | Health | `GET` | `/health` | ❌ |
| 22 | Health | `GET` | `/health/liveness` | ❌ |
| 23 | Health | `GET` | `/health/readiness` | ❌ |

> **Auth**: Enviar header `Authorization: Bearer <token>` en todos los endpoints marcados con ✅.

---

## 🔐 Autenticación

### 1. Registrar Usuario
`POST /api/auth/register`

Crea una nueva cuenta. El rol por defecto es `student`.

**Body**:
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

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ | Nombre completo (2–50 caracteres) |
| `email` | string | ✅ | Correo electrónico válido |
| `password` | string | ✅ | Mín. 8 chars, mayúscula + minúscula + número |
| `card_id` | string | ✅ | Número de carné único |
| `vehicle_plate` | string | ✅ | Placa del vehículo única |
| `role` | string | ❌ | `student` \| `faculty` \| `guard` \| `admin` (default: `student`) |

**Respuesta 201**:
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

| Código | Motivo |
|--------|--------|
| `201` | Usuario creado exitosamente |
| `400` | Datos inválidos (validación fallida) |
| `409` | El correo o carné ya está registrado |

---

### 2. Iniciar Sesión
`POST /api/auth/login`

Autentica al usuario y retorna un **access token** (15 min) y un **refresh token** (7 días).

> ⚠️ Rate limit: **5 intentos** cada 15 minutos.

**Body**:
```json
{
  "email": "carmen@miumg.edu.gt",
  "password": "Password123!"
}
```

**Respuesta 200**:
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

| Código | Motivo |
|--------|--------|
| `200` | Login exitoso |
| `401` | Credenciales inválidas |
| `429` | Rate limit excedido (5 intentos / 15 min) |

---

### 3. Renovar Access Token
`POST /api/auth/refresh`

Genera un nuevo access token usando el refresh token.

**Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respuesta 200**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Código | Motivo |
|--------|--------|
| `200` | Nuevo token generado |
| `401` | Refresh token inválido o expirado |

---

### 4. Cerrar Sesión
`POST /api/auth/logout` 🔒

Invalida el refresh token en la base de datos.

**Body** *(opcional)*:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respuesta 200**:
```json
{
  "success": true,
  "message": "Sesión cerrada"
}
```

| Código | Motivo |
|--------|--------|
| `200` | Sesión cerrada |
| `401` | Token JWT inválido o expirado |

---

### 5. Obtener Perfil del Usuario
`GET /api/auth/me` 🔒

Retorna los datos del usuario autenticado.

**Respuesta 200**:
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

| Código | Motivo |
|--------|--------|
| `200` | Datos del usuario |
| `401` | Token inválido o expirado |

---

### 6. Login con Google OAuth2
`POST /api/auth/google`

Autentica mediante un token de Google. Solo acepta correos `@miumg.edu.gt`.

**Body**:
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Respuesta 200**: igual que `/api/auth/login`

| Código | Motivo |
|--------|--------|
| `200` | Login exitoso |
| `400` | Token inválido o correo no institucional |

---

## 🅿️ Parqueo

### 7. Listar Lotes de Parqueo
`GET /api/parking/lots` 🔒

Retorna todos los lotes con disponibilidad en tiempo real.

**Respuesta 200**:
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

| Código | Motivo |
|--------|--------|
| `200` | Lista de lotes |
| `401` | No autenticado |

---

### 8. Crear Lote de Parqueo
`POST /api/parking/lots` 🔒 `admin`

Crea un nuevo lote con sus espacios.

**Body**:
```json
{
  "name": "Lote Norte",
  "total_spaces": 50,
  "hourly_rate": 5.00,
  "location": { "lat": 14.6349, "lng": -90.5069 }
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ | Nombre único del lote |
| `total_spaces` | integer | ✅ | Total de espacios |
| `hourly_rate` | number | ✅ | Tarifa por hora en Quetzales |
| `location` | object | ❌ | Coordenadas GPS `{ lat, lng }` |

**Respuesta 201**:
```json
{
  "success": true,
  "message": "Lote creado exitosamente"
}
```

| Código | Motivo |
|--------|--------|
| `201` | Lote creado |
| `400` | Datos inválidos |
| `401` | No autenticado |
| `403` | Rol insuficiente (requiere admin) |

---

### 9. Asignar Espacio — Entrada
`POST /api/parking/assign` 🔒

Asigna el primer espacio libre del lote al usuario. Los estudiantes requieren **solvencia mensual vigente**.

**Body**:
```json
{
  "parkingLotId": 1
}
```

**Respuesta 200**:
```json
{
  "message": "Espacio asignado con éxito",
  "parkingLot": "Lote Norte",
  "space": "A-5",
  "entryTime": "2026-02-21T17:00:00.000Z",
  "info": "Tarifa al salir."
}
```

| Código | Motivo |
|--------|--------|
| `200` | Espacio asignado |
| `400` | El usuario ya tiene espacio asignado |
| `401` | No autenticado |
| `402` | Estudiante sin solvencia mensual vigente |
| `404` | No hay espacios disponibles en el lote |

---

### 10. Pagar Tarifa
`POST /api/parking/pay` 🔒

Registra el pago calculando la tarifa por tiempo de permanencia. Llamar **antes** de `/release`.

> ⚠️ Rate limit: **3 intentos** por minuto.

**Body**:
```json
{
  "parkingLotId": 1
}
```

**Respuesta 200**:
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

| Código | Motivo |
|--------|--------|
| `200` | Pago registrado |
| `400` | No tiene espacio asignado, o ya pagó |
| `401` | No autenticado |
| `429` | Rate limit excedido |

---

### 11. Liberar Espacio — Salida
`POST /api/parking/release` 🔒

Registra la salida, libera el espacio y abre la barrera de salida vía MQTT.

**Body**: No requiere

**Respuesta 200**:
```json
{
  "message": "¡Salida exitosa! Espacio A-5 liberado."
}
```

| Código | Motivo |
|--------|--------|
| `200` | Salida exitosa |
| `400` | No tiene espacio asignado |
| `401` | No autenticado |

---

### 12. Estado del Parqueo (Dashboard)
`GET /api/parking/status` 🔒 `admin` `guard` `faculty`

Retorna el estado de ocupación de todos los lotes.

**Respuesta 200**:
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

| Código | Motivo |
|--------|--------|
| `200` | Estado del parqueo |
| `401` | No autenticado |
| `403` | Rol insuficiente |

---

### 13. Abrir Barrera
`POST /api/parking/gate/open` 🔒 `admin` `guard` `faculty` `student`

Envía señal MQTT para abrir la barrera de entrada o salida.

> ⚠️ Rate limit: **5 aperturas** por minuto por usuario.

**Body** *(opcional)*:
```json
{
  "gate": "GATE_MAIN_ENTRY"
}
```

| Campo | Tipo | Valores válidos | Default |
|-------|------|-----------------|---------|
| `gate` | string | `GATE_MAIN_ENTRY` \| `GATE_MAIN_EXIT` | `GATE_MAIN_ENTRY` |

**Respuesta 200**:
```json
{
  "success": true,
  "message": "Barrera abierta"
}
```

| Código | Motivo |
|--------|--------|
| `200` | Señal enviada |
| `401` | No autenticado |
| `403` | Rol insuficiente |
| `429` | Rate limit excedido |

---

## 💳 Solvencia Mensual

### 14. Actualizar Solvencia
`PUT /api/parking/solvency/:userId` 🔒 `admin` `guard`

Marca un usuario como solvente por N meses. Si ya tiene solvencia vigente, la extiende desde su fecha actual.

**Parámetro de ruta**:
| Param | Tipo | Descripción |
|-------|------|-------------|
| `userId` | integer | ID numérico del usuario |

**Body** *(opcional)*:
```json
{
  "months": 1
}
```

| Campo | Tipo | Rango | Default |
|-------|------|-------|---------|
| `months` | integer | 1–12 | 1 |

**Respuesta 200**:
```json
{
  "success": true,
  "message": "Solvencia actualizada correctamente por 1 mes(es)",
  "user": {
    "id": 5,
    "name": "Carmen Lopez",
    "email": "carmen@miumg.edu.gt",
    "cardId": "12345678",
    "isSolvent": true,
    "solvencyExpires": "2026-03-21T17:11:00.000Z"
  }
}
```

| Código | Motivo |
|--------|--------|
| `200` | Solvencia actualizada |
| `400` | Meses fuera del rango 1–12 |
| `401` | No autenticado |
| `403` | Rol insuficiente |
| `404` | Usuario no encontrado |

---

### 15. Consultar Solvencia por Carné
`GET /api/parking/solvency/:cardId` 🔒

Consulta el estado de solvencia de un usuario por su número de carné.

**Parámetro de ruta**:
| Param | Tipo | Descripción |
|-------|------|-------------|
| `cardId` | string | Número de carné (ej: `12345678`) |

**Respuesta 200**:
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

> Roles exentos (`faculty`, `guard`, `admin`) devuelven `isExemptRole: true` y `status: "EXEMPT"`.

| Código | Motivo |
|--------|--------|
| `200` | Datos de solvencia |
| `401` | No autenticado |
| `404` | Carné no encontrado |

---

### 16. Reporte de Solvencias
`GET /api/parking/solvency-report` 🔒 `admin`

Reporte completo de todos los estudiantes ordenado por fecha de vencimiento.

**Respuesta 200**:
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
      "email": "carmen@miumg.edu.gt",
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

| Código | Motivo |
|--------|--------|
| `200` | Reporte generado |
| `401` | No autenticado |
| `403` | Rol insuficiente (solo admin) |

---

## 🧪 Simulación

> ⚠️ Solo para entornos de **testing / demo**.

### 17. Simular Lote Lleno
`POST /api/parking/simulate/fill` 🔒

Marca todos los espacios de un lote como ocupados.

**Body**:
```json
{
  "parkingLotId": 1
}
```

**Respuesta 200**:
```json
{
  "success": true,
  "message": "Lote marcado como lleno"
}
```

---

### 18. Simular Lote Vacío
`POST /api/parking/simulate/empty` 🔒

Marca todos los espacios de un lote como disponibles.

**Body**:
```json
{
  "parkingLotId": 1
}
```

**Respuesta 200**:
```json
{
  "success": true,
  "message": "Lote vaciado exitosamente"
}
```

---

## 🧾 Facturas

### 19. Generar Factura
`POST /api/invoices/generate` 🔒

Genera un comprobante de pago FEL simulado con PDF en base64. Llamar después de `/api/parking/pay`.

**Body**:
```json
{
  "parkingLotId": 1,
  "amount": 15.50,
  "duration_minutes": 185
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `parkingLotId` | integer | ✅ | ID del lote |
| `amount` | number | ✅ | Monto a facturar en Quetzales |
| `duration_minutes` | integer | ✅ | Duración de la estadía en minutos |

**Respuesta 201**:
```json
{
  "message": "Factura generada exitosamente",
  "invoice": {
    "id": 1,
    "invoiceNumber": "FEL-SIM-839274",
    "userId": 1,
    "amount": 15.50,
    "status": "PAID",
    "issuedAt": "2026-02-21T18:00:00.000Z",
    "felData": {
      "authorizationUUID": "A1B2C3D4-E5F6-7890-1234-567890ABCDEF",
      "serie": "FEL-SIM",
      "certificationDate": "2026-02-21T18:00:00.000Z"
    }
  },
  "pdfBase64": "JVBERi0xLjMK..."
}
```

> El campo `pdfBase64` contiene el PDF en Base64 para descarga directa en el frontend.

| Código | Motivo |
|--------|--------|
| `201` | Factura generada |
| `400` | Datos inválidos |
| `401` | No autenticado |

---

## 📡 IoT / Cámaras LPR

### 20. Evento de Reconocimiento de Placa
`POST /api/iot/lpr/event`

Recibe eventos de cámaras LPR (License Plate Recognition) y ejecuta entrada o salida automática.

> ⚠️ **Seguridad**: En producción proteger con API Key o firma HMAC. No requiere JWT.

**Body**:
```json
{
  "plate": "UMG-001",
  "camera_id": "CAM-ENTRY-01",
  "event_type": "ENTRY",
  "timestamp": "2026-02-21T17:00:00Z"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `plate` | string | ✅ | Placa detectada por la cámara |
| `camera_id` | string | ✅ | Identificador de la cámara |
| `event_type` | string | ✅ | `ENTRY` → asigna espacio / `EXIT` → libera espacio |
| `timestamp` | string (ISO 8601) | ❌ | Timestamp del evento |

**Flujo automático**:
- `ENTRY` → Busca usuario por placa → Verifica solvencia → Asigna espacio
- `EXIT` → Busca usuario por placa → Libera espacio → Calcula tarifa

**Respuesta 200**:
```json
{
  "success": true,
  "message": "Evento LPR procesado",
  "action": "ASSIGN",
  "space": "A-5"
}
```

| Código | Motivo |
|--------|--------|
| `200` | Evento procesado |
| `400` | Placa no encontrada o datos inválidos |
| `402` | Usuario no solvente (solo en ENTRY) |

---

## ❤️ Health

### 21. Estado General
`GET /health`

**Respuesta 200**:
```json
{
  "status": "healthy",
  "uptime": 12345,
  "version": "2.0.0",
  "timestamp": "2026-02-21T17:00:00.000Z"
}
```

---

### 22. Liveness Probe
`GET /health/liveness`

Indica si el proceso está vivo (para Kubernetes).

**Respuesta 200**:
```json
{ "status": "alive" }
```

---

### 23. Readiness Probe
`GET /health/readiness`

Verifica conectividad con la base de datos y Redis.

**Respuesta 200**:
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

**Respuesta 503** (si algún servicio falla):
```json
{
  "status": "unhealthy",
  "checks": {
    "database": "error: connection refused",
    "redis": "connected"
  }
}
```

---

## 🔑 Roles y Permisos

| Endpoint | student | faculty | guard | admin |
|----------|---------|---------|-------|-------|
| `POST /api/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/parking/lots` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/parking/lots` | ❌ | ❌ | ❌ | ✅ |
| `POST /api/parking/assign` | ✅* | ✅ | ✅ | ✅ |
| `POST /api/parking/pay` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/parking/release` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/parking/status` | ❌ | ✅ | ✅ | ✅ |
| `POST /api/parking/gate/open` | ✅ | ✅ | ✅ | ✅ |
| `PUT /api/parking/solvency/:userId` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/parking/solvency/:cardId` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/parking/solvency-report` | ❌ | ❌ | ❌ | ✅ |
| `POST /api/parking/simulate/*` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/invoices/generate` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/iot/lpr/event` | — | — | — | — |

> \* Los estudiantes requieren solvencia mensual vigente para `/assign`.  
> `—` El endpoint IoT no usa JWT, se protege con API Key en producción.

---

## ⚠️ Códigos de Error Estándar

| Código | Significado |
|--------|-------------|
| `400 Bad Request` | Datos de entrada inválidos o faltantes |
| `401 Unauthorized` | Token JWT ausente, inválido o expirado |
| `402 Payment Required` | Estudiante sin solvencia mensual vigente |
| `403 Forbidden` | Rol sin permisos para este endpoint |
| `404 Not Found` | Recurso no encontrado |
| `409 Conflict` | Recurso duplicado (email/carné ya registrado) |
| `429 Too Many Requests` | Rate limit excedido |
| `500 Internal Server Error` | Error inesperado del servidor |

**Formato de error estándar**:
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

---

## 🔒 Seguridad

| Mecanismo | Detalle |
|-----------|---------|
| **JWT** | Access token expira en **15 minutos** |
| **Refresh Token** | Expira en **7 días**, almacenado en DB |
| **Rate Limit Login** | 5 intentos / 15 min por IP |
| **Rate Limit Pay** | 3 intentos / min por usuario |
| **Rate Limit Gate** | 5 aperturas / min por usuario |
| **Idempotency** | Header `Idempotency-Key` para evitar duplicados |
| **Helmet** | Headers HTTP de seguridad |
| **CORS** | Configurado por `ALLOWED_ORIGINS` en `.env` |

---

**Documentación actualizada**: 21 de febrero de 2026  
**Versión**: 2.0.0 | **Soporte**: soporte@miumg.edu.gt
