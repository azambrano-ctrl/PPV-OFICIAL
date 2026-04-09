import { query } from './src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration026() {
    try {
        console.log('🔧 Applying migration 026: Add streaming providers...');

        const migrationPath = path.join(__dirname, 'migrations', '026_add_streaming_providers.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration SQL:');
        console.log(migrationSQL);
        console.log('\n🚀 Executing migration...\n');

        await query(migrationSQL);

        console.log('✅ Migration 026 applied successfully!');
        console.log('\n📊 Verifying columns...');

        const result = await query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'live_streams'
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Current live_streams table schema:');
        console.table(result.rows);

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error applying migration:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

applyMigration026();
