import { query } from './src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    try {
        console.log('Running migration: 004_add_settings_table.sql');

        const migrationPath = path.join(__dirname, 'migrations', '004_add_settings_table.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await query(sql);

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
