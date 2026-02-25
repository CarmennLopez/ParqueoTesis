# Guía Rápida de Verificación

Este documento te ayuda a verificar que el sistema está configurado correctamente.
**Stack actual: Node.js + Express + PostgreSQL + Sequelize + Redis**

---

## ✅ Lista de Verificación Rápida

### 1. Archivos Clave del Proyecto

- [ ] `src/config/constants.js` — Roles, tarifas, JWT, solvencia
- [ ] `src/config/database.js` — Conexión Sequelize/PostgreSQL
- [ ] `src/middleware/authMiddleware.js` — Protección JWT
- [ ] `src/middleware/solvencyMiddleware.js` — Control de solvencia
- [ ] `src/middleware/iotAuthMiddleware.js` — API Key para IoT
- [ ] `src/models/AuditLog.js` — Modelo Sequelize de auditoría
- [ ] `.env` — Variables de entorno

---

### 2. Dependencias Instaladas

```bash
npm install
npm list --depth=0
```

Dependencias clave: `express`, `sequelize`, `pg`, `pg-hstore`, `bcrypt`, `jsonwebtoken`, `ioredis`, `socket.io`, `mqtt`, `helmet`, `cors`, `winston`

---

### 3. Configuración del Entorno

Variables críticas en `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=clave_segura_minimo_32_chars
REDIS_URL=redis://localhost:6379
IOT_API_KEY=iot-dev-key-umg-parking-2026
```

---

### 4. Inicializar la Base de Datos

```bash
# Crear la base de datos en PostgreSQL primero:
# psql -U postgres -c "CREATE DATABASE parking_db;"
# psql -U postgres -d parking_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Luego ejecutar seeds:
npm run seed            # Parqueo principal
npm run seed:users      # Usuarios de prueba
npm run seed:pricing    # Planes de precios
```

Salida esperada al correr seeds:
```
✅ Conectado a PostgreSQL
🎉 Seeding de usuarios completado:
  ✅ admin@umg.edu.gt (admin)
  ✅ guard@umg.edu.gt (guard)
  ...
🔌 Desconectado de PostgreSQL
```

---

### 5. Prueba del Servidor

```bash
npm run dev
```

Debe mostrar:
```
✅ Conexión a PostgreSQL establecida correctamente.
🔄 Modelos sincronizados con la base de datos.
🚀 Servidor escuchando en http://localhost:3000
```

---

### 6. Pruebas de Endpoints

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Registro de Usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Prueba",
    "email": "prueba@test.com",
    "password": "Prueba123",
    "cardId": "CARD001",
    "vehiclePlate": "ABC123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "prueba@test.com", "password": "Prueba123"}'
```

#### Asignar Espacio (requiere token)
```bash
curl -X POST http://localhost:3000/api/parking/assign \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"parkingLotId": 1}'
```

#### Swagger UI (documentación interactiva)
```
http://localhost:3000/api-docs
```

---

### 7. Verificación de Seguridad

- **Rate Limiting Login:** Intenta 6 logins incorrectos seguidos → el 6to debe bloquearte.
- **Solvencia:** Un estudiante sin solvencia al intentar `POST /api/parking/assign` debe recibir `402`.
- **IoT Auth:** `POST /api/iot/lpr/event` sin el header `X-IoT-Api-Key` debe dar `401` (en producción).
- **Roles:** Usuario `student` en `GET /api/parking/status` debe dar `403`.

---

### 8. Verificar Roles de Prueba

Usa `POST /api/auth/switch-role` con `{"role": "admin"}` para cambiar tu rol durante pruebas.

O bien usa la API de administración:
```bash
curl -X PATCH http://localhost:3000/api/parking/admin/users/2/role \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"role": "guard"}'
```

---

## ⚠️ Problemas Comunes

### Error de conexión a PostgreSQL
- Verifica que PostgreSQL está corriendo: `pg_ctl status` o `net start postgresql`
- Verifica `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` en `.env`

### Error PostGIS
```sql
-- Conectar a la BD y ejecutar:
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Error de Redis
- Verifica que Redis está corriendo: `redis-cli ping` debe responder `PONG`
- Si no tienes Redis puedes deshabilitarlo temporalmente en el código de caché

### "Parqueo lleno"
- Ejecuta `npm run seed` para reiniciar

### Logs no se crean
- Winston crea el directorio `logs/` automáticamente

---

## ✨ Todo Funciona

Si todas las verificaciones pasaron, ¡el sistema está listo!

**Flujo principal:**
1. Registro / Login
2. `GET /api/parking/lots` → ver parqueos disponibles
3. `POST /api/parking/assign` → entrar al parqueo
4. `POST /api/parking/pay` → pagar
5. `POST /api/parking/release` → salir

Para referencia completa de endpoints: `PROJECT_DOCUMENTATION.md`
