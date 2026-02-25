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

### MongoDB
- **Conexión**: Variables de entorno (`MONGODB_URI`)
- **Autenticación**: Usuario y contraseña requeridos
- **Sanitización**: Validación de inputs contra inyección

### Redis
- **Caché**: Tokens y sesiones
- **Expiración**: TTL automático
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
JWT_SECRET=                    # ⚠️ CRÍTICO - 32+ caracteres aleatorios
MONGODB_URI=                   # Credenciales seguras
REDIS_URL=                     # Con autenticación en prod
NODE_ENV=production            # Nunca 'development' en producción
ALLOWED_ORIGINS=               # Solo dominios confiables
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
- Tabla AuditLog en MongoDB
- Consultas auditables por usuario

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
- [ ] `JWT_SECRET` generado aleatoriamente
- [ ] CORS limitado a dominios autorizados
- [ ] HTTPS/TLS en todas las conexiones
- [ ] MongoDB con credenciales fuertes
- [ ] Redis con autenticación
- [ ] Logs rotativos habilitados
- [ ] Health checks configurados
- [ ] Backups automatizados
- [ ] Monitoreo y alertas activos

### Docker:
```bash
# Construir imagen
docker build -t parking-api:prod .

# Ejecutar con variables seguras
docker run -d \
  -e NODE_ENV=production \
  -e JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") \
  -e MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db \
  parking-api:prod
```

---

## 9. VULNERABILIDADES CONOCIDAS Y MITIGACIÓN

| Vulnerabilidad | Mitigación |
|---|---|
| SQL Injection | Mongoose ODM + validación |
| NoSQL Injection | express-mongo-sanitize (comentado - buscar alternativa) |
| XSS | Content-Security-Policy vía Helmet |
| CSRF | Token validation en formularios |
| Weak JWT | Algoritmo HS256 + secret fuerte |
| Default Credentials | Sin credenciales por defecto |
| Exposed Secrets | Variables de entorno, .gitignore |
| Weak Encryption | Bcrypt para contraseñas, HTTPS obligatorio |

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
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

---

## 12. CONTACTO Y ESCALAMIENTO

Para reportar vulnerabilidades de seguridad:
- 📧 Email: security@umg.edu.gt
- 🔒 **NO** reportar públicamente
- ⏰ Respuesta esperada: 24 horas

---

**Última actualización**: 12 de enero de 2026
**Versión**: 1.0
