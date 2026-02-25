/**
 * seedPricingPlans.js - Seeder para crear planes de precios (PostgreSQL/Sequelize)
 * Ejecutar con: node seeders/seedPricingPlans.js
 */

const dotenv = require('dotenv');
dotenv.config();

const { sequelize } = require('../src/config/database');
const PricingPlan = require('../src/models/PricingPlan');

const seedPricingPlans = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    // Verificar si ya existen planes
    const count = await PricingPlan.count();
    if (count > 0) {
      console.log(`⚠️  Ya existen ${count} planes. Limpiando...`);
      await PricingPlan.destroy({ where: {} });
    }

    // Planes de precios
    const pricingPlans = [
      {
        code: 'STANDARD_HOURLY',
        name: 'Tarifa Estándar',
        description: 'Tarifa por hora para estudiantes y visitantes',
        type: 'HOURLY',
        baseRate: 2.50,
        currency: 'GTQ',
        billingInterval: 'HOUR',
        isActive: true,
        rules: {
          gracePeriodMinutes: 15,
          maxDailyCap: 25.00,
          weekendMultiplier: 1.0
        }
      },
      {
        code: 'FACULTY_MONTHLY',
        name: 'Tarifa Personal Académico',
        description: 'Tarifa especial para catedráticos y personal administrativo',
        type: 'SUBSCRIPTION',
        baseRate: 150.00,
        currency: 'GTQ',
        billingInterval: 'MONTH',
        isActive: true,
        rules: {
          gracePeriodMinutes: 0,
          weekendMultiplier: 1.0
        }
      },
      {
        code: 'VIP_MONTHLY',
        name: 'Tarifa VIP',
        description: 'Acceso premium sin límites',
        type: 'SUBSCRIPTION',
        baseRate: 300.00,
        currency: 'GTQ',
        billingInterval: 'MONTH',
        isActive: true,
        rules: {
          gracePeriodMinutes: 30,
          weekendMultiplier: 0.8
        }
      },
      {
        code: 'PROMO_WINTER',
        name: 'Promoción Invierno',
        description: 'Tarifa reducida durante temporada',
        type: 'HOURLY',
        baseRate: 1.50,
        currency: 'GTQ',
        billingInterval: 'HOUR',
        isActive: false,
        rules: {
          gracePeriodMinutes: 15,
          maxDailyCap: 15.00,
          weekendMultiplier: 1.0
        }
      }
    ];

    // Crear planes usando bulkCreate
    const createdPlans = await PricingPlan.bulkCreate(pricingPlans);

    console.log('\n🎉 Seeding de planes de precios completado:');
    createdPlans.forEach(plan => {
      console.log(`  ✅ ${plan.name}`);
      console.log(`     Código: ${plan.code}`);
      console.log(`     Precio base: ${plan.baseRate} ${plan.currency} (${plan.type})`);
      console.log(`     Intervalo: ${plan.billingInterval}`);
      console.log(`     Activo: ${plan.isActive ? '✅' : '❌'}\n`);
    });

  } catch (error) {
    console.error('❌ Error en seeding de planes:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Desconectado de PostgreSQL');
    process.exit(0);
  }
};

seedPricingPlans();
