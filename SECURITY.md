# 🔒 GUÍA DE SEGURIDAD - Sistema de Gestión de Parqueo

## Resumen de Seguridad

Este documento describe las medidas de seguridad implementadas en el proyecto y recomendaciones para producción.

---

## 1. AUTENTICACIÓN Y AUTORIZACIÓN

### JWT (JSON Web Tokens)
- **Access Token**: 15 minutos (corto para seguridad)
- **Refresh Token**: 30 días (largo para experiencia móvil)
- **Generación**: Tokens firmados con `JWT_SECRET` seguro

```bash
# Generar un JWT_SECRET seguro:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Contraseñas
- **Validación Fuerte**: Mínimo 8 caracteres, mayúscula, minúscula, número
- **Hashing**: Bcrypt con salt automático
- **Nunca se almacenan en texto plano**

### Roles y Permisos (Jerárquicos)
```
ADMIN       → Acceso total al sistema
GUARD       → Verificación y liberación manual
FACULTY     → Catedráticos y personal administrativo
STUDENT     → Estudiantes activos
VISITOR     → Visitantes externos
```

---

## 2. SEGURIDAD DE RED

### CORS (Cross-Origin Resource Sharing)
```env
# .env - Permitir solo dominios autorizados
ALLOWED_ORIGINS=https://app.umg.edu.gt,https://admin.umg.edu.gt
```

### HELMET - Headers HTTP Seguros
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY (evita clickjacking)
- Content-Security-Policy configurado
- HSTS habilitado

### Rate Limiting
- **Login**: Máximo 5 intentos en 15 minutos
- **API General**: 100 requests por minuto
- **Previene**: Fuerza bruta, DDoS, abuso

---

## 3. VALIDACIÓN DE DATOS

### Express-Validator en Todas las Rutas
- Validación de tipos de datos
- Sanitización de inputs
- Prevención de inyección NoSQL

### Ejemplo:
```javascript
const { body, validationResult } = require('express-validator');

router.post('/endpoint', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('vehiclePlate').matches(/^[A-Z0-9]{6,8}$/i)
], controller);
```

---

## 4. BASE DE DATOS

### PostgreSQL
- **Conexión**: Variables individuales (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
- **ORM**: Sequelize — protege contra SQL injection automáticamente
- **Autenticación**: Usuario y contraseña requeridos, nunca en texto plano

### Redis
- **Caché**: Rate limiting y sesiones de idempotencia
- **Expiración**: TTL automático en todas las claves
- **Seguridad**: Requiere autenticación en producción

```env
# .env - Producción
REDIS_URL=redis://:tu_password_seguro@redis-host:6379
```

---

## 5. VARIABLES DE ENTORNO CRÍTICAS

**NUNCA** comitear archivos `.env` al repositorio.

### Variables Esenciales:
```env
JWT_SECRET=         # ⚠️ CRÍTICO - 32+ caracteres aleatorios
DB_HOST=            # Host de PostgreSQL
DB_USER=            # Usuario de PostgreSQL
DB_PASSWORD=        # ⚠️ CRÍTICO - nunca en texto plano
DB_NAME=            # Nombre de la base de datos
REDIS_URL=          # Con autenticación en prod
IOT_API_KEY=        # ⚠️ Clave para dispositivos IoT
NODE_ENV=production # Nunca 'development' en producción
ALLOWED_ORIGINS=    # Solo dominios confiables
```

### Archivo .gitignore (debe incluir):
```
.env
.env.local
.env.*.local
node_modules/
logs/
*.log
```

---

## 6. LOGGING Y AUDITORÍA

### Winston - Logging Profesional
- **Nivel**: debug, info, warn, error
- **Rotación**: Diaria, máximo 30 días
- **Sensibilidad**: Nunca registra contraseñas o tokens

### Auditoría
- Cada acción crítica registra: usuario, IP, timestamp
- Tabla `audit_logs` en PostgreSQL
- Consultas auditables por usuario y por acción

```javascript
logAudit(req, 'REGISTER', 'User', { userId, email });
```

---

## 7. IDEMPOTENCIA

Todas las operaciones sensibles usan **Idempotency-Key**:
```
Header: Idempotency-Key: {uuid}
```

Esto previene duplicación si una request se reinicia.

---

## 8. SEGURIDAD EN PRODUCCIÓN

### Checklist de Deployment:
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` generado aleatoriamente (32+ chars)
- [ ] `IOT_API_KEY` configurado con valor único
- [ ] CORS limitado a dominios autorizados
- [ ] HTTPS/TLS en todas las conexiones
- [ ] PostgreSQL con usuario dedicado y contraseña fuerte
- [ ] Redis con autenticación (`REDIS_URL=redis://:password@host:6379`)
- [ ] `.env` excluido del repositorio (`.gitignore`)
- [ ] Logs rotativos habilitados
- [ ] Health checks configurados
- [ ] Backups de PostgreSQL automatizados (`pg_dump`)
- [ ] Monitoreo y alertas activos

### Docker:
```bash
# Construir imagen
docker build -t parking-api:prod .

# Ejecutar con variables seguras
docker run -d \
  -e NODE_ENV=production \
  -e JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") \
  -e DB_HOST=postgres-host \
  -e DB_USER=parqueo_app \
  -e DB_PASSWORD=password_seguro \
  -e DB_NAME=parking_db \
  -e IOT_API_KEY=clave-secreta-iot \
  parking-api:prod
```

---

## 9. VULNERABILIDADES CONOCIDAS Y MITIGACIÓN

| Vulnerabilidad | Mitigación |
|---|---|
| SQL Injection | Sequelize ORM con queries parametrizadas |
| Credential Exposure | Variables de entorno + `.env` en `.gitignore` |
| XSS | Content-Security-Policy vía Helmet |
| CSRF | Token validation en formularios |
| Weak JWT | Algoritmo HS256 + secret 32+ chars |
| Brute Force | Rate limiting Redis (5 intentos/15 min) |
| IoT Spoofing | `X-IoT-Api-Key` header obligatorio |
| Default Credentials | Sin credenciales por defecto en código |
| Weak Encryption | Bcrypt para contraseñas, HTTPS obligatorio |
| Replay Attack | Middleware de idempotencia con TTL en Redis |

---

## 10. MONITOREO RECOMENDADO

### Alertas Activas:
1. **Múltiples fallos de login** - Posible ataque de fuerza bruta
2. **Requests anormalmente altos** - Posible DDoS
3. **Errores de conexión BD** - Falla de servicio
4. **Tokens expirados en masa** - Posible ataque
5. **Cambios en permisos** - Auditoria

---

## 11. RECURSOS Y REFERENCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Sequelize Security](https://sequelize.org/docs/v6/core-concepts/raw-queries/)

---

## 12. CONTACTO Y ESCALAMIENTO

Para reportar vulnerabilidades de seguridad:
- 📧 Email: security@umg.edu.gt
- 🔒 **NO** reportar públicamente
- ⏰ Respuesta esperada: 24 horas

---

**Última actualización**: Febrero 2026  
**Versión**: 2.0 (PostgreSQL/Sequelize)
