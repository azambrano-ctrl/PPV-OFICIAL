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
import { getChatMessages } from '../services/chatService';

const router = Router();

// Validation schemas




const eventIdSchema = z.object({
    id: z.string().uuid('Invalid event ID'),
});

const eventQuerySchema = z.object({
    status: z.enum(['upcoming', 'live', 'finished', 'cancelled', 'reprise', 'pending', 'draft']).optional(),
    featured: z.string().transform(val => val === 'true').optional(),
    upcoming: z.string().transform(val => val === 'true').optional(),
    promoter_id: z.string().uuid().optional(),
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
        try {
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
        } catch (error: any) {
            console.error('[EventsRoute] Error fetching event:', error.message);
            console.error('[EventsRoute] Stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los detalles del evento',
                error: error.message
            });
        }
    })
);

/**
 * POST /api/events
 * Create new event (admin or promoter)
 */
router.post(
    '/',
    authenticate,
    uploadEventImages,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const user = req.user!;
        const files = (req as any).files;

        // Security check: Only admin or approved promoter
        if (user.role !== 'admin' && user.role !== 'promoter') {
            res.status(403).json({ success: false, message: 'No tienes permisos para crear eventos' });
            return;
        }

        const isPromoter = user.role === 'promoter';

        const eventData = {
            title: req.body.title,
            description: req.body.description,
            event_date: new Date(req.body.event_date),
            price: parseFloat(req.body.price),
            currency: req.body.currency || 'USD',
            status: isPromoter ? 'pending' : (req.body.status || 'upcoming'),
            is_featured: isPromoter ? false : (req.body.is_featured === 'true'),
            stream_url: isPromoter ? null : (req.body.stream_url || null),
            thumbnail_url: files?.thumbnail ? files.thumbnail[0].path : undefined,
            banner_url: files?.banner ? files.banner[0].path : undefined,
            promoter_id: isPromoter ? user.promoterId : (req.body.promoter_id || null),
            created_by: user.userId,
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
 * Update event (admin or the owning promoter)
 */
router.put(
    '/:id',
    authenticate,
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
            const user = req.user!;
            const eventId = req.params.id;
            console.log(`[DEBUG] User: ${user.email} (Role: ${user.role})`);

            // Fetch current event to check ownership
            const currentEvent = await getEventById(eventId);
            if (!currentEvent) {
                res.status(404).json({ success: false, message: 'Evento no encontrado' });
                return;
            }

            const isAdmin = user.role === 'admin';
            const isOwner = user.role === 'promoter' && currentEvent.promoter_id === user.promoterId;

            if (!isAdmin && !isOwner) {
                res.status(403).json({ success: false, message: 'No tienes permisos para editar este evento' });
                return;
            }

            const files = (req as any).files;
            const updates: any = {};

            // Basic fields allowed for both
            if (req.body.title) updates.title = req.body.title;
            if (req.body.description !== undefined) updates.description = req.body.description;

            // Handle date
            if (req.body.event_date) {
                const date = new Date(req.body.event_date);
                if (!isNaN(date.getTime())) {
                    updates.event_date = date;
                }
            }

            // Handle price
            if (req.body.price !== undefined && req.body.price !== '') {
                const price = parseFloat(req.body.price);
                if (!isNaN(price)) {
                    updates.price = price;
                }
            }

            if (req.body.currency) {
                updates.currency = req.body.currency;
            }

            // Admin-only fields
            if (isAdmin) {
                if (req.body.status) updates.status = req.body.status;
                if (req.body.is_featured !== undefined) updates.is_featured = req.body.is_featured === 'true';
                if (req.body.stream_url !== undefined) {
                    updates.stream_url = req.body.stream_url === '' ? null : req.body.stream_url;
                }
                if (req.body.promoter_id !== undefined) {
                    updates.promoter_id = req.body.promoter_id || null;
                }
            }

            // Handle files
            if (files?.thumbnail) {
                updates.thumbnail_url = files.thumbnail[0].path;
            } else if (req.body.remove_thumbnail === 'true') {
                updates.thumbnail_url = null;
            }

            if (files?.banner) {
                updates.banner_url = files.banner[0].path;
            } else if (req.body.remove_banner === 'true') {
                updates.banner_url = null;
            }

            console.log('[DEBUG] Updates object before DB call:', JSON.stringify(updates, null, 2));

            const event = await updateEvent(eventId, updates);
            console.log('[DEBUG] Event updated successfully in DB');

            res.json({
                success: true,
                message: 'Evento actualizado exitosamente',
                data: event,
            });
        } catch (error) {
            console.error('[ERROR] Failed to update event:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el evento',
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
 * GET /api/events/:id/chat
 * Get chat history for an event
 */
router.get(
    '/:id/chat',
    authenticate,
    validateParams(eventIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Verify user has access to event
        const hasAccess = await userHasAccessToEvent(
            req.user!.userId,
            req.params.id
        );

        if (!hasAccess) {
            res.status(403).json({
                success: false,
                message: 'No tienes acceso al chat de este evento',
            });
            return;
        }

        const messages = await getChatMessages(req.params.id);

        res.json({
            success: true,
            data: messages,
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
    validateBody(z.object({ status: z.enum(['upcoming', 'live', 'finished', 'cancelled', 'reprise', 'pending', 'draft']) })),
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
