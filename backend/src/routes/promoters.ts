import { Router, Response, Request } from 'express';
const bcrypt = require('bcryptjs');
import { findUserByEmail } from '../services/userService';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validation';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';
import * as promoterService from '../services/promoterService';
import { uploadPromoterImages, handleUploads } from '../middleware/upload';

const router = Router();

const createPromoterSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    social_links: z.string().optional(), // Will be parsed from JSON
});

const registerPromoterSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    phone: z.string().min(6, 'WhatsApp/Teléfono es requerido'),
    city: z.string().min(2, 'Ciudad es requerida'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * GET /api/promoters
 * Get all promoters (Public)
 */
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const promoters = await promoterService.getAllPromoters();

        // Filter active for non-admins
        const user = (req as any).user;
        const filtered = (user?.role === 'admin')
            ? promoters
            : promoters.filter((p: any) => p.status === 'active');

        res.json({
            success: true,
            data: filtered,
        });
    })
);

/**
 * GET /api/promoters/:id
 * Get promoter by ID (Public)
 */
router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const promoter = await promoterService.getPromoterById(req.params.id);
        if (!promoter) {
            res.status(404).json({ success: false, message: 'Promoter not found' });
            return;
        }
        res.json({
            success: true,
            data: promoter,
        });
    })
);

/**
 * POST /api/promoters
 * Create a new promoter (Admin only)
 */
router.post(
    '/',
    authenticate,
    requireAdmin,
    handleUploads(uploadPromoterImages),
    validateBody(createPromoterSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const body = req.body;
        const files: any = req.files;

        const logo_url = files?.logo ? files.logo[0].location : null;
        const banner_url = files?.banner ? files.banner[0].location : null;

        const promoter = await promoterService.createPromoter({
            name: body.name,
            description: body.description,
            logo_url,
            banner_url,
            social_links: body.social_links ? JSON.parse(body.social_links) : {},
        });

        res.status(201).json({
            success: true,
            message: 'Promoter created successfully',
            data: promoter,
        });
    })
);

/**
 * POST /api/promoters/register
 * Self-registration for promoters (Public)
 */
router.post(
    '/register',
    validateBody(registerPromoterSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { name, description, email, password, phone, city } = req.body;

        // Check if email already exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado' });
            return;
        }

        const password_hash = await bcrypt.hash(password, 10);

        const result = await promoterService.registerPromoter({
            name,
            description,
            email,
            password_hash,
            phone,
            city
        });

        res.status(201).json({
            success: true,
            message: 'Solicitud de registro enviada correctamente. Un administrador revisará tu perfil.',
            data: result
        });
    })
);

/**
 * PATCH /api/promoters/:id/status
 * Update promoter status (Admin only)
 */
router.patch(
    '/:id/status',
    authenticate,
    requireAdmin,
    validateBody(z.object({ status: z.enum(['pending', 'active', 'suspended']) })),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        const updatedPromoter = await promoterService.updatePromoter(id, { status });

        res.json({
            success: true,
            message: `Estado de la promotora actualizado a ${status}`,
            data: updatedPromoter
        });
    })
);

/**
 * PUT /api/promoters/:id
 * Update promoter (Admin or specific Promoter user)
 */
router.put(
    '/:id',
    authenticate,
    handleUploads(uploadPromoterImages),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const user = req.user!;

        // Check permissions: Admin or the Promoter assigned to this profile
        if (user.role !== 'admin' && (user.role !== 'promoter' || user.promoterId !== id)) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }

        const body = req.body;
        const files: any = req.files;

        const updates: any = { ...body };

        if (files?.logo) updates.logo_url = files.logo[0].location;
        if (files?.banner) updates.banner_url = files.banner[0].location;
        if (files?.gallery) {
            const newImages = files.gallery.map((f: any) => f.location);
            const currentPromoter = await promoterService.getPromoterById(id);
            updates.gallery = [...(currentPromoter?.gallery || []), ...newImages];
        }

        if (body.social_links) updates.social_links = JSON.parse(body.social_links);
        if (body.gallery_to_remove) {
            const toRemove = JSON.parse(body.gallery_to_remove);
            const currentPromoter = await promoterService.getPromoterById(id);
            updates.gallery = (currentPromoter?.gallery || []).filter(img => !toRemove.includes(img));
        }

        const updatedPromoter = await promoterService.updatePromoter(id, updates);

        res.json({
            success: true,
            message: 'Promoter updated successfully',
            data: updatedPromoter,
        });
    })
);

/**
 * DELETE /api/promoters/:id
 * Delete promoter (Admin only)
 */
router.delete(
    '/:id',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        await promoterService.deletePromoter(req.params.id);
        res.json({
            success: true,
            message: 'Promoter deleted successfully',
        });
    })
);

export default router;
