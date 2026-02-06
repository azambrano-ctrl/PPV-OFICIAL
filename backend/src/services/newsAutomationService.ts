import Parser from 'rss-parser';
import { query } from '../config/database';
import logger from '../config/logger';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
});

const FEEDS = [
    { name: 'MMA al Día', url: 'https://mmaaldia.com/feed/' },
    { name: 'UFC News', url: 'https://www.ufc.com/rss/news' }
    // Add more reliable feeds here
];

const ADMIN_ID = 'e5a029b5-6f6a-4d2f-9f5f-8d1219e49e6e';

export const NewsAutomationService = {
    /**
     * Fetch news from RSS feeds and update the database
     */
    async updateNews() {
        logger.info('🔄 Starting MMA news automation update...');

        // We only want recent news (last 48 hours for automation)
        const fortyEightHoursAgo = new Date(Date.now() - (48 * 60 * 60 * 1000));
        let addedCount = 0;

        for (const feedConfig of FEEDS) {
            try {
                logger.info(`[NewsAutomation] Fetching feed: ${feedConfig.name}`);
                const feed = await parser.parseURL(feedConfig.url);

                for (const item of feed.items) {
                    let pubDate: Date;
                    try {
                        pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
                        if (isNaN(pubDate.getTime())) {
                            pubDate = new Date();
                        }
                    } catch (e) {
                        pubDate = new Date();
                    }

                    // Filter old news
                    if (pubDate < fortyEightHoursAgo) continue;

                    const title = item.title || 'Sin título';
                    const link = item.link || '';
                    const content = item['content:encoded'] || item.content || item.description || '';
                    const excerpt = item.contentSnippet?.slice(0, 160) || '';

                    // Generate slug from title
                    const slug = this.generateSlug(title);

                    // Extract image
                    let thumbnail_url = '';
                    if (item.enclosure?.url) {
                        thumbnail_url = item.enclosure.url;
                    } else if (item['media:content']) {
                        // @ts-ignore
                        thumbnail_url = item['media:content'].$.url;
                    } else {
                        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
                        if (imgMatch) thumbnail_url = imgMatch[1];
                    }

                    // Default image if none found
                    if (!thumbnail_url) {
                        thumbnail_url = 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2000&auto=format&fit=crop';
                    }

                    // Insert into DB
                    const result = await query(
                        `INSERT INTO news_posts (
                            title, slug, content, excerpt, category, thumbnail_url, banner_url,
                            author_id, status, is_featured, meta_title, meta_description,
                            source_name, source_url, created_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                        ON CONFLICT (slug) DO NOTHING
                        RETURNING id`,
                        [
                            title,
                            slug,
                            content,
                            excerpt,
                            'Internacional',
                            thumbnail_url,
                            ADMIN_ID,
                            'published',
                            false,
                            title,
                            excerpt,
                            feedConfig.name,
                            link,
                            pubDate
                        ]
                    );

                    if (result.rowCount && result.rowCount > 0) {
                        addedCount++;
                        logger.info(`[NewsAutomation] Added new article: ${title}`);
                    }
                }
            } catch (error) {
                logger.error(`[NewsAutomation] Error processing feed ${feedConfig.name}:`, error);
            }
        }

        logger.info(`✅ MMA news update completedly. Added ${addedCount} new articles.`);
        return addedCount;
    },

    /**
     * Generate a URL-friendly slug
     */
    generateSlug(title: string): string {
        return title
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
};
