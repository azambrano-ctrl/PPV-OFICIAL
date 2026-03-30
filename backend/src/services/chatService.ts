import { query } from '../config/database';
import logger from '../config/logger';

/**
 * Get recent chat messages for an event
 * @param eventId The event ID
 * @param limit Number of messages to retrieve (default 50)
 */
export const getChatMessages = async (eventId: string, limit: number = 50) => {
    try {
        const sql = `
            SELECT 
                cm.id,
                cm.message,
                cm.created_at,
                cm.is_deleted,
                u.id as user_id,
                u.full_name as user_name,
                u.role
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.event_id = $1
            ORDER BY cm.created_at DESC
            LIMIT $2
        `;

        const result = await query(sql, [eventId, limit]);

        // Reverse to get chronological order (oldest first)
        return result.rows.reverse();
    } catch (error) {
        logger.error('Error fetching chat messages:', error);
        throw error;
    }
};
