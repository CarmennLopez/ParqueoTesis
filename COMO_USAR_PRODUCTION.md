# 🚀 Guía: Usar Modo Production

## 🧪 Opción 1: Probar Production AHORA (Local)

### **Paso 1: Cambiar a Production**

Edita `docker-compose.yml` línea 10:

**Antes:**
```yaml
- ASPNETCORE_ENVIRONMENT=Development
```

**Después:**
```yaml
- ASPNETCORE_ENVIRONMENT=Production
```

### **Paso 2: Reconstruir Gateway**

```bash
docker-compose up -d --build gateway
```

### **Paso 3: Verificar que usa Production**

```bash
docker logs parqueotesis-gateway-1 | grep "configuración"
```

**Debes ver:**
```
[INF] Usando configuración de entorno: ocelot.Production.json
```

### **Paso 4: Probar JWT Validation**

**Sin token (debe fallar):**
```bash
curl http://localhost:5000/api/parking/lots
```

**Resultado esperado:**
```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

**Con token (debe funcionar):**
```bash
# 1. Registrarse
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@umg.edu.gt",
    "password": "Test123!",
    "cardId": "12345678",
    "vehiclePlate": "ABC123"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@umg.edu.gt",
    "password": "Test123!"
  }'

# Copiar el accessToken de la respuesta

# 3. Usar el token
curl http://localhost:5000/api/parking/lots \
  -H "Authorization: Bearer {TU_TOKEN_AQUI}"
```

### **Paso 5: Probar Rate Limiting**

**Hacer 11 peticiones rápidas al login:**
```bash
for ($i=1; $i -le 11; $i++) {
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"Test123!"}'
  Write-Host "Petición $i"
}
```

**Resultado esperado:**
- Peticiones 1-10: ✅ Funcionan (aunque fallen por credenciales incorrectas)
- Petición 11: ❌ 429 Too Many Requests

```json
{
  "status": 429,
  "message": "Demasiadas peticiones. Intenta de nuevo más tarde."
}
```

### **Paso 6: Volver a Development**

Edita `docker-compose.yml` línea 10:

```yaml
- ASPNETCORE_ENVIRONMENT=Development
```

Reconstruir:
```bash
docker-compose up -d --build gateway
```

---

## 🌐 Opción 2: Configurar para Producción REAL

### **Escenario: Desplegar en Servidor**

#### **1. Variables de Entorno del Servidor**

En tu servidor (ej. AWS, Azure, DigitalOcean), configura:

```bash
export ASPNETCORE_ENVIRONMENT=Production
export JWT_SECRET="tu-secret-super-seguro-generado-con-openssl"
export JWT_ISSUER="parking-api"
export JWT_AUDIENCE="parking-users"
```

#### **2. Docker Compose para Producción**

Crea `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  gateway:
    build:
      context: ./csharp-gateway/ApiGatewayProject
    ports:
      - "443:8080"  # HTTPS en producción
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - JWT_SECRET=${JWT_SECRET}
      - JWT_ISSUER=${JWT_ISSUER}
      - JWT_AUDIENCE=${JWT_AUDIENCE}
    networks:
      - app-network
    restart: always
    depends_on:
      - app-backend

  app-backend:
    build:
      context: ./nodejs-backend
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_HOST=redis
    networks:
      - app-network
    restart: always
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7.0
    volumes:
      - mongo_data:/data/db
    networks:
      - app-network
    restart: always

  redis:
    image: redis:alpine
    networks:
      - app-network
    restart: always

networks:
  app-network:
    driver: bridge

volumes:
  mongo_data:
```

#### **3. Desplegar en Producción**

```bash
# En el servidor
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Diferencias: Development vs Production

| Aspecto | Development | Production |
|---------|-------------|------------|
| **Archivo Ocelot** | `ocelot.Development.json` | `ocelot.Production.json` |
| **JWT Validation** | ❌ Desactivado | ✅ Requerido |
| **Rate Limiting** | ❌ Sin límites | ✅ 10-100/min |
| **Logs** | Consola + Archivo | Consola + Archivo |
| **CORS** | `AllowAll` | Restringir a dominio |
| **Puerto** | 5000 (HTTP) | 443 (HTTPS) |
| **Restart Policy** | No | `always` |

---

## 🔐 Generar JWT Secret Seguro

Para producción, genera un secret seguro:

### **Opción 1: OpenSSL**
```bash
openssl rand -base64 32
```

### **Opción 2: PowerShell**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### **Opción 3: Online**
https://generate-secret.vercel.app/32

**Importante:** Usa el **mismo secret** en gateway y backend.

---

## ✅ Checklist de Producción

Antes de desplegar:

- [ ] `ASPNETCORE_ENVIRONMENT=Production`
- [ ] JWT_SECRET generado y configurado
- [ ] Mismo JWT_SECRET en gateway y backend
- [ ] CORS restringido a tu dominio
- [ ] HTTPS configurado (certificado SSL)
- [ ] MongoDB con autenticación
- [ ] Redis con password
- [ ] Logs configurados
- [ ] Backups automáticos
- [ ] Monitoreo configurado

---

## 🧪 Prueba Rápida en Local

**1. Cambiar a Production:**
```yaml
# docker-compose.yml línea 10
- ASPNETCORE_ENVIRONMENT=Production
```

**2. Reconstruir:**
```bash
docker-compose up -d --build gateway
```

**3. Probar:**
```bash
# Sin token (debe fallar)
curl http://localhost:5000/api/parking/lots

# Con Swagger (necesitas token)
# http://localhost:5000/api-docs/
```

**4. Volver a Development:**
```yaml
# docker-compose.yml línea 10
- ASPNETCORE_ENVIRONMENT=Development
```

```bash
docker-compose up -d --build gateway
```

---

## 📝 Resumen

**Para probar ahora:**
1. Cambia línea 10 de `docker-compose.yml` a `Production`
2. `docker-compose up -d --build gateway`
3. Prueba con y sin token

**Para producción real:**
1. Usa `docker-compose.prod.yml`
2. Configura variables de entorno en el servidor
3. Genera JWT_SECRET seguro
4. Configura HTTPS
5. Despliega con `docker-compose -f docker-compose.prod.yml up -d`
