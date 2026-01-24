import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

router.get('/fix-images', async (_req: Request, res: Response) => {
    try {
        console.log('Starting cleanup of malformed image URLs via API...');

        // 1. Identify records
        const checkResult = await query(`
            SELECT id, title, thumbnail_url, banner_url 
            FROM events 
            WHERE thumbnail_url LIKE '%"' 
               OR banner_url LIKE '%"'
               OR thumbnail_url LIKE '% %'
               OR banner_url LIKE '% %'
        `);

        let updatedCount = 0;
        const updates: any[] = [];

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
                await query(
                    'UPDATE events SET thumbnail_url = $1, banner_url = $2 WHERE id = $3',
                    [newThumbnail, newBanner, event.id]
                );
                updatedCount++;
                updates.push({ id: event.id, title: event.title, oldThumb: event.thumbnail_url, newThumb: newThumbnail });
            }
        }

        res.json({
            success: true,
            message: `Successfully cleaned up ${updatedCount} events.`,
            details: updates
        });

    } catch (error) {
        console.error('Error during cleanup:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

export default router;
