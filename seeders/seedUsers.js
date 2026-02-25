/**
 * seedUsers.js - Seeder para crear usuarios de prueba (PostgreSQL/Sequelize)
 * Ejecutar con: node seeders/seedUsers.js
 */

const dotenv = require('dotenv');
dotenv.config();

const { sequelize } = require('../src/config/database');
const User = require('../src/models/user');
const { USER_ROLES } = require('../src/config/constants');

const seedUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    // Verificar si ya existen usuarios
    const count = await User.count();
    if (count > 0) {
      console.log(`⚠️  Ya existen ${count} usuarios en la BD. Limpiando...`);
      await User.destroy({ where: {}, truncate: true, cascade: true });
    }

    // Usuarios de prueba
    const testUsers = [
      {
        name: 'Admin Sistema',
        email: 'admin@umg.edu.gt',
        password: 'Admin@12345',
        cardId: 'ADMIN001',
        vehiclePlate: 'ADMIN01',
        role: USER_ROLES.ADMIN,
        nit: '1234567-8',
        fiscalAddress: 'Campus Central UMG'
      },
      {
        name: 'Guard Principal',
        email: 'guard@umg.edu.gt',
        password: 'Guard@12345',
        cardId: 'GUARD001',
        vehiclePlate: 'GUARD01',
        role: USER_ROLES.GUARD,
        nit: 'CF'
      },
      {
        name: 'Dr. Juan Pérez',
        email: 'juan.perez@umg.edu.gt',
        password: 'Faculty@12345',
        cardId: 'FAC001',
        vehiclePlate: 'FAC0001',
        role: USER_ROLES.FACULTY,
        nit: '9876543-2',
        fiscalAddress: 'Zona 12, Guatemala'
      },
      {
        name: 'Carlos López Estudiante',
        email: 'carlos.lopez@estudiante.umg.edu.gt',
        password: 'Student@12345',
        cardId: 'STU001',
        vehiclePlate: 'STU0001',
        role: USER_ROLES.STUDENT,
        nit: 'CF'
      },
      {
        name: 'María García Visitante',
        email: 'maria.garcia@external.com',
        password: 'Visitor@12345',
        cardId: 'VIS001',
        vehiclePlate: 'VIS0001',
        role: USER_ROLES.VISITOR,
        nit: 'CF',
        fiscalAddress: 'Visitante'
      }
    ];

    // Crear usuarios de uno en uno para que el hook beforeSave haga el hash del password
    const createdUsers = [];
    for (const userData of testUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }

    console.log('\n🎉 Seeding de usuarios completado:');
    createdUsers.forEach(user => {
      console.log(`  ✅ ${user.email} (${user.role})`);
    });

    console.log('\n📋 Credenciales de prueba:');
    testUsers.forEach(user => {
      console.log(`  Email: ${user.email} | Contraseña: ${user.password} | Rol: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error en seeding de usuarios:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Desconectado de PostgreSQL');
    process.exit(0);
  }
};

seedUsers();
