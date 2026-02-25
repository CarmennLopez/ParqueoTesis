// seed.js: Script para inicializar el lote de parqueo en la base de datos


const { sequelize } = require('./src/config/database');
const { User, ParkingLot, ParkingSpace, PricingPlan } = require('./src/models');
const { USER_ROLES } = require('./src/config/constants');


const seedDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a PostgreSQL');

        // Sincronizar modelos (FORCE: TRUE borra todo)
        await sequelize.sync({ force: true });
        console.log('✅ Base de datos sincronizada (Tablas recreadas)');

        // 1. Crear Planes de Precio
        const hourlyPlan = await PricingPlan.create({
            code: 'ESTANDAR_HORA',
            name: 'Tarifa Estándar por Hora',
            type: 'HOURLY',
            baseRate: 10.00,
            currency: 'GTQ',
            billingInterval: 'HOUR',
            description: 'Cobro de Q10.00 por cada hora o fracción.',
            isActive: true
        });

        const studentPlan = await PricingPlan.create({
            code: 'ALUMNO_SEM',
            name: 'Plan Semestral Alumnos',
            type: 'SUBSCRIPTION',
            baseRate: 500.00,
            currency: 'GTQ',
            billingInterval: 'ONE_TIME', // Simulado
            description: 'Pago único por semestre con acceso ilimitado.',
            isActive: true
        });

        console.log('✅ Planes de precio creados');

        // 2. Crear Usuarios
        // Hash password manually if hooks don't fire on bulkCreate (they usually do on create)
        // Using create for safety with hooks
        const adminUser = await User.create({
            name: 'Administrador',
            email: 'admin@umg.edu.gt',
            password: 'adminpassword', // Hook will hash
            role: USER_ROLES.ADMIN,
            cardId: 'ADMIN001',
            vehiclePlate: 'ADMIN-001'
        });

        const guardUser = await User.create({
            name: 'Oficial de Seguridad',
            email: 'guardia@umg.edu.gt',
            password: 'guardpassword',
            role: USER_ROLES.GUARD,
            cardId: 'GUARD001',
            vehiclePlate: 'GUARD-001'
        });

        const studentUser = await User.create({
            name: 'Estudiante Demo',
            email: 'estudiante@umg.edu.gt',
            password: 'userpassword',
            role: USER_ROLES.STUDENT,
            cardId: 'STUDENT001',
            vehiclePlate: 'P-123XYZ',
            subscriptionPlanId: studentPlan.id // Sequelize FK
        });

        console.log('✅ Usuarios creados');

        // 3. Crear Parqueo (Campus Central)
        // Coordenadas aproximadas UMG Portales/Central (Ejemplo)
        // PostGIS Point: { type: 'Point', coordinates: [lng, lat] }
        const mainLot = await ParkingLot.create({
            name: 'Campus Central - Sótano 1',
            location: {
                type: 'Point',
                coordinates: [-90.2866, 14.7595] // [Longitud, Latitud] - San Antonio La Paz
            },
            totalSpaces: 20
        });

        console.log('✅ Parqueo creado:', mainLot.name);

        // 4. Crear Espacios de Parqueo
        // Generar 20 espacios
        const spacesData = [];
        for (let i = 1; i <= 20; i++) {
            spacesData.push({
                parkingLotId: mainLot.id,
                spaceNumber: `A-${i.toString().padStart(2, '0')}`,
                isOccupied: false
            });
        }
        await ParkingSpace.bulkCreate(spacesData);

        console.log(`✅ ${spacesData.length} espacios de parqueo creados`);

        console.log('🚀 Seeding completado con éxito');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seeding:', error);
        process.exit(1);
    }
};

seedDatabase();
