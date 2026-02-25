/**
 * createStudentUser.js - Crea o actualiza un usuario estudiante (PostgreSQL/Sequelize)
 * Ejecutar con: node seeders/createStudentUser.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
const User = require('../src/models/user');

async function createOrUpdateStudent() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a PostgreSQL');

        const email = 'carlos.lopez@estudiante.umg.edu.gt';
        const password = 'Student@12345';

        // Verificar si el usuario existe
        let user = await User.findOne({ where: { email } });

        if (user) {
            console.log('✅ Usuario encontrado, actualizando contraseña...');
            user.password = password;
            await user.save(); // El hook beforeSave hashea automáticamente
            console.log('✅ Contraseña actualizada.');
        } else {
            console.log('⚠️  Usuario no encontrado, creando...');
            user = await User.create({
                name: 'Carlos López Estudiante',
                email,
                password,
                cardId: 'STU001',
                vehiclePlate: 'STU0001',
                role: 'student',
                nit: 'CF'
            });
            console.log('✅ Usuario creado exitosamente.');
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

createOrUpdateStudent();
