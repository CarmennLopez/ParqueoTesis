# Base de Datos - Sistema de Parqueo UMG

**Motor**: MongoDB 7.0+  
**ORM**: Mongoose 8.x  
**Base de Datos**: `parqueo_umg`

---

## 📊 Esquema de la Base de Datos

### Colecciones Principales

1. **users** - Usuarios del sistema
2. **parkinglots** - Lotes de parqueo
3. **invoices** - Facturas generadas
4. **pricingplans** - Planes de tarifas
5. **auditlogs** - Registros de auditoría
6. **refreshtokens** - Tokens de autenticación (Redis)

---

## 1. Colección: `users`

### Estructura del Documento

```javascript
{
  _id: ObjectId("692cb50d5b37a245f8e8b44a"),
  name: "Juan Pérez",
  email: "juan@test.com",
  password: "$2b$10$encrypted_password_hash",
  hasPaid: false,
  cardId: "CARD001",
  vehiclePlate: "ABC123",
  nit: "CF",
  fiscalAddress: "Ciudad",
  fiscalName: null,
  currentParkingSpace: null,
  entryTime: null,
  lastPaymentAmount: 0,
  subscriptionPlan: null,
  subscriptionExpiresAt: null,
  role: "student",
  refreshTokenVersion: 0,
  createdAt: ISODate("2025-11-30T21:15:06.132Z"),
  updatedAt: ISODate("2025-11-30T21:15:06.132Z")
}
```

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `_id` | ObjectId | Sí | ID único del usuario |
| `name` | String | Sí | Nombre completo |
| `email` | String | Sí | Email (único, lowercase) |
| `password` | String | Sí | Contraseña encriptada con bcrypt |
| `hasPaid` | Boolean | No | Si pagó su última sesión |
| `cardId` | String | Sí | ID de tarjeta RFID (único) |
| `vehiclePlate` | String | Sí | Placa del vehículo (único, uppercase) |
| `nit` | String | No | NIT para facturación |
| `fiscalAddress` | String | No | Dirección fiscal |
| `fiscalName` | String | No | Nombre fiscal |
| `currentParkingSpace` | String | No | Espacio actual (ej: "A1") |
| `entryTime` | Date | No | Hora de entrada al parqueo |
| `lastPaymentAmount` | Number | No | Último monto pagado |
| `subscriptionPlan` | ObjectId | No | Referencia a PricingPlan |
| `subscriptionExpiresAt` | Date | No | Fecha de expiración de suscripción |
| `role` | String | Sí | Rol: student, faculty, visitor, guard, admin |
| `refreshTokenVersion` | Number | No | Versión del refresh token |
| `createdAt` | Date | Sí | Fecha de creación |
| `updatedAt` | Date | Sí | Última actualización |

### Índices

```javascript
// Índices únicos
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ cardId: 1 }, { unique: true });
db.users.createIndex({ vehiclePlate: 1 }, { unique: true });

// Índices de búsqueda
db.users.createIndex({ role: 1 });
db.users.createIndex({ currentParkingSpace: 1 });
```

### Queries Comunes

#### Buscar usuario por email
```javascript
db.users.findOne({ email: "juan@test.com" });
```

#### Buscar usuarios con espacio asignado
```javascript
db.users.find({ currentParkingSpace: { $ne: null } });
```

#### Buscar usuarios que no han pagado
```javascript
db.users.find({ 
  currentParkingSpace: { $ne: null },
  hasPaid: false 
});
```

#### Actualizar espacio de parqueo
```javascript
db.users.updateOne(
  { _id: ObjectId("692cb50d5b37a245f8e8b44a") },
  { 
    $set: { 
      currentParkingSpace: "A1",
      entryTime: new Date(),
      hasPaid: false 
    }
  }
);
```

#### Liberar espacio de parqueo
```javascript
db.users.updateOne(
  { _id: ObjectId("692cb50d5b37a245f8e8b44a") },
  { 
    $set: { 
      currentParkingSpace: null,
      entryTime: null,
      hasPaid: true 
    }
  }
);
```

#### Crear usuario administrador
```javascript
db.users.updateOne(
  { email: "admin@umg.edu.gt" },
  { $set: { role: "admin" } }
);
```

#### Listar usuarios por rol
```javascript
db.users.find({ role: "student" }).sort({ createdAt: -1 });
```

---

## 2. Colección: `parkinglots`

### Estructura del Documento

```javascript
{
  _id: ObjectId("692cb50d5b37a245f8e8b44b"),
  name: "Parqueo Principal UMG",
  location: {
    type: "Point",
    coordinates: [-90.506882, 14.634915]  // [longitud, latitud]
  },
  totalSpaces: 10,
  availableSpaces: 7,
  spaces: [
    {
      _id: ObjectId("692cb50d5b37a245f8e8b44c"),
      spaceNumber: "A1",
      isOccupied: true,
      occupiedBy: ObjectId("692cb50d5b37a245f8e8b44a"),
      entryTime: ISODate("2025-11-30T21:15:06.132Z")
    },
    {
      _id: ObjectId("692cb50d5b37a245f8e8b44d"),
      spaceNumber: "A2",
      isOccupied: false,
      occupiedBy: null,
      entryTime: null
    }
  ],
  createdAt: ISODate("2025-11-30T21:15:06.132Z"),
  updatedAt: ISODate("2025-11-30T21:15:06.132Z")
}
```

### Índices

```javascript
// Índice único por nombre
db.parkinglots.createIndex({ name: 1 }, { unique: true });

// Índice geoespacial para búsquedas de cercanía
db.parkinglots.createIndex({ location: "2dsphere" });
```

### Queries Comunes

#### Obtener estado del parqueo
```javascript
db.parkinglots.findOne({ name: "Parqueo Principal UMG" });
```

#### Buscar espacios disponibles
```javascript
db.parkinglots.aggregate([
  { $unwind: "$spaces" },
  { $match: { "spaces.isOccupied": false } },
  { $project: { spaceNumber: "$spaces.spaceNumber" } }
]);
```

#### Asignar espacio a usuario
```javascript
db.parkinglots.updateOne(
  { 
    name: "Parqueo Principal UMG",
    "spaces.spaceNumber": "A1"
  },
  { 
    $set: { 
      "spaces.$.isOccupied": true,
      "spaces.$.occupiedBy": ObjectId("692cb50d5b37a245f8e8b44a"),
      "spaces.$.entryTime": new Date()
    },
    $inc: { availableSpaces: -1 }
  }
);
```

#### Liberar espacio
```javascript
db.parkinglots.updateOne(
  { 
    name: "Parqueo Principal UMG",
    "spaces.spaceNumber": "A1"
  },
  { 
    $set: { 
      "spaces.$.isOccupied": false,
      "spaces.$.occupiedBy": null,
      "spaces.$.entryTime": null
    },
    $inc: { availableSpaces: 1 }
  }
);
```

#### Buscar parqueos cercanos (búsqueda geoespacial)
```javascript
db.parkinglots.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [-90.506882, 14.634915]
      },
      $maxDistance: 1000 // metros
    }
  }
});
```

---

## 3. Colección: `invoices`

### Estructura del Documento

```javascript
{
  _id: ObjectId("692cb60d5b37a245f8e8b55b"),
  invoiceNumber: "INV-2025-001",
  userId: ObjectId("692cb50d5b37a245f8e8b44a"),
  amount: 15.50,
  currency: "GTQ",
  status: "PAID",
  felData: {
    authorizationUUID: "FEL-UUID-12345",
    serie: "A",
    number: "001",
    certificationDate: ISODate("2025-11-30T22:30:15.456Z")
  },
  items: [
    {
      description: "Estacionamiento - Espacio A1",
      quantity: 1,
      unitPrice: 15.50,
      total: 15.50
    }
  ],
  pdfUrl: "/invoices/INV-2025-001.pdf",
  createdAt: ISODate("2025-11-30T22:30:15.456Z"),
  updatedAt: ISODate("2025-11-30T22:30:15.456Z")
}
```

### Índices

```javascript
db.invoices.createIndex({ invoiceNumber: 1 }, { unique: true });
db.invoices.createIndex({ userId: 1 });
db.invoices.createIndex({ status: 1 });
db.invoices.createIndex({ createdAt: -1 });
```

### Queries Comunes

#### Buscar facturas de un usuario
```javascript
db.invoices.find({ 
  userId: ObjectId("692cb50d5b37a245f8e8b44a") 
}).sort({ createdAt: -1 });
```

#### Facturas por estado
```javascript
db.invoices.find({ status: "PAID" });
```

#### Total facturado en un período
```javascript
db.invoices.aggregate([
  {
    $match: {
      createdAt: {
        $gte: ISODate("2025-11-01"),
        $lte: ISODate("2025-11-30")
      },
      status: "PAID"
    }
  },
  {
    $group: {
      _id: null,
      totalAmount: { $sum: "$amount" },
      count: { $sum: 1 }
    }
  }
]);
```

#### Crear factura
```javascript
db.invoices.insertOne({
  invoiceNumber: "INV-2025-002",
  userId: ObjectId("692cb50d5b37a245f8e8b44a"),
  amount: 15.50,
  currency: "GTQ",
  status: "PAID",
  felData: {
    authorizationUUID: "FEL-UUID-12346",
    serie: "A",
    number: "002",
    certificationDate: new Date()
  },
  items: [
    {
      description: "Estacionamiento - 1.5 horas",
      quantity: 1.5,
      unitPrice: 10.00,
      total: 15.00
    }
  ],
  pdfUrl: "/invoices/INV-2025-002.pdf"
});
```

---

## 4. Colección: `pricingplans`

### Estructura del Documento

```javascript
{
  _id: ObjectId("692cb70d5b37a245f8e8b66c"),
  code: "STANDARD_HOURLY",
  name: "Tarifa Por Hora - Estudiantes",
  type: "HOURLY",
  baseRate: 10.00,
  currency: "GTQ",
  billingInterval: "HOUR",
  description: "Tarifa estándar por hora para estudiantes",
  isActive: true,
  rules: {
    gracePeriodMinutes: 15,
    maxDailyCap: 50.00,
    weekendMultiplier: 1.0
  },
  createdAt: ISODate("2025-11-30T21:15:06.132Z"),
  updatedAt: ISODate("2025-11-30T21:15:06.132Z")
}
```

### Queries Comunes

#### Obtener planes activos
```javascript
db.pricingplans.find({ isActive: true });
```

#### Buscar plan por código
```javascript
db.pricingplans.findOne({ code: "STANDARD_HOURLY" });
```

#### Crear nuevo plan
```javascript
db.pricingplans.insertOne({
  code: "MONTHLY_STUDENT",
  name: "Mensualidad Estudiantes",
  type: "SUBSCRIPTION",
  baseRate: 250.00,
  currency: "GTQ",
  billingInterval: "MONTH",
  description: "Suscripción mensual ilimitada para estudiantes",
  isActive: true,
  rules: {
    gracePeriodMinutes: 0,
    maxDailyCap: null,
    weekendMultiplier: 1.0
  }
});
```

---

## 5. Colección: `auditlogs`

### Estructura del Documento

```javascript
{
  _id: ObjectId("692cb80d5b37a245f8e8b77d"),
  userId: ObjectId("692cb50d5b37a245f8e8b44a"),
  userRole: "student",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  action: "LOGIN",
  resource: "Auth",
  status: "SUCCESS",
  details: {
    email: "juan@test.com",
    loginMethod: "password"
  },
  timestamp: ISODate("2025-11-30T21:15:06.132Z")
}
```

### Índices

```javascript
db.auditlogs.createIndex({ timestamp: -1, action: 1 });
db.auditlogs.createIndex({ userId: 1 });
```

### Queries Comunes

#### Logs de un usuario
```javascript
db.auditlogs.find({ 
  userId: ObjectId("692cb50d5b37a245f8e8b44a") 
}).sort({ timestamp: -1 }).limit(100);
```

#### Logs por acción
```javascript
db.auditlogs.find({ action: "LOGIN" })
  .sort({ timestamp: -1 })
  .limit(50);
```

#### Logs de intentos fallidos
```javascript
db.auditlogs.find({ 
  status: "FAILURE",
  action: "LOGIN"
}).sort({ timestamp: -1 });
```

#### Análisis de actividad por fecha
```javascript
db.auditlogs.aggregate([
  {
    $match: {
      timestamp: {
        $gte: ISODate("2025-11-01"),
        $lte: ISODate("2025-11-30")
      }
    }
  },
  {
    $group: {
      _id: { action: "$action", status: "$status" },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);
```

---

## 📦 Exportar/Importar Base de Datos

### Exportar toda la base de datos

```bash
mongodump --uri="mongodb+srv://usuario:contraseña@cluster.mongodb.net/parqueo_umg" --out=./backup
```

### Exportar solo una colección

```bash
mongoexport --uri="mongodb+srv://usuario:contraseña@cluster.mongodb.net/parqueo_umg" --collection=users --out=users.json
```

### Importar base de datos

```bash
mongorestore --uri="mongodb+srv://usuario:contraseña@cluster.mongodb.net/parqueo_umg" ./backup/parqueo_umg
```

### Importar una colección

```bash
mongoimport --uri="mongodb+srv://usuario:contraseña@cluster.mongodb.net/parqueo_umg" --collection=users --file=users.json
```

---

## 🔧 Scripts de Inicialización

### Script 1: Crear Base de Datos y Colecciones

```javascript
// Conectar a MongoDB
use parqueo_umg;

// Crear colecciones con validación
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password", "cardId", "vehiclePlate"],
      properties: {
        email: { bsonType: "string", pattern: "^\\S+@\\S+\\.\\S+$" },
        role: { enum: ["admin", "guard", "faculty", "student", "visitor"] }
      }
    }
  }
});
```

### Script 2: Crear Índices

```javascript
// Índices de users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ cardId: 1 }, { unique: true });
db.users.createIndex({ vehiclePlate: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Índices de parkinglots
db.parkinglots.createIndex({ name: 1 }, { unique: true });
db.parkinglots.createIndex({ location: "2dsphere" });

// Índices de invoices
db.invoices.createIndex({ invoiceNumber: 1 }, { unique: true });
db.invoices.createIndex({ userId: 1 });
db.invoices.createIndex({ createdAt: -1 });

// Índices de auditlogs
db.auditlogs.createIndex({ timestamp: -1, action: 1 });
db.auditlogs.createIndex({ userId: 1 });

// Índices de pricingplans
db.pricingplans.createIndex({ code: 1 }, { unique: true });
```

### Script 3: Datos de Prueba

```javascript
// Crear parqueo inicial
db.parkinglots.insertOne({
  name: "Parqueo Principal UMG",
  location: {
    type: "Point",
    coordinates: [-90.506882, 14.634915]
  },
  totalSpaces: 10,
  availableSpaces: 10,
  spaces: [
    { spaceNumber: "A1", isOccupied: false, occupiedBy: null, entryTime: null },
    { spaceNumber: "A2", isOccupied: false, occupiedBy: null, entryTime: null },
    { spaceNumber: "A3", isOccupied: false, occupiedBy: null, entryTime: null },
    { spaceNumber: "A4", isOccupied: false, occupiedBy: null, entryTime: null },
    { spaceNumber: "A5", isOccupied: false, occupiedBy: null, entryTime: null },
    { spaceNumber: "B1", isOccupied: false, occupiedBy: null, entryTime: null },
    { spaceNumber: "B2", isOccupied: false, occupiedBy: null, entryTime: null },
    { spaceNumber: "B3", isOccupied: false, occupiedBy: null, entryTime: null },
    { spaceNumber: "B4", isOccupied: false, occupiedBy: null, entryTime: null },
    { spaceNumber: "B5", isOccupied: false, occupiedBy: null, entryTime: null }
  ]
});

// Crear planes de precios
db.pricingplans.insertMany([
  {
    code: "HOURLY_STUDENT",
    name: "Por Hora - Estudiantes",
    type: "HOURLY",
    baseRate: 10.00,
    currency: "GTQ",
    billingInterval: "HOUR",
    isActive: true,
    rules: { gracePeriodMinutes: 15, maxDailyCap: 50.00 }
  },
  {
    code: "HOURLY_VISITOR",
    name: "Por Hora - Visitantes",
    type: "HOURLY",
    baseRate: 15.00,
    currency: "GTQ",
    billingInterval: "HOUR",
    isActive: true,
    rules: { gracePeriodMinutes: 15, maxDailyCap: 75.00 }
  }
]);
```

---

## 📊 Consultas de Análisis

### Reporte de Ingresos Diarios

```javascript
db.invoices.aggregate([
  {
    $match: {
      status: "PAID",
      createdAt: {
        $gte: ISODate("2025-11-01"),
        $lte: ISODate("2025-11-30")
      }
    }
  },
  {
    $group: {
      _id: { 
        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
      },
      totalIncome: { $sum: "$amount" },
      invoiceCount: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);
```

### Usuarios Más Activos

```javascript
db.invoices.aggregate([
  {
    $group: {
      _id: "$userId",
      totalSpent: { $sum: "$amount" },
      visits: { $sum: 1 }
    }
  },
  { $sort: { totalSpent: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "userInfo"
    }
  }
]);
```

### Ocupación Promedio del Parqueo

```javascript
db.parkinglots.aggregate([
  { $unwind: "$spaces" },
  {
    $group: {
      _id: "$name",
      totalSpaces: { $sum: 1 },
      occupiedSpaces: {
        $sum: { $cond: ["$spaces.isOccupied", 1, 0] }
      }
    }
  },
  {
    $project: {
      totalSpaces: 1,
      occupiedSpaces: 1,
      occupancyRate: {
        $multiply: [
          { $divide: ["$occupiedSpaces", "$totalSpaces"] },
          100
        ]
      }
    }
  }
]);
```

---

## 🔒 Seguridad y Permisos

### Crear Usuario de Base de Datos

```javascript
use admin;

db.createUser({
  user: "parqueo_app",
  pwd: "password_seguro_aqui",
  roles: [
    { role: "readWrite", db: "parqueo_umg" },
    { role: "dbAdmin", db: "parqueo_umg" }
  ]
});
```

### String de Conexión Recomendado

```
mongodb+srv://parqueo_app:password@cluster.mongodb.net/parqueo_umg?retryWrites=true&w=majority
```

---

## 📝 Notas Importantes

1. **Backup Regular**: Configurar backups automáticos diarios
2. **Índices**: Todos los índices están configurados para optimizar consultas
3. **Relaciones**: Se usan referencias (ObjectId) para mantener integridad
4. **Auditoría**: Todos los eventos críticos se registran en `auditlogs`
5. **Escalabilidad**: Diseñado para soportar múltiples sedes con índices geoespaciales

---

**Documentación generada**: 2025-11-30  
**Versión del Sistema**: 2.0.0
