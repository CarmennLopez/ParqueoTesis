# Base de Datos - Sistema de Parqueo UMG

**Motor**: PostgreSQL 14+  
**ORM**: Sequelize 6.x  
**Base de Datos**: `parking_db`

---

## 📊 Esquema de la Base de Datos

### Tablas Principales

1. **users** - Usuarios del sistema
2. **parking_lots** - Lotes de parqueo
3. **parking_spaces** - Espacios individuales de parqueo
4. **invoices** - Facturas generadas
5. **pricing_plans** - Planes de tarifas
6. **audit_logs** - Registros de auditoría

---

## 1. Tabla: `users`

### Estructura

```sql
CREATE TABLE users (
  id                     SERIAL PRIMARY KEY,
  name                   VARCHAR(50)   NOT NULL,
  email                  VARCHAR(100)  NOT NULL UNIQUE,
  password               VARCHAR(255)  NOT NULL,
  role                   VARCHAR(20)   NOT NULL DEFAULT 'student',
  card_id                VARCHAR(20)   NOT NULL UNIQUE,
  vehicle_plate          VARCHAR(10)   NOT NULL UNIQUE,
  has_paid               BOOLEAN       NOT NULL DEFAULT FALSE,
  nit                    VARCHAR(20)   DEFAULT 'CF',
  fiscal_address         VARCHAR(255)  DEFAULT 'Ciudad',
  fiscal_name            VARCHAR(100),
  current_parking_lot_id INTEGER       REFERENCES parking_lots(id),
  current_parking_space  VARCHAR(10),
  entry_time             TIMESTAMPTZ,
  last_payment_amount    DECIMAL(10,2) DEFAULT 0,
  refresh_token_version  INTEGER       NOT NULL DEFAULT 0,
  -- Solvencia Mensual
  is_solvent             BOOLEAN       NOT NULL DEFAULT FALSE,
  solvency_expires       TIMESTAMPTZ,
  solvency_updated_by    INTEGER       REFERENCES users(id),
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Campos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | SERIAL | PRIMARY KEY | ID único auto-incrementable |
| `name` | VARCHAR(50) | NOT NULL | Nombre completo |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Email (debe ser @miumg.edu.gt) |
| `password` | VARCHAR(255) | NOT NULL | Contraseña encriptada con bcrypt |
| `has_paid` | BOOLEAN | DEFAULT FALSE | Si pagó su última sesión |
| `card_id` | VARCHAR(20) | UNIQUE, NOT NULL | Carné de identificación |
| `vehicle_plate` | VARCHAR(10) | UNIQUE, NOT NULL | Placa del vehículo (ej: UMG-001) |
| `nit` | VARCHAR(20) | DEFAULT 'CF' | NIT para facturación |
| `fiscal_address` | VARCHAR(255) | - | Dirección fiscal |
| `fiscal_name` | VARCHAR(100) | - | Nombre fiscal |
| `current_parking_lot_id` | INT FK | - | Lote actual |
| `current_parking_space` | VARCHAR(10) | - | Espacio actual (ej: "A-5") |
| `entry_time` | TIMESTAMPTZ | - | Hora de entrada al parqueo |
| `last_payment_amount` | DECIMAL(10,2) | DEFAULT 0 | Último monto pagado |
| `refresh_token_version` | INTEGER | DEFAULT 0 | Versión del refresh token |
| `is_solvent` | BOOLEAN | DEFAULT FALSE | Si el usuario tiene solvencia mensual vigente |
| `solvency_expires` | TIMESTAMPTZ | NULL | Fecha de vencimiento de la solvencia |
| `solvency_updated_by` | INT FK | NULL | ID del admin/guard que actualizó la solvencia |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

### Queries Comunes

#### Buscar usuario por email
```sql
SELECT * FROM users WHERE email = 'juan@miumg.edu.gt';
```

#### Buscar usuarios con espacio asignado
```sql
SELECT * FROM users WHERE current_parking_space IS NOT NULL;
```

#### Buscar usuarios que no han pagado
```sql
SELECT * FROM users 
WHERE current_parking_space IS NOT NULL AND has_paid = FALSE;
```

#### Actualizar espacio de parqueo (entrada)
```sql
UPDATE users
SET current_parking_space = 'A1',
    current_parking_lot_id = 1,
    entry_time = NOW(),
    has_paid = FALSE
WHERE id = 2;
```

#### Liberar espacio de parqueo (salida)
```sql
UPDATE users
SET current_parking_space = NULL,
    current_parking_lot_id = NULL,
    entry_time = NULL,
    has_paid = FALSE,
    last_payment_amount = 0
WHERE id = 2;
```

#### Crear usuario administrador
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@miumg.edu.gt';
```

#### Listar usuarios por rol
```sql
SELECT * FROM users WHERE role = 'student' ORDER BY created_at DESC;
```

#### Actualizar solvencia mensual (1 mes)
```sql
UPDATE users
SET is_solvent = TRUE,
    solvency_expires = NOW() + INTERVAL '1 month',
    solvency_updated_by = 1  -- ID del admin/guard
WHERE id = 5;
```

#### Consultar solvencia por carné
```sql
SELECT id, name, role, card_id, is_solvent, solvency_expires,
       GREATEST(0, EXTRACT(DAY FROM solvency_expires - NOW())::int) AS days_remaining
FROM users
WHERE card_id = '12345678';
```

#### Reporte de solvencias de estudiantes
```sql
SELECT id, name, card_id, vehicle_plate, is_solvent, solvency_expires,
       CASE
         WHEN solvency_expires > NOW() AND is_solvent = TRUE THEN 'VIGENTE'
         ELSE 'VENCIDA'
       END AS status
FROM users
WHERE role = 'student'
ORDER BY solvency_expires ASC NULLS LAST;
```

---

## 2. Tabla: `parking_lots`

### Estructura

```sql
CREATE TABLE parking_lots (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100)  NOT NULL UNIQUE,
  location         JSONB         NOT NULL DEFAULT '{"lat": 0, "lon": 0}',
  total_spaces     INTEGER       NOT NULL,
  available_spaces INTEGER       NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

### Queries Comunes

#### Obtener estado del parqueo
```sql
SELECT * FROM parking_lots WHERE name = 'Parqueo Principal UMG';
```

#### Listar lotes con espacios disponibles
```sql
SELECT id, name, available_spaces, total_spaces
FROM parking_lots
WHERE available_spaces > 0
ORDER BY available_spaces DESC;
```

#### Actualizar espacios disponibles (al asignar)
```sql
UPDATE parking_lots
SET available_spaces = available_spaces - 1,
    updated_at = NOW()
WHERE id = 1;
```

#### Actualizar espacios disponibles (al liberar)
```sql
UPDATE parking_lots
SET available_spaces = available_spaces + 1,
    updated_at = NOW()
WHERE id = 1;
```

---

## 3. Tabla: `parking_spaces`

### Estructura

```sql
CREATE TABLE parking_spaces (
  id                   SERIAL PRIMARY KEY,
  lot_id               INTEGER      NOT NULL REFERENCES parking_lots(id),
  space_number         VARCHAR(10)  NOT NULL,
  is_available         BOOLEAN      NOT NULL DEFAULT TRUE,
  occupied_by_user_id  INTEGER      REFERENCES users(id),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (lot_id, space_number)
);
```

### Queries Comunes

#### Buscar un espacio disponible en un lote
```sql
SELECT * FROM parking_spaces
WHERE lot_id = 1 AND is_available = TRUE
ORDER BY space_number ASC
LIMIT 1;
```

#### Marcar espacio como ocupado
```sql
UPDATE parking_spaces
SET is_available = FALSE,
    occupied_by_user_id = 2,
    updated_at = NOW()
WHERE lot_id = 1 AND space_number = 'A1';
```

#### Liberar espacio
```sql
UPDATE parking_spaces
SET is_available = TRUE,
    occupied_by_user_id = NULL,
    updated_at = NOW()
WHERE lot_id = 1 AND space_number = 'A1';
```

---

## 4. Tabla: `pricing_plans`

### Estructura

```sql
CREATE TABLE pricing_plans (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(50)    NOT NULL UNIQUE,
  name             VARCHAR(100)   NOT NULL,
  type             VARCHAR(20)    NOT NULL,  -- 'hourly', 'monthly'
  base_rate        DECIMAL(10,2)  NOT NULL,
  billing_interval VARCHAR(20)    NOT NULL,
  description      TEXT,
  is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
```

### Queries Comunes

#### Obtener planes activos
```sql
SELECT * FROM pricing_plans WHERE is_active = TRUE;
```

#### Buscar plan por código
```sql
SELECT * FROM pricing_plans WHERE code = 'STANDARD_HOURLY';
```

#### Crear nuevo plan
```sql
INSERT INTO pricing_plans (code, name, type, base_rate, billing_interval, description)
VALUES ('MONTHLY_STUDENT', 'Mensualidad Estudiantes', 'monthly', 250.00, 'MONTH', 'Suscripción mensual ilimitada para estudiantes');
```

---

## 5. Tabla: `invoices`

### Estructura

```sql
CREATE TABLE invoices (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER        NOT NULL REFERENCES users(id),
  amount       DECIMAL(10,2)  NOT NULL,
  invoice_date TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
```

### Queries Comunes

#### Buscar facturas de un usuario
```sql
SELECT * FROM invoices WHERE user_id = 2 ORDER BY created_at DESC;
```

#### Total facturado en un período
```sql
SELECT SUM(amount) AS total_amount, COUNT(*) AS invoice_count
FROM invoices
WHERE invoice_date BETWEEN '2025-11-01' AND '2025-11-30';
```

#### Reporte de ingresos diarios
```sql
SELECT DATE(invoice_date) AS day, SUM(amount) AS total, COUNT(*) AS count
FROM invoices
GROUP BY DATE(invoice_date)
ORDER BY day DESC;
```

---

## 6. Tabla: `audit_logs`

### Estructura

```sql
CREATE TABLE audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      REFERENCES users(id),
  user_role   VARCHAR(50),
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(255),
  action      VARCHAR(100) NOT NULL,
  resource    VARCHAR(100) NOT NULL,
  status      VARCHAR(20)  NOT NULL,  -- 'success', 'failure', 'warning'
  details     JSONB,
  timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Queries Comunes

#### Logs de un usuario
```sql
SELECT * FROM audit_logs WHERE user_id = 2 ORDER BY timestamp DESC LIMIT 100;
```

#### Logs por acción
```sql
SELECT * FROM audit_logs WHERE action = 'LOGIN' ORDER BY timestamp DESC LIMIT 50;
```

#### Logs de intentos fallidos
```sql
SELECT * FROM audit_logs WHERE status = 'failure' AND action = 'LOGIN' ORDER BY timestamp DESC;
```

#### Análisis de actividad por acción
```sql
SELECT action, status, COUNT(*) AS count
FROM audit_logs
WHERE timestamp BETWEEN '2025-11-01' AND '2025-11-30'
GROUP BY action, status
ORDER BY count DESC;
```

---

## 🔧 Scripts de Inicialización

### Crear la Base de Datos

```powershell
# Conectarse a PostgreSQL
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1

# En el prompt de psql:
CREATE DATABASE parking_db;
\q
```

### Ejecutar los Seeders

```bash
# Crear tablas y datos iniciales del parqueo
npm run seed

# Crear usuarios de prueba
npm run seed:users

# Crear planes de precios
npm run seed:pricing

# Ejecutar todo de una vez
npm run seed:all
```

### Datos de Prueba (Usuarios)

| Nombre | Email | Contraseña | Rol |
|--------|-------|------------|-----|
| Admin UMG | admin@miumg.edu.gt | Admin2025! | admin |
| Guardia 1 | guardia@miumg.edu.gt | Guard2025! | guard |
| Prof. López | lopez@miumg.edu.gt | Faculty2025! | faculty |
| Estudiante 1 | student1@miumg.edu.gt | Student2025! | student |
| Estudiante 2 | student2@miumg.edu.gt | Student2025! | student |

---

## 📊 Consultas de Análisis

### Usuarios Más Activos
```sql
SELECT u.name, u.email, COUNT(i.id) AS visits, SUM(i.amount) AS total_spent
FROM users u
JOIN invoices i ON u.id = i.user_id
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC
LIMIT 10;
```

### Ocupación Actual del Parqueo
```sql
SELECT
  pl.name,
  pl.total_spaces,
  pl.available_spaces,
  pl.total_spaces - pl.available_spaces AS occupied_spaces,
  ROUND((pl.total_spaces - pl.available_spaces)::numeric / pl.total_spaces * 100, 1) AS occupancy_percent
FROM parking_lots pl;
```

---

## 🔒 Seguridad y Permisos

### Crear Usuario de Base de Datos (Producción)

```sql
-- Crear usuario con permisos limitados
CREATE USER parqueo_app WITH PASSWORD 'password_seguro';
GRANT CONNECT ON DATABASE parking_db TO parqueo_app;
GRANT USAGE ON SCHEMA public TO parqueo_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO parqueo_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO parqueo_app;
```

### String de Conexión

```env
# Variables separadas (recomendado para Windows)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_db
DB_USER=postgres
DB_PASSWORD=tu_password
```

---

## 📝 Notas Importantes

1. **Sincronización Automática**: Sequelize sincroniza los modelos automáticamente al iniciar el servidor con `force: false` (no destruye datos existentes).
2. **Índices**: Sequelize crea índices automáticamente para los campos `unique: true`.
3. **Timestamps**: Todos los modelos tienen `createdAt` y `updatedAt` gestionados por Sequelize.
4. **Relaciones**: Las claves foráneas (`FK`) se definen en el archivo `src/models/index.js`.
5. **Auditoría**: Todas las acciones críticas se registran en `audit_logs`.

---

**Documentación actualizada**: 21 de febrero de 2026  
**Versión del Sistema**: 2.0.0
