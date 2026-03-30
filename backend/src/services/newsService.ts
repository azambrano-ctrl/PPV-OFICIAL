import { query } from '../config/database';

export interface NewsPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    category?: string;
    thumbnail_url?: string;
    banner_url?: string;
    author_id?: string;
    status: 'draft' | 'published' | 'scheduled';
    scheduled_for?: Date;
    meta_title?: string;
    meta_description?: string;
    view_count: number;
    is_featured: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateNewsInput {
    title: string;
    content: string;
    excerpt?: string;
    category?: string;
    thumbnail_url?: string;
    banner_url?: string;
    author_id?: string;
    status?: 'draft' | 'published' | 'scheduled';
    scheduled_for?: Date;
    meta_title?: string;
    meta_description?: string;
    is_featured?: boolean;
}

/**
 * Generate a URL-friendly slug from a title
 */
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const NewsService = {
    /**
     * Get all news posts with optional filters
     */
    async getAllPosts(filters?: {
        status?: string;
        category?: string;
        featured?: boolean;
        limit?: number;
        offset?: number;
    }) {
        let queryText = 'SELECT * FROM news_posts WHERE 1=1';
        const params: any[] = [];
        let paramCount = 1;

        if (filters?.status) {
            queryText += ` AND status = $${paramCount++}`;
            params.push(filters.status);
        } else {
            // By default, only show published posts for general users
            queryText += ` AND status = 'published'`;
        }

        if (filters?.category) {
            queryText += ` AND category = $${paramCount++}`;
            params.push(filters.category);
        }

        if (filters?.featured !== undefined) {
            queryText += ` AND is_featured = $${paramCount++}`;
            params.push(filters.featured);
        }

        queryText += ' ORDER BY created_at DESC';

        if (filters?.limit) {
            queryText += ` LIMIT $${paramCount++}`;
            params.push(filters.limit);
        }

        if (filters?.offset) {
            queryText += ` OFFSET $${paramCount++}`;
            params.push(filters.offset);
        }

        const result = await query(queryText, params);
        return result.rows;
    },

    /**
     * Get single post by slug
     */
    async getPostBySlug(slug: string): Promise<NewsPost | null> {
        const result = await query(
            'SELECT * FROM news_posts WHERE slug = $1',
            [slug]
        );

        if (result.rows.length > 0) {
            // Increment view count asynchronously
            query('UPDATE news_posts SET view_count = view_count + 1 WHERE id = $1', [result.rows[0].id]).catch(err => {
                console.error('[NewsService] Error incrementing view count:', err);
            });
            return result.rows[0];
        }

        return null;
    },

    /**
     * Get single post by ID
     */
    async getPostById(id: string): Promise<NewsPost | null> {
        const result = await query(
            'SELECT * FROM news_posts WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Create a new news post
     */
    async createPost(input: CreateNewsInput): Promise<NewsPost> {
        const slugBase = generateSlug(input.title);
        let slug = slugBase;

        // Ensure slug uniqueness
        let slugExists = true;
        let counter = 0;
        while (slugExists) {
            const check = await query('SELECT id FROM news_posts WHERE slug = $1', [slug]);
            if (check.rows.length === 0) {
                slugExists = false;
            } else {
                counter++;
                slug = `${slugBase}-${counter}`;
            }
        }

        const result = await query(
            `INSERT INTO news_posts (
                title, slug, content, excerpt, category, thumbnail_url, banner_url,
                author_id, status, scheduled_for, meta_title, meta_description, is_featured
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                input.title,
                slug,
                input.content,
                input.excerpt,
                input.category,
                input.thumbnail_url,
                input.banner_url,
                input.author_id,
                input.status || 'draft',
                input.scheduled_for,
                input.meta_title || input.title,
                input.meta_description || input.excerpt,
                input.is_featured || false
            ]
        );

        return result.rows[0];
    },

    /**
     * Update an existing post
     */
    async updatePost(id: string, updates: Partial<CreateNewsInput>): Promise<NewsPost> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        const allowedFields = [
            'title',
            'content',
            'excerpt',
            'category',
            'thumbnail_url',
            'banner_url',
            'status',
            'scheduled_for',
            'meta_title',
            'meta_description',
            'is_featured'
        ];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = $${paramCount++}`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        // Handle slug update if title changed
        if (updates.title) {
            const slugBase = generateSlug(updates.title);
            let slug = slugBase;
            let slugExists = true;
            let counter = 0;
            while (slugExists) {
                const check = await query('SELECT id FROM news_posts WHERE slug = $1 AND id != $2', [slug, id]);
                if (check.rows.length === 0) {
                    slugExists = false;
                } else {
                    counter++;
                    slug = `${slugBase}-${counter}`;
                }
            }
            fields.push(`slug = $${paramCount++}`);
            values.push(slug);
        }

        values.push(id);
        const queryText = `UPDATE news_posts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

        const result = await query(queryText, values);
        if (result.rows.length === 0) {
            throw new Error('Post not found');
        }

        return result.rows[0];
    },

    /**
     * Delete a post
     */
    async deletePost(id: string): Promise<void> {
        const result = await query('DELETE FROM news_posts WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            throw new Error('Post not found');
        }
    }
};
