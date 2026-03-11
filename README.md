# Sistema de Gestión de Parqueo - API REST

Sistema empresarial de gestión de parqueo desarrollado con **Node.js**, **Express**, **PostgreSQL** y **Sequelize**. Diseñado para alta disponibilidad y sincronización en tiempo real mediante **WebSockets** y **Redis**.

## 🚀 Características Avanzadas

- ✅ **Arquitectura SQL**: Migrada de MongoDB a PostgreSQL para garantizar integridad referencial y transacciones ACID.
- ✅ **Sincronización Real-Time**: WebSockets (Socket.IO) para actualizaciones instantáneas de disponibilidad.
- ✅ **Caché de Alto Rendimiento**: Integración con Redis para lectura ultrarrápida de perfiles y estados de parqueo.
- ✅ **Motor de Reglas de Parqueo**: Asignación automática inteligente basada en proximidad y disponibilidad.
- ✅ **Panel de Administración Proactivo**: Endpoints dedicados para monitoreo de ingresos, estadísticas de ocupación y gestión de usuarios en tiempo real.
- ✅ **Seguridad Robusta**: JWT con refresh tokens, Rate Limiting distribuido y auditoría de acciones.

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **ORM / DB**: Sequelize con PostgreSQL + **PostGIS** (Extensión espacial obligatoria)
- **Caché / NoSQL**: Redis
- **Protocolos**: HTTP, WebSockets, MQTT (IoT)
- **Documentación**: Swagger / OpenAPI 3.0

## 📋 Instalación Rápida

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Configurar Base de Datos**: Asegúrate de tener PostgreSQL (con la extensión **PostGIS** instalada) y Redis activos. Crea el archivo `.env` siguiendo el ejemplo:
   ```env
   DATABASE_URL=postgres://usuario:password@localhost:5432/parking_db
   REDIS_URL=redis://localhost:6379
   ```

3. **Inicializar Datos**:
   ```bash
   npm run seed
   ```

4. **Ejecutar**:
   ```bash
   npm run dev
   ```

## 📚 Documentación Interactiva (Swagger)

Accede a la documentación completa, esquemas de datos y prueba los endpoints en vivo:
🔗 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

## 👥 Roles del Sistema

- **Admin**: Control total, analíticas y gestión de lotes.
- **Guard**: Gestión operativa, ingreso manual y control de talanqueras.
- **Student/Faculty**: Usuarios registrados con planes de suscripción.
- **Visitor**: Usuarios casuales con cobro por hora fracción.

---
**Versión:** 2.0.0  
**Autor:** Carmen Lopez - Proyecto de Tesis UMG
