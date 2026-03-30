import { query, closePool } from '../config/database';

async function migrateSmart() {
    console.log('🚀 Running smart migration for Nacional category...');
    const keywords = [
        '%Ecuador%', '%Ecuatoriano%', '%Ecuatoriana%',
        '%TFL%', '%Troncal Fight League%', '%La Troncal%',
        '%Chito Vera%', '%Michael Morales%', '%Marlon Vera%'
    ];

    try {
        let totalUpdated = 0;
        for (const keyword of keywords) {
            const res = await query(
                `UPDATE news_posts 
                 SET category = 'Nacional' 
                 WHERE (title ILIKE $1 OR content ILIKE $1) 
                 AND category != 'Nacional'`,
                [keyword]
            );
            totalUpdated += res.rowCount || 0;
            if (res.rowCount && res.rowCount > 0) {
                console.log(`- Updated ${res.rowCount} records for keyword: ${keyword}`);
            }
        }
        console.log(`✅ Smart migration complete. Total updated: ${totalUpdated}`);
    } catch (error: any) {
        console.error('❌ Migration error:', error.message);
    } finally {
        await closePool();
    }
}

migrateSmart();
