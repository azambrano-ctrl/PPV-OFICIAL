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
    status: 'upcoming' | 'live' | 'finished' | 'cancelled' | 'reprise' | 'draft';
    stream_key?: string;
    stream_url?: string;
    trailer_url?: string;
    max_viewers?: number;
    free_viewers_limit?: number | null;
    is_featured: boolean;
    promoter_id?: string;
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
    card_image_url?: string;
    max_viewers?: number;
    free_viewers_limit?: number | null;
    is_featured?: boolean;
    promoter_id?: string;
    created_by: string;
}

/**
 * Get all events with optional filters
 */
export const getAllEvents = async (filters?: {
    status?: string;
    featured?: boolean;
    upcoming?: boolean;
    promoter_id?: string;
}) => {
    let queryText = `
        SELECT e.*, p.name as promoter_name, p.logo_url as promoter_logo_url, p.id as promoter_id,
            (SELECT COUNT(*) FROM purchases WHERE event_id = e.id AND payment_status = 'completed') as claimed_free_spots
        FROM events e
        LEFT JOIN promoters p ON e.promoter_id = p.id
        WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
        queryText += ` AND e.status = $${paramCount++}`;
        params.push(filters.status);
    }

    if (filters?.featured !== undefined) {
        queryText += ` AND e.is_featured = $${paramCount++}`;
        params.push(filters.featured);
    }

    if (filters?.promoter_id) {
        queryText += ` AND e.promoter_id = $${paramCount++}`;
        params.push(filters.promoter_id);
    }

    if (filters?.upcoming) {
        queryText += ` AND e.event_date > NOW() AND e.status = 'upcoming'`;
    }

    // Prioritize 'live' events, then order by date
    queryText += ` ORDER BY 
        CASE WHEN e.status = 'live' THEN 0 ELSE 1 END ASC,
        e.event_date ASC
    `;

    const result = await query(queryText, params);
    return result.rows;
};

/**
 * Get event by ID
 */
export const getEventById = async (id: string): Promise<Event | null> => {
    try {
        const result = await query(
            `SELECT e.*, p.name as promoter_name, p.logo_url as promoter_logo_url,
                (SELECT COUNT(*) FROM purchases WHERE event_id = e.id AND payment_status = 'completed') as claimed_free_spots
             FROM events e
             LEFT JOIN promoters p ON e.promoter_id = p.id
             WHERE e.id = $1`,
            [id]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error(`[EventService] Error in getEventById for id ${id}:`, error);
        throw error;
    }
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
      thumbnail_url, banner_url, card_image_url, max_viewers, is_featured, created_by, stream_key, promoter_id, free_viewers_limit
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
            input.card_image_url,
            input.max_viewers,
            input.is_featured || false,
            input.created_by,
            streamKey,
            input.promoter_id,
            input.free_viewers_limit || null,
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
        'card_image_url',
        'status',
        'max_viewers',
        'free_viewers_limit',
        'is_featured',
        'stream_url',
        'trailer_url',
        'promoter_id',
        'waiting_room_bg_url',
        'waiting_room_music_url',
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
export const deleteEvent = async (id: string, force = false): Promise<void> => {
    // 1. Verificar si hay compras asociadas
    const purchases = await query('SELECT COUNT(*) FROM purchases WHERE event_id = $1', [id]);
    const purchaseCount = parseInt(purchases.rows[0].count);
    if (purchaseCount > 0 && !force) {
        throw new Error(`Este evento tiene ${purchaseCount} compra(s) registrada(s). Para eliminarlo de todas formas usa la opción "Forzar eliminación".`);
    }

    // Si hay compras y se fuerza, eliminar también las compras
    if (purchaseCount > 0 && force) {
        await query('DELETE FROM purchases WHERE event_id = $1', [id]).catch(() => { });
    }

    // 2. Borrar datos técnicos asociados (borrado en cascada manual)
    console.log(`[EventService] Eliminando datos técnicos del evento ${id}...`);
    await query('DELETE FROM chat_messages WHERE event_id = $1', [id]).catch(() => { });
    await query('DELETE FROM stream_tokens WHERE event_id = $1', [id]).catch(() => { });
    await query('DELETE FROM live_streams WHERE event_id = $1', [id]).catch(() => { });
    await query('DELETE FROM chat_bans WHERE event_id = $1', [id]).catch(() => { });
    await query('DELETE FROM analytics WHERE event_id = $1', [id]).catch(() => { });
    await query('DELETE FROM recordings WHERE event_id = $1', [id]).catch(() => { });
    await query('DELETE FROM registrations WHERE event_id = $1', [id]).catch(() => { });
    await query('DELETE FROM event_fighters WHERE event_id = $1', [id]).catch(() => { });

    // 3. Borrar el evento
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
    try {
        // Check if event is free and has no limit
        const event = await getEventById(eventId);
        if (event && (event.price === 0 || Number(event.price) === 0)) {
            if (!event.free_viewers_limit || event.free_viewers_limit === 0) {
                return true;
            }
        }

        // Check if user has a Season Pass
        const seasonPassResult = await query(
            `SELECT COUNT(*) as count FROM purchases
         WHERE user_id = $1 AND purchase_type = 'season_pass' AND payment_status = 'completed'`,
            [userId]
        );

        if (parseInt(seasonPassResult.rows[0].count) > 0) {
            return true;
        }

        const result = await query(
            `SELECT COUNT(*) as count FROM purchases
         WHERE user_id = $1 AND event_id = $2 AND payment_status = 'completed'`,
            [userId, eventId]
        );

        return parseInt(result.rows[0].count) > 0;
    } catch (error) {
        console.error(`[EventService] Error in userHasAccessToEvent (User: ${userId}, Event: ${eventId}):`, error);
        throw error;
    }
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

/**
 * Get all fighters assigned to an event
 */
export const getEventFighters = async (eventId: string) => {
    const result = await query(
        `SELECT f.*, ef.order_index 
         FROM fighters f
         JOIN event_fighters ef ON f.id = ef.fighter_id
         WHERE ef.event_id = $1
         ORDER BY ef.order_index ASC, ef.created_at ASC`,
        [eventId]
    );
    return result.rows;
};

/**
 * Add a fighter to an event
 */
export const addFighterToEvent = async (eventId: string, fighterId: string, orderIndex?: number) => {
    // Check if fighter already added
    const check = await query(
        `SELECT 1 FROM event_fighters WHERE event_id = $1 AND fighter_id = $2`,
        [eventId, fighterId]
    );

    if (check.rows.length > 0) {
        throw new Error('El peleador ya está en la cartelera de este evento');
    }

    let nextOrder = orderIndex;
    if (nextOrder === undefined) {
        // Find next order index
        const orderRes = await query(
            `SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM event_fighters WHERE event_id = $1`,
            [eventId]
        );
        nextOrder = parseInt(orderRes.rows[0].next_order);
    }

    const result = await query(
        `INSERT INTO event_fighters (event_id, fighter_id, order_index)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [eventId, fighterId, nextOrder]
    );

    return result.rows[0];
};

/**
 * Remove a fighter from an event
 */
export const removeFighterFromEvent = async (eventId: string, fighterId: string) => {
    const result = await query(
        `DELETE FROM event_fighters WHERE event_id = $1 AND fighter_id = $2 RETURNING *`,
        [eventId, fighterId]
    );

    if (result.rowCount === 0) {
        throw new Error('El peleador no fue encontrado en este evento');
    }
};

export const getEventCardImages = async (eventId: string) => {
    const result = await query(
        'SELECT * FROM event_card_images WHERE event_id = $1 ORDER BY order_index ASC, created_at ASC',
        [eventId]
    );
    return result.rows;
};

export const addEventCardImage = async (eventId: string, imageUrl: string) => {
    const orderRes = await query(
        'SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM event_card_images WHERE event_id = $1',
        [eventId]
    );
    const nextOrder = parseInt(orderRes.rows[0].next);
    const result = await query(
        'INSERT INTO event_card_images (event_id, image_url, order_index) VALUES ($1, $2, $3) RETURNING *',
        [eventId, imageUrl, nextOrder]
    );
    return result.rows[0];
};

export const deleteEventCardImage = async (eventId: string, imageId: string) => {
    const result = await query(
        'DELETE FROM event_card_images WHERE id = $1 AND event_id = $2 RETURNING *',
        [imageId, eventId]
    );
    if (result.rowCount === 0) throw new Error('Imagen no encontrada');
};
