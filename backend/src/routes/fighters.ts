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
import { uploadFighterImages } from '../middleware/upload';
// import { ScraperService } from '../services/scraperService';
import { query } from '../config/database';
import { createNotification } from '../services/notificationService';

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

        // If admin specifically requests all via query param
        if (req.query.all === 'true' && authReq.user && authReq.user.role === 'admin') {
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
    uploadFighterImages,
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

        const files = (req as any).files;
        const uploadData = { ...req.body };
        if (files?.profile_image_url) {
            uploadData.profile_image_url = files.profile_image_url[0].path;
        }
        if (files?.banner_image_url) {
            uploadData.banner_image_url = files.banner_image_url[0].path;
        }

        const newFighter = await claimFighterProfile(userId, uploadData);

        // Notify all main admins
        try {
            const adminsResult = await query("SELECT id FROM users WHERE role = 'admin'");
            for (const admin of adminsResult.rows) {
                await createNotification(
                    admin.id,
                    'Nuevo Peleador',
                    'Un nuevo peleador ha mandado su perfil a revisión',
                    'system',
                    '/admin/fighters'
                );
            }
        } catch (error) {
            console.error('Error sending admin notifications for new fighter claim:', error);
        }

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
    uploadFighterImages,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const existing = await query(`SELECT id FROM fighters WHERE user_id = $1 LIMIT 1`, [userId]);
        if (existing.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Fighter profile not found.' });
            return;
        }

        const fighterId = existing.rows[0].id;

        const files = (req as any).files;
        const uploadData = { ...req.body };
        if (files?.profile_image_url) {
            uploadData.profile_image_url = files.profile_image_url[0].path;
        }
        if (files?.banner_image_url) {
            uploadData.banner_image_url = files.banner_image_url[0].path;
        }

        const updatedFighter = await updateFighterProfile(fighterId, userId, uploadData);

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

export default router;
