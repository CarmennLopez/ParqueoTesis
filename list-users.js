const { User } = require('./src/models');
const { sequelize } = require('./src/models');

async function listUsers() {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({ raw: true });
    console.log('--- USERS LIST ---');
    users.forEach(u => {
      console.log(`ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Paid: ${u.hasPaid}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

listUsers();
