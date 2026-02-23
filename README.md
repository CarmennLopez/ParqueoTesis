# Sistema de Gestión de Parqueo - API REST

Sistema completo de gestión de parqueo desarrollado con Node.js, Express y PostgreSQL (Sequelize). Permite el control de entrada, pago y salida de vehículos con autenticación JWT y roles de usuario.

## 🚀 Características

- ✅ Sistema de autenticación con JWT
- ✅ Gestión de espacios de parqueo en tiempo real
- ✅ Cálculo automático de tarifas por tiempo
- ✅ Validación de pago antes de permitir salida
- ✅ Panel de administración para ver estado del parqueo
- ✅ Sistema de roles (Usuario, Administrador, Operador)
- ✅ Validación robusta de datos
- ✅ Seguridad con Helmet, CORS y sanitización
- ✅ Rate limiting para prevenir ataques de fuerza bruta
- ✅ Logging profesional con Winston

## 📋 Requisitos Previos

- Node.js 16+ 
- PostgreSQL 14+
- npm o yarn

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd TesisProyect
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRATION=24h
ALLOWED_ORIGINS=http://localhost:3000
PARKING_LOT_NAME=Parqueo Principal
LOG_LEVEL=info
```

### 4. Inicializar la base de datos

Ejecutar el script de seed para crear el parqueo inicial:

```bash
npm run seed
```

Este comando creará un lote de parqueo con 10 espacios (A1-A5, B1-B5).

### 5. Iniciar el servidor

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📖 Documentación API (Swagger)

Puedes ver la documentación interactiva y probar los endpoints directamente en:

**http://localhost:3000/api-docs**

## � Uso de la API

### Autenticación

#### Registrar Usuario

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@miumg.edu.gt",
  "password": "Password123",
  "cardId": "CARD001",
  "vehiclePlate": "ABC123"
}
```

**Requisitos de contraseña:**
- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número

#### Iniciar Sesión

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@miumg.edu.gt",
  "password": "Password123"
}
```

**Respuesta:**
```json
{
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user",
    "hasPaid": false,
    "currentParkingSpace": null
  }
}
```

### Sistema de Parqueo

**📝 Nota:** Todas las rutas de parqueo requieren autenticación. Incluir el token en el header:

```
Authorization: Bearer <tu_token_jwt>
```

#### 1. Asignar Espacio (Entrada)

```bash
POST /api/parking/assign
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "message": "Espacio asignado con éxito",
  "space": "A1",
  "entryTime": "2025-11-22T06:00:00.000Z",
  "rate": "$2.5 por hora"
}
```

#### 2. Pagar Estacionamiento

```bash
POST /api/parking/pay
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "message": "Pago registrado con éxito. Puede proceder a la salida.",
  "costoPagado": "$5.00",
  "tiempoEstancia": "120 minutos",
  "horasCobradas": 2,
  "tarifaPorHora": "$2.5",
  "hasPaid": true
}
```

#### 3. Salir del Parqueo (Liberar Espacio)

```bash
POST /api/parking/release
Authorization: Bearer <token>
```

**Respuesta (con pago realizado):**
```json
{
  "message": "¡Salida exitosa! Espacio A1 liberado. Barrera abierta.",
  "timeSpent": "120 minutos",
  "horasCobradas": 2,
  "costFinal": "$5.00"
}
```

**Respuesta (sin pago):**
```json
{
  "message": "Salida denegada. Debe pagar el servicio de parqueo.",
  "requiredAction": "Pagar en /api/parking/pay",
  "timeSpent": "120 minutos",
  "horasCobrar": 2,
  "totalCost": "$5.00"
}
```

#### 4. Ver Estado del Parqueo (Solo Administradores)

```bash
GET /api/parking/status
Authorization: Bearer <token_admin>
```

**Respuesta:**
```json
{
  "parkingLotName": "Parqueo Principal",
  "location": "Centro Comercial",
  "totalSpaces": 10,
  "occupiedSpaces": 3,
  "availableSpaces": 7,
  "occupiedDetails": [
    {
      "spaceNumber": "A1",
      "occupiedBy": {
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "vehiclePlate": "ABC123"
      },
      "entryTime": "2025-11-22T06:00:00.000Z",
      "durationMinutes": 45,
      "estimatedCost": "$2.50"
    }
  ],
  "ratePerHour": "$2.5"
}
```

### Health Check

```bash
GET /health
```

**Respuesta:**
```json
{
  "status": "OK",
  "uptime": 12345,
  "timestamp": 1700000000000,
  "environment": "development"
}
```

## 👥 Sistema de Roles

El sistema cuenta con tres roles:

- **user**: Usuario normal (puede usar el parqueo)
- **admin**: Administrador (acceso completo, puede ver estadísticas)
- **operator**: Operador (puede ver estadísticas y gestionar parqueo)

Para crear un administrador, modificar el rol directamente en la base de datos:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## 🔒 Seguridad

### Implementaciones de Seguridad

- **Helmet**: Headers HTTP seguros
- **CORS**: Control de orígenes permitidos
- **Rate Limiting**: Máximo 5 intentos de login cada 15 minutos
- **Validación de datos**: Express-validator en todas las entradas
- **Validación de datos**: Express-validator en todas las entradas
- **JWT**: Tokens con expiración de 24 horas
- **Bcrypt**: Encriptación de contraseñas con salt rounds de 10

### Recomendaciones para Producción

1. **Variables de entorno seguras**: 
   - Usar secreto JWT aleatorio y complejo
   - Especificar orígenes CORS exactos (no usar `*`)

2. **HTTPS**: 
   - Forzar HTTPS en producción
   - Usar certificados SSL válidos

3. **PostgreSQL**:
   - Usar PostgreSQL Cloud (RDS, Cloud SQL) o servidor dedicado
   - Configurar backups automáticos diarios

4. **Monitoreo**:
   - Revisar logs regularmente
   - Configurar alertas de errores

## 📁 Estructura del Proyecto

```
TesisProyect/
├── src/
│   ├── config/
│   │   ├── constants.js       # Constantes centralizadas
│   │   └── logger.js          # Configuración de Winston
│   ├── controllers/
│   │   ├── authController.js  # Lógica de autenticación
│   │   └── parkingController.js # Lógica de parqueo
│   ├── middleware/
│   │   ├── authMiddleware.js  # Verificación JWT
│   │   ├── authorize.js       # Autorización por roles
│   │   └── errorHandler.js    # Manejo centralizado de errores
│   ├── models/
│   │   ├── user.js           # Modelo de usuario
│   │   └── ParkingLot.js     # Modelo de parqueo
│   ├── routes/
│   │   ├── authRoutes.js     # Rutas de autenticación
│   │   └── parkingRoutes.js  # Rutas de parqueo
│   └── utils/
│       └── ApiError.js        # Clase de error personalizada
├── logs/                      # Logs de la aplicación (generados)
├── .env                       # Variables de entorno (NO versionar)
├── .env.example              # Plantilla de variables de entorno
├── .gitignore                # Archivos ignorados por git
├── package.json              # Dependencias y scripts
├── seed.js                   # Script de inicialización de DB
└── server.js                 # Punto de entrada de la aplicación
```

## 🧪 Testing

Actualmente el proyecto no tiene tests automatizados. Se recomienda implementar:

- Tests unitarios con Jest
- Tests de integración con Supertest
- Cobertura mínima del 80%

## 📝 Scripts Disponibles

```bash
npm start        # Iniciar servidor en producción
npm run dev      # Iniciar servidor en modo desarrollo
npm run seed     # Inicializar/reiniciar base de datos
```

## 🐛 Troubleshooting

### Error: "Variables de BD no definidas"
- Verificar que existe el archivo `.env`
- Verificar que `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` están definidos

### Error: "No autorizado, no se proporcionó token"
- Verificar que el header `Authorization` está presente
- Formato correcto: `Authorization: Bearer <token>`

### Error: "Parqueo lleno"
- Ejecutar `npm run seed` para reiniciar el parqueo
- O liberar espacios usando `/api/parking/release`

### Error de conexión a PostgreSQL
- Verificar que PostgreSQL está corriendo (o Docker activo)
- Verificar las credenciales en `.env`

## 📄 Licencia

ISC

## 👤 Autor

Carmen Lopez - Proyecto de Tesis

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025
