const { sequelize } = require('./src/config/database');

const checkTriggers = async () => {
    try {
        await sequelize.authenticate();
        console.log('--- CHECKING DATABASE TRIGGERS ---');
        
        const [results] = await sequelize.query(`
            SELECT event_object_table, trigger_name, event_manipulation, 
                   action_statement, action_timing
            FROM information_schema.triggers
            WHERE event_object_table = 'users';
        `);
        
        if (results.length === 0) {
            console.log('No triggers found on users table.');
        } else {
            console.log('Triggers found:', JSON.stringify(results, null, 2));
        }

        console.log('\n--- CHECKING FUNCTIONS ---');
        const [functions] = await sequelize.query(`
            SELECT n.nspname as schema, p.proname as function_name, 
                   pg_get_functiondef(p.oid) as definition
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.prosrc ILIKE '%has_paid%';
        `);

        if (functions.length === 0) {
            console.log('No functions matching "has_paid" found.');
        } else {
            console.log('Functions found:', JSON.stringify(functions, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking triggers:', error);
        process.exit(1);
    }
};

checkTriggers();
