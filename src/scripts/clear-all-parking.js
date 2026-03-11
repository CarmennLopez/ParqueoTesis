const { User, ParkingSpace, ParkingLot } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../config/logger');

async function clearAllParking() {
    const t = await sequelize.transaction();
    try {
        console.log('🚀 Iniciando limpieza total de parqueos...');

        // 1. Limpiar usuarios
        const [userCount] = await User.update({
            currentParkingLotId: null,
            currentParkingSpace: null,
            entryTime: null
        }, {
            where: {},
            transaction: t
        });
        console.log(`✅ ${userCount} usuarios limpiados.`);

        // 2. Limpiar espacios
        const [spaceCount] = await ParkingSpace.update({
            isOccupied: false,
            occupiedByUserId: null,
            entryTime: null
        }, {
            where: {},
            transaction: t
        });
        console.log(`✅ ${spaceCount} espacios liberados.`);

        // 3. Sincronizar conteo en lotes
        const lots = await ParkingLot.findAll({ transaction: t });
        for (const lot of lots) {
            lot.availableSpaces = lot.totalSpaces;
            await lot.save({ transaction: t });
        }
        console.log(`✅ ${lots.length} lotes sincronizados.`);

        await t.commit();
        console.log('✨ Limpieza completada con éxito.');
        process.exit(0);
    } catch (error) {
        await t.rollback();
        console.error('❌ Error durante la limpieza:', error);
        process.exit(1);
    }
}

clearAllParking();
