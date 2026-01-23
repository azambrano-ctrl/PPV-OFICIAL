import { query } from '../config/database';

async function checkStreams() {
    try {
        const result = await query(
            'SELECT id, title, stream_key, thumbnail_url, banner_url, status FROM events ORDER BY created_at DESC'
        );

        console.log('='.repeat(80));
        console.log('EVENT STREAM CONFIGURATION CHECK');
        console.log('='.repeat(80));
        console.log(`Found ${result.rows.length} events\n`);

        result.rows.forEach((event: any, index: number) => {
            console.log(`--- Event ${index + 1} ---`);
            console.log('Title:', event.title);
            console.log('Status:', event.status);
            console.log('Stream Key:', event.stream_key);
            console.log('Thumbnail URL:', event.thumbnail_url || 'N/A');
            console.log('Banner URL:', event.banner_url || 'N/A');

            // Validate stream URL
            const isValidUrl = event.stream_key?.startsWith('http');
            console.log('Valid Stream URL:', isValidUrl ? '✓ YES' : '✗ NO (needs HLS_BASE_URL)');

            console.log('');
        });

        console.log('='.repeat(80));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkStreams();
