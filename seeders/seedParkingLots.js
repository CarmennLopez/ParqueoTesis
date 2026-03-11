const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ParkingLot = require('../src/models/ParkingLot');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Conectado a la base de datos de MongoDB para el seeder');
    seedData();
  })
  .catch(err => {
    console.error('❌ Error de conexión:', err);
  });

async function seedData() {
  try {
    // 1. Limpiar los datos existentes para evitar duplicados en cada ejecución
    await ParkingLot.deleteMany({});
    console.log('✅ Estacionamientos existentes eliminados.');

    const parkingLotsToCreate = 10;
    const spacesPerLot = 150;
    const newParkingLots = [];

    // 2. Generar los datos de los 10 estacionamientos
    // San Antonio La Paz Center: 14.7592, -90.2866
    const baseLat = 14.7592;
    const baseLng = -90.2866;

    for (let i = 1; i <= parkingLotsToCreate; i++) {
      const spaces = [];
      for (let j = 1; j <= spacesPerLot; j++) {
        spaces.push({
          spaceNumber: j,
          isOccupied: false,
          occupiedBy: null
        });
      }

      const isExclusive = i <= 2;

      // Spread lots around the center
      const latOffset = (Math.random() - 0.5) * 0.005;
      const lngOffset = (Math.random() - 0.5) * 0.005;

      newParkingLots.push({
        name: `Parqueo ${i} - San Antonio`,
        // Store as GeoJSON Point for geospatial queries if needed, or just simple lat/lng object
        // Based on MapService, it expects: lot.location.coordinates = [lng, lat]
        location: {
          type: 'Point',
          coordinates: [baseLng + lngOffset, baseLat + latOffset]
        },
        isExclusive: isExclusive,
        totalSpaces: spacesPerLot,
        availableSpaces: spacesPerLot,
        spaces: spaces
      });
    }

    // 3. Insertar los estacionamientos en la base de datos
    await ParkingLot.insertMany(newParkingLots);
    console.log(`✅ ${newParkingLots.length} estacionamientos creados exitosamente.`);

  } catch (error) {
    console.error('❌ Error al sembrar los datos:', error);
  } finally {
    // 4. Desconectar de la base de datos al finalizar
    mongoose.disconnect();
    console.log('✅ Desconectado de la base de datos.');
  }
}