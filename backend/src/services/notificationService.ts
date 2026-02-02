import { query } from '../config/database';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    is_read: boolean;
    created_at: Date;
}

/**
 * Create a new notification
 */
export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: string = 'system',
    link?: string
): Promise<Notification> => {
    const sql = `
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const result = await query(sql, [userId, title, message, type, link]);
    const notification = result.rows[0];

    // Emit via socket if io is available (injected from server.ts)
    if ((global as any).io) {
        (global as any).io.to(`user_notifications_${userId}`).emit('new_notification', notification);
    }

    return notification;
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId: string, limit: number = 20): Promise<Notification[]> => {
    const sql = `
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
    `;
    const result = await query(sql, [userId, limit]);
    return result.rows;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string, userId: string): Promise<void> => {
    await query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
    );
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
    await query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1',
        [userId]
    );
};

/**
 * Delete old notifications (maintenance)
 */
export const deleteOldNotifications = async (days: number = 30): Promise<void> => {
    await query(
        "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '$1 days'",
        [days]
    );
};
