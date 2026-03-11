const { User } = require('./src/models');
const { sequelize } = require('./src/models');

async function bulkUpdate() {
  try {
    await sequelize.authenticate();
    const [count] = await User.update({ hasPaid: true }, { where: {} });
    console.log(`Successfully updated ${count} users to Paid: true`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

bulkUpdate();
