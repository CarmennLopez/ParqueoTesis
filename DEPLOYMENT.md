# 🚀 GUÍA DE DESPLIEGUE — Sistema de Parqueo UMG v2.0

**Stack:** Node.js + Express 5 + PostgreSQL + Redis + Docker

---

## Índice
1. [Despliegue Local](#local)
2. [Despliegue con Docker](#docker)
3. [Despliegue en Producción](#produccion)
4. [Monitoreo](#monitoreo)

---

## 📱 Despliegue Local {#local}

### Requisitos
- Node.js 18+
- PostgreSQL 14+ (local)
- Redis / Memurai 6+

### Pasos

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tu DB_PASSWORD y demás valores
```

3. **Crear la base de datos** (si no existe)
```bash
psql -U postgres -c "CREATE DATABASE parking_db;"
```

4. **Iniciar servidor** (las tablas se crean automáticamente)
```bash
npm run dev
```

5. **Poblar datos de prueba** (opcional)
```bash
node seeders/seedUsers.js
node seeders/seedPricingPlans.js
node seeders/seedParkingLots.js
```

6. **Verificar**
```bash
curl http://localhost:3000/health
# Respuesta: {"status":"OK","services":{"database":"connected","redis":"connected"}}
```

---

## 🐳 Despliegue con Docker {#docker}

### Quick Start

```bash
# Construir imagen
npm run docker:build

# Iniciar servicios (API + PostgreSQL + Redis)
npm run docker:up

# Ver logs
docker-compose logs -f api

# Detener servicios
npm run docker:down
```

### Estructura Docker Compose

```yaml
services:
  api:
    - Node.js API
    - Puerto: 3000
    - Healthcheck cada 30s

  postgres:
    - PostgreSQL 15
    - Puerto: 5432
    - Volumen: postgres_data

  redis:
    - Redis Alpine
    - Puerto: 6379
    - Caché e idempotencia
```

### Comandos Útiles

```bash
# Ver estado de containers
docker-compose ps

# Ejecutar seeders dentro del container
docker-compose exec api node seeders/seedUsers.js
docker-compose exec api node seeders/seedPricingPlans.js
docker-compose exec api node seeders/seedParkingLots.js

# Limpiar todo (cuidado: elimina la BD!)
docker-compose down -v

# Ver logs de PostgreSQL
docker-compose logs postgres
```

---

## 🌐 Despliegue en Producción {#produccion}

### Pre-requisitos
- Servidor Linux (Ubuntu 20.04+)
- Docker y Docker Compose
- Dominio configurado y certificado SSL
- PostgreSQL (gestionado o servidor dedicado)
- Redis en producción

### Variables de Entorno (Producción)

```env
# .env.production
NODE_ENV=production
PORT=3000

# Base de datos PostgreSQL
DB_HOST=prod-postgres.example.com
DB_PORT=5432
DB_NAME=parking_db
DB_USER=parqueo_app
DB_PASSWORD=<contraseña_muy_segura>

# Redis (con autenticación)
REDIS_URL=redis://:strong_password@redis.example.com:6379

# JWT (generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=<generar_valor_aleatorio_64_caracteres>
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# CORS (solo dominios autorizados)
ALLOWED_ORIGINS=https://app.umg.edu.gt,https://admin.umg.edu.gt

# IoT
IOT_API_KEY=<clave_secreta_para_dispositivos_iot>

# Parqueo
PARKING_LOT_NAME=Parqueo Principal UMG

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/parking-api

# Rate limiting
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=3
API_RATE_LIMIT_MAX_REQUESTS=50
```

### Deployment Steps

1. **SSH al servidor**
```bash
ssh user@production.example.com
```

2. **Clonar repositorio**
```bash
git clone https://github.com/CarmennLopez/ParqueoTesis.git
cd ParqueoTesis
```

3. **Crear archivo .env**
```bash
nano .env
# Pegar variables de producción
# Guardar: Ctrl+X, Y, Enter
```

4. **Construir imagen**
```bash
docker build -t parking-api:v2.0 .
```

5. **Iniciar servicios**
```bash
docker-compose -f docker-compose.yml up -d
```

6. **Verificar salud**
```bash
curl https://api.example.com/health
```

7. **Inicializar datos (solo primera vez)**
```bash
docker-compose exec api node seeders/seedUsers.js
docker-compose exec api node seeders/seedPricingPlans.js
docker-compose exec api node seeders/seedParkingLots.js
```

### Nginx como Reverse Proxy

```nginx
# /etc/nginx/sites-available/parking-api

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        access_log off;
        proxy_pass http://localhost:3000;
    }
}
```

Habilitar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/parking-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Certificado SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d api.example.com
```

### Backup Automatizado (PostgreSQL)

```bash
# /usr/local/bin/backup-postgres.sh
#!/bin/bash

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -U parqueo_app -h prod-postgres.example.com parking_db \
  > $BACKUP_DIR/dump_$TIMESTAMP.sql

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "Backup completado: $BACKUP_DIR/dump_$TIMESTAMP.sql"
```

Agregar a crontab:
```bash
# Backup diario a las 2:00 AM
0 2 * * * /usr/local/bin/backup-postgres.sh
```

---

## 📊 Monitoreo {#monitoreo}

### Health Checks

```bash
# Estado completo del sistema
curl https://api.example.com/health
# {"status":"OK","services":{"database":"connected","redis":"connected"}}
```

### Logs en Tiempo Real

```bash
# Últimas 50 líneas
docker-compose logs -f --tail=50 api

# Solo errores
docker-compose logs api | grep ERROR

# Con timestamps
docker-compose logs -t api
```

### Métricas Básicas

```bash
# Espacio en disco
df -h

# Uso de memoria/CPU por container
docker stats

# Conexiones activas en PostgreSQL
docker-compose exec postgres psql -U parqueo_app -d parking_db \
  -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

### Alertas Recomendadas

| Métrica | Umbral | Acción |
|---------|--------|--------|
| CPU | > 80% | Escalar horizontalmente |
| Memoria | > 85% | Revisar memory leaks |
| Disco | > 90% | Limpiar logs antiguos |
| Errores API | > 5% | Revisar logs |
| Response Time | > 1s | Optimizar queries SQL |

---

## 🔄 Actualizaciones

```bash
# Pull cambios
git pull origin main

# Reconstruir imagen
docker-compose build --no-cache

# Reiniciar servicios (sin downtime con --no-deps)
docker-compose up -d

# Verificar
curl https://api.example.com/health
```

---

## 🆘 Troubleshooting

### Container no inicia
```bash
docker-compose logs api
# Ver error específico
```

### PostgreSQL no responde
```bash
# Verificar estado
docker-compose exec postgres pg_isready

# Reiniciar
docker-compose restart postgres

# Verificar conexión desde la API
docker-compose exec api node -e "
const { sequelize } = require('./src/config/database');
sequelize.authenticate().then(() => console.log('OK')).catch(console.error);
"
```

### Redis timeout
```bash
# Verificar conexión
docker-compose exec redis redis-cli ping
# Respuesta: PONG

# Ver memoria usada
docker-compose exec redis redis-cli INFO memory
```

### SSL/TLS issues
```bash
# Renovar certificado
sudo certbot renew

# Verificar certificado
openssl s_client -connect api.example.com:443
```

---

**Última actualización**: Febrero 2026 | **Versión**: 2.0.0 (PostgreSQL)
