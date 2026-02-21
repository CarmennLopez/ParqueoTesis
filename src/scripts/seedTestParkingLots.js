const { ParkingLot, ParkingSpace, User } = require('../models');

/**
 * Script para crear 3 parqueos de prueba con diferentes niveles de ocupación
 * 
 * Parqueo A - Norte: Completamente vacío (10/10 disponibles)
 * Parqueo B - Sur: Completamente lleno (0/10 disponibles)
 * Parqueo C - Este: Parcialmente ocupado (5/10 disponibles)
 */

async function seedTestParkingLots() {
    try {
        console.log('🚗 Iniciando seed de parqueos de prueba...\n');

        // Coordenadas base: UMG Campus (14.7592, -90.2866)
        const baseLatitud = 14.7592;
        const baseLongitud = -90.2866;

        // Calcular coordenadas a ~1km de distancia
        // 1 km ≈ 0.009 grados de latitud/longitud
        const offset = 0.009;

        // 1. Parqueo Norte - Completamente Vacío
        console.log('📍 Creando Parqueo Norte (Vacío)...');
        const parqueoNorte = await ParkingLot.findOrCreate({
            where: { name: 'Parqueo Norte UMG' },
            defaults: {
                name: 'Parqueo Norte UMG',
                location: {
                    type: 'Point',
                    coordinates: [baseLongitud, baseLatitud + offset] // 1km al norte
                },
                totalSpaces: 10,
                address: 'Zona 11, Guatemala',
                description: 'Parqueo de prueba - Completamente vacío'
            }
        });

        // Crear 10 espacios vacíos
        for (let i = 1; i <= 10; i++) {
            await ParkingSpace.findOrCreate({
                where: {
                    parkingLotId: parqueoNorte[0].id,
                    spaceNumber: `N${i}`
                },
                defaults: {
                    parkingLotId: parqueoNorte[0].id,
                    spaceNumber: `N${i}`,
                    isOccupied: false
                }
            });
        }
        console.log('✅ Parqueo Norte creado: 10/10 espacios disponibles\n');

        // 2. Parqueo Sur - Completamente Lleno
        console.log('📍 Creando Parqueo Sur (Lleno)...');
        const parqueoSur = await ParkingLot.findOrCreate({
            where: { name: 'Parqueo Sur UMG' },
            defaults: {
                name: 'Parqueo Sur UMG',
                location: {
                    type: 'Point',
                    coordinates: [baseLongitud, baseLatitud - offset] // 1km al sur
                },
                totalSpaces: 10,
                address: 'Zona 9, Guatemala',
                description: 'Parqueo de prueba - Completamente lleno'
            }
        });

        // Obtener un usuario de prueba para ocupar espacios
        const testUser = await User.findOne();

        // Crear 10 espacios ocupados
        for (let i = 1; i <= 10; i++) {
            await ParkingSpace.findOrCreate({
                where: {
                    parkingLotId: parqueoSur[0].id,
                    spaceNumber: `S${i}`
                },
                defaults: {
                    parkingLotId: parqueoSur[0].id,
                    spaceNumber: `S${i}`,
                    isOccupied: true,
                    occupiedByUserId: testUser ? testUser.id : null,
                    entryTime: new Date()
                }
            });
        }
        console.log('✅ Parqueo Sur creado: 0/10 espacios disponibles\n');

        // 3. Parqueo Este - Parcialmente Ocupado
        console.log('📍 Creando Parqueo Este (50% ocupado)...');
        const parqueoEste = await ParkingLot.findOrCreate({
            where: { name: 'Parqueo Este UMG' },
            defaults: {
                name: 'Parqueo Este UMG',
                location: {
                    type: 'Point',
                    coordinates: [baseLongitud + offset, baseLatitud] // 1km al este
                },
                totalSpaces: 10,
                address: 'Zona 10, Guatemala',
                description: 'Parqueo de prueba - Parcialmente ocupado'
            }
        });

        // Crear 10 espacios (5 ocupados, 5 libres)
        for (let i = 1; i <= 10; i++) {
            const isOccupied = i <= 5; // Primeros 5 ocupados
            await ParkingSpace.findOrCreate({
                where: {
                    parkingLotId: parqueoEste[0].id,
                    spaceNumber: `E${i}`
                },
                defaults: {
                    parkingLotId: parqueoEste[0].id,
                    spaceNumber: `E${i}`,
                    isOccupied: isOccupied,
                    occupiedByUserId: isOccupied && testUser ? testUser.id : null,
                    entryTime: isOccupied ? new Date() : null
                }
            });
        }
        console.log('✅ Parqueo Este creado: 5/10 espacios disponibles\n');

        console.log('🎉 Seed completado exitosamente!');
        console.log('\n📊 Resumen:');
        console.log('- Parqueo Norte: 100% disponible (10/10)');
        console.log('- Parqueo Sur: 0% disponible (0/10)');
        console.log('- Parqueo Este: 50% disponible (5/10)');
        console.log('\n📍 Ubicaciones:');
        console.log(`- Norte: [${baseLongitud}, ${baseLatitud + offset}]`);
        console.log(`- Sur: [${baseLongitud}, ${baseLatitud - offset}]`);
        console.log(`- Este: [${baseLongitud + offset}, ${baseLatitud}]`);

    } catch (error) {
        console.error('❌ Error en seed:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    seedTestParkingLots()
        .then(() => {
            console.log('\n✅ Script finalizado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error:', error);
            process.exit(1);
        });
}

module.exports = seedTestParkingLots;
