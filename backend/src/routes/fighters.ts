import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin, optionalAuthenticate, AuthRequest } from '../middleware/auth';
import {
    getAllApprovedFighters,
    getAllFightersAdmin,
    getFighterBySlug,
    claimFighterProfile,
    updateFighterProfile,
    updateFighterStatusAdmin
} from '../services/fighterService';
import { ScraperService } from '../services/scraperService';
import { query } from '../config/database';
import rateLimit from 'express-rate-limit';

const router = Router();

/**
 * GET /api/fighters
 * Get all approved fighters for the public directory
 */
router.get(
    '/',
    optionalAuthenticate,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;

        // If admin, they might want to see all
        if (authReq.user && authReq.user.role === 'admin') {
            const allFighters = await getAllFightersAdmin();
            res.json({ success: true, data: allFighters });
            return;
        }

        const fighters = await getAllApprovedFighters();
        res.json({ success: true, data: fighters });
    })
);

/**
 * GET /api/fighters/me
 * Get the currently logged-in user's fighter profile
 */
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const result = await query(`SELECT * FROM fighters WHERE user_id = $1 LIMIT 1`, [authReq.user!.userId]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'No fighter profile found for user' });
            return;
        }

        res.json({ success: true, data: result.rows[0] });
    })
);

/**
 * GET /api/fighters/:slug
 * Get a specific fighter's profile
 */
router.get(
    '/:slug',
    asyncHandler(async (req: any, res: Response) => {
        const fighter = await getFighterBySlug(req.params.slug);

        if (!fighter) {
            res.status(404).json({ success: false, message: 'Fighter not found' });
            return;
        }

        res.json({ success: true, data: fighter });
    })
);

/**
 * POST /api/fighters/claim
 * User creates/claims their fighter profile
 */
router.post(
    '/claim',
    authenticate,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        // Check if user already has a profile
        const existing = await query(`SELECT id FROM fighters WHERE user_id = $1 LIMIT 1`, [userId]);
        if (existing.rows.length > 0) {
            res.status(400).json({ success: false, message: 'You already have a fighter profile.' });
            return;
        }

        // Validate bare minimum
        if (!req.body.first_name || !req.body.last_name) {
            res.status(400).json({ success: false, message: 'First name and Last name are required.' });
            return;
        }

        const newFighter = await claimFighterProfile(userId, req.body);
        res.status(201).json({ success: true, data: newFighter });
    })
);

/**
 * PUT /api/fighters/me
 * Update own profile
 */
router.put(
    '/me',
    authenticate,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const existing = await query(`SELECT id FROM fighters WHERE user_id = $1 LIMIT 1`, [userId]);
        if (existing.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Fighter profile not found.' });
            return;
        }

        const fighterId = existing.rows[0].id;
        const updatedFighter = await updateFighterProfile(fighterId, userId, req.body);

        res.json({ success: true, data: updatedFighter });
    })
);

/**
 * PUT /api/fighters/:id/status
 * Admin approves or rejects a profile
 */
router.put(
    '/:id/status',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            res.status(400).json({ success: false, message: 'Invalid status' });
            return;
        }

        const updated = await updateFighterStatusAdmin(req.params.id, status);
        if (!updated) {
            res.status(404).json({ success: false, message: 'Fighter not found' });
            return;
        }

        res.json({ success: true, data: updated });
    })
);

/**
 * POST /api/fighters/scrape-tapology
 * Uses puppeteer to bypass Cloudflare and scrape a profile
 */
const scrapeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Demasiadas solicitudes de scrape, intenta más tarde' }
});

router.post(
    '/scrape-tapology',
    authenticate,
    scrapeLimiter,
    asyncHandler(async (req: any, res: Response) => {
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ success: false, message: 'URL es requerida' });
            return;
        }

        const result = await ScraperService.scrapeTapology(url);

        if (!result.success) {
            res.status(400).json(result);
            return;
        }

        res.json(result);
    })
);

export default router;
