const { User } = require('./src/models');
const { sequelize } = require('./src/config/database');

const fixRolesAndPayments = async () => {
    try {
        await sequelize.authenticate();
        console.log('--- FIXING STUDENT ROLES AND PAYMENTS ---');

        // 1. Corregir roles mal escritos (estudiante -> student)
        const [roleCount] = await User.update(
            { role: 'student' },
            { where: { role: 'estudiante' } }
        );
        console.log(`Updated ${roleCount} users with role 'estudiante' to 'student'.`);

        // 2. Forzar pago para todos los estudiantes (o todos los usuarios como pidió el usuario)
        const [payCount] = await User.update(
            { hasPaid: true },
            { where: {} } // El usuario pidió que TODOS tengan pagado
        );
        console.log(`Updated ${payCount} users to Paid: true.`);

        process.exit(0);
    } catch (error) {
        console.error('Error fixing database:', error);
        process.exit(1);
    }
};

fixRolesAndPayments();
