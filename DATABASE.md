# Base de Datos - Sistema de Parqueo UMG

**Motor**: PostgreSQL 15+  
**ORM**: Sequelize 6.x  
**Base de Datos**: `parking_db`

---

## 📊 Propósito de la Migración
El sistema ha sido migrado de MongoDB a PostgreSQL para garantizar:
1. **Integridad Referencial**: Uso de Llaves Foráneas (FK) para evitar huérfanos entre Usuarios y Espacios.
2. **Transacciones ACID**: Transacciones nativas para asegurar que la asignación de un espacio sea atómica.
3. **Optimización Geoespacial**: Utilización de PostGIS para cálculos de proximidad de alta precisión.

---

## 📊 Esquema Entidad-Relación (E-R)

### Tablas Principales

1. **Users**: Información de perfiles, roles y estado de pago.
2. **ParkingLots**: Cabecera de los lotes de parqueo (Nombre, Ubicación PostGIS, Capacidad).
3. **ParkingSpaces**: Detalle de cada cajón de estacionamiento y su estado actual.
4. **Sessions**: Historial de entradas y salidas (Log de ocupación).

---

## 🛠️ Modelos Sequelize

### 1. Modelo: `User`
```javascript
{
  id: Integer,
  name: String,
  email: String (Unique),
  role: Enum('student', 'faculty', 'visitor', 'guard', 'admin'),
  vehiclePlate: String (Unique),
  hasPaid: Boolean
}
```

### 2. Modelo: `ParkingLot`
```javascript
{
  id: Integer,
  name: String (Unique),
  location: Geometry(Point, 4326), // PostGIS
  totalSpaces: Integer,
  availableSpaces: Integer
}
```

### 3. Modelo: `ParkingSpace`
```javascript
{
  id: Integer,
  spaceNumber: String (Ej: 'A-01'),
  isOccupied: Boolean,
  occupiedByUserId: Integer (FK -> Users),
  parkingLotId: Integer (FK -> ParkingLots)
}
```

---

## 🛰️ Consultas Avanzadas (SQL)

### Búsqueda Geoespacial (Cercanía)
```sql
SELECT id, name, 
       ST_Distance(location, ST_MakePoint(longitude, latitude)::geography) as distance
FROM parking_lots
ORDER BY distance ASC
LIMIT 5;
```

### Actualización Atómica de Espacio
```sql
UPDATE parking_spaces 
SET is_occupied = true, occupied_by_user_id = :userId 
WHERE id = :spaceId AND is_occupied = false;
```

---
**Documentación de Ingeniería**: Marzo 2026
