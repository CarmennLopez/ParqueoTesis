# Guía Rápida de Verificación

Este documento te ayuda a verificar que todas las mejoras se implementaron correctamente.

## ✅ Lista de Verificación Rápida

### 1. Archivos Creados/Modificados

Verifica que existen estos archivos:

**Nuevos archivos:**
- [ ] `src/config/constants.js`
- [ ] `src/config/logger.js`
- [ ] `src/middleware/errorHandler.js`
- [ ] `src/middleware/authorize.js`
- [ ] `src/utils/ApiError.js`
- [ ] `README.md`
- [ ] `.env.example`
- [ ] `logs/.gitkeep`

**Archivos modificados:**
- [ ] `server.js` (helmet, CORS, sanitización configurados)
- [ ] `src/models/user.js` (campo role agregado, currentParkingSpace es String)
- [ ] `src/models/ParkingLot.js` (campo isExclusive eliminado)
- [ ] `src/controllers/authController.js` (validaciones completas)
- [ ] `src/controllers/parkingController.js` (bugs corregidos)
- [ ] `src/middleware/authMiddleware.js` (refactorizado)
- [ ] `src/routes/authRoutes.js` (validación y rate limiting)
- [ ] `src/routes/parkingRoutes.js` (autorización por roles)
- [ ] `package.json` (nuevas dependencias)
- [ ] `seed.js` (nombre sincronizado)

### 2. Dependencias Instaladas

Ejecuta y verifica que están instaladas:

```bash
npm list --depth=0
```

Debe mostrar:
- express-validator
- express-rate-limit
- express-mongo-sanitize
- winston
- compression
- helmet
- cors

### 3. Configuración del Entorno

```bash
# Copia el archivo de ejemplo si no existe tu .env
cp .env.example .env

# Edita .env con tus valores reales
notepad .env
```

Variables críticas a configurar:
- `MONGODB_URI` - Tu conexión a MongoDB
- `JWT_SECRET` - Un secreto seguro (mínimo 32 caracteres aleatorios)

### 4. Prueba de Inicialización

```bash
# Inicializar la base de datos
npm run seed
```

Debe mostrar:
```
✅ Conectado a la base de datos de MongoDB para la inicialización
🎉 Inicialización Exitosa
✅ Parqueo 'Parqueo Principal' creado con 10 espacios
```

### 5. Prueba del Servidor

```bash
# Iniciar en modo desarrollo
npm run dev
```

Debe mostrar:
```
✅ Conectado a la base de datos de MongoDB
🚀 Servidor escuchando en http://localhost:3000
📝 Modo: development
```

### 6. Pruebas de Endpoints

#### Health Check
```bash
curl http://localhost:3000/health
```

Esperado: `{"status":"OK","uptime":...}`

#### Registro de Usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Prueba",
    "email": "prueba@miumg.edu.gt",
    "password": "Prueba123",
    "cardId": "CARD001",
    "vehiclePlate": "ABC123"
  }'
```

Esperado: Usuario creado exitosamente

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prueba@miumg.edu.gt",
    "password": "Prueba123"
  }'
```

Esperado: Token JWT

#### Asignar Espacio (requiere token)
```bash
curl -X POST http://localhost:3000/api/parking/assign \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

Esperado: Espacio asignado (ej: "A1")

### 7. Verificación de Seguridad

#### Rate Limiting
Intenta hacer login 6 veces seguidas con credenciales incorrectas.
En el intento 6 debe bloquearte.

#### Validación de Contraseña
Intenta registrar con contraseña "123" - debe rechazarla.

#### CORS
Si tienes configurado ALLOWED_ORIGINS, intenta acceder desde un origen no permitido.

### 8. Verificación de Logs

Verifica que se crearon los archivos de log:

```bash
ls logs/
```

Debe mostrar:
- `error.log` (si hubo errores)
- `combined.log`
- `.gitkeep`

### 9. Verificación de Roles

Para probar el sistema de roles:

1. Crea un usuario admin en PostgreSQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'prueba@miumg.edu.gt';
```

2. Intenta acceder al endpoint de status:
```bash
curl -X GET http://localhost:3000/api/parking/status \
  -H "Authorization: Bearer TU_TOKEN_DE_ADMIN"
```

Esperado: Estado completo del parqueo

3. Con usuario normal debe dar 403 Forbidden

## ⚠️ Problemas Comunes

### "Error: MONGODB_URI no definida"
- Verifica que `.env` existe y tiene `MONGODB_URI` configurado

### "Error de conexión a MongoDB"
- Verifica que MongoDB está corriendo
- Verifica la URI de conexión

### "Cannot find module 'winston'"
- Ejecuta `npm install`

### "Parqueo lleno"
- Ejecuta `npm run seed` para reiniciar

### Logs no se crean
- Verifica que el directorio `logs/` existe
- Winston lo creará automáticamente si no existe

## ✨ Todo Funciona

Si todas las verificaciones pasaron, ¡felicitaciones! El sistema está listo para usar.

**Siguientes pasos:**
1. Crear tu primer usuario administrador
2. Probar el flujo completo: registro → login → asignar → pagar → salir
3. Revisar los logs para familiarizarte con el sistema

Para más detalles, consulta el `README.md` completo.
