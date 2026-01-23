import { query } from '../config/database';

async function updateAllStreams() {
    try {
        console.log('Checking current event data...\n');

        const result = await query(
            'SELECT id, title, stream_key, thumbnail_url FROM events ORDER BY created_at DESC'
        );

        console.log(`Found ${result.rows.length} events:\n`);

        result.rows.forEach((event: any, index: number) => {
            console.log(`${index + 1}. "${event.title}"`);
            console.log(`   ID: ${event.id}`);
            const streamPreview = event.stream_key?.substring(0, 60) || 'NULL';
            console.log(`   Stream: ${streamPreview}...`);
            console.log('');
        });

        // Update ALL events with valid test stream
        console.log('Updating all events with valid test HLS stream...\n');

        const updateResult = await query(`
            UPDATE events 
            SET 
                stream_key = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                thumbnail_url = 'https://via.placeholder.com/800x450/FF6B6B/FFFFFF?text=PPV+Event',
                banner_url = 'https://via.placeholder.com/1920x600/FF6B6B/FFFFFF?text=PPV+Event+Banner'
            WHERE stream_key NOT LIKE 'https://test-streams%'
        `);

        console.log(`✓ Updated ${updateResult.rowCount} events\n`);

        // Verify
        const verifyResult = await query(
            'SELECT id, title, stream_key, thumbnail_url FROM events ORDER BY created_at DESC LIMIT 5'
        );

        console.log('Verification - Updated events:\n');
        verifyResult.rows.forEach((event, index) => {
            console.log(`${index + 1}. ${event.title}`);
            console.log(`   Stream: ${event.stream_key}`);
            console.log(`   Thumbnail: ${event.thumbnail_url}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

updateAllStreams();
