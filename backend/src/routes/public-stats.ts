import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import pool from '../config/database';

const router = Router();

/**
 * GET /api/public-stats
 * Get basic platform statistics for the About page
 */
router.get(
    '/',
    asyncHandler(async (_req: any, res: Response) => {
        // Get total users
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = parseInt(usersResult.rows[0].count);

        // Get total events (including past ones)
        const eventsResult = await pool.query('SELECT COUNT(*) as count FROM events');
        const totalEvents = parseInt(eventsResult.rows[0].count);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalEvents,
            },
        });
    })
);

export default router;
