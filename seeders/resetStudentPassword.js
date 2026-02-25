/**
 * resetStudentPassword.js - Resetea la contraseña de un usuario (PostgreSQL/Sequelize)
 * Ejecutar con: node seeders/resetStudentPassword.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('../src/config/database');
const User = require('../src/models/user');

async function resetPassword() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a PostgreSQL');

        const email = 'carlos.lopez@estudiante.umg.edu.gt';
        const newPassword = 'Student@12345';

        // Buscar usuario
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('⚠️  Usuario no encontrado:', email);
        } else {
            // Asignar y guardar — el hook beforeSave hará el hash automáticamente
            user.password = newPassword;
            await user.save();
            console.log(`✅ Contraseña para ${email} actualizada exitosamente.`);
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

resetPassword();
