require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'purchases'");
        console.log("Columns in purchases:", columns.rows.map(r => r.column_name));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
