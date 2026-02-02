import { query, transaction } from '../config/database';

export interface Promoter {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    gallery: string[];
    social_links: Record<string, string>;
    status: 'pending' | 'active' | 'suspended';
    phone?: string;
    city?: string;
    experience_links?: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreatePromoterInput {
    name: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    social_links?: Record<string, string>;
    status?: 'pending' | 'active' | 'suspended';
    phone?: string;
    city?: string;
    experience_links?: string;
}

/**
 * Get all promoters
 */
export const getAllPromoters = async () => {
    const result = await query(
        'SELECT * FROM promoters ORDER BY name ASC',
        []
    );
    return result.rows;
};

/**
 * Get promoter by ID
 */
export const getPromoterById = async (id: string): Promise<Promoter | null> => {
    const result = await query(
        'SELECT * FROM promoters WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
};

/**
 * Get promoter by Slug
 */
export const getPromoterBySlug = async (slug: string): Promise<Promoter | null> => {
    const result = await query(
        'SELECT * FROM promoters WHERE slug = $1',
        [slug]
    );
    return result.rows[0] || null;
};

/**
 * Create a new promoter
 */
export const createPromoter = async (input: CreatePromoterInput): Promise<Promoter> => {
    const { name, description, logo_url, banner_url, social_links } = input;

    // Create slug from name
    const slug = name.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');

    const result = await query(
        `INSERT INTO promoters (name, slug, description, logo_url, banner_url, social_links, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, slug, description, logo_url, banner_url, social_links || {}, input.status || 'pending']
    );

    return result.rows[0];
};

/**
 * Register a new promoter (Public registration)
 */
export const registerPromoter = async (input: {
    name: string;
    description?: string;
    email: string;
    password_hash: string;
    phone?: string;
    city?: string;
    experience_links?: string;
}) => {
    const { name, description, email, password_hash, phone, city, experience_links } = input;

    return transaction(async (client: any) => {
        // 1. Create promoter profile
        const slug = name.toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '-');

        const promoterRes = await client.query(
            `INSERT INTO promoters (name, slug, description, status, phone, city, experience_links)
             VALUES ($1, $2, $3, 'pending', $4, $5, $6)
             RETURNING id`,
            [name, slug, description, phone, city, experience_links]
        );

        const promoterId = promoterRes.rows[0].id;

        // 2. Create user account
        const userRes = await client.query(
            `INSERT INTO users (email, password_hash, full_name, role, promoter_id, is_verified)
             VALUES ($1, $2, $3, 'promoter', $4, true)
             RETURNING id, email, full_name`,
            [email, password_hash, name, promoterId]
        );

        return {
            promoterId,
            userId: userRes.rows[0].id
        };
    });
};

/**
 * Update promoter profile
 */
export const updatePromoter = async (id: string, updates: Partial<CreatePromoterInput> & { gallery?: string[] }): Promise<Promoter> => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = ['name', 'description', 'logo_url', 'banner_url', 'gallery', 'social_links', 'status', 'phone', 'city', 'experience_links'];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
            if (key === 'gallery' || key === 'social_links') {
                fields.push(`${key} = $${paramCount++}`);
                values.push(JSON.stringify(value));
            } else {
                fields.push(`${key} = $${paramCount++}`);
                values.push(value);
            }
        }
    }

    if (fields.length === 0) {
        throw new Error('No valid fields to update');
    }

    values.push(id);
    const result = await query(
        `UPDATE promoters SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
        values
    );

    if (result.rows.length === 0) {
        throw new Error('Promoter not found');
    }

    return result.rows[0];
};

/**
 * Delete promoter
 */
export const deletePromoter = async (id: string): Promise<void> => {
    const result = await query('DELETE FROM promoters WHERE id = $1', [id]);
    if (result.rowCount === 0) {
        throw new Error('Promoter not found');
    }
};

/**
 * Get analytics for a promoter
 */
export const getPromoterStats = async (promoterId: string) => {
    // 1. Total revenue and sales
    const revenueSql = `
        SELECT 
            COUNT(*) as total_sales,
            COALESCE(SUM(p.final_amount), 0) as total_revenue
        FROM purchases p
        JOIN events e ON p.event_id = e.id
        WHERE e.promoter_id = $1 AND p.payment_status = 'completed'
    `;
    const revenueRes = await query(revenueSql, [promoterId]);

    // 2. Sales per event
    const eventSalesSql = `
        SELECT 
            e.id,
            e.title,
            e.event_date,
            COUNT(p.id) as sales_count,
            COALESCE(SUM(p.final_amount), 0) as revenue
        FROM events e
        LEFT JOIN purchases p ON e.id = p.event_id AND p.payment_status = 'completed'
        WHERE e.promoter_id = $1
        GROUP BY e.id, e.title, e.event_date
        ORDER BY e.event_date DESC
    `;
    const eventSalesRes = await query(eventSalesSql, [promoterId]);

    // 3. Daily sales (last 30 days) for chart
    const dailySalesSql = `
        SELECT 
            TO_CHAR(DATE_TRUNC('day', p.purchased_at), 'YYYY-MM-DD') as date,
            COUNT(*) as count,
            SUM(p.final_amount) as amount
        FROM purchases p
        JOIN events e ON p.event_id = e.id
        WHERE e.promoter_id = $1 
          AND p.payment_status = 'completed'
          AND p.purchased_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', p.purchased_at)
        ORDER BY DATE_TRUNC('day', p.purchased_at) ASC
    `;
    const dailySalesRes = await query(dailySalesSql, [promoterId]);

    return {
        summary: revenueRes.rows[0],
        events: eventSalesRes.rows,
        daily_chart: dailySalesRes.rows
    };
};

/**
 * Chat Moderation: Ban or Mute user
 */
export const moderateUser = async (eventId: string, userId: string, type: 'ban' | 'mute', reason?: string) => {
    const sql = `
        INSERT INTO chat_bans (event_id, user_id, type, reason)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (event_id, user_id, type) DO UPDATE SET
            reason = EXCLUDED.reason,
            created_at = NOW()
        RETURNING *
    `;
    const result = await query(sql, [eventId, userId, type, reason || '']);
    return result.rows[0];
};

/**
 * Chat Moderation: Check user status
 */
export const checkChatStatus = async (eventId: string, userId: string) => {
    const sql = `
        SELECT type FROM chat_bans 
        WHERE event_id = $1 AND user_id = $2
    `;
    const result = await query(sql, [eventId, userId]);
    return {
        isBanned: result.rows.some((r: { type: string }) => r.type === 'ban'),
        isMuted: result.rows.some((r: { type: string }) => r.type === 'mute')
    };
};

/**
 * Chat Moderation: Remove ban/mute
 */
export const removeModeration = async (eventId: string, userId: string, type: 'ban' | 'mute') => {
    await query(
        'DELETE FROM chat_bans WHERE event_id = $1 AND user_id = $2 AND type = $3',
        [eventId, userId, type]
    );
};
