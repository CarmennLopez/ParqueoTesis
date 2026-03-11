const { User } = require('./src/models');
const { sequelize } = require('./src/config/database');

const checkUserDetails = async () => {
    try {
        await sequelize.authenticate();
        console.log('--- DETAILED USER DATA ---');
        
        const users = await User.findAll({
            attributes: [
                'id', 'email', 'role', 'hasPaid', 
                'subscriptionPlanId', 'currentParkingSpace'
            ],
            raw: true
        });
        
        console.table(users);
        process.exit(0);
    } catch (error) {
        console.error('Error fetching user details:', error);
        process.exit(1);
    }
};

checkUserDetails();
