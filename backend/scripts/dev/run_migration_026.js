const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration026() {
    try {
        console.log('🔧 Running migration 026: Add streaming providers...\n');

        const migrationSQL = `
-- Migration to add Cloudflare and Bunny stream provider columns
ALTER TABLE live_streams ALTER COLUMN mux_live_stream_id DROP NOT NULL;
ALTER TABLE live_streams ALTER COLUMN stream_key DROP NOT NULL;
ALTER TABLE live_streams ALTER COLUMN rtmp_url DROP NOT NULL;
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS cloudflare_stream_id VARCHAR(255);
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS bunny_live_stream_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_live_streams_cloudflare ON live_streams(cloudflare_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_bunny ON live_streams(bunny_live_stream_id);
        `;

        await pool.query(migrationSQL);
        console.log('✅ Migration 026 applied successfully!\n');

        // Verify
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'live_streams'
            AND column_name IN ('cloudflare_stream_id', 'bunny_live_stream_id')
            ORDER BY column_name;
        `);

        console.log('📋 Verified columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

runMigration026();
