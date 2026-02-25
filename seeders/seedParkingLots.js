/**
 * seedParkingLots.js - Seeder para crear lotes de parqueo (PostgreSQL/Sequelize)
 * Ejecutar con: node seeders/seedParkingLots.js
 * NOTA: Requiere extensión PostGIS habilitada en la BD (CREATE EXTENSION IF NOT EXISTS postgis;)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
const { ParkingLot, ParkingSpace } = require('../src/models');

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ alter: true });

    // 1. Limpiar datos existentes para evitar duplicados
    await ParkingSpace.destroy({ where: {} });
    await ParkingLot.destroy({ where: {} });
    console.log('✅ Datos existentes eliminados.');

    const parkingLotsToCreate = 10;
    const spacesPerLot = 150;

    // San Antonio La Paz Center: 14.7592, -90.2866
    const baseLat = 14.7592;
    const baseLng = -90.2866;

    // 2. Generar datos de los lotes
    for (let i = 1; i <= parkingLotsToCreate; i++) {
      const latOffset = (Math.random() - 0.5) * 0.005;
      const lngOffset = (Math.random() - 0.5) * 0.005;

      const lot = await ParkingLot.create({
        name: `Parqueo ${i} - San Antonio`,
        location: {
          type: 'Point',
          coordinates: [baseLng + lngOffset, baseLat + latOffset]
        },
        totalSpaces: spacesPerLot,
        availableSpaces: spacesPerLot
      });

      // 3. Crear espacios individuales para este lote
      const spaces = [];
      for (let j = 1; j <= spacesPerLot; j++) {
        spaces.push({
          parkingLotId: lot.id,
          spaceNumber: j,
          isOccupied: false
        });
      }
      await ParkingSpace.bulkCreate(spaces);

      console.log(`✅ Parqueo ${i} creado con ${spacesPerLot} espacios (ID: ${lot.id})`);
    }

    console.log(`\n🎉 ${parkingLotsToCreate} estacionamientos creados exitosamente.`);

  } catch (error) {
    console.error('❌ Error al sembrar los datos:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('✅ Desconectado de PostgreSQL.');
    process.exit(0);
  }
}

seedData();