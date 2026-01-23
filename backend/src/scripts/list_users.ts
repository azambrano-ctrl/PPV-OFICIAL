
import { query } from '../config/database';

async function main() {
    try {
        const result = await query('SELECT id, email, role, password FROM users LIMIT 5');
        console.log('Users found:', result.rows);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
