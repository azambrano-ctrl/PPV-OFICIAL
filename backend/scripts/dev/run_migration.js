require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT DEFAULT ''")
    .then(r => {
        console.log('Migration OK:', r.command);
        pool.end();
    })
    .catch(e => {
        console.error('Error:', e.message);
        pool.end();
    });
