import webpush from 'web-push';
import { query } from '../config/database';
import logger from '../config/logger';

// VAPID keys must be set in environment variables.
// Generate once with: node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k)"
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@arenafightpass.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushSubscriptionData {
    endpoint: string;
    keys: { p256dh: string; auth: string };
}

export const saveSubscription = async (userId: string, sub: PushSubscriptionData) => {
    await query(
        `INSERT INTO web_push_subscriptions (user_id, endpoint, p256dh, auth)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
        [userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
    );
};

export const deleteSubscription = async (userId: string, endpoint: string) => {
    await query(
        `DELETE FROM web_push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
        [userId, endpoint]
    );
};

export const sendWebPushToUser = async (userId: string, title: string, message: string, link?: string) => {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

    const result = await query(
        `SELECT endpoint, p256dh, auth FROM web_push_subscriptions WHERE user_id = $1`,
        [userId]
    );

    const payload = JSON.stringify({ title, message, link: link || '/' });

    for (const row of result.rows) {
        try {
            await webpush.sendNotification(
                { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
                payload
            );
        } catch (err: any) {
            // 410 Gone = subscription expired/invalid, remove it
            if (err.statusCode === 410) {
                await query(
                    `DELETE FROM web_push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
                    [userId, row.endpoint]
                );
                logger.info(`Removed expired web push subscription for user ${userId}`);
            } else {
                logger.error(`Web push error for user ${userId}:`, err.message);
            }
        }
    }
};

export const getVapidPublicKey = () => VAPID_PUBLIC_KEY;
