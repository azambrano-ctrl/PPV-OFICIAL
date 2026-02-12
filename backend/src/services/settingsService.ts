import { query } from '../config/database';

export interface Settings {
    id: string;
    homepage_background: string | null;
    homepage_video: string | null;
    homepage_slider: any; // JSONB
    about_hero_title: string;
    about_hero_subtitle: string;
    about_background: string | null;
    about_mission_title: string;
    about_mission_text: string;
    about_values: any; // JSONB
    about_slider_images: any; // JSONB
    about_stats_users: string;
    about_stats_events: string;
    about_history_image_1: string | null;
    about_history_image_2: string | null;
    about_history_image_3: string | null;

    // General
    site_name: string;
    site_description: string;
    contact_email: string;
    social_links: any; // JSONB
    site_logo: string | null;
    site_logo_width: number;
    site_logo_offset_x: number;
    site_logo_offset_y: number;
    site_favicon: string | null;

    // Login Page
    login_background_url: string | null;
    login_background_position: string;

    // Payments
    stripe_enabled: boolean;
    stripe_public_key: string;
    stripe_secret_key: string;
    paypal_enabled: boolean;
    paypal_client_id: string;
    paypal_secret_key: string;

    // Season Pass
    season_pass_enabled: boolean;
    season_pass_title: string;
    season_pass_description: string;
    season_pass_price: number;
    season_pass_button_text: string;

    created_at: Date;
    updated_at: Date;
}

export interface UpdateSettingsDTO {
    homepage_background?: string | null;
    homepage_video?: string | null;
    homepage_slider?: any;
    about_hero_title?: string;
    about_hero_subtitle?: string;
    about_background?: string | null;
    about_mission_title?: string;
    about_mission_text?: string;
    about_values?: any;
    about_slider_images?: any;
    about_stats_users?: string;
    about_stats_events?: string;
    about_history_image_1?: string | null;
    about_history_image_2?: string | null;
    about_history_image_3?: string | null;

    // General
    site_name?: string;
    site_description?: string;
    contact_email?: string;
    social_links?: any;
    site_logo?: string | null;
    site_logo_width?: number;
    site_logo_offset_x?: number;
    site_logo_offset_y?: number;
    site_favicon?: string | null;

    // Login Page
    login_background_url?: string | null;
    login_background_position?: string;

    // Payments
    stripe_enabled?: boolean;
    stripe_public_key?: string;
    stripe_secret_key?: string;
    paypal_enabled?: boolean;
    paypal_client_id?: string;
    paypal_secret_key?: string;

    // Season Pass
    season_pass_enabled?: boolean;
    season_pass_title?: string;
    season_pass_description?: string;
    season_pass_price?: number;
    season_pass_button_text?: string;
}

/**
 * Get application settings
 */
export const getSettings = async (): Promise<Settings> => {
    const result = await query(
        'SELECT * FROM settings WHERE id = $1',
        ['00000000-0000-0000-0000-000000000001']
    );

    if (result.rows.length === 0) {
        throw new Error('Settings not found');
    }

    return result.rows[0];
};

/**
 * Update application settings
 */
export const updateSettings = async (updates: UpdateSettingsDTO): Promise<Settings> => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const keys: (keyof UpdateSettingsDTO)[] = [
        'homepage_background',
        'homepage_video',
        'homepage_slider',
        'about_hero_title',
        'about_hero_subtitle',
        'about_background',
        'about_mission_title',
        'about_mission_text',
        'about_values',
        'about_slider_images',
        'about_stats_users',
        'about_stats_events',
        'about_history_image_1',
        'about_history_image_2',
        'about_history_image_3',
        'site_name',
        'site_description',
        'contact_email',
        'social_links',
        'stripe_enabled',
        'stripe_public_key',
        'stripe_secret_key',
        'paypal_enabled',
        'paypal_client_id',
        'paypal_secret_key',
        'site_logo',
        'site_logo_width',
        'site_logo_offset_x',
        'site_logo_offset_y',
        'site_favicon',
        'season_pass_enabled',
        'season_pass_title',
        'season_pass_description',
        'season_pass_price',
        'season_pass_button_text',
        'login_background_url',
        'login_background_position'
    ];

    for (const key of keys) {
        if (updates[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);

            let val = updates[key];
            // Debug logging for JSON fields
            if (['homepage_slider', 'about_values', 'about_slider_images', 'social_links'].includes(key)) {
                console.log(`🔍 [Service] Preparing ${key}:`, {
                    type: typeof val,
                    isArray: Array.isArray(val),
                    valuePreview: JSON.stringify(val).substring(0, 100)
                });

                // CRITICAL FIX: explicitly stringify objects/arrays for JSONB columns
                // logic: pg driver converts JS Arrays to Postgres Array syntax "{a,b}", 
                // but JSONB columns expect JSON syntax "[a,b]". 
                // We must send it as a JSON string.
                if (val !== null && typeof val === 'object') {
                    console.log(`🔄 [Service] Stringifying ${key} for JSONB compatibility`);
                    val = JSON.stringify(val);
                }
            }

            values.push(val);
            paramCount++;
        }
    }

    if (fields.length === 0) {
        throw new Error('No valid fields to update');
    }

    values.push('00000000-0000-0000-0000-000000000001');

    console.log('🚀 [Service] Executing SQL Update with params:', JSON.stringify(values));

    const result = await query(
        `UPDATE settings SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
    );

    return result.rows[0];
};
