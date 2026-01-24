import { query } from '../config/database';

export interface Settings {
    id: string;
    homepage_background: string | null;
    about_hero_title: string;
    about_hero_subtitle: string;
    about_mission_title: string;
    about_mission_text: string;
    about_values: any; // JSONB
    about_slider_images: any; // JSONB
    created_at: Date;
    updated_at: Date;
}

export interface UpdateSettingsDTO {
    homepage_background?: string | null;
    about_hero_title?: string;
    about_hero_subtitle?: string;
    about_mission_title?: string;
    about_mission_text?: string;
    about_values?: any;
    about_slider_images?: any;
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
        'about_hero_title',
        'about_hero_subtitle',
        'about_mission_title',
        'about_mission_text',
        'about_values',
        'about_slider_images'
    ];

    for (const key of keys) {
        if (updates[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(updates[key]);
            paramCount++;
        }
    }

    if (fields.length === 0) {
        throw new Error('No valid fields to update');
    }

    values.push('00000000-0000-0000-0000-000000000001');

    const result = await query(
        `UPDATE settings SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
    );

    return result.rows[0];
};
