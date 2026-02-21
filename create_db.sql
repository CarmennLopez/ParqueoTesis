-- Crear base de datos parking_db si no existe
CREATE DATABASE parking_db;

-- Conectar a la base de datos
\c parking_db

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mostrar confirmación
SELECT 'Base de datos parking_db creada exitosamente' as resultado;
