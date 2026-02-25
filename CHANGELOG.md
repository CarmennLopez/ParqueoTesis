# 📋 CHANGELOG - Sistema de Gestión de Parqueo

## [2.0.0] - 24 de febrero de 2026

### 💥 Breaking Changes

- **Migración completa de MongoDB → PostgreSQL (Sequelize)**. Todos los modelos, seeders y tests han sido reescritos.
- `.env` ya no usa `MONGODB_URI`; ahora requiere `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- `ParkingLot.location` cambia de tipo `GEOMETRY` (requería PostGIS) a `JSONB` (sin dependencia externa).

### ✨ Nuevas Funcionalidades

#### Sistema de Solvencia
- ✅ Campos `isSolvent`, `solvencyExpires`, `solvencyUpdatedBy` en el modelo `User`
- ✅ Middleware `checkSolvency` — bloquea entrada de estudiantes sin solvencia vigente (→ `402`)
- ✅ `PUT /api/parking/solvency/:userId` — admin/guard marca solvencia por N meses
- ✅ `GET /api/parking/solvency/:cardId` — consultar solvencia por carné
- ✅ `GET /api/parking/solvency-report` — reporte general (solo admin)

#### IoT — Autenticación por API Key
- ✅ `iotAuthMiddleware.js` — valida header `X-IoT-Api-Key`
- ✅ `POST /api/iot/lpr/event` protegido con la nueva clave `IOT_API_KEY` del `.env`

#### Swagger UI
- ✅ Habilitado en `/api-docs` (OpenAPI 3.0)
- ✅ `SWAGGER_GUIDE.md` con flujos de prueba paso a paso

#### Otras Mejoras
- ✅ Validación de pago obligatoria en `POST /api/parking/release` (→ `402` si no pagó)
- ✅ `admin.controller.js` — gestión manual de asignación/liberación por guard/admin
- ✅ `initPricingPlans.js` migrado a Sequelize (`findOne({ where: { code } })`)
- ✅ `database.js` ahora prioriza variables `DB_*` sobre `DATABASE_URL`

### 🔧 Archivos Modificados

- **Modelos:** `AuditLog.js` (Mongoose → Sequelize), `ParkingLot.js` (GEOMETRY → JSONB), `user.js` (campos solvencia)
- **Seeders:** `seedUsers`, `seedPricingPlans`, `seedParkingLots`, `updateCoordinates`, `resetStudentPassword`, `createStudentUser`, `checkData`
- **Tests:** `__tests__/auth.test.js`, `__tests__/setup.js` (Mongoose → Sequelize)
- **Rutas:** `parkingRoutes.js` (nuevas rutas solvencia + IoT), `iotRoutes.js` (IoT auth)
- **Docs:** `README.md`, `INSTALL.md`, `VERIFICATION.md`, `TESTING.md`, `QUICKSTART.md`

### 🗑️ Eliminado

- Dependencia `mongoose` eliminada del código (ya no se importa en ningún archivo)
- Dependencia `mongodb` eliminada (driver directo)
- Variable `MONGODB_URI` ya no se utiliza
- `.env` eliminado del tracking de Git

### 🔒 Seguridad

- `IOT_API_KEY` — nueva variable de entorno para autenticar dispositivos IoT
- `DB_PASSWORD` nunca expuesta en el repositorio (`.env` excluido de Git)

---

## [1.1.0] - 12 de enero de 2026



### ✨ Nuevas Funcionalidades

#### Testing
- ✅ Configuración completa de Jest para unit/integration tests
- ✅ Tests para autenticación (register, login, refresh token)
- ✅ Supertest para testing de API REST
- ✅ Cobertura de código automatizada
- ✅ Setup global de Jest
- ✅ Archivo `.env.test` para testing aislado

**Comandos nuevos:**
```bash
npm test                # Ejecutar todos los tests
npm run test:watch     # Tests en modo watch
npm run test:auth      # Tests de autenticación
npm test -- --coverage # Con cobertura de código
```

#### Seeders Mejorados
- ✅ Seeder para usuarios de prueba (admin, guard, faculty, student, visitor)
- ✅ Seeder para planes de precios (estándar, faculty, VIP, temporal)
- ✅ Tipos de tarifas: hourly, monthly
- ✅ Roles jerárquicos con permisos específicos
- ✅ Datos de facturación FEL

**Comandos nuevos:**
```bash
npm run seed:users     # Crear usuarios de prueba
npm run seed:pricing   # Crear planes de precios
npm run seed:all       # Todos los seeders
```

#### Documentación Completa
- ✅ **SECURITY.md** - Guía de seguridad y mejores prácticas
- ✅ **TESTING.md** - Guía completa de testing
- ✅ **DEPLOYMENT.md** - Despliegue local, Docker, y producción

### 🔒 Seguridad

#### Mejoras
- ✅ Actualización de `.env` con valores seguros (sin credenciales hardcodeadas)
- ✅ Documentación de variables críticas (JWT_SECRET, MONGODB_URI, REDIS_URL)
- ✅ Guía de generación de secretos seguros
- ✅ Rate limiting documentado (5 intentos/15 min en login)
- ✅ CORS configurado correctamente
- ✅ Helmet headers HTTP seguros
- ✅ Contraseñas validadas (8+ caracteres, mayúscula, minúscula, número)

#### Variables de Entorno
```env
JWT_SECRET=8f9d7e3c5b2a1f6e9d4c8b1a7f3e2d5c9b6a1f4e8d3c7b2a5f1e9d6c4b8a
MONGODB_URI=mongodb://localhost:27017/parqueo_umg
REDIS_URL=redis://localhost:6379
```

### 📦 Package.json Actualizado

#### Scripts nuevos
```json
{
  "seed:users": "node seeders/seedUsers.js",
  "seed:pricing": "node seeders/seedPricingPlans.js",
  "seed:all": "npm run seed && npm run seed:users && npm run seed:pricing",
  "test": "jest --coverage",
  "test:watch": "jest --watch",
  "test:auth": "jest __tests__/auth.test.js",
  "lint": "eslint src/**/*.js",
  "docker:build": "docker build -t parking-api:latest .",
  "docker:up": "docker-compose up -d",
  "docker:down": "docker-compose down"
}
```

#### Dependencias de Testing (devDependencies)
```json
{
  "jest": "^29.7.0",
  "supertest": "^6.3.3",
  "eslint": "^8.55.0"
}
```

### 🐳 Docker

#### Estado
- ✅ Dockerfile multi-stage optimizado (ya estaba completo)
- ✅ ENTRYPOINT correctamente configurado
- ✅ Healthcheck cada 30 segundos
- ✅ Usuario no privilegiado (node)
- ✅ docker-compose.yml funcional (API + MongoDB + Redis)

### 🏗️ Estructura de Directorios

```
TesisProyect/
├── __tests__/              # ✨ NUEVO - Tests automatizados
│   ├── auth.test.js
│   └── setup.js
├── seeders/
│   ├── seedUsers.js        # ✨ NUEVO - Usuarios de prueba
│   ├── seedPricingPlans.js # ✨ NUEVO - Planes de precios
│   └── seedParkingLots.js  # Existente
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── .env                    # ✨ ACTUALIZADO - Sin credenciales expuestas
├── .env.test              # ✨ NUEVO - Vars para testing
├── .env.example           # Existente
├── jest.config.js         # ✨ NUEVO - Configuración Jest
├── SECURITY.md            # ✨ NUEVO - Guía de seguridad
├── TESTING.md             # ✨ NUEVO - Guía de testing
├── DEPLOYMENT.md          # ✨ NUEVO - Guía de despliegue
├── package.json           # ✨ ACTUALIZADO - Nuevos scripts
└── Dockerfile             # Existente (ya completo)
```

### 📚 Documentación Agregada

#### SECURITY.md (220 líneas)
- JWT y autenticación
- CORS y rate limiting
- Validación de datos
- Base de datos (MongoDB, Redis)
- Variables de entorno críticas
- Logging y auditoría
- Seguridad en producción
- Vulnerabilidades conocidas y mitigación
- Monitoreo recomendado

#### TESTING.md (180 líneas)
- Instalación y ejecución de tests
- Estructura de tests
- Cómo escribir tests
- Testing de API REST
- Fixtures y mocking
- Buenas prácticas
- Tests pendientes
- Troubleshooting
- Cobertura de código

#### DEPLOYMENT.md (400+ líneas)
- Despliegue local (paso a paso)
- Despliegue con Docker
- Despliegue en producción
- Variables de entorno de producción
- Nginx como reverse proxy
- SSL/TLS con Let's Encrypt
- Backups automatizados
- Monitoreo en tiempo real
- Alertas recomendadas
- Actualizaciones seguras
- Troubleshooting

### 🎯 Casos de Uso Ahora Cubiertos

#### Para Desarrolladores
```bash
# Iniciar en desarrollo
npm run dev

# Ejecutar tests
npm test

# Tests específicos
npm run test:auth

# Ver cobertura
npm test -- --coverage
```

#### Para QA / Testing
```bash
# Crear base de datos limpia con datos de prueba
npm run seed:all

# Verificar salud del sistema
curl http://localhost:3000/health/liveness

# Ejecutar tests completos
npm test
```

#### Para DevOps / Producción
```bash
# Build Docker
npm run docker:build

# Desplegar localmente
npm run docker:up

# Ver logs
docker-compose logs -f api

# Backup de BD
docker-compose exec mongo mongodump
```

### 🔍 Verificación

#### Archivos Creados
- ✅ `__tests__/auth.test.js` - 120 líneas de tests
- ✅ `__tests__/setup.js` - Setup global
- ✅ `seeders/seedUsers.js` - 70 líneas
- ✅ `seeders/seedPricingPlans.js` - 85 líneas
- ✅ `jest.config.js` - Configuración Jest
- ✅ `.env.test` - Variables de testing
- ✅ `SECURITY.md` - 220 líneas
- ✅ `TESTING.md` - 180 líneas
- ✅ `DEPLOYMENT.md` - 400+ líneas

#### Archivos Actualizados
- ✅ `.env` - Credenciales seguras
- ✅ `package.json` - 10 nuevos scripts + 3 dev dependencies

#### Verificación de Integridad
```bash
# El proyecto ahora soporta:
- Unit tests ✓
- Integration tests ✓
- API REST testing ✓
- Seeders de datos ✓
- Docker deployment ✓
- Documentación completa ✓
```

### 🚀 Próximas Mejoras (Roadmap)

- [ ] Tests para controlador de parqueo (parking.test.js)
- [ ] Tests para facturación (invoice.test.js)
- [ ] Tests para middleware (auth, errors, rate-limit)
- [ ] Tests para utilidades (tokens, audit logging)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoreo con Prometheus + Grafana
- [ ] APM con New Relic o DataDog
- [ ] Documentación API con Swagger mejorado
- [ ] Load testing con K6 o JMeter
- [ ] Análisis de seguridad con SonarQube

### 📝 Notas Importantes

1. **Variables de Entorno**: Cambiar `JWT_SECRET` en producción
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Testing**: Requiere MongoDB y Redis corriendo
   ```bash
   # MongoDB
   mongod
   
   # Redis
   redis-server
   ```

3. **Docker**: Incluye MongoDB y Redis automáticamente
   ```bash
   npm run docker:up
   ```

4. **Seguridad**: Nunca comitear `.env` real
   ```bash
   # .gitignore debe incluir:
   .env
   .env.local
   ```

### 👥 Contribuidores

- Equipo de Desarrollo (12 de enero de 2026)

---

**Versión Anterior**: [1.0.0] - Versión inicial
**Versión Actual**: [1.1.0] - Testing, seeders y documentación completa
