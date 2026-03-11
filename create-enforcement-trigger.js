const { sequelize } = require('./src/config/database');

const createTrigger = async () => {
    try {
        await sequelize.authenticate();
        console.log('--- CREATING DATABASE TRIGGER FOR PAYMENT ENFORCEMENT ---');

        // 1. Create Function
        await sequelize.query(`
            CREATE OR REPLACE FUNCTION ensure_has_paid_true_v2()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.has_paid := true;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 2. Drop existing if any to avoid errors (using a unique name _v2)
        await sequelize.query(`DROP TRIGGER IF EXISTS trigger_ensure_has_paid_true_v2 ON users;`);

        // 3. Create Trigger
        await sequelize.query(`
            CREATE TRIGGER trigger_ensure_has_paid_true_v2
            BEFORE INSERT OR UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION ensure_has_paid_true_v2();
        `);

        console.log('✅ Trigger created successfully. has_paid is now locked to TRUE at DB level.');
        
        // 4. Force update all existing to catch up
        const [count] = await sequelize.query(`UPDATE users SET has_paid = true;`);
        console.log(`✅ All existing users set to Paid: true.`);

        process.exit(0);
    } catch (error) {
        console.error('Error creating trigger:', error);
        process.exit(1);
    }
};

createTrigger();
