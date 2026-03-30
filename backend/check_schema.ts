import { query } from './src/config/database';

async function checkSchema() {
    try {
        const tables = ['users', 'events', 'settings'];
        for (const tableName of tables) {
            const tableResult = await query(
                `SELECT column_name, data_type 
                 FROM information_schema.columns 
                 WHERE table_name = $1 
                 ORDER BY ordinal_position`,
                [tableName]
            );
            console.log(`\n--- Schema for table: ${tableName} ---`);
            console.log(JSON.stringify(tableResult.rows, null, 2));
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
