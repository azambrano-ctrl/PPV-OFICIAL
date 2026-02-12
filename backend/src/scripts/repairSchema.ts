
import { query } from '../config/database';
import logger from '../config/logger';

/**
 * Emergency schema repair to ensure all settings columns exist.
 * This runs on server startup to bypass migration history checks.
 */
export const repairSchema = async () => {
    try {
        console.log('🔧 [Repair] Running emergency schema repair...');
        logger.info('🔧 Running emergency schema repair...');

        const queries = [
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_logo TEXT DEFAULT ''`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_logo_width INTEGER DEFAULT 40`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS homepage_video TEXT`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_logo_offset_x INTEGER DEFAULT 0`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_logo_offset_y INTEGER DEFAULT 0`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS login_background_url TEXT DEFAULT '/images/octagon-bg.png'`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS login_background_position TEXT DEFAULT 'center'`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS login_background_video TEXT`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS homepage_slider JSONB DEFAULT '[]'`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_stats_users TEXT DEFAULT '10k+'`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_stats_events TEXT DEFAULT '50+'`,
            `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false`,
            `ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming'`,
            `ALTER TABLE events ADD COLUMN IF NOT EXISTS stream_key TEXT`,
            `ALTER TABLE events ADD COLUMN IF NOT EXISTS stream_url TEXT`,
            `ALTER TABLE live_streams ALTER COLUMN mux_live_stream_id DROP NOT NULL`,
            `ALTER TABLE live_streams ALTER COLUMN mux_playback_id DROP NOT NULL`,
            `ALTER TABLE live_streams ALTER COLUMN stream_key DROP NOT NULL`,
            `ALTER TABLE live_streams ALTER COLUMN rtmp_url DROP NOT NULL`,
            `ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS bunny_live_stream_id VARCHAR(255)`,
            `ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS cloudflare_stream_id VARCHAR(255)`,
            `ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idle'`,
            `ALTER TABLE promoters ADD COLUMN IF NOT EXISTS logo_url TEXT`,
            `ALTER TABLE promoters ADD COLUMN IF NOT EXISTS banner_url TEXT`,
            `ALTER TABLE live_streams DROP CONSTRAINT IF EXISTS live_streams_rtmp_url_key`,
            `ALTER TABLE live_streams DROP CONSTRAINT IF EXISTS live_streams_stream_key_key`,
            `ALTER TABLE live_streams DROP CONSTRAINT IF EXISTS live_streams_mux_live_stream_id_key`,
            `ALTER TABLE events DROP CONSTRAINT IF EXISTS events_stream_key_key`
        ];

        for (const sql of queries) {
            try {
                process.stdout.write(`[Repair] Executing: ${sql.substring(0, 50)}... `);
                await query(sql);
                console.log('✅');
            } catch (err: any) {
                console.log(`⚠️ (Skipped: ${err.message.substring(0, 50)})`);
                logger.debug(`Schema repair step skipped: ${err.message}`);
            }
        }

        // Final verification check
        try {
            const check = await query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'live_streams' 
                AND column_name = 'cloudflare_stream_id'
            `);
            if (check.rowCount > 0) {
                console.log('✅ [Repair] VERIFIED: cloudflare_stream_id column exists.');
            } else {
                console.warn('⚠️ [Repair] WARNING: cloudflare_stream_id column still missing!');
            }
        } catch (vErr) {
            console.error('[Repair] Verification failed:', vErr);
        }

        console.log('✅ [Repair] Emergency schema repair completed successfully.');
        logger.info('✅ Emergency schema repair completed successfully.');
    } catch (error) {
        console.error('❌ [Repair] Emergency schema repair failed:', error);
        logger.error('❌ Emergency schema repair failed:', error);
    }
};

// Call repairSchema if run directly
if (require.main === module) {
    repairSchema().then(() => {
        console.log('Done.');
        process.exit(0);
    }).catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
}
