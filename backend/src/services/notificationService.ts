import { query } from '../config/database';
import { Expo } from 'expo-server-sdk';
import logger from '../config/logger';
import { sendWebPushToUser } from './webPushService';

// Create a new Expo SDK client
const expo = new Expo();

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

    // Send Push Notification if user has a token
    try {
        const userResult = await query('SELECT push_token FROM users WHERE id = $1', [userId]);
        const pushToken = userResult.rows[0]?.push_token;

        if (pushToken && Expo.isExpoPushToken(pushToken)) {
            await sendPushNotification(pushToken, title, message, { type, link });
        }
    } catch (error) {
        logger.error('Error sending push notification in createNotification:', error);
    }

    // Also send Web Push to browser subscribers
    try {
        await sendWebPushToUser(userId, title, message, link);
    } catch (error) {
        logger.error('Error sending web push notification:', error);
    }


    return notification;
};

/**
 * Send a push notification via Expo
 */
export const sendPushNotification = async (
    targetToken: string,
    title: string,
    body: string,
    data: any = {}
): Promise<void> => {
    if (!Expo.isExpoPushToken(targetToken)) {
        logger.error(`Push token ${targetToken} is not a valid Expo push token`);
        return;
    }

    const messages = [{
        to: targetToken,
        sound: 'default' as const,
        title,
        body,
        data,
    }];

    try {
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            logger.info('Push notification sent successfully', { ticketChunk });
            // NOTE: In a production app, you should handle tickets (check for errors/receipts)
        }
    } catch (error) {
        logger.error('Error sending push notification via Expo SDK:', error);
    }
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
