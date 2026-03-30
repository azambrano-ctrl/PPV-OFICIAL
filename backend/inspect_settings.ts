import pool from './src/config/database';

async function listColumns() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'settings'
        `);
        console.log('--- COLUMNS IN SETTINGS ---');
        result.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
        console.log('---------------------------');

        const data = await pool.query('SELECT * FROM settings LIMIT 1');
        console.log('--- ACTUAL DATA (First Row) ---');
        console.log(JSON.stringify(data.rows[0], null, 2));
        console.log('---------------------------');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

listColumns();
