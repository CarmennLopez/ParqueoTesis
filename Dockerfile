# Etapa 1: Construcción (Builder)
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo dev para compilación si fuera necesario)
RUN npm ci

# Copiar código fuente
COPY . .

# Etapa 2: Producción (Runner)
FROM node:18-alpine

WORKDIR /app

# Instalar herramientas básicas de sistema si son necesarias
RUN apk add --no-cache curl

# Copiar desde el builder solo lo necesario
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./

# Configurar variables de entorno por defecto (pueden sobreescribirse)
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health/liveness || exit 1

# Usuario no privilegiado por seguridad
USER node

# Comando de inicio
CMD ["node", "server.js"]
