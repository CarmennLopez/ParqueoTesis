# Guía de Instalación: Entorno de Desarrollo Local UMG

## 📋 Prerequisitos

- **Node.js:** v18 o superior
- **Windows 10/11** con PowerShell
- **Git:** Para control de versiones
- **VS Code:** (Recomendado)

---

## 🔧 Paso 1: Instalar MongoDB Local

### Opción A: Instalador Oficial (Recomendado)

1. Descargar MongoDB Community Server desde:
   - https://www.mongodb.com/try/download/community
   - Versión: **7.0 o superior**
   - OS: **Windows**

2. Ejecutar instalador:
   - ✅ Instalar como servicio de Windows
   - ✅ Incluir MongoDB Compass (GUI opcional)
   - Directorio de datos: `C:\data\db`

3. Verificar instalación:
```powershell
# Abrir PowerShell como Administrador
mongod --version
# Debe mostrar: db version v7.x.x

# El servicio debe estar corriendo automáticamente
# Verificar en Servicios de Windows: MongoDB Server
```

### Opción B: Chocolatey (Instalador de paquetes)

```powershell
# Si tienes Chocolatey instalado
choco install mongodb

# Crear directorio de datos
New-Item -Path C:\data\db -ItemType Directory -Force

# Iniciar MongoDB manualmente
mongod --dbpath C:\data\db
```

### Verificar Conexión

```powershell
# Abrir MongoDB Shell
mongosh

# Deberías ver:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/?directConnection=true

# Salir
exit
```

---

## 💾 Paso 2: Instalar Redis (Memurai para Windows)

Redis no tiene soporte oficial para Windows, usaremos **Memurai** (fork compatible 100% con Redis).

### Opción A: Instalador Memurai (Recomendado)

1. Descargar Memurai Developer desde:
   - https://www.memurai.com/get-memurai
   - Versión: **Developer Edition (Gratis)**

2. Ejecutar instalador:
   - ✅ Instalar como servicio de Windows
   - Puerto por defecto: **6379**

3. Verificar instalación:
```powershell
# Abrir PowerShell
memurai-cli ping
# Debe retornar: PONG

# O si instalaste con nombre redis-cli:
redis-cli ping
```

### Opción B: Chocolatey

```powershell
choco install memurai-developer

# Verificar
memurai-cli ping
```

### Opción C: Redis en WSL2 (Avanzado)

Si prefieres Redis nativo:
```bash
# Desde WSL2 Ubuntu
sudo apt update
sudo apt install redis-server
sudo service redis-server start

# Verificar
redis-cli ping
```

> **Nota:** Si usas WSL2, cambiar en `.env`: `REDIS_URL=redis://localhost:6379` (funcionará si WSL está configurado para exponer puertos)

---

## 📦 Paso 3: Configurar el Proyecto

### Clonar el repositorio (si aplica)
```powershell
cd C:\Users\azuce\OneDrive\Escritorio
git clone <tu-repo-url> TesisProyect
cd TesisProyect
```

### Instalar dependencias Node.js
```powershell
npm install
```

### Crear archivo `.env`

Copiar `.env.example` a `.env`:
```powershell
Copy-Item .env.example .env
```

Editar `.env` con tus valores locales:
```bash
# .env (Desarrollo Local)
NODE_ENV=development
PORT=3000

# MongoDB Local
MONGODB_URI=mongodb://localhost:27017/parqueo_umg

# Redis Local
REDIS_URL=redis://localhost:6379

# JWT (Cambiar en producción)
JWT_SECRET=umg_parking_dev_secret_2025
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# CORS (Permite localhost para desarrollo)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8100,http://localhost:4200

# Simulación IoT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_SIMULATION_MODE=true

# Simulación FEL
FEL_SIMULATION_MODE=true
FEL_PROVIDER=INFILE_GUATEMALA

# Simulación LDAP
LDAP_SIMULATION_MODE=true
LDAP_SERVER_URL=ldap://localhost:389
LDAP_BASE_DN=dc=umg,dc=edu,dc=gt

# Logging
LOG_LEVEL=debug

# Parking Config
PARKING_LOT_NAME=Parqueo Principal UMG
```

---

## 🌱 Paso 4: Poblar Base de Datos (Seeding)

```powershell
# Ejecutar el script de semillas
npm run seed
```

Esto creará:
- ✅ Usuarios de prueba (estudiante, catedrático, admin)
- ✅ Lote de parqueo con espacios inicial
- ✅ Datos de ejemplo

---

## 🚀 Paso 5: Iniciar el Servidor

### Desarrollo (con auto-reload)
```powershell
npm run dev
```

### Producción Local
```powershell
npm start
```

Deberías ver:
```
🚀 Servidor escuchando en http://localhost:3000
✅ Conectado a la base de datos de MongoDB
📝 Modo: development
```

---

## ✅ Verificar Instalación

### Test 1: Health Check
```powershell
# En navegador o con curl/Invoke-WebRequest
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "uptime": 12.345,
  "timestamp": 1732676400000,
  "environment": "development"
}
```

### Test 2: Endpoint de Bienvenida
```powershell
curl http://localhost:3000/
```

Respuesta:
```json
{
  "message": "¡API de parqueo funcionando!",
  "version": "1.0.0",
  "status": "active",
  "endpoints": {
    "auth": "/api/auth",
    "parking": "/api/parking",
    "health": "/health"
  }
}
```

### Test 3: Login de Prueba
```powershell
# Usar Postman, Insomnia, o curl
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@umg.edu.gt",
    "password": "Admin2025!"
  }'
```

---

## 🛠️ Herramientas Recomendadas

### MongoDB Compass (GUI)
- Explorar base de datos visualmente
- Ejecutar queries manualmente
- Crear índices
- Descargar: https://www.mongodb.com/products/compass

### Redis Commander (GUI para Redis)
```powershell
# Instalar globalmente
npm install -g redis-commander

# Iniciar
redis-commander --redis-port 6379

# Abrir en navegador: http://localhost:8081
```

### Postman / Insomnia
- Probar endpoints API
- Guardar colecciones de requests
- Scripts de automatización

---

## 🐛 Solución de Problemas

### MongoDB no inicia

**Error:** `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`

**Solución:**
```powershell
# Verificar servicio de Windows
Get-Service MongoDB

# Si está detenido, iniciarlo
Start-Service MongoDB

# O manualmente:
mongod --dbpath C:\data\db
```

### Redis/Memurai no responde

**Error:** `Error: Redis connection to localhost:6379 failed`

**Solución:**
```powershell
# Verificar servicio
Get-Service Memurai

# Iniciar si está detenido
Start-Service Memurai

# Verificar puerto
netstat -ano | findstr :6379
```

### Puerto 3000 en uso

**Error:** `EADDRINUSE: address already in use :::3000`

**Solución:**
```powershell
# Encontrar proceso usando puerto 3000
netstat -ano | findstr :3000

# Matar proceso (reemplazar <PID> con el número de la última columna)
taskkill /PID <PID> /F

# O cambiar puerto en .env
PORT=3001
```

---

## 📚 Próximos Pasos

Una vez verificada la instalación:

1. **Explorar la API** con Postman usando los ejemplos del `README.md`
2. **Revisar logs** en `./logs/` para entender el flujo
3. **Estudiar el código** empezando por `server.js` → `routes` → `controllers`
4. **Comenzar Fase 1** del plan de modernización

---

## 🔗 Referencias Útiles

- **Documentación MongoDB:** https://www.mongodb.com/docs/manual/
- **Documentación Redis:** https://redis.io/docs/
- **Memurai Docs:** https://docs.memurai.com/
- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices
- **Express.js Guide:** https://expressjs.com/en/guide/routing.html

---

**¿Todo funcionando?** ✅ Estás listo para comenzar el desarrollo enterprise 🚀
