# 📦 Guía de Instalación — Sistema de Parqueo UMG v2.0

**Stack:** Node.js + Express 5 + PostgreSQL + Sequelize + Redis + Socket.io

---

## 📋 Prerequisitos

| Herramienta | Versión | Para qué se usa |
|---|---|---|
| Node.js | 18+ | Runtime del servidor |
| PostgreSQL | 14+ | Base de datos principal |
| Redis / Memurai | 6+ | Caché, rate limiting, sesiones |
| Git | Cualquiera | Control de versiones |
| npm | 8+ | Gestor de paquetes |

---

## 🗄️ Paso 1: Instalar PostgreSQL

### Descarga
- Instalador oficial: https://www.postgresql.org/download/windows/
- Versión recomendada: **PostgreSQL 15 o 16**

### Durante la instalación
- ✅ Habilitar **pgAdmin 4** (GUI visual)
- ✅ Habilitar **Stack Builder** (para extensiones)
- Puerto por defecto: **5432**
- Apuntar la contraseña del usuario `postgres` — la necesitarás en el `.env`

### Crear la base de datos

Abre **pgAdmin 4** o ejecuta en PowerShell:

```powershell
# Abrir psql
psql -U postgres

# Dentro de psql:
CREATE DATABASE parking_db;
\q
```

### Verificar conexión

```powershell
psql -U postgres -d parking_db -c "SELECT version();"
# Debe mostrar la versión de PostgreSQL instalada
```

---

## 💾 Paso 2: Instalar Redis (Memurai para Windows)

Redis no tiene soporte oficial en Windows. Usamos **Memurai** (compatible 100% con Redis).

### Descargar Memurai
- https://www.memurai.com/get-memurai
- Versión: **Developer Edition (Gratis)**
- Instalar como servicio de Windows (puerto **6379**)

### Verificar

```powershell
memurai-cli ping
# Debe retornar: PONG
```

### Alternativa: Redis en WSL2

```bash
# Desde WSL2 Ubuntu
sudo apt update && sudo apt install redis-server
sudo service redis-server start
redis-cli ping
```

---

## 📦 Paso 3: Configurar el Proyecto

### Clonar el repositorio

```powershell
git clone https://github.com/CarmennLopez/ParqueoTesis.git
cd ParqueoTesis
```

### Instalar dependencias Node.js

```powershell
npm install
```

### Crear archivo `.env`

```powershell
Copy-Item .env.example .env
notepad .env   # Editar con tus valores reales
```

### Configuración completa del `.env`

```env
# =============================================
# BASE DE DATOS POSTGRESQL
# =============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_postgres

# =============================================
# SERVIDOR
# =============================================
PORT=3000
NODE_ENV=development

# =============================================
# AUTENTICACIÓN JWT
# =============================================
JWT_SECRET=genera_una_clave_aleatoria_de_minimo_32_chars
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# =============================================
# REDIS
# =============================================
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# =============================================
# SEGURIDAD
# =============================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:8100
IOT_API_KEY=iot-dev-key-umg-parking-2026

# =============================================
# CONFIGURACIÓN DE PARQUEO
# =============================================
PARKING_LOT_NAME=Parqueo Principal UMG

# =============================================
# MODOS DE SIMULACIÓN
# (true = no requiere hardware real)
# =============================================
MQTT_SIMULATION_MODE=true
FEL_SIMULATION_MODE=true
LDAP_SIMULATION_MODE=true

# =============================================
# GOOGLE OAUTH (Opcional)
# =============================================
# GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com

# =============================================
# LOGGING
# =============================================
LOG_LEVEL=debug
LOG_DIR=./logs

# =============================================
# RATE LIMITING
# =============================================
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🌱 Paso 4: Inicializar la Base de Datos

Las tablas se crean **automáticamente** cuando el servidor arranca en modo desarrollo gracias a `sequelize.sync({ alter: true })`.

Si quieres poblar datos de prueba:

```powershell
# Usuarios de prueba (admin, guard, faculty, student, visitor)
node seeders/seedUsers.js

# Planes de precios (STANDARD_HOURLY, FACULTY_MONTHLY, etc.)
node seeders/seedPricingPlans.js

# Lotes de parqueo con espacios
node seeders/seedParkingLots.js
```

**Usuarios creados por seedUsers.js:**

| Rol | Email | Contraseña |
|---|---|---|
| admin | admin@umg.edu.gt | Admin@12345 |
| guard | guard@umg.edu.gt | Guard@12345 |
| faculty | juan.perez@umg.edu.gt | Faculty@12345 |
| student | carlos.lopez@estudiante.umg.edu.gt | Student@12345 |
| visitor | maria.garcia@external.com | Visitor@12345 |

---

## 🚀 Paso 5: Iniciar el Servidor

### Modo desarrollo (con auto-reload)

```powershell
npm run dev
```

### Salida esperada al arrancar correctamente

```
🔧 MQTT Service iniciado en MODO SIMULACIÓN
🚀 INICIANDO API DE PARQUEO...
📍 URL BASE: /api/parking
📍 AMBIENTE: development
🔗 Conectando a Redis/Memurai...
✅ Redis conectado y listo
✅ Conexión a PostgreSQL establecida correctamente.
🔄 Modelos sincronizados con la base de datos.
🚀 Servidor escuchando en http://localhost:3000
📌 Socket.io listo para conexiones
```

---

## ✅ Verificar Instalación

### Health Check

```powershell
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2026-02-24T20:00:00.000Z",
  "uptime": 15,
  "services": { "database": "connected", "redis": "connected" }
}
```

### Swagger UI

Abre en el navegador: **http://localhost:3000/api-docs**

Debes ver la interfaz interactiva de Swagger con todos los endpoints.

### Test de Login

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@umg.edu.gt","password":"Admin@12345"}'
```

Respuesta esperada: JSON con `accessToken` y `refreshToken`.

---

## 🛠️ Herramientas Recomendadas

### pgAdmin 4 (GUI para PostgreSQL)
- Incluido en el instalador de PostgreSQL
- Explorar tablas, ejecutar SQL, ver datos
- URL: http://localhost:5050 (si instalado como servidor)

### Redis Commander (GUI para Redis)
```powershell
npm install -g redis-commander
redis-commander --redis-port 6379
# Abrir: http://localhost:8081
```

### Swagger UI (incluido en el proyecto)
- **http://localhost:3000/api-docs**
- Prueba todos los endpoints con interfaz visual
- Ver `SWAGGER_GUIDE.md` para flujos de prueba

### DBeaver / TablePlus
- Clientes SQL multiplataforma para PostgreSQL
- Útiles para inspeccionar tablas y datos

---

## 🐛 Solución de Problemas

### Error: `password authentication failed for user "postgres"`
```
Causa: DB_PASSWORD incorrecto en .env
Solución: Verificar la contraseña del usuario postgres en PostgreSQL
```

### Error: `EADDRINUSE: address already in use :::3000`
```powershell
# Identificar proceso usando el puerto 3000
netstat -ano | findstr :3000

# Terminar el proceso (reemplazar <PID>)
taskkill /PID <PID> /F

# O cambiar el puerto en .env:
PORT=3001
```

### Error: Redis `ECONNREFUSED 127.0.0.1:6379`
```powershell
# Verificar si Memurai está corriendo
Get-Service Memurai

# Iniciar si está detenido
Start-Service Memurai

# Verificar puerto
redis-cli ping
```

### Error: `no existe el tipo «geometry»`
```
Causa: Versión antigua del modelo ParkingLot.js con DataTypes.GEOMETRY
Estado: YA CORREGIDO — ahora usa DataTypes.JSONB (no requiere PostGIS)
Solución: Asegúrate de estar usando la versión actualizada del código
```

### Tablas no se crean / Error de sincronización
```powershell
# Verificar que la BD existe
psql -U postgres -c "\l" | Select-String "parking_db"

# Si no existe, crearla:
psql -U postgres -c "CREATE DATABASE parking_db;"

# Reiniciar el servidor para que Sequelize las cree automáticamente
npm run dev
```

### Error: `Module not found`
```powershell
# Reinstalar dependencias
Remove-Item node_modules -Recurse -Force
npm install
```

---

## 📚 Siguiente Paso

Con el servidor corriendo:

1. **Abre Swagger UI**: http://localhost:3000/api-docs
2. **Lee la guía**: [`SWAGGER_GUIDE.md`](./SWAGGER_GUIDE.md)
3. **Flujo básico de prueba**:
   - `POST /api/auth/login` con admin@umg.edu.gt
   - Autoriza en Swagger con el token
   - `GET /api/parking/lots` → ver parqueos
   - `POST /api/parking/assign` → entrar
   - `POST /api/parking/pay` → pagar
   - `POST /api/parking/release` → salir

---

**¿Todo funcionando?** ✅ El sistema está listo para usar 🚀

**Versión:** 2.0.0 | **Última actualización:** Febrero 2026
