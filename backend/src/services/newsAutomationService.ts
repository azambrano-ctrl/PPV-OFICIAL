import Parser from 'rss-parser';
import { query } from '../config/database';
import logger from '../config/logger';
import axios from 'axios';

const parser = new Parser({
    customFields: {
        item: [
            ['content:encoded', 'contentEncoded'],
            ['media:content', 'mediaContent'],
            ['media:thumbnail', 'mediaThumbnail'],
            ['enclosure', 'enclosure'],
        ],
    },
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

/**
 * Fallback to extract image from OG tags if missing in RSS
 */
async function fetchOGImage(url: string): Promise<string> {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000
        });
        const html = response.data;
        const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

        return ogImageMatch ? ogImageMatch[1].replace(/&amp;/g, '&') : '';
    } catch (error: any) {
        logger.debug(`[NewsAutomation] Failed to fetch OG image for ${url}: ${error.message}`);
        return '';
    }
}

export class NewsAutomationService {
    /**
     * Fetch news from RSS feeds and update the database
     */
    static async updateNews() {
        logger.info('🔄 Starting MMA news automation update...');
        let totalAddedCount = 0;

        try {
            for (const feedConfig of FEEDS) {
                try {
                    totalAddedCount += await this.processFeed(feedConfig);
                } catch (error: any) {
                    logger.error(`Error fetching feed ${feedConfig.name}: ${error.message}`);
                }
            }
        } catch (error: any) {
            logger.error(`[NewsAutomation] Global error: ${error.message}`);
        }

        logger.info(`✅ MMA news update completed. Added ${totalAddedCount} new articles.`);
        return totalAddedCount;
    }

    private static async processFeed(feedConfig: any): Promise<number> {
        let addedCount = 0;
        try {
            const response = await axios.get(feedConfig.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
                timeout: 30000
            });
            const feed = await parser.parseString(response.data);
            logger.info(`[NewsAutomation] Fetching feed: ${feedConfig.name} (${feed.items.length} items)`);

            // 96 hours window
            const ninetySixHoursAgo = new Date(Date.now() - (96 * 60 * 60 * 1000));

            for (const item of feed.items) {
                try {
                    let pubDate = new Date(item.pubDate || item.isoDate || '');
                    if (isNaN(pubDate.getTime())) {
                        pubDate = new Date();
                    }
                    if (pubDate < ninetySixHoursAgo) continue;

                    const title = item.title || 'Sin título';
                    const link = item.link || '';

                    // Get raw content for image extraction before stripping HTML
                    let rawContent = (item as any).contentEncoded || item.content || (item as any).description || '';

                    // Extract image URL from various tags
                    let thumbnail_url = item.enclosure?.url || (item as any).mediaContent?.url || '';

                    if (!thumbnail_url && rawContent) {
                        const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
                        thumbnail_url = imgMatch ? imgMatch[1] : '';
                    }

                    if (!thumbnail_url && (item as any).mediaThumbnail) {
                        thumbnail_url = (item as any).mediaThumbnail.$.url;
                    }

                    // Fallback to OG Image
                    if (!thumbnail_url && link) {
                        logger.debug(`[NewsAutomation] Image missing for "${title}", trying OG fallback...`);
                        thumbnail_url = await fetchOGImage(link);
                    }

                    // Cleanup image URL
                    if (thumbnail_url) {
                        thumbnail_url = thumbnail_url.replace(/&#038;/g, '&').replace(/&amp;/g, '&');
                        if (thumbnail_url.includes('pixel') || thumbnail_url.includes('scorecardresearch')) {
                            thumbnail_url = '';
                        }
                    }

                    if (!thumbnail_url) {
                        thumbnail_url = 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2000&auto=format&fit=crop';
                    }

                    // Process text content
                    const excerpt = (item.contentSnippet || (item as any).description || '').substring(0, 180).trim() + '...';
                    let content = rawContent
                        .replace(/<\/p>/gi, '\n\n')
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]*>/g, '')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/\n{3,}/g, '\n\n')
                        .trim();

                    if (content.length < 100 && item.contentSnippet) {
                        content = item.contentSnippet;
                    }

                    // Smart Categorization
                    const category = this.detectCategory(title, content);

                    const slug = this.generateSlug(title);

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
                            category,
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
                } catch (itemError: any) {
                    logger.error(`[NewsAutomation] Error processing item: ${itemError.message}`);
                }
            }
        } catch (error: any) {
            logger.error(`[NewsAutomation] Error processing feed ${feedConfig.name}: ${error.message}`);
        }
        return addedCount;
    }

    private static detectCategory(title: string, content: string): string {
        const localKeywords = [
            'ecuador', 'ecuatoriano', 'ecuatoriana',
            'tfl', 'troncal fight league', 'la troncal',
            'chito vera', 'michael morales', 'marlon vera'
        ];

        const combinedText = (title + ' ' + content).toLowerCase();

        const isLocal = localKeywords.some(keyword => combinedText.includes(keyword));

        return isLocal ? 'Nacional' : 'UFC';
    }

    private static generateSlug(title: string): string {
        return title
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
