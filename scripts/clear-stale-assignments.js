/**
 * Script para limpiar asignaciones estancadas en la base de datos.
 * Esto resuelve el bug donde un usuario ve su espacio "asignado" al iniciar sesión
 * incluso cuando no está físicamente en el parqueo.
 * 
 * Uso: node api/scripts/clear-stale-assignments.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/config/database');
const { User, ParkingSpace } = require('../src/models');
const { Op } = require('sequelize');

async function clearStaleAssignments() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');

        // Encontrar todos los usuarios con un espacio asignado
        const usersWithSpace = await User.findAll({
            where: { currentParkingSpace: { [Op.ne]: null } }
        });

        if (usersWithSpace.length === 0) {
            console.log('✅ No hay asignaciones pendientes. La base de datos está limpia.');
            process.exit(0);
        }

        console.log(`⚠️  Encontrados ${usersWithSpace.length} usuarios con espacio asignado:`);
        usersWithSpace.forEach(u => {
            console.log(`   - ${u.name} (${u.email}) → Espacio: ${u.currentParkingSpace} en Lot ID: ${u.currentParkingLotId}`);
        });

        // Liberar todos los espacios físicos asociados
        for (const user of usersWithSpace) {
            if (user.currentParkingLotId && user.currentParkingSpace) {
                await ParkingSpace.update(
                    { isOccupied: false, occupiedByUserId: null, entryTime: null },
                    { where: { parkingLotId: user.currentParkingLotId, spaceNumber: user.currentParkingSpace } }
                );
            }
        }

        // Limpiar el estado del usuario
        await User.update(
            { currentParkingLotId: null, currentParkingSpace: null, entryTime: null },
            { where: { currentParkingSpace: { [Op.ne]: null } } }
        );

        console.log('✅ Todas las asignaciones han sido liberadas correctamente.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

clearStaleAssignments();
