import { query } from '../config/database';

export interface Settings {
    id: string;
    homepage_background: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface UpdateSettingsDTO {
    homepage_background?: string;
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

    if (updates.homepage_background !== undefined) {
        fields.push(`homepage_background = $${paramCount}`);
        values.push(updates.homepage_background);
        paramCount++;
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
