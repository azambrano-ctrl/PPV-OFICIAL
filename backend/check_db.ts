import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        await client.connect();
        console.log('Connected successfully');

        const resVersion = await client.query('SELECT version()');
        console.log('Postgres Version:', resVersion.rows[0].version);

        try {
            const resUuid = await client.query('SELECT gen_random_uuid()');
            console.log('gen_random_uuid() works:', resUuid.rows[0]);
        } catch (e) {
            console.log('gen_random_uuid() failed:', e.message);
        }

        try {
            const resUuidOld = await client.query('SELECT uuid_generate_v4()');
            console.log('uuid_generate_v4() works:', resUuidOld.rows[0]);
        } catch (e) {
            console.log('uuid_generate_v4() failed:', e.message);
        }

    } catch (err) {
        console.error('Connection error', err);
    } finally {
        await client.end();
    }
}

check();
