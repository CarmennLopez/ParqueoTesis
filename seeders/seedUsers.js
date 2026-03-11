/**
 * seedUsers.js - Seeder para crear usuarios de prueba
 * Ejecutar con: node seeders/seedUsers.js
 */

const { connect } = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/user');
const { USER_ROLES } = require('../src/config/constants');

dotenv.config();

const seedUsers = async () => {
  try {
    await connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existen usuarios
    const existingUsers = await User.find();
    if (existingUsers.length > 0) {
      console.log(`⚠️  Ya existen ${existingUsers.length} usuarios en la BD. Limpiando...`);
      await User.deleteMany({});
    }

    // Usuarios de prueba
    const testUsers = [
      {
        name: 'Admin Sistema',
        email: 'admin@umg.edu.gt',
        password: 'Admin@12345',
        cardId: 'ADMIN001',
        vehiclePlate: 'ADMIN-01',
        role: USER_ROLES.ADMIN,
        nit: '1234567-8',
        fiscalAddress: 'Campus Central UMG'
      },
      {
        name: 'Guard Principal',
        email: 'guard@umg.edu.gt',
        password: 'Guard@12345',
        cardId: 'GUARD001',
        vehiclePlate: 'GUARD-01',
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

    // Crear usuarios usando create() para que se ejecute el pre-save hook de Mongoose (hashing de password)
    const createdUsers = [];
    for (const user of testUsers) {
      const newUser = await User.create(user);
      createdUsers.push(newUser);
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
    if (require('mongoose').connection.readyState === 1) {
      await require('mongoose').disconnect();
      console.log('\n🔌 Desconectado de MongoDB');
    }
    process.exit();
  }
};

seedUsers();
