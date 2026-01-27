
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await pool.query('ALTER TABLE promoters ADD COLUMN experience_links TEXT');
        console.log('✅ Column experience_links added successfully');
    } catch (err: any) {
        if (err.code === '42701') {
            console.log('⚠️ Column experience_links already exists');
        } else {
            console.error('❌ Error applying migration:', err);
        }
    } finally {
        await pool.end();
    }
}

runMigration();
