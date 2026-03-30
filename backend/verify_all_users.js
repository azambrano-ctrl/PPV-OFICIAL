require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log("Verifying all unverified users...");
        const res = await pool.query("UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE OR is_verified IS NULL");
        console.log(`Updated ${res.rowCount} users to be verified.`);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
