import { query } from '../config/database';

async function migrate() {
    try {
        console.log('Starting migration...');

        await query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
            ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
        `);

        console.log('Migration successful: Added reset_password_token and reset_password_expires columns.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
