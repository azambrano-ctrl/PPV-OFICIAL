import { query } from './src/config/database';

async function updateStreamUrl() {
    try {
        const streamUrl = 'https://d3s7x6kmqcnb6b.cloudfront.net/hls/STMBNOY/3D7568C35498/m.m3u8';

        console.log('Updating stream URL for the latest event...');

        const result = await query(`
            UPDATE events 
            SET stream_key = $1 
            WHERE id = (SELECT id FROM events ORDER BY created_at DESC LIMIT 1)
            RETURNING id, title;
        `, [streamUrl]);

        if (result.rowCount > 0) {
            console.log(`✅ Updated event "${result.rows[0].title}" (ID: ${result.rows[0].id}) with CloudFront stream URL.`);
        } else {
            console.log('❌ No events found to update.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    }
}

updateStreamUrl();
