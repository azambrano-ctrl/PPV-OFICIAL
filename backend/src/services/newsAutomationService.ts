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
    { name: 'Marca MMA', url: 'https://e00-marca.uecdn.es/rss/boxeo/mma.xml' },
    { name: 'Diario AS', url: 'https://as.com/rss/deportes/otros_deportes.xml' }
];

const ADMIN_ID = 'e5a029b5-6f6a-4d2f-9f5f-8d1219e49e6e';

export const NewsAutomationService = {
    /**
     * Fetch news from RSS feeds and update the database
     */
    async updateNews() {
        logger.info('🔄 Starting MMA news automation update...');

        // We want recent news (last 72 hours for better coverage)
        const ninetySixHoursAgo = new Date(Date.now() - (96 * 60 * 60 * 1000));
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
                    if (pubDate < ninetySixHoursAgo) continue;

                    const title = item.title || 'Sin título';
                    const link = item.link || '';
                    const rawContent = item['content:encoded'] || item.content || item.description || '';

                    // Strip all HTML but try to preserve some line breaks by replacing </p> and <br> with newlines
                    let content = rawContent
                        .replace(/<\/p>/gi, '\n\n')
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]*>/g, '') // Strip remaining tags
                        .replace(/&nbsp;/g, ' ')
                        .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
                        .trim();

                    // If it's too short, use the snippet
                    if (content.length < 100 && item.contentSnippet) {
                        content = item.contentSnippet;
                    }

                    // Strip HTML for excerpt
                    const excerpt = (item.contentSnippet || content.replace(/<[^>]*>/g, ''))
                        .slice(0, 180)
                        .trim() + '...';

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
                        // Improved Regex for images in content
                        const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (imgMatch) {
                            thumbnail_url = imgMatch[1];
                        }
                    }

                    // Specific handling for Mundo Deportivo / AS which might have images in other tags
                    if (!thumbnail_url && item['media:thumbnail']) {
                        // @ts-ignore
                        thumbnail_url = item['media:thumbnail'].$.url;
                    }

                    // Filter out tiny tracking pixels
                    if (thumbnail_url && (thumbnail_url.includes('pixel') || thumbnail_url.includes('scorecardresearch'))) {
                        thumbnail_url = '';
                    }

                    // Unescape HTML entities in URL (common in WordPress content)
                    if (thumbnail_url) {
                        thumbnail_url = thumbnail_url
                            .replace(/&#038;/g, '&')
                            .replace(/&amp;/g, '&');
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
