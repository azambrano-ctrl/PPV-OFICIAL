const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function getLogo() {
    const result = await pool.query('SELECT site_logo FROM settings LIMIT 1');
    fs.writeFileSync('logo_utf8.txt', result.rows[0]?.site_logo, 'utf8');
    process.exit();
}

getLogo();
