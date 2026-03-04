import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * POST /api/analytics/pageview - Track a page view
 * Public endpoint (no auth required)
 */
router.post('/pageview', async (req: Request, res: Response) => {
    try {
        const { page } = req.body;
        if (!page) {
            return res.status(400).json({ success: false, message: 'Page is required' });
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

        // Extract user ID from token if present (optional)
        let userId = null;
        try {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const jwt = require('jsonwebtoken');
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            }
        } catch (e) {
            // Token invalid or missing - that's fine, track anonymously
        }

        await query(
            'INSERT INTO page_views (page, ip_address, user_agent, user_id) VALUES ($1, $2, $3, $4)',
            [page, typeof ip === 'string' ? ip : (ip as string[])[0], userAgent, userId]
        );

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error tracking page view:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/analytics/stats - Get visit statistics (admin only)
 */
router.get('/stats', authenticate, requireAdmin, async (_req: Request, res: Response) => {
    try {
        // Total views
        const totalResult = await query('SELECT COUNT(*) as total FROM page_views');
        const total = parseInt(totalResult.rows[0].total);

        // Today
        const todayResult = await query(
            "SELECT COUNT(*) as total FROM page_views WHERE created_at >= CURRENT_DATE"
        );
        const today = parseInt(todayResult.rows[0].total);

        // Last 7 days
        const weekResult = await query(
            "SELECT COUNT(*) as total FROM page_views WHERE created_at >= NOW() - INTERVAL '7 days'"
        );
        const week = parseInt(weekResult.rows[0].total);

        // Last 30 days
        const monthResult = await query(
            "SELECT COUNT(*) as total FROM page_views WHERE created_at >= NOW() - INTERVAL '30 days'"
        );
        const month = parseInt(monthResult.rows[0].total);

        // Daily breakdown (last 7 days)
        const dailyResult = await query(`
            SELECT DATE(created_at) as date, COUNT(*) as views
            FROM page_views
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        // Top pages
        const pagesResult = await query(`
            SELECT page, COUNT(*) as views
            FROM page_views
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY page
            ORDER BY views DESC
            LIMIT 10
        `);

        // Unique visitors (by IP, last 30 days)
        const uniqueResult = await query(
            "SELECT COUNT(DISTINCT ip_address) as total FROM page_views WHERE created_at >= NOW() - INTERVAL '30 days'"
        );
        const uniqueVisitors = parseInt(uniqueResult.rows[0].total);

        res.json({
            success: true,
            data: {
                total,
                today,
                week,
                month,
                uniqueVisitors,
                daily: dailyResult.rows,
                topPages: pagesResult.rows
            }
        });
    } catch (error: any) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
