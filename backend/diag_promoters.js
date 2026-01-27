
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkPromoters() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        const res = await pool.query('SELECT id, name, status FROM promoters');
        console.log('--- PROMOTERS IN DATABASE ---');
        console.table(res.rows);

        const active = res.rows.filter(p => p.status === 'active');
        console.log(`\nTotal: ${res.rows.length}, Active: ${active.length}`);

        if (active.length === 0 && res.rows.length > 0) {
            console.log('\nWARNING: There are promoters but NONE are active. This is why the directory is empty.');
        } else if (res.rows.length === 0) {
            console.log('\nERROR: There are NO promoters in the database.');
        }
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

checkPromoters();
