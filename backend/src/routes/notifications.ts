import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as notificationService from '../services/notificationService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/notifications
 * Get latest notifications for current user
 */
router.get(
    '/',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const notifications = await notificationService.getUserNotifications(userId);
        res.json({ success: true, data: notifications });
    })
);

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch(
    '/:id/read',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        await notificationService.markAsRead(req.params.id, userId);
        res.json({ success: true });
    })
);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch(
    '/read-all',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        await notificationService.markAllAsRead(userId);
        res.json({ success: true });
    })
);

export default router;

import { saveSubscription, deleteSubscription, getVapidPublicKey } from '../services/webPushService';

/**
 * GET /api/notifications/vapid-public-key
 * Returns the VAPID public key so the frontend can subscribe
 */
router.get('/vapid-public-key', (_req, res) => {
    const key = getVapidPublicKey();
    if (!key) {
        res.status(503).json({ success: false, message: 'Web push not configured' });
        return;
    }
    res.json({ success: true, data: key });
});

/**
 * POST /api/notifications/web-push/subscribe
 * Save a browser push subscription for the current user
 */
router.post(
    '/web-push/subscribe',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            res.status(400).json({ success: false, message: 'Invalid subscription data' });
            return;
        }
        await saveSubscription(req.user!.userId, { endpoint, keys });
        res.json({ success: true });
    })
);

/**
 * DELETE /api/notifications/web-push/subscribe
 * Remove a browser push subscription
 */
router.delete(
    '/web-push/subscribe',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { endpoint } = req.body;
        if (!endpoint) {
            res.status(400).json({ success: false, message: 'Missing endpoint' });
            return;
        }
        await deleteSubscription(req.user!.userId, endpoint);
        res.json({ success: true });
    })
);
