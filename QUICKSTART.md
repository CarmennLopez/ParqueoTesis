# ⚡ QUICK START GUIDE

## 🚀 5 Minutos para Empezar

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
```bash
# Editar .env si es necesario
# (ya está preconfigrado)
cat .env
```

### 3. Iniciar Servicios (Docker)
```bash
npm run docker:up
```

### 4. Crear Datos de Prueba
```bash
# Esperar 10 segundos para que MongoDB inicie
docker-compose exec api npm run seed:all
```

### 5. Verificar que Funciona
```bash
curl http://localhost:3000/health/liveness
# Respuesta esperada: {"status":"UP"}
```

✅ **¡Listo! Sistema en funcionamiento.**

---

## 📱 Primeros Pasos

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@umg.edu.gt",
    "password": "Admin@12345"
  }'
```

### Test Parqueo
```bash
curl http://localhost:3000/api/v1/parking/status \
  -H "Authorization: Bearer <token_del_login>"
```

### Ver Logs
```bash
docker-compose logs -f api
```

### Detener Servicios
```bash
npm run docker:down
```

---

## 🧪 Testing

### Ejecutar Tests
```bash
npm test
```

### Tests en Modo Watch
```bash
npm run test:watch
```

### Ver Cobertura
```bash
npm test -- --coverage
```

---

## 📊 Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@umg.edu.gt | Admin@12345 | ADMIN |
| guard@umg.edu.gt | Guard@12345 | GUARD |
| juan.perez@umg.edu.gt | Faculty@12345 | FACULTY |
| carlos.lopez@estudiante.umg.edu.gt | Student@12345 | STUDENT |
| maria.garcia@external.com | Visitor@12345 | VISITOR |

---

## 🐳 Docker Comandos

```bash
# Ver estado
docker-compose ps

# Logs
docker-compose logs -f api

# Ejecutar comando en container
docker-compose exec api npm run seed:users

# Reiniciar
docker-compose restart api

# Limpiar todo
docker-compose down -v
```

---

## 🔧 Desarrollo

### Modo Desarrollo (Auto-reload)
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

### Crear Seeder Personalizado
```bash
# Copiar un seeder existente
cp seeders/seedUsers.js seeders/seedCustom.js

# Editar y ejecutar
node seeders/seedCustom.js
```

---

## 📚 Documentación

| Documento | Para |
|-----------|------|
| README.md | Introducción general |
| SECURITY.md | Seguridad y mejores prácticas |
| TESTING.md | Cómo escribir tests |
| DEPLOYMENT.md | Despliegue en producción |
| CHANGELOG.md | Historial de cambios |
| IMPROVEMENTS-SUMMARY.md | Resumen de mejoras |

---

## 🆘 Problemas Comunes

### "Connection refused"
```bash
# Asegurar que Docker está corriendo
docker-compose up -d
```

### "Cannot find module"
```bash
# Instalar dependencias
npm install
npm install --save-dev jest supertest
```

### "Tests fallan"
```bash
# Limpiar cache
npm test -- --clearCache

# Asegurar que .env.test existe
ls .env.test
```

### "Port already in use"
```bash
# Cambiar puerto en .env
PORT=3001

# O detener el proceso anterior
npm run docker:down
```

---

## 📞 Soporte

Para más información:
- 📖 Ver README.md
- 🔒 Ver SECURITY.md para seguridad
- 🧪 Ver TESTING.md para testing
- 🚀 Ver DEPLOYMENT.md para producción

---

**Última actualización**: 12 de enero de 2026
