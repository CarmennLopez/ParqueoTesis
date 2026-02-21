# Guía de Instalación: Entorno de Desarrollo Local UMG

## 📋 Prerequisitos

- **Node.js:** v18 o superior
- **Windows 10/11** con PowerShell
- **Git:** Para control de versiones
- **VS Code:** (Recomendado)

---

## 🔧 Paso 1: Instalar PostgreSQL Local

### Opción A: Instalador Oficial

1. Descargar PostgreSQL desde:
   - https://www.postgresql.org/download/windows/
   - Versión: **14 o superior**
   - OS: **Windows**

2. Ejecutar instalador:
   - Seguir los pasos del asistente.
   - Recordar la contraseña del superusuario (`postgres`).
   - Puerto por defecto: **5432**.

3. Verificar instalación:
```powershell
# Abrir PowerShell
psql --version
# Debe mostrar: psql (PostgreSQL) ...
```

### Verificar Conexión

```powershell
# Conectar con psql (ajustar ruta si cambia la versión)
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1

# Deberías ver el prompt:
# psql (PostgreSQL) 14.x...
# postgres=#

# Listar bases de datos
\l

# Salir
\q
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

# PostgreSQL Local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=

# Redis Local
REDIS_URL=redis://localhost:6379

# JWT (Cambiar en producción)
JWT_SECRET=umg_parking_dev_secret_2025
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# CORS (Permite localhost para desarrollo)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8100,http://localhost:4200

# Simulación IoT
MQTT_SIMULATION_MODE=true

# Simulación FEL
FEL_SIMULATION_MODE=true

# Simulación LDAP
LDAP_SIMULATION_MODE=true

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
✅ Conectado a la base de datos PostgreSQL (parking_db)
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

### pgAdmin (GUI para PostgreSQL)
- Explorar y administrar la base de datos visualmente
- Ejecutar queries SQL manualmente
- Crear y gestionar índices
- Descargar: https://www.pgadmin.org/download/

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

### PostgreSQL no inicia

**Error:** `SequelizeConnectionRefusedError: connect ECONNREFUSED 127.0.0.1:5432`

**Solución:**
```powershell
# Verificar servicio de Windows
Get-Service postgresql*

# Si está detenido, iniciarlo
Start-Service postgresql-x64-18

# O desde el Panel de Control → Servicios
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

- **Documentación PostgreSQL:** https://www.postgresql.org/docs/
- **Documentación Sequelize:** https://sequelize.org/docs/v6/
- **Documentación Redis:** https://redis.io/docs/
- **Memurai Docs:** https://docs.memurai.com/
- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices
- **Express.js Guide:** https://expressjs.com/en/guide/routing.html

---

**¿Todo funcionando?** ✅ Estás listo para comenzar el desarrollo enterprise 🚀
