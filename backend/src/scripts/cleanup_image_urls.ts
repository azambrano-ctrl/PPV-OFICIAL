import { query } from '../config/database';

async function cleanupImageUrls() {
    console.log('Starting cleanup of malformed image URLs...');

    try {
        // 1. Identify records with trailing quotes
        const checkResult = await query(`
            SELECT id, title, thumbnail_url, banner_url 
            FROM events 
            WHERE thumbnail_url LIKE '%"' 
               OR banner_url LIKE '%"'
               OR thumbnail_url LIKE '% %'
        `);

        console.log(`Found ${checkResult.rows.length} events with potentially malformed URLs.`);

        let updatedCount = 0;

        // 2. Fix them
        for (const event of checkResult.rows) {
            let needsUpdate = false;
            let newThumbnail = event.thumbnail_url;
            let newBanner = event.banner_url;

            // Clean Thumbnail
            if (newThumbnail && (newThumbnail.endsWith('"') || newThumbnail.endsWith(' '))) {
                newThumbnail = newThumbnail.replace(/["\s]+$/, '');
                needsUpdate = true;
            }

            // Clean Banner
            if (newBanner && (newBanner.endsWith('"') || newBanner.endsWith(' '))) {
                newBanner = newBanner.replace(/["\s]+$/, '');
                needsUpdate = true;
            }

            if (needsUpdate) {
                console.log(`Fixing Event ID ${event.id}:`);
                console.log(`  Thumb: '${event.thumbnail_url}' -> '${newThumbnail}'`);
                console.log(`  Banner: '${event.banner_url}' -> '${newBanner}'`);

                await query(
                    'UPDATE events SET thumbnail_url = $1, banner_url = $2 WHERE id = $3',
                    [newThumbnail, newBanner, event.id]
                );
                updatedCount++;
            }
        }

        console.log(`\nSuccessfully cleaned up ${updatedCount} events.`);

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        process.exit(0);
    }
}

cleanupImageUrls();
