import { query } from '../config/database';

export interface Fighter {
    id: string;
    user_id?: string;
    first_name: string;
    last_name: string;
    nickname?: string;
    slug: string;
    date_of_birth?: Date;
    country?: string;
    city?: string;
    team_association?: string;
    height_cm?: number;
    weight_kg?: number;
    reach_cm?: number;
    stance?: 'Ortodoxo' | 'Zurdo' | 'Ambidiestro';
    base_style?: string;
    wins: number;
    losses: number;
    draws: number;
    kos: number;
    submissions: number;
    profile_image_url?: string;
    banner_image_url?: string;
    social_instagram?: string;
    social_twitter?: string;
    status: 'pending' | 'approved' | 'rejected';
    is_amateur?: boolean;
    titles?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const generateSlug = (firstName: string, lastName: string, nickname?: string): string => {
    const base = nickname ? `${firstName}-${nickname}-${lastName}` : `${firstName}-${lastName}`;
    return base
        .toLowerCase()
        .normalize('NFD')                     // Remove accents
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')          // Replace non-alphanumeric with hyphen
        .replace(/^-+|-+$/g, '');             // Trim hyphens
};

/**
 * Get all approved fighters (Public)
 */
export const getAllApprovedFighters = async () => {
    const result = await query(
        `SELECT * FROM fighters WHERE status = 'approved' AND is_active = true ORDER BY first_name ASC, last_name ASC`
    );
    return result.rows;
};

/**
 * Get all fighters (Admin)
 */
export const getAllFightersAdmin = async () => {
    const result = await query(
        `SELECT * FROM fighters ORDER BY created_at DESC`
    );
    return result.rows;
};

/**
 * Get a specific fighter by slug
 */
export const getFighterBySlug = async (slug: string): Promise<Fighter | null> => {
    const result = await query(
        `SELECT * FROM fighters WHERE slug = $1 AND is_active = true LIMIT 1`,
        [slug]
    );
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Claim/Create a new fighter profile
 */
export const claimFighterProfile = async (userId: string, data: any) => {
    // Basic slug generation, avoiding duplicates by appending a short hash if needed
    let slug = generateSlug(data.first_name, data.last_name, data.nickname);

    // Check if slug exists
    const slugCheck = await query(`SELECT id FROM fighters WHERE slug = $1`, [slug]);
    if (slugCheck.rows.length > 0) {
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const {
        first_name, last_name, nickname, date_of_birth, country, city, team_association,
        height_cm, weight_kg, reach_cm, stance, base_style, wins, losses, draws, kos, submissions,
        profile_image_url, banner_image_url, social_instagram, social_twitter, is_amateur, titles
    } = data;

    const result = await query(
        `INSERT INTO fighters (
            user_id, first_name, last_name, nickname, slug,
            date_of_birth, country, city, team_association,
            height_cm, weight_kg, reach_cm, stance, base_style,
            wins, losses, draws, kos, submissions,
            profile_image_url, banner_image_url, social_instagram, social_twitter,
            status, is_amateur, titles
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21, $22, $23, 'pending', $24, $25
        ) RETURNING *`,
        [
            userId, first_name, last_name, nickname, slug,
            date_of_birth, country, city, team_association,
            height_cm, weight_kg, reach_cm, stance, base_style,
            wins || 0, losses || 0, draws || 0, kos || 0, submissions || 0,
            profile_image_url, banner_image_url, social_instagram, social_twitter,
            is_amateur || false, titles || null
        ]
    );

    return result.rows[0];
};

/**
 * Update a fighter's own profile
 */
export const updateFighterProfile = async (fighterId: string, userId: string, updates: any) => {
    // Only allow updating specific fields
    const allowedFields = [
        'first_name', 'last_name', 'nickname', 'date_of_birth', 'country', 'city', 'team_association',
        'height_cm', 'weight_kg', 'reach_cm', 'stance', 'base_style',
        'wins', 'losses', 'draws', 'kos', 'submissions',
        'profile_image_url', 'banner_image_url', 'social_instagram', 'social_twitter',
        'is_amateur', 'titles'
    ];

    const updateKeys = Object.keys(updates).filter(key => allowedFields.includes(key));
    if (updateKeys.length === 0) return null;

    let queryText = 'UPDATE fighters SET ';
    const params: any[] = [];
    let paramCount = 1;

    updateKeys.forEach((key, index) => {
        queryText += `${key} = $${paramCount}`;
        params.push(updates[key]);
        if (index < updateKeys.length - 1) queryText += ', ';
        paramCount++;
    });

    // Make status pending again if major changes? We can choose to do that, but for now we won't out of simplicity
    queryText += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;
    params.push(fighterId, userId);

    const result = await query(queryText, params);
    return result.rows.length ? result.rows[0] : null;
};

/**
 * Approve or Reject a fighter (Admin only)
 */
export const updateFighterStatusAdmin = async (fighterId: string, status: 'approved' | 'rejected' | 'pending') => {
    const result = await query(
        `UPDATE fighters SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [status, fighterId]
    );
    return result.rows.length ? result.rows[0] : null;
};
