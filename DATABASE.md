# 🗄️ Base de Datos — Sistema de Parqueo UMG v2.0

**Motor**: PostgreSQL 14+  
**ORM**: Sequelize 6.x  
**Base de Datos**: `parking_db`

---

## 📊 Tablas Principales

| Tabla | Descripción |
|---|---|
| `users` | Usuarios del sistema con datos de solvencia |
| `parking_lots` | Lotes de parqueo |
| `parking_spaces` | Espacios individuales de cada lote |
| `pricing_plans` | Planes de tarifas |
| `invoices` | Facturas generadas |
| `audit_logs` | Registros de auditoría |

> Las tablas se crean automáticamente con `sequelize.sync({ alter: true })` al iniciar el servidor en modo `development`.

---

## 1. Tabla: `users`

### Estructura

```sql
CREATE TABLE users (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) NOT NULL UNIQUE,
  password         VARCHAR(255) NOT NULL,
  card_id          VARCHAR(255) UNIQUE,
  vehicle_plate    VARCHAR(50) UNIQUE,
  role             VARCHAR(50) DEFAULT 'student',
  nit              VARCHAR(100),
  fiscal_address   VARCHAR(255),
  fiscal_name      VARCHAR(255),
  has_paid         BOOLEAN DEFAULT false,
  current_parking_space_id INTEGER,
  entry_time       TIMESTAMP,
  last_payment_amount DECIMAL(10,2) DEFAULT 0,
  refresh_token_version INTEGER DEFAULT 0,
  -- Solvencia
  is_solvent        BOOLEAN DEFAULT false,
  solvency_expires  TIMESTAMP,
  solvency_updated_by INTEGER,
  "createdAt"      TIMESTAMP NOT NULL,
  "updatedAt"      TIMESTAMP NOT NULL
);
```

### Campos importantes

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER | PK autoincremental |
| `email` | VARCHAR | Único, lowercase |
| `password` | VARCHAR | Hash bcrypt |
| `card_id` | VARCHAR | Carné / RFID único |
| `vehicle_plate` | VARCHAR | Placa en mayúscula |
| `role` | VARCHAR | `admin`, `guard`, `faculty`, `student`, `visitor` |
| `is_solvent` | BOOLEAN | ¿Tiene solvencia vigente? |
| `solvency_expires` | TIMESTAMP | Fecha de expiración de solvencia |
| `current_parking_space_id` | INTEGER FK | Espacio asignado actualmente |

### Queries comunes (SQL)

```sql
-- Buscar usuario por email
SELECT * FROM users WHERE email = 'juan@umg.edu.gt';

-- Usuarios con espacio asignado
SELECT u.name, u.vehicle_plate, ps.space_number, u.entry_time
FROM users u
JOIN parking_spaces ps ON u.current_parking_space_id = ps.id
WHERE u.current_parking_space_id IS NOT NULL;

-- Estudiantes sin solvencia
SELECT * FROM users
WHERE role = 'student'
  AND (is_solvent = false OR solvency_expires < NOW());

-- Actualizar solvencia
UPDATE users
SET is_solvent = true,
    solvency_expires = NOW() + INTERVAL '1 month',
    solvency_updated_by = 1
WHERE id = 5;

-- Cambiar rol a admin
UPDATE users SET role = 'admin' WHERE email = 'admin@umg.edu.gt';
```

### Sequelize (ORM)

```javascript
// Buscar usuario
const user = await User.findOne({ where: { email } });

// Actualizar solvencia
await user.update({
  isSolvent: true,
  solvencyExpires: new Date(Date.now() + 30*24*60*60*1000)
});

// Usuarios activos en parqueo
const active = await User.findAll({
  where: { currentParkingSpaceId: { [Op.ne]: null } }
});
```

---

## 2. Tabla: `parking_lots`

### Estructura

```sql
CREATE TABLE parking_lots (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255) NOT NULL UNIQUE,
  location         JSONB,             -- GeoJSON: { type:"Point", coordinates:[lng,lat] }
  total_spaces     INTEGER NOT NULL,
  available_spaces INTEGER DEFAULT 0,
  is_active        BOOLEAN DEFAULT true,
  "createdAt"      TIMESTAMP NOT NULL,
  "updatedAt"      TIMESTAMP NOT NULL
);
```

### Queries comunes

```sql
-- Ver todos los parqueos
SELECT id, name, total_spaces, available_spaces FROM parking_lots;

-- Parqueos con espacios disponibles
SELECT * FROM parking_lots WHERE available_spaces > 0 AND is_active = true;

-- Ocupación general
SELECT name,
       total_spaces,
       available_spaces,
       total_spaces - available_spaces AS occupied,
       ROUND((total_spaces - available_spaces)::NUMERIC / total_spaces * 100, 1) AS occupancy_pct
FROM parking_lots;
```

---

## 3. Tabla: `parking_spaces`

### Estructura

```sql
CREATE TABLE parking_spaces (
  id               SERIAL PRIMARY KEY,
  parking_lot_id   INTEGER NOT NULL REFERENCES parking_lots(id),
  space_number     INTEGER NOT NULL,
  is_occupied      BOOLEAN DEFAULT false,
  occupied_by_id   INTEGER REFERENCES users(id),
  entry_time       TIMESTAMP,
  "createdAt"      TIMESTAMP NOT NULL,
  "updatedAt"      TIMESTAMP NOT NULL
);
```

### Queries comunes

```sql
-- Espacios disponibles de un lote
SELECT * FROM parking_spaces
WHERE parking_lot_id = 1 AND is_occupied = false
ORDER BY space_number;

-- Qué espacio ocupa cada usuario
SELECT ps.space_number, u.name, u.vehicle_plate, ps.entry_time
FROM parking_spaces ps
JOIN users u ON ps.occupied_by_id = u.id
WHERE ps.is_occupied = true;

-- Liberar espacio
UPDATE parking_spaces
SET is_occupied = false, occupied_by_id = NULL, entry_time = NULL
WHERE id = 5;
```

---

## 4. Tabla: `pricing_plans`

### Estructura

```sql
CREATE TABLE pricing_plans (
  id                SERIAL PRIMARY KEY,
  code              VARCHAR(100) UNIQUE NOT NULL,
  name              VARCHAR(255) NOT NULL,
  type              VARCHAR(50),        -- 'hourly', 'monthly'
  base_rate         DECIMAL(10,2),
  currency          VARCHAR(10) DEFAULT 'GTQ',
  billing_interval  VARCHAR(50),        -- 'HOUR', 'MONTH'
  description       TEXT,
  is_active         BOOLEAN DEFAULT true,
  rules             JSONB,
  "createdAt"       TIMESTAMP NOT NULL,
  "updatedAt"       TIMESTAMP NOT NULL
);
```

### Planes por defecto (seeders)

| Código | Tipo | Tarifa | Para |
|---|---|---|---|
| `STANDARD_HOURLY` | hourly | Q10/hr | Estudiantes, Visitantes |
| `FACULTY_MONTHLY` | monthly | Q150/mes | Catedráticos |
| `ADMIN_VIP` | monthly | Q300/mes | Admin, Guard |
| `TEMP_DISCOUNT` | hourly | Q5/hr | Promocional |

### Query

```sql
-- Planes activos
SELECT code, name, type, base_rate FROM pricing_plans WHERE is_active = true;

-- Buscar por código
SELECT * FROM pricing_plans WHERE code = 'STANDARD_HOURLY';
```

---

## 5. Tabla: `invoices`

### Estructura

```sql
CREATE TABLE invoices (
  id               SERIAL PRIMARY KEY,
  invoice_number   VARCHAR(100) UNIQUE,
  user_id          INTEGER REFERENCES users(id),
  amount           DECIMAL(10,2),
  currency         VARCHAR(10) DEFAULT 'GTQ',
  status           VARCHAR(50) DEFAULT 'PAID',
  fel_data         JSONB,
  items            JSONB,
  pdf_url          VARCHAR(500),
  "createdAt"      TIMESTAMP NOT NULL,
  "updatedAt"      TIMESTAMP NOT NULL
);
```

### Queries comunes

```sql
-- Facturas de un usuario
SELECT * FROM invoices WHERE user_id = 5 ORDER BY "createdAt" DESC;

-- Ingresos del mes
SELECT
  DATE_TRUNC('day', "createdAt") AS dia,
  SUM(amount) AS total,
  COUNT(*) AS cantidad
FROM invoices
WHERE status = 'PAID'
  AND "createdAt" >= DATE_TRUNC('month', NOW())
GROUP BY dia
ORDER BY dia;

-- Top usuarios por gasto
SELECT u.name, u.email, SUM(i.amount) AS total_gastado, COUNT(*) AS visitas
FROM invoices i
JOIN users u ON i.user_id = u.id
WHERE i.status = 'PAID'
GROUP BY u.id, u.name, u.email
ORDER BY total_gastado DESC
LIMIT 10;
```

---

## 6. Tabla: `audit_logs`

### Estructura

```sql
CREATE TABLE audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id),
  user_role   VARCHAR(50),
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  action      VARCHAR(100),    -- 'LOGIN', 'REGISTER', 'ASSIGN', 'PAY', 'RELEASE'
  resource    VARCHAR(100),
  status      VARCHAR(50),     -- 'SUCCESS', 'FAILURE'
  details     JSONB,
  timestamp   TIMESTAMP DEFAULT NOW()
);
```

### Queries comunes

```sql
-- Logs de un usuario
SELECT * FROM audit_logs WHERE user_id = 5 ORDER BY timestamp DESC LIMIT 50;

-- Intentos de login fallidos
SELECT * FROM audit_logs
WHERE action = 'LOGIN' AND status = 'FAILURE'
ORDER BY timestamp DESC;

-- Actividad por acción
SELECT action, status, COUNT(*) AS cantidad
FROM audit_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY action, status
ORDER BY cantidad DESC;
```

---

## 🔧 Administración con pgAdmin / psql

### Conectar a la BD
```bash
psql -U postgres -d parking_db
```

### Ver tablas
```sql
\dt
```

### Ver estructura de una tabla
```sql
\d users
```

### Backup de la BD
```bash
pg_dump -U postgres parking_db > backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
psql -U postgres parking_db < backup_20260224.sql
```

---

## 📝 Notas Importantes

1. **Auto-sync**: En desarrollo, Sequelize crea y altera tablas automáticamente
2. **Migraciones**: En producción, usar migraciones Sequelize en lugar de `sync`
3. **JSONB**: Los campos `location`, `fel_data`, `items`, `rules` son JSONB — permiten queries flexibles
4. **Solvencia**: Revisar `is_solvent` Y `solvency_expires` al validar acceso de estudiantes
5. **Backups**: Programar `pg_dump` diario para no perder datos

---

**Última actualización**: Febrero 2026 | **Versión**: 2.0.0 (PostgreSQL)
