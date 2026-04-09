import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { uploadEventImages, uploadTrailerVideo } from '../middleware/upload';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventStats,
    userHasAccessToEvent,
    updateEventStatus,
    getEventFighters,
    addFighterToEvent,
    removeFighterFromEvent
} from '../services/eventService';
import { getChatMessages } from '../services/chatService';

const router = Router();

// Validation schemas




// Generic fast upload for trailers directly to Supabase
router.post('/upload-trailer', authenticate, requireAdmin, uploadTrailerVideo, async (req: Request, res: Response) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files || !files.trailer_video || files.trailer_video.length === 0) {
            return res.status(400).json({ success: false, message: 'No se envió ningún archivo de video.' });
        }

        const uploadedFile = files.trailer_video[0];

        // El middleware handleUploads ya se encargó de subirlo a Supabase
        // y adjuntar la publicUrl en 'path' o 'location'.
        const trailerUrl = uploadedFile.path || (uploadedFile as any).location;

        if (!trailerUrl) {
            return res.status(500).json({ success: false, message: 'No se pudo obtener la URL de Supabase del archivo subido.' });
        }

        return res.json({
            success: true,
            url: trailerUrl
        });
    } catch (error: any) {
        console.error('Error in /upload-trailer:', error);
        return res.status(500).json({ success: false, message: 'Error subiendo el video', ...(process.env.NODE_ENV === 'development' && { error: (error as any).message }) });
    }
});

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
                ...(process.env.NODE_ENV === 'development' && { error: (error as any).message })
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
            free_viewers_limit: req.body.free_viewers_limit ? parseInt(req.body.free_viewers_limit) : null,
            stream_url: isPromoter ? null : (req.body.stream_url || null),
            trailer_url: isPromoter ? null : (req.body.trailer_url || null),
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
                    ...(process.env.NODE_ENV === 'development' && { error: (err as any).message })
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
                if (req.body.free_viewers_limit !== undefined) {
                    updates.free_viewers_limit = req.body.free_viewers_limit ? parseInt(req.body.free_viewers_limit) : null;
                }
                if (req.body.is_featured !== undefined) updates.is_featured = req.body.is_featured === 'true';
                if (req.body.stream_url !== undefined) {
                    updates.stream_url = req.body.stream_url === '' ? null : req.body.stream_url;
                }
                if (req.body.trailer_url !== undefined) {
                    updates.trailer_url = req.body.trailer_url === '' ? null : req.body.trailer_url;
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

            if (req.body.trailer_url !== undefined) {
                updates.trailer_url = req.body.trailer_url === '' ? null : req.body.trailer_url;
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
                ...(process.env.NODE_ENV === 'development' && { error: error instanceof Error ? error.message : 'Unknown error' })
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
 * POST /api/events/:id/claim-free
 * Claim a free spot for a limited free event
 */
router.post(
    '/:id/claim-free',
    authenticate,
    validateParams(eventIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const eventId = req.params.id;

        // Check if already claimed/purchased
        const hasAccess = await userHasAccessToEvent(userId, eventId);
        if (hasAccess) {
            res.json({ success: true, message: 'Ya tienes acceso a este evento' });
            return;
        }

        const { query } = require('../config/database');

        // Empezar transacción
        await query('BEGIN');

        try {
            // Obtener el límite del evento
            const eventRes = await query(`SELECT price, free_viewers_limit FROM events WHERE id = $1`, [eventId]);
            const event = eventRes.rows[0];

            if (!event) {
                await query('ROLLBACK');
                res.status(404).json({ success: false, message: 'Evento no encontrado' });
                return;
            }

            // Must be free or have a limit
            if (Number(event.price) > 0 && (!event.free_viewers_limit || event.free_viewers_limit === 0)) {
                await query('ROLLBACK');
                res.status(403).json({ success: false, message: 'Este evento no tiene pases gratuitos disponibles' });
                return;
            }

            const limit = event.free_viewers_limit || 0;

            if (limit > 0) {
                // Verificar cuántos lugares ya han sido ocupados de forma transaccional (bloqueo)
                const countRes = await query(`
                    SELECT COUNT(*) as count 
                    FROM purchases 
                    WHERE event_id = $1 AND payment_status = 'completed'
                    FOR UPDATE
                `, [eventId]);

                const claimed = parseInt(countRes.rows[0].count);

                if (claimed >= limit) {
                    await query('ROLLBACK');
                    res.status(403).json({ success: false, message: 'Los pases gratuitos se han agotado. Debes comprar tu entrada.' });
                    return;
                }
            }

            // Insert a "free purchase" record
            await query(
                `INSERT INTO purchases (user_id, event_id, amount, final_amount, payment_status, purchase_type)
                VALUES ($1, $2, 0, 0, 'completed', 'event')`,
                [userId, eventId]
            );

            await query('COMMIT');

            res.json({
                success: true,
                message: 'Pase gratuito reclamado exitosamente',
            });
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
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

        const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
        const messages = await getChatMessages(req.params.id, limit);

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

/**
 * GET /api/events/:id/fighters
 * Get all fighters assigned to this event
 */
router.get(
    '/:id/fighters',
    validateParams(eventIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const fighters = await getEventFighters(req.params.id);
        res.json({
            success: true,
            data: fighters,
        });
    })
);

/**
 * POST /api/events/:id/fighters
 * Add a fighter to the event (admin only)
 */
router.post(
    '/:id/fighters',
    authenticate,
    requireAdmin,
    validateParams(eventIdSchema),
    validateBody(z.object({ fighter_id: z.string().uuid(), order_index: z.number().optional() })),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { fighter_id, order_index } = req.body;
        await addFighterToEvent(req.params.id, fighter_id, order_index);

        res.json({
            success: true,
            message: 'Fighter added to event successfully'
        });
    })
);

/**
 * DELETE /api/events/:id/fighters/:fighterId
 * Remove a fighter from the event (admin only)
 */
router.delete(
    '/:id/fighters/:fighterId',
    authenticate,
    requireAdmin,
    validateParams(eventIdSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        await removeFighterFromEvent(req.params.id, req.params.fighterId);

        res.json({
            success: true,
            message: 'Fighter removed from event successfully'
        });
    })
);

export default router;
