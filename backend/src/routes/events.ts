import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { uploadEventImages } from '../middleware/upload';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventStats,
    userHasAccessToEvent,
    updateEventStatus,
} from '../services/eventService';

const router = Router();

// Validation schemas




const eventIdSchema = z.object({
    id: z.string().uuid('Invalid event ID'),
});

const eventQuerySchema = z.object({
    status: z.enum(['upcoming', 'live', 'finished', 'cancelled']).optional(),
    featured: z.string().transform(val => val === 'true').optional(),
    upcoming: z.string().transform(val => val === 'true').optional(),
});

/**
 * GET /api/events
 * Get all events with optional filters
 */
router.get(
    '/',
    validateQuery(eventQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const filters = req.query as any;
        console.log('[DEBUG] GET /events filters:', filters);

        const events = await getAllEvents(filters);
        console.log(`[DEBUG] Found ${events.length} events matching filters`);

        res.json({
            success: true,
            data: events,
        });
    })
);

/**
 * GET /api/events/:id
 * Get event by ID
 */
router.get(
    '/:id',
    validateParams(eventIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const event = await getEventById(req.params.id);

        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found',
            });
            return;
        }

        res.json({
            success: true,
            data: event,
        });
    })
);

/**
 * POST /api/events
 * Create new event (admin only)
 */
router.post(
    '/',
    authenticate,
    requireAdmin,
    uploadEventImages,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Parse form data
        const files = (req as any).files;

        const eventData = {
            title: req.body.title,
            description: req.body.description,
            event_date: new Date(req.body.event_date),
            price: parseFloat(req.body.price),
            currency: req.body.currency || 'USD',
            status: req.body.status || 'upcoming',
            is_featured: req.body.is_featured === 'true',
            stream_url: req.body.stream_url || null,
            thumbnail_url: files?.thumbnail ? `/uploads/${files.thumbnail[0].filename}` : undefined,
            banner_url: files?.banner ? `/uploads/${files.banner[0].filename}` : undefined,
            created_by: req.user!.userId,
        };

        const event = await createEvent(eventData);

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event,
        });
    })
);

/**
 * PUT /api/events/:id
 * Update event (admin only)
 */
router.put(
    '/:id',
    authenticate,
    requireAdmin,
    validateParams(eventIdSchema),
    validateParams(eventIdSchema),
    (req: Request, res: Response, next: import('express').NextFunction) => {
        console.log('[DEBUG] Processing upload for URL:', req.originalUrl);
        uploadEventImages(req, res, (err: any) => {
            if (err) {
                console.error('[ERROR] Multer Middleware Failed:', err);
                res.status(500).json({
                    success: false,
                    message: 'File upload failed',
                    error: err.message || 'Unknown upload error'
                });
                return;
            }
            console.log('[DEBUG] Upload processed. Body keys:', Object.keys(req.body));
            next();
        });
    },
    asyncHandler(async (req: AuthRequest, res: Response) => {
        try {
            console.log(`[DEBUG] Received update for event ${req.params.id}`);
            console.log('[DEBUG] Request body:', req.body);
            // console.log('[DEBUG] Files:', req.files); // Careful with binary data

            const files = (req as any).files;
            const updates: any = {};

            // Only update fields that are provided
            if (req.body.title) updates.title = req.body.title;
            if (req.body.description !== undefined) updates.description = req.body.description;
            if (req.body.status) updates.status = req.body.status;
            if (req.body.is_featured !== undefined) updates.is_featured = req.body.is_featured === 'true';

            // Handle optional fields
            if (req.body.event_date) {
                const date = new Date(req.body.event_date);
                if (!isNaN(date.getTime())) {
                    updates.event_date = date;
                } else {
                    console.error('[ERROR] Invalid event_date:', req.body.event_date);
                }
            }

            if (req.body.price !== undefined && req.body.price !== '') {
                const price = parseFloat(req.body.price);
                if (!isNaN(price)) {
                    updates.price = price;
                } else {
                    console.error('[ERROR] Invalid price:', req.body.price);
                }
            }

            if (req.body.currency) {
                updates.currency = req.body.currency;
            }

            if (req.body.stream_url !== undefined) {
                updates.stream_url = req.body.stream_url === '' ? null : req.body.stream_url;
            }

            // Handle thumbnail
            if (files?.thumbnail) {
                updates.thumbnail_url = `/uploads/${files.thumbnail[0].filename}`;
            } else if (req.body.remove_thumbnail === 'true') {
                updates.thumbnail_url = null;
            }

            // Handle banner
            if (files?.banner) {
                updates.banner_url = `/uploads/${files.banner[0].filename}`;
            } else if (req.body.remove_banner === 'true') {
                updates.banner_url = null;
            }

            console.log('[DEBUG] Updates object:', updates);

            const event = await updateEvent(req.params.id, updates);
            console.log('[DEBUG] Event updated successfully');

            res.json({
                success: true,
                message: 'Event updated successfully',
                data: event,
            });
        } catch (error) {
            console.error('[ERROR] Failed to update event:', error);
            // Re-throw to async handler or send error response directly
            res.status(500).json({
                success: false,
                message: 'Failed to update event',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    })
);

/**
 * DELETE /api/events/:id
 * Delete event (admin only)
 */
router.delete(
    '/:id',
    authenticate,
    requireAdmin,
    validateParams(eventIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        await deleteEvent(req.params.id);

        res.json({
            success: true,
            message: 'Event deleted successfully',
        });
    })
);

/**
 * GET /api/events/:id/stats
 * Get event statistics (admin only)
 */
router.get(
    '/:id/stats',
    authenticate,
    requireAdmin,
    validateParams(eventIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const stats = await getEventStats(req.params.id);

        if (!stats) {
            res.status(404).json({
                success: false,
                message: 'Event not found',
            });
            return;
        }

        res.json({
            success: true,
            data: stats,
        });
    })
);

/**
 * GET /api/events/:id/access
 * Check if user has access to event
 */
router.get(
    '/:id/access',
    authenticate,
    validateParams(eventIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const hasAccess = await userHasAccessToEvent(
            req.user!.userId,
            req.params.id
        );

        res.json({
            success: true,
            data: { hasAccess },
        });
    })
);

/**
 * PATCH /api/events/:id/status
 * Update event status (admin only)
 */
router.patch(
    '/:id/status',
    authenticate,
    requireAdmin,
    validateParams(eventIdSchema),
    validateBody(z.object({ status: z.enum(['upcoming', 'live', 'finished', 'cancelled']) })),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const event = await updateEventStatus(req.params.id, req.body.status);

        res.json({
            success: true,
            message: 'Event status updated successfully',
            data: event,
        });
    })
);

export default router;
