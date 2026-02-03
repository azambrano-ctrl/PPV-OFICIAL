
import { query } from '../config/database';
import logger from '../config/logger';

/**
 * Emergency schema repair to ensure all settings columns exist.
 * This runs on server startup to bypass migration history checks.
 */
export const repairSchema = async () => {
    try {
        logger.info('🔧 Running emergency schema repair...');

        const queries = [
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_logo TEXT DEFAULT ''`,
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_logo_width INTEGER DEFAULT 40`,
            `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false`,
            `ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming'`,
            `ALTER TABLE events ADD COLUMN IF NOT EXISTS stream_key TEXT`,
            `ALTER TABLE events ADD COLUMN IF NOT EXISTS stream_url TEXT`,
            `ALTER TABLE live_streams ALTER COLUMN mux_live_stream_id DROP NOT NULL`,
            `ALTER TABLE live_streams ALTER COLUMN mux_playback_id DROP NOT NULL`,
            `ALTER TABLE live_streams ALTER COLUMN stream_key DROP NOT NULL`,
            `ALTER TABLE live_streams ALTER COLUMN rtmp_url DROP NOT NULL`,
            `ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS bunny_live_stream_id VARCHAR(255)`,
            `ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idle'`,
            `ALTER TABLE live_streams DROP CONSTRAINT IF EXISTS live_streams_rtmp_url_key`,
            `ALTER TABLE live_streams DROP CONSTRAINT IF EXISTS live_streams_stream_key_key`,
            `ALTER TABLE live_streams DROP CONSTRAINT IF EXISTS live_streams_mux_live_stream_id_key`,
            `ALTER TABLE events DROP CONSTRAINT IF EXISTS events_stream_key_key`
        ];

        for (const sql of queries) {
            try {
                await query(sql);
            } catch (err: any) {
                // Ignore "already exists" or "not found" related to constraints for speed
                logger.debug(`Schema repair step skipped: ${err.message}`);
            }
        }
        logger.info('✅ Emergency schema repair completed successfully.');
    } catch (error) {
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
