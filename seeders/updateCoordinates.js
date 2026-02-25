/**
 * updateCoordinates.js - Actualiza coordenadas de un lote de parqueo (PostgreSQL/Sequelize)
 * Ejecutar con: node seeders/updateCoordinates.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
const ParkingLot = require('../src/models/ParkingLot');

async function updateCoordinates() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a PostgreSQL');

        // San Antonio La Paz coordinates: [-90.2866, 14.7592]
        const [updatedCount] = await ParkingLot.update(
            {
                location: {
                    type: 'Point',
                    coordinates: [-90.2866, 14.7592]
                }
            },
            { where: { name: 'Campus Central' } }
        );

        console.log('✅ Coordenadas actualizadas:', updatedCount, 'registro(s)');

        // Verificar
        const lot = await ParkingLot.findOne({ where: { name: 'Campus Central' } });
        if (lot) {
            console.log('📍 Ubicación actualizada:', lot.location);
        } else {
            console.log('⚠️  No se encontró el lote "Campus Central".');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('✅ Desconectado de PostgreSQL');
        process.exit(0);
    }
}

updateCoordinates();
