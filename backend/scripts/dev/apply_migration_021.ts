import { query } from './src/config/database';
import fs from 'fs';
import path from 'path';

async function applyMigration() {
    const migrationPath = path.join(__dirname, 'migrations', '021_add_promoter_details.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration 021...');
    try {
        await query(sql);
        console.log('✅ Migration 021 applied successfully');
    } catch (error) {
        console.error('❌ Failed to apply migration 021:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

applyMigration();
