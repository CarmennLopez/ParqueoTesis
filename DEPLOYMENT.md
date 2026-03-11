# 🚀 GUÍA DE DESPLIEGUE

## Índice
1. [Despliegue Local](#local)
2. [Despliegue con Docker](#docker)
3. [Despliegue en Producción](#produccion)
4. [Monitoreo](#monitoreo)

---

## 📱 Despliegue Local {#local}

### Requisitos
- Node.js 16+
- MongoDB 5+
- Redis (Memurai en Windows, Redis en Linux/Mac)

### Pasos

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con valores locales
```

3. **Inicializar base de datos**
```bash
# Crear espacios de parqueo
npm run seed

# Crear usuarios de prueba
npm run seed:users

# Crear planes de precios
npm run seed:pricing

# O todos a la vez
npm run seed:all
```

4. **Ejecutar servidor**
```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start
```

5. **Verificar**
```bash
curl http://localhost:3000/health/liveness
# Respuesta: {"status":"UP"}
```

---

## 🐳 Despliegue con Docker {#docker}

### Quick Start

```bash
# Construir imagen
npm run docker:build

# Iniciar servicios (API + MongoDB + Redis)
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
  
  mongo:
    - MongoDB 7.0
    - Puerto: 27017
    - Volumen: mongo_data
  
  redis:
    - Redis Alpine
    - Puerto: 6379
    - Caché e idempotencia
```

### Comandos Útiles

```bash
# Ver estado de containers
docker-compose ps

# Ejecutar comando en container
docker-compose exec api npm run seed:all

# Limpiar todo (cuidado!)
docker-compose down -v

# Ver logs de un servicio específico
docker-compose logs mongo
```

---

## 🌐 Despliegue en Producción {#produccion}

### Pre-requisitos
- Servidor Linux (Ubuntu 20.04+)
- Docker y Docker Compose instalados
- Dominio configurado
- Certificado SSL/TLS
- MongoDB Atlas o BD autogestionada
- Redis en producción

### Variables de Entorno (Producción)

```env
# .env.production
NODE_ENV=production
PORT=3000

# Base de datos
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/parqueo
MONGODB_TIMEOUT=5000
MONGODB_RETRY_ATTEMPTS=5

# Redis (con autenticación)
REDIS_URL=redis://:strong_password@redis.example.com:6379

# JWT (generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=<generar_valor_aleatorio_64_caracteres>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# CORS (solo dominios autorizados)
ALLOWED_ORIGINS=https://app.umg.edu.gt,https://admin.umg.edu.gt

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
git clone https://github.com/your-org/TesisProyect.git
cd TesisProyect
```

3. **Crear archivo .env**
```bash
nano .env
# Pegar variables de producción
# Guardar: Ctrl+X, Y, Enter
```

4. **Construir imagen**
```bash
docker build -t parking-api:v1.0 .
```

5. **Iniciar servicios**
```bash
docker-compose -f docker-compose.yml up -d
```

6. **Verificar salud**
```bash
curl https://api.example.com/health/liveness
```

7. **Inicializar datos (solo primera vez)**
```bash
docker-compose exec api npm run seed:all
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

    # Security headers
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

    # Health check endpoint (sin logs)
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

### Backup Automatizado

```bash
# /usr/local/bin/backup-mongodb.sh
#!/bin/bash

BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose exec -T mongo mongodump \
  --uri="mongodb://user:pass@mongo:27017/parqueo" \
  --out=$BACKUP_DIR/dump_$TIMESTAMP

# Mantener solo últimos 30 días
find $BACKUP_DIR -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \;

echo "Backup completado: $BACKUP_DIR/dump_$TIMESTAMP"
```

Agregar a crontab:
```bash
# Backup diario a las 2:00 AM
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

---

## 📊 Monitoreo {#monitoreo}

### Health Checks

```bash
# Liveness - ¿está vivo?
curl https://api.example.com/health/liveness

# Readiness - ¿está listo?
curl https://api.example.com/health/readiness
```

### Logs en Tiempo Real

```bash
# Últimos 50 líneas
docker-compose logs -f --tail=50 api

# Errores solo
docker-compose logs api | grep ERROR

# Con timestamps
docker-compose logs -t api
```

### Métricas Básicas

```bash
# Espacio en disco
df -h

# Uso de memoria/CPU
docker stats

# Conexiones MongoDB
docker-compose exec mongo mongosh --eval "db.serverStatus()"
```

### Alertas Recomendadas

| Métrica | Umbral | Acción |
|---------|--------|--------|
| CPU | > 80% | Escalar horizontalmente |
| Memoria | > 85% | Revisar leaks |
| Disco | > 90% | Limpiar logs antiguos |
| Errores API | > 5% | Revisar logs |
| Response Time | > 1s | Optimizar queries |

---

## 🔄 Actualizaciones

```bash
# Pull cambios
git pull origin main

# Reconstruir imagen
docker-compose build --no-cache

# Reiniciar servicios
docker-compose up -d

# Verificar
curl https://api.example.com/health/liveness
```

---

## 🆘 Troubleshooting

### Container no inicia
```bash
docker-compose logs api
# Ver error específico
```

### MongoDB no responde
```bash
# Reiniciar
docker-compose restart mongo

# O desde cero
docker-compose down -v
docker-compose up -d
docker-compose exec api npm run seed:all
```

### Redis timeout
```bash
# Verificar conexión
docker-compose exec api redis-cli ping
# Respuesta: PONG

# Revisar memoria
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

**Última actualización**: 12 de enero de 2026
