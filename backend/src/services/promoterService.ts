import { query } from '../config/database';

export interface Promoter {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    gallery: string[];
    social_links: Record<string, string>;
    created_at: Date;
    updated_at: Date;
}

export interface CreatePromoterInput {
    name: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    social_links?: Record<string, string>;
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
        `INSERT INTO promoters (name, slug, description, logo_url, banner_url, social_links)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, slug, description, logo_url, banner_url, social_links || {}]
    );

    return result.rows[0];
};

/**
 * Update promoter profile
 */
export const updatePromoter = async (id: string, updates: Partial<CreatePromoterInput> & { gallery?: string[] }): Promise<Promoter> => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = ['name', 'description', 'logo_url', 'banner_url', 'gallery', 'social_links'];

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
