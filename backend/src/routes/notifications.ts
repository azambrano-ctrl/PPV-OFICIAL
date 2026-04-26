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
