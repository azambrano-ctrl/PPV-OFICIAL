import { query } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    try {
        console.log('Running migration: 007_update_test_streams.sql');

        const migrationPath = path.join(__dirname, '../../migrations/007_update_test_streams.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await query(sql);

        console.log('✓ Migration completed successfully!');
        console.log('\nVerifying changes...\n');

        // Verify the changes
        const result = await query(
            'SELECT title, stream_key, thumbnail_url FROM events ORDER BY created_at DESC'
        );

        result.rows.forEach((event: any, index: number) => {
            console.log(`${index + 1}. ${event.title}`);
            console.log(`   Stream: ${event.stream_key}`);
            console.log(`   Thumbnail: ${event.thumbnail_url}`);
            console.log('');
        });

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

runMigration();
