import { query } from '../config/database';

async function checkEventImages() {
    try {
        const result = await query(
            'SELECT id, title, thumbnail_url, banner_url FROM events ORDER BY created_at DESC LIMIT 5'
        );

        console.log('Found', result.rows.length, 'events\n');
        result.rows.forEach((event: any, index: number) => {
            console.log(`--- Event ${index + 1} ---`);
            console.log('Title:', event.title);
            console.log('Thumbnail URL:', event.thumbnail_url);
            console.log('Banner URL:', event.banner_url);
            console.log('');
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkEventImages();
