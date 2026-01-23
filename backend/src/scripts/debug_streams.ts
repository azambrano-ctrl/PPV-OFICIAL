
import pool from '../config/database';

async function fixStream() {
    try {
        console.log('Fixing stream for event 19940f3a-a189-40ad-b6e3-9e53eec02fd9');

        const validPlaybackId = 'HAQnaIIc00YrQfOebJf999Jpo02o1dZHCQ01Qo3M00iGt14';
        const streamUrl = `https://stream.mux.com/${validPlaybackId}.m3u8`;

        // Update live_streams
        await pool.query(
            `UPDATE live_streams 
             SET mux_playback_id = $1, status = 'active' 
             WHERE event_id = '19940f3a-a189-40ad-b6e3-9e53eec02fd9'`,
            [validPlaybackId]
        );
        console.log('Updated live_streams');

        // Update events
        await pool.query(
            `UPDATE events 
             SET stream_key = $1 
             WHERE id = '19940f3a-a189-40ad-b6e3-9e53eec02fd9'`,
            [streamUrl]
        );
        console.log('Updated events');

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

fixStream();
