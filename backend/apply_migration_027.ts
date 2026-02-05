import { query } from './src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration027() {
    try {
        console.log('🔧 Applying migration 027: Create news_posts table...');

        const migrationPath = path.join(__dirname, 'migrations', '027_create_news_posts_table.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration SQL:');
        console.log(migrationSQL);
        console.log('\n🚀 Executing migration...\n');

        await query(migrationSQL);

        console.log('✅ Migration 027 applied successfully!');

        console.log('\n📊 Verifying table...');
        const result = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'news_posts';
        `);

        if (result.rows.length > 0) {
            console.log('✅ Table news_posts confirmed in database.');
        } else {
            console.error('❌ Table news_posts NOT found after migration.');
        }

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error applying migration:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

applyMigration027();
