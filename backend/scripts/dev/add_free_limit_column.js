const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/ROAIMA/Downloads/PPV-OFICIAL-main/PPV-OFICIAL-main/backend/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function runMigration() {
    try {
        console.log("Checking if free_viewers_limit column exists...");
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='events' and column_name='free_viewers_limit';
        `);

        if (res.rows.length === 0) {
            console.log("Adding free_viewers_limit column to events table...");
            await pool.query('ALTER TABLE events ADD COLUMN free_viewers_limit INTEGER DEFAULT NULL');
            console.log("Migration successful.");
        } else {
            console.log("Column free_viewers_limit already exists.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

runMigration();
