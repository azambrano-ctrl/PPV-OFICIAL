import { query } from '../config/database';

export interface Event {
    id: string;
    title: string;
    description?: string;
    event_date: Date;
    duration_minutes: number;
    price: number;
    currency: string;
    thumbnail_url?: string;
    banner_url?: string;
    status: 'upcoming' | 'live' | 'finished' | 'cancelled';
    stream_key?: string;
    max_viewers?: number;
    is_featured: boolean;
    created_by?: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreateEventInput {
    title: string;
    description?: string;
    event_date: Date;
    duration_minutes?: number;
    price: number;
    currency?: string;
    thumbnail_url?: string;
    banner_url?: string;
    max_viewers?: number;
    is_featured?: boolean;
    created_by: string;
}

/**
 * Get all events with optional filters
 */
export const getAllEvents = async (filters?: {
    status?: string;
    featured?: boolean;
    upcoming?: boolean;
}) => {
    let queryText = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
        queryText += ` AND status = $${paramCount++}`;
        params.push(filters.status);
    }

    if (filters?.featured !== undefined) {
        queryText += ` AND is_featured = $${paramCount++}`;
        params.push(filters.featured);
    }

    if (filters?.upcoming) {
        queryText += ` AND event_date > NOW() AND status = 'upcoming'`;
    }

    queryText += ' ORDER BY event_date ASC';

    const result = await query(queryText, params);
    return result.rows;
};

/**
 * Get event by ID
 */
export const getEventById = async (id: string): Promise<Event | null> => {
    const result = await query(
        'SELECT * FROM events WHERE id = $1',
        [id]
    );

    return result.rows[0] || null;
};

/**
 * Create new event
 */
export const createEvent = async (input: CreateEventInput): Promise<Event> => {
    // Generate unique stream key
    const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await query(
        `INSERT INTO events (
      title, description, event_date, duration_minutes, price, currency,
      thumbnail_url, banner_url, max_viewers, is_featured, created_by, stream_key
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
        [
            input.title,
            input.description,
            input.event_date,
            input.duration_minutes || 180,
            input.price,
            input.currency || 'USD',
            input.thumbnail_url,
            input.banner_url,
            input.max_viewers,
            input.is_featured || false,
            input.created_by,
            streamKey,
        ]
    );

    return result.rows[0];
};

/**
 * Update event
 */
export const updateEvent = async (
    id: string,
    updates: Partial<CreateEventInput>
): Promise<Event> => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = [
        'title',
        'description',
        'event_date',
        'duration_minutes',
        'price',
        'currency',
        'thumbnail_url',
        'banner_url',
        'status',
        'max_viewers',
        'is_featured',
        'stream_url',
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

    values.push(id);

    const queryText = `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    console.log('[DEBUG] updateEvent SQL:', queryText);
    console.log('[DEBUG] updateEvent Values:', values);

    try {
        const result = await query(queryText, values);

        if (result.rows.length === 0) {
            throw new Error('Event not found');
        }

        return result.rows[0];
    } catch (error) {
        console.error('[ERROR] updateEvent DB Error:', error);
        throw error;
    }
};

/**
 * Delete event
 */
export const deleteEvent = async (id: string): Promise<void> => {
    const result = await query('DELETE FROM events WHERE id = $1', [id]);

    if (result.rowCount === 0) {
        throw new Error('Event not found');
    }
};

/**
 * Get event statistics
 */
export const getEventStats = async (eventId: string) => {
    const result = await query(
        `SELECT * FROM event_stats WHERE id = $1`,
        [eventId]
    );

    return result.rows[0] || null;
};

/**
 * Check if user has access to event
 */
export const userHasAccessToEvent = async (
    userId: string,
    eventId: string
): Promise<boolean> => {
    const result = await query(
        `SELECT COUNT(*) as count FROM purchases
     WHERE user_id = $1 AND event_id = $2 AND payment_status = 'completed'`,
        [userId, eventId]
    );

    return parseInt(result.rows[0].count) > 0;
};

/**
 * Update event status
 */
export const updateEventStatus = async (
    eventId: string,
    status: Event['status']
): Promise<Event> => {
    const result = await query(
        'UPDATE events SET status = $1 WHERE id = $2 RETURNING *',
        [status, eventId]
    );

    if (result.rows.length === 0) {
        throw new Error('Event not found');
    }

    return result.rows[0];
};
