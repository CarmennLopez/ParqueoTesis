/**
 * checkData.js - Verifica los datos de parqueos en la BD (PostgreSQL/Sequelize)
 * Ejecutar con: node seeders/checkData.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
const ParkingLot = require('../src/models/ParkingLot');

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a PostgreSQL');

        const lots = await ParkingLot.findAll();
        console.log(`\n📊 Se encontraron ${lots.length} lote(s) de parqueo:\n`);
        lots.forEach(lot => {
            console.log(`  - ${lot.name} (ID: ${lot.id})`);
            console.log(`    Espacios: ${lot.availableSpaces}/${lot.totalSpaces} disponibles`);
            console.log(`    Ubicación:`, JSON.stringify(lot.location));
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('\n✅ Desconectado de PostgreSQL');
        process.exit(0);
    }
}

checkData();
