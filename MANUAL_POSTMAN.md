# Manual de Pruebas con Postman - API Sistema de Parqueo UMG

**Version**: 2.0.0  
**URL Base**: `http://localhost:3000`

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Endpoints de Autenticación](#endpoints-de-autenticación)
3. [Endpoints de Parqueo](#endpoints-de-parqueo)
4. [Endpoints de Facturas](#endpoints-de-facturas)
5. [Health Checks](#health-checks)
6. [Flujo de Prueba Completo](#flujo-de-prueba-completo)
7. [Automatización en Postman](#automatización-en-postman)

---

## 🚀 Configuración Inicial

### Requisitos Previos
- ✅ Servidor corriendo: `npm run dev`
- ✅ Base de datos inicializada: `npm run seed`
- ✅ Postman instalado

### Configurar Environment en Postman

1. Crear un nuevo Environment llamado "Parqueo Local"
2. Agregar estas variables:

| Variable | Valor Inicial |
|----------|---------------|
| `baseUrl` | `http://localhost:3000` |
| `token` | (dejar vacío) |
| `refreshToken` | (dejar vacío) |

---

## 🔐 Endpoints de Autenticación

### 1. Registrar Usuario

**Endpoint**: `POST {{baseUrl}}/api/auth/register`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw - JSON):
```json
{
  "name": "Juan Pérez",
  "email": "juan@miumg.edu.gt",
  "password": "Password123",
  "cardId": "CARD001",
  "vehiclePlate": "ABC123",
  "role": "student"
}
```

**Parámetros Opcionales**:
- `role`: `student` | `faculty` | `visitor` | `guard` | `admin` (por defecto: `student`)

**Validaciones**:
- ✅ Nombre: 2-50 caracteres
- ✅ Email: formato válido
- ✅ Password: mínimo 8 caracteres, debe incluir mayúscula, minúscula y número
- ✅ CardId: 4-20 caracteres
- ✅ VehiclePlate: 6-8 caracteres alfanuméricos

**Respuesta Exitosa** (201):
```json
{
  "_id": "692cb50d5b37a245f8e8b44a",
  "name": "Juan Pérez",
  "email": "juan@miumg.edu.gt",
  "role": "student",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Iniciar Sesión (Login)

**Endpoint**: `POST {{baseUrl}}/api/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw - JSON):
```json
{
  "email": "juan@miumg.edu.gt",
  "password": "Password123"
}
```

**Respuesta Exitosa** (200):
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@miumg.edu.gt",
  "role": "student",
  "hasPaid": false,
  "currentParkingSpace": null,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "ae56dfee169265d28277bf8d3817a6ff..."
}
```

**⚠️ Importante**: 
- Guarda el `accessToken` para usarlo en requests protegidos
- El `refreshToken` sirve para renovar el token cuando expire
- Rate limit: 5 intentos cada 15 minutos

**Script de Postman** (pestaña Tests):
```javascript
// Auto-guardar tokens en variables de entorno
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.accessToken);
    pm.environment.set("refreshToken", response.refreshToken);
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
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@miumg.edu.gt",
  "role": "student",
  "cardId": "CARD001",
  "vehiclePlate": "ABC123",
  "currentParkingSpace": null,
  "hasPaid": false,
  "entryTime": null
}
```

---

### 4. Renovar Access Token

**Endpoint**: `POST {{baseUrl}}/api/auth/refresh`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw - JSON):
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Respuesta Exitosa** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "nuevo_refresh_token..."
}
```

---

### 5. Cerrar Sesión (Logout)

**Endpoint**: `POST {{baseUrl}}/api/auth/logout`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw - JSON):
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Respuesta Exitosa** (200):
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

## 🚗 Endpoints de Parqueo

### 6. Asignar Espacio de Parqueo

**Endpoint**: `POST {{baseUrl}}/api/parking/assign`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Body**: No requiere

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "message": "Espacio asignado exitosamente",
  "spaceNumber": "A1",
  "entryTime": "2025-11-30T21:15:06.132Z"
}
```

**Errores Comunes**:
- `400`: Ya tienes un espacio asignado
- `404`: No hay espacios disponibles (parqueo lleno)

---

### 7. Salir del Parqueo (Generar Factura)

**Endpoint**: `POST {{baseUrl}}/api/parking/exit`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Body**: No requiere

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "message": "Salida registrada exitosamente",
  "invoice": {
    "id": 1,
    "userId": 1,
    "parkingSpace": "A1",
    "entryTime": "2025-11-30T21:15:06.132Z",
    "exitTime": "2025-11-30T22:30:15.456Z",
    "duration": "1 hora 15 minutos",
    "amount": 15.50,
    "felNumber": "FEL-2025-001",
    "status": "paid"
  }
}
```

**Errores Comunes**:
- `400`: No tienes un espacio asignado

---

### 8. Ver Estado del Parqueo (Admin/Guard)

**Endpoint**: `GET {{baseUrl}}/api/parking/status`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "parkingLot": {
    "name": "Parqueo Principal UMG",
    "totalSpaces": 10,
    "availableSpaces": 7,
    "occupiedSpaces": 3,
    "spaces": [
      {
        "spaceNumber": "A1",
        "isOccupied": true,
        "occupiedBy": "692cb50d5b37a245f8e8b44a",
        "entryTime": "2025-11-30T21:15:06.132Z"
      },
      {
        "spaceNumber": "A2",
        "isOccupied": false,
        "occupiedBy": null,
        "entryTime": null
      }
    ]
  }
}
```

**⚠️ Requiere**: Rol `admin` o `guard`

---

## 🧾 Endpoints de Facturas

### 9. Listar Mis Facturas

**Endpoint**: `GET {{baseUrl}}/api/invoices`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Query Parameters** (opcionales):
```
?limit=10&page=1&status=paid
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "invoices": [
    {
      "id": 1,
      "parkingSpace": "A1",
      "entryTime": "2025-11-30T21:15:06.132Z",
      "exitTime": "2025-11-30T22:30:15.456Z",
      "amount": 15.50,
      "felNumber": "FEL-2025-001",
      "status": "paid"
    }
  ],
  "total": 1,
  "page": 1
}
```

---

### 10. Obtener Factura PDF

**Endpoint**: `GET {{baseUrl}}/api/invoices/:invoiceId/pdf`

**Headers**:
```
Authorization: Bearer {{token}}
```

**Respuesta**: Archivo PDF descargable

---

## 🏥 Health Checks

### 11. Health Check Simple

**Endpoint**: `GET {{baseUrl}}/health`

**Respuesta Exitosa** (200):
```json
{
  "status": "OK",
  "uptime": 12345,
  "timestamp": "2025-11-30T21:15:06.132Z"
}
```

---

### 12. Health Check Detallado (Readiness)

**Endpoint**: `GET {{baseUrl}}/health/readiness`

**Respuesta Exitosa** (200):
```json
{
  "status": "healthy",
  "checks": {
    "database": "connected (PostgreSQL)",
    "redis": "connected"
  },
  "timestamp": "2025-11-30T21:15:06.132Z"
}
```

---

## 🔄 Flujo de Prueba Completo

### Escenario 1: Usuario Nuevo - Primera Visita

1. **Registrarse**
   ```
   POST /api/auth/register
   ```

2. **Iniciar Sesión**
   ```
   POST /api/auth/login
   ```
   ➡️ Guarda el `accessToken`

3. **Ver Mi Perfil**
   ```
   GET /api/auth/me
   ```

4. **Asignar Espacio**
   ```
   POST /api/parking/assign
   ```
   ➡️ Recibes espacio "A1"

5. **Simular Tiempo de Estacionamiento**
   - Espera unos minutos o continúa inmediatamente

6. **Salir del Parqueo**
   ```
   POST /api/parking/exit
   ```
   ➡️ Genera factura y libera espacio

7. **Ver Mis Facturas**
   ```
   GET /api/invoices
   ```

---

### Escenario 2: Administrador - Monitoreo

1. **Login como Admin** (primero crea un usuario admin en PostgreSQL)
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@miumg.edu.gt';
   ```
   Luego inicia sesión con:
   ```json
   {
     "email": "admin@miumg.edu.gt",
     "password": "Admin2025!"
   }
   ```

2. **Ver Estado del Parqueo**
   ```
   GET /api/parking/status
   ```

---

## ⚙️ Automatización en Postman

### Auto-guardar Token al hacer Login

En la pestaña **Tests** del request de login:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.accessToken);
    pm.environment.set("refreshToken", response.refreshToken);
    console.log("✅ Tokens guardados");
}
```

### Verificar Expiración del Token

En la pestaña **Pre-request Script** de cualquier request protegido:

```javascript
const token = pm.environment.get("token");
if (!token) {
    console.error("❌ No hay token. Debes hacer login primero.");
}
```

### Colección Recomendada

Organiza tus requests en carpetas:

```
📁 Sistema de Parqueo UMG
  📁 1. Autenticación
    - Registrar Usuario
    - Login
    - Mi Perfil
    - Refresh Token
    - Logout
  📁 2. Parqueo
    - Asignar Espacio
    - Salir
    - Ver Estado (Admin)
  📁 3. Facturas
    - Mis Facturas
    - Descargar PDF
  📁 4. Health
    - Health Check
    - Readiness
```

---

## 🐛 Errores Comunes

### 401 Unauthorized
- ❌ Token no enviado o inválido
- ✅ Verifica que el header `Authorization: Bearer {{token}}` esté correcto

### 403 Forbidden
- ❌ No tienes permisos (rol insuficiente)
- ✅ Algunos endpoints requieren rol `admin` o `guard`

### 429 Too Many Requests
- ❌ Excediste el rate limit
- ✅ Espera 15 minutos o reinicia el servidor

### 400 Bad Request
- ❌ Datos de validación incorrectos
- ✅ Revisa el mensaje de error en la respuesta

---

## 📚 Notas Adicionales

### Duración de Tokens
- **Access Token**: 15 minutos
- **Refresh Token**: 7 días

### Tarifas (configurables en `.env`)
- Estudiantes: Q10.00/hora
- Visitantes: Q15.00/hora
- Mensualidad Estudiantes: Q250.00
- Mensualidad Catedráticos: Q150.00

### Roles Disponibles
- `student` - Estudiante (por defecto)
- `faculty` - Catedrático
- `visitor` - Visitante
- `guard` - Guardia de seguridad
- `admin` - Administrador

---

## 🎯 Próximos Pasos

1. Importa esta colección a Postman
2. Configura el Environment
3. Ejecuta el flujo completo
4. Prueba los endpoints de Admin (requiere cambiar rol en PostgreSQL con: `UPDATE users SET role = 'admin' WHERE email = 'admin@miumg.edu.gt';`)
5. Descarga facturas en PDF

---

**Documentación actualizada**: 21 de febrero de 2026  
**Soporte**: soporte@umg.edu.gt
