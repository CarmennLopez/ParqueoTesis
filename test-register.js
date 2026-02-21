const { sequelize, User } = require('./src/models');
const bcrypt = require('bcrypt');

async function testRegister() {
    try {
        console.log('🔍 Probando registro de usuario...');
        
        // Verificar conexión
        await sequelize.authenticate();
        console.log('✓ Conexión a BD exitosa');
        
        // Sync models
        await sequelize.sync();
        console.log('✓ Modelos sincronizados');
        
        // Crear usuario
        const user = await User.create({
            name: 'Test User',
            email: `test${Date.now()}@test.com`,
            password: 'TestPass123!',
            cardId: `CARD${Date.now()}`,
            vehiclePlate: `PLT${Math.random().toString().slice(2, 8)}`
        });
        
        console.log('✓ Usuario creado:', {
            id: user.id,
            name: user.name,
            email: user.email
        });
        
        // Verificar en BD
        const count = await User.count();
        console.log(`✓ Total usuarios en BD: ${count}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        process.exit(0);
    }
}

testRegister();
