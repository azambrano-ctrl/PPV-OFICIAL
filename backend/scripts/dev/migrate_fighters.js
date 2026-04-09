require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        console.log('Adding is_amateur and titles columns to fighters table...');

        // Check if is_amateur already exists to avoid errors on multiple runs
        const checkAmateur = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='fighters' and column_name='is_amateur';
    `);

        if (checkAmateur.rowCount === 0) {
            await pool.query(`ALTER TABLE fighters ADD COLUMN is_amateur BOOLEAN DEFAULT FALSE;`);
            console.log('Success: Added is_amateur column.');
        } else {
            console.log('Info: is_amateur column already exists.');
        }

        const checkTitles = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='fighters' and column_name='titles';
    `);

        if (checkTitles.rowCount === 0) {
            await pool.query(`ALTER TABLE fighters ADD COLUMN titles TEXT;`);
            console.log('Success: Added titles column.');
        } else {
            console.log('Info: titles column already exists.');
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
