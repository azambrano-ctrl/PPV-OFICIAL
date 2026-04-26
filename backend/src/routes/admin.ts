import { Router, Response } from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { bunnyService } from '../services/bunnyService';
import { CloudflareService } from '../services/cloudflareService';
import { getEventById } from '../services/eventService';
import logger from '../config/logger';

const router = Router();

/**
 * GET /api/admin/ping
 * Quick check to verify admin router is mounted
 */
router.get('/ping', (_req, res) => {
    res.json({ success: true, message: 'Admin router is active' });
});

/**
 * GET /api/admin/cf-test
 * Diagnostic route for Cloudflare Stream
 */
router.get(
    '/cf-test',
    authenticate,
    requireAdmin,
    asyncHandler(async (_req: any, res: Response) => {
        try {
            console.log('[Admin] Running Cloudflare Diagnostic...');
            const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
            const token = process.env.CLOUDFLARE_API_TOKEN;

            const results: any = {
                config: {
                    accountId,
                    tokenLength: token?.length || 0,
                    tokenStart: token?.substring(0, 5) + '...'
                },
                apiTest: {},
                dbTest: {}
            };

            // Test 0: Database Health
            try {
                const dbRes = await pool.query('SELECT current_database(), now()');
                results.dbTest.status = 'OK';
                results.dbTest.details = dbRes.rows[0];

                const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
                results.dbTest.eventsCount = parseInt(eventsCount.rows[0].count);

                const tableCheck = await pool.query(`
                    SELECT table_name, column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name IN ('events', 'live_streams', 'promoters')
                    ORDER BY table_name, ordinal_position
                `);
                results.dbTest.schema = tableCheck.rows.length;
            } catch (dbErr: any) {
                results.dbTest.status = 'FAILED';
                results.dbTest.error = dbErr.message;
            }

            // Test 1: Basic list inputs
            try {
                const response = await axios.get(
                    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                results.apiTest.listInputs = {
                    status: 'OK',
                    count: response.data.result?.length || 0
                };
            } catch (e: any) {
                results.apiTest.listInputs = {
                    status: 'FAILED',
                    code: e.response?.status,
                    data: e.response?.data
                };
            }

            res.json({
                success: true,
                results
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error sending mass email',
                ...(process.env.NODE_ENV === 'development' && { error: (error as any).message })
            });
        }
    })
);

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get(
    '/stats',
    authenticate,
    requireAdmin,
    asyncHandler(async (_req: any, res: Response) => {
        // Get total users
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = parseInt(usersResult.rows[0].count);

        // Get total events
        const eventsResult = await pool.query('SELECT COUNT(*) as count FROM events');
        const totalEvents = parseInt(eventsResult.rows[0].count);

        // Get total revenue
        const revenueResult = await pool.query(
            `SELECT COALESCE(SUM(final_amount), 0) as total FROM purchases WHERE payment_status = 'completed'`
        );
        const totalRevenue = parseFloat(revenueResult.rows[0].total);

        // Get active viewers (sum of all max_viewers of live events as a proxy or just count live events)
        const liveEventsResult = await pool.query(
            `SELECT COUNT(*) as count FROM events WHERE status = 'live'`
        );
        const activeStreams = parseInt(liveEventsResult.rows[0].count);

        // Current month stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const newUsersMonthResult = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
            [startOfMonth]
        );
        const newUsersThisMonth = parseInt(newUsersMonthResult.rows[0].count);

        const eventsMonthResult = await pool.query(
            'SELECT COUNT(*) as count FROM events WHERE created_at >= $1',
            [startOfMonth]
        );
        const eventsThisMonth = parseInt(eventsMonthResult.rows[0].count);

        // Monthly Revenue (Last 6 months)
        const monthlyRevenueResult = await pool.query(`
            SELECT 
                TO_CHAR(purchased_at, 'Mon') as month,
                SUM(final_amount) as total
            FROM purchases
            WHERE payment_status = 'completed' 
              AND purchased_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(purchased_at, 'Mon'), DATE_TRUNC('month', purchased_at)
            ORDER BY DATE_TRUNC('month', purchased_at) ASC
        `);

        // Monthly User Growth (Last 6 months)
        const monthlyUsersResult = await pool.query(`
            SELECT 
                TO_CHAR(created_at, 'Mon') as month,
                COUNT(*) as count
            FROM users
            WHERE created_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at) ASC
        `);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalEvents,
                totalRevenue,
                activeStreams,
                newUsersThisMonth,
                eventsThisMonth,
                charts: {
                    revenue: monthlyRevenueResult.rows,
                    users: monthlyUsersResult.rows
                }
            },
        });
    })
);

/**
 * POST /api/admin/mass-email
 * Send a mass email to all registered users (or a specific role)
 */
router.post(
    '/mass-email',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const { subject, body, role, specificEmail } = req.body;

        if (!subject || !body) {
            res.status(400).json({ success: false, message: 'Subject and body are required' });
            return;
        }

        try {
            console.log('[Admin] Preparing mass email...');

            let emails: string[] = [];

            if (role === 'specific' && specificEmail) {
                emails = [specificEmail];
            } else {
                // Build the query to get emails
                let queryText = 'SELECT email FROM users WHERE email IS NOT NULL';
                let queryParams: any[] = [];

                if (role && role !== 'all') {
                    queryText += ' AND role = $1';
                    queryParams.push(role);
                }

                const result = await pool.query(queryText, queryParams);
                emails = result.rows.map((row: any) => row.email).filter((e: string) => e && e.includes('@'));
            }

            if (emails.length === 0) {
                res.status(404).json({ success: false, message: 'No recipients found' });
                return;
            }

            console.log(`[Admin] Sending mass email to ${emails.length} users...`);

            // Send the emails using the service
            const { sendMassEmail } = await import('../services/emailService');

            // Send asynchronously so the admin doesn't have to wait for hundreds of emails
            sendMassEmail(emails, subject, body).catch(err => {
                console.error('[Admin] Background mass email failed:', err);
            });

            res.json({
                success: true,
                message: `Email sending process started for ${emails.length} users.`,
                recipientsCount: emails.length
            });
        } catch (error: any) {
            console.error('[Admin] Error initiating mass email:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to initiate mass email'
            });
        }
    })
);

/**
 * GET /api/admin/purchases/recent
/**
 * GET /api/admin/purchases
 * All purchases with optional filters: eventId, status, paymentMethod
 */
router.get(
    '/purchases',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { eventId, status, paymentMethod } = req.query as Record<string, string>;

        const conditions: string[] = [];
        const params: any[] = [];

        if (eventId) { params.push(eventId); conditions.push(`p.event_id = $${params.length}`); }
        if (status)  { params.push(status);  conditions.push(`p.payment_status = $${params.length}`); }
        if (paymentMethod) { params.push(paymentMethod); conditions.push(`p.payment_method = $${params.length}`); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT
                p.id,
                p.payment_status,
                p.payment_method,
                p.amount,
                p.final_amount,
                p.discount_amount,
                p.currency,
                p.coupon_code,
                p.seat_number,
                p.purchased_at,
                p.payment_intent_id,
                u.id        AS user_id,
                u.email     AS user_email,
                u.full_name AS user_name,
                COALESCE(e.title, 'Pase de Temporada') AS event_title,
                e.id        AS event_id,
                p.purchase_type
             FROM purchases p
             JOIN users u ON u.id = p.user_id
             LEFT JOIN events e ON e.id = p.event_id
             ${where}
             ORDER BY p.purchased_at DESC
             LIMIT 500`,
            params
        );

        res.json({ success: true, data: result.rows });
    })
);

/**
 * GET /api/admin/purchases/recent
 * Get recent purchases
 */
router.get(
    '/purchases/recent',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await pool.query(
            `SELECT
                p.id,
                p.amount,
                p.currency,
                p.purchased_at,
                u.email as user_email,
                e.title as event_title
            FROM purchases p
            JOIN users u ON p.user_id = u.id
            JOIN events e ON p.event_id = e.id
            WHERE p.payment_status = 'completed'
            ORDER BY p.purchased_at DESC
            LIMIT $1`,
            [limit]
        );

        res.json({
            success: true,
            data: result.rows,
        });
    })
);


/**
 * GET /api/admin/users/:userId/purchases
 * Get all purchases for a specific user (all statuses)
 */
router.get(
    '/users/:userId/purchases',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT
                p.id,
                p.amount,
                p.final_amount,
                p.currency,
                p.payment_method,
                p.payment_status,
                p.payment_intent_id,
                p.purchase_type,
                p.coupon_code,
                p.discount_amount,
                p.purchased_at,
                p.seat_number,
                COALESCE(e.title, 'Pase de Temporada') as event_title,
                e.id as event_id,
                e.status as event_status,
                e.event_date
             FROM purchases p
             LEFT JOIN events e ON p.event_id = e.id
             WHERE p.user_id = $1
             ORDER BY p.purchased_at DESC`,
            [userId]
        );

        res.json({ success: true, data: result.rows });
    })
);

/**
 * GET /api/admin/events/sales-summary
 * Returns all events with completed purchase counts and revenue
 */
router.get(
    '/events/sales-summary',
    authenticate,
    requireAdmin,
    asyncHandler(async (_req: AuthRequest, res: Response) => {
        const result = await pool.query(
            `SELECT
                e.id,
                e.title,
                e.status,
                e.event_date,
                e.price,
                e.currency,
                COUNT(p.id) FILTER (WHERE p.payment_status = 'completed') AS sold,
                COUNT(p.id) FILTER (WHERE p.payment_status = 'pending')   AS pending,
                COALESCE(SUM(p.final_amount) FILTER (WHERE p.payment_status = 'completed'), 0) AS revenue
             FROM events e
             LEFT JOIN purchases p ON p.event_id = e.id
             GROUP BY e.id
             ORDER BY e.event_date DESC`
        );
        res.json({ success: true, data: result.rows });
    })
);

/**
 * POST /api/admin/events/:id/live-stream
 * Create a new live stream for an event
 */
router.post(
    '/events/:id/live-stream',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const eventId = authReq.params.id;

        // Check if stream already exists
        const existingStream = await pool.query(
            'SELECT * FROM live_streams WHERE event_id = $1',
            [eventId]
        );

        if (existingStream.rows.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Live stream already exists for this event',
                data: existingStream.rows[0],
            });
            return;
        }

        try {
            console.log('[Admin] Creating stream for event:', eventId);

            // Create stream in Cloudflare Stream
            const event = await getEventById(eventId);
            if (!event) {
                console.error('[Admin] Event not found:', eventId);
                res.status(404).json({ success: false, message: 'Event not found' });
                return;
            }

            console.log('[Admin] Calling CloudflareService for event:', event.title);
            const streamData = await CloudflareService.createLiveInput(event.title);
            console.log('[Admin] Cloudflare stream created:', streamData.cloudflareStreamId);

            console.log('[Admin] Inserting into live_streams table...');
            console.log('[Admin] Stream data to insert:', {
                eventId,
                cloudflareStreamId: streamData.cloudflareStreamId,
                streamKey: streamData.streamKey ? 'present' : 'missing',
                rtmpUrl: streamData.rtmpUrl ? 'present' : 'missing'
            });

            let result;
            try {
                result = await pool.query(
                    `INSERT INTO live_streams (
                        event_id, 
                        cloudflare_stream_id, 
                        stream_key, 
                        rtmp_url, 
                        status
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *`,
                    [
                        eventId,
                        streamData.cloudflareStreamId,
                        streamData.streamKey || '',
                        streamData.rtmpUrl || '',
                        'active' // Cloudflare inputs are ready immediately
                    ]
                );
                console.log('[Admin] Insert into live_streams successful');
            } catch (dbError: any) {
                console.error('[Admin] DB INSERT FAILED:', dbError.message);
                console.error('[Admin] DB Error Detail:', dbError.detail || 'No detail');
                console.error('[Admin] DB Error Code:', dbError.code || 'No code');
                throw new Error(`Database error: ${dbError.message}. Detail: ${dbError.detail || 'none'}`);
            }

            // Update event with stream details
            const hlsUrl = streamData.hlsUrl;

            console.log('[Admin] Updating event with HLS URL:', hlsUrl);
            try {
                await pool.query(
                    'UPDATE events SET stream_url = $1, stream_key = $2 WHERE id = $3',
                    [hlsUrl, streamData.streamKey, eventId]
                );
                console.log('[Admin] Event updated successfully');
            } catch (dbError: any) {
                console.error('[Admin] FAILED TO UPDATE EVENT:', dbError.message);
            }

            res.json({
                success: true,
                data: result.rows[0],
            });
        } catch (error: any) {
            console.error('[Admin DEBUG] FATAL ERROR in live-stream route:', error);
            console.error('[Admin DEBUG] Error stack:', error.stack);

            if (error.response) {
                console.error('[Admin DEBUG] Cloudflare Response Data:', JSON.stringify(error.response.data, null, 2));
                console.error('[Admin DEBUG] Cloudflare Response Status:', error.response.status);
            }

            res.status(500).json({
                success: false,
                message: 'Error creating live stream',
                ...(process.env.NODE_ENV === 'development' && {
                    error: (error as any).message,
                    details: {
                        cloudflareError: (error as any).response?.data || null,
                        cloudflareStatus: (error as any).response?.status || null,
                        errorType: (error as any).constructor?.name
                    }
                })
            });
        }
    })
);


/**
 * GET /api/admin/events/:id/live-stream
 * Get live stream details for an event
 */
router.get(
    '/events/:id/live-stream',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const eventId = authReq.params.id;

        const result = await pool.query(
            'SELECT * FROM live_streams WHERE event_id = $1',
            [eventId]
        );

        if (result.rows.length === 0) {
            res.json({
                success: true,
                data: null,
            });
            return;
        }

        // Optionally fetch up-to-date status
        const stream = result.rows[0];
        try {
            if (stream.cloudflare_stream_id) {
                const cfInput = await CloudflareService.getLiveInput(stream.cloudflare_stream_id);
                // Cloudflare may return status as a string or nested object
                const cfStatusRaw = cfInput.status;
                let cfStatusStr: string;
                if (cfStatusRaw === null || cfStatusRaw === undefined) {
                    cfStatusStr = 'idle';
                } else if (typeof cfStatusRaw === 'object') {
                    cfStatusStr = (cfStatusRaw as any).current?.state
                        ?? (cfStatusRaw as any).state
                        ?? JSON.stringify(cfStatusRaw);
                } else {
                    cfStatusStr = String(cfStatusRaw);
                }
                stream.status = cfStatusStr.toLowerCase().includes('connected') ? 'active' : cfStatusStr;
            } else if (stream.bunny_live_stream_id) {
                const bunnyStream = await bunnyService.getLiveStream(stream.bunny_live_stream_id);
                stream.status = bunnyStream.status === 3 ? 'active' : 'idle';
            }
        } catch (error) {
            console.error('Failed to fetch stream status', error);
        }

        res.json({
            success: true,
            data: stream,
        });
    })
);

/**
 * DELETE /api/admin/events/:id/live-stream
 * Delete live stream for an event
 */
router.delete(
    '/events/:id/live-stream',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const eventId = authReq.params.id;

        const result = await pool.query(
            'SELECT * FROM live_streams WHERE event_id = $1',
            [eventId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Stream not found',
            });
            return;
        }

        const stream = result.rows[0];

        // Delete from Provider
        if (stream.cloudflare_stream_id) {
            try {
                await CloudflareService.deleteLiveInput(stream.cloudflare_stream_id);
            } catch (e) {
                console.warn('Cloudflare delete failed', e);
            }
        } else if (stream.bunny_live_stream_id) {
            try {
                await bunnyService.deleteLiveStream(stream.bunny_live_stream_id);
            } catch (e) {
                console.warn('Bunny delete failed or already deleted', e);
            }
        }

        // Delete from DB
        await pool.query('DELETE FROM live_streams WHERE id = $1', [stream.id]);

        res.json({
            success: true,
            message: 'Stream deleted successfully',
        });
    })
);

/**
 * POST /api/admin/events/:id/end-stream
 * Manually force an event from 'live' → 'reprise' (admin emergency stop)
 */
router.post(
    '/events/:id/end-stream',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const eventId = authReq.params.id;

        // Verify the event exists
        const eventRes = await pool.query(
            'SELECT id, title, status FROM events WHERE id = $1',
            [eventId]
        );

        if (eventRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Evento no encontrado' });
            return;
        }

        const event = eventRes.rows[0];

        if (event.status !== 'live') {
            res.status(400).json({
                success: false,
                message: `El evento no está en vivo (estado actual: ${event.status})`,
            });
            return;
        }

        // Move event to reprise
        await pool.query(
            "UPDATE events SET status = 'reprise', updated_at = NOW() WHERE id = $1",
            [eventId]
        );

        // Mark live_stream as completed
        await pool.query(
            "UPDATE live_streams SET status = 'completed', updated_at = NOW() WHERE event_id = $1",
            [eventId]
        );

        logger.info(`[Admin] Event "${event.title}" (${eventId}) manually ended by admin ${authReq.user!.userId}`);

        res.json({
            success: true,
            message: `Transmisión de "${event.title}" finalizada. Estado cambiado a REPRISE.`,
        });
    })
);

/**
 * POST /api/admin/purchases/paypal-reconcile
 * Check ALL pending PayPal purchases against PayPal API and auto-capture APPROVED ones
 */
router.post(
    '/purchases/paypal-reconcile',
    authenticate,
    requireAdmin,
    asyncHandler(async (_req: AuthRequest, res: Response) => {
        const pendingRes = await pool.query(
            `SELECT id, payment_intent_id FROM purchases
             WHERE payment_method = 'paypal' AND payment_status = 'pending'`
        );

        const { getPayPalOrderStatus, capturePayPalOrder } = await import('../services/paypalService');

        const results = { captured: 0, expired: 0, errors: 0, capturedOrders: [] as string[] };

        for (const row of pendingRes.rows) {
            try {
                const status = await getPayPalOrderStatus(row.payment_intent_id);

                if (status.status === 'APPROVED') {
                    try {
                        await capturePayPalOrder(row.payment_intent_id);
                        results.captured++;
                        results.capturedOrders.push(row.id);
                        logger.info('[Reconcile] Auto-captured APPROVED PayPal order', { purchaseId: row.id });
                    } catch (captureErr: any) {
                        logger.warn('[Reconcile] Capture failed for APPROVED order', { purchaseId: row.id, error: captureErr.message });
                        results.errors++;
                    }
                } else {
                    results.expired++;
                }
            } catch {
                results.expired++; // Treat fetch errors as expired/not found
            }
        }

        logger.info('[Reconcile] PayPal reconciliation complete', results);
        res.json({ success: true, data: results });
    })
);

/**
 * GET /api/admin/purchases/:purchaseId/paypal-status
 * Check the real status of a PayPal order directly from PayPal
 */
router.get(
    '/purchases/:purchaseId/paypal-status',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { purchaseId } = req.params;

        const result = await pool.query(
            'SELECT id, payment_intent_id, payment_method FROM purchases WHERE id = $1',
            [purchaseId]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Purchase not found' });
            return;
        }
        const purchase = result.rows[0];
        if (purchase.payment_method !== 'paypal') {
            res.status(400).json({ success: false, message: 'Not a PayPal purchase' });
            return;
        }

        const { getPayPalOrderStatus } = await import('../services/paypalService');

        try {
            const status = await getPayPalOrderStatus(purchase.payment_intent_id);
            res.json({ success: true, data: status });
        } catch (paypalErr: any) {
            // PayPal SDK wraps errors — extract useful message
            const details = paypalErr?.message || String(paypalErr);
            logger.warn('[Admin] PayPal order status check failed', {
                purchaseId,
                orderId: purchase.payment_intent_id,
                error: details,
            });

            // Order expired or not found in PayPal
            if (details.includes('404') || details.includes('INVALID_RESOURCE_ID') || details.includes('not found')) {
                res.json({
                    success: true,
                    data: { status: 'EXPIRED_OR_NOT_FOUND', grossAmount: undefined, payerEmail: undefined },
                });
                return;
            }

            res.status(502).json({
                success: false,
                message: `PayPal API error: ${details.substring(0, 200)}`,
            });
        }
    })
);

/**
 * POST /api/admin/purchases/:purchaseId/retry-capture
 * Manually retry PayPal capture for a stuck pending purchase
 */
router.post(
    '/purchases/:purchaseId/retry-capture',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const { purchaseId } = req.params;

        const result = await pool.query(
            `SELECT id, payment_intent_id, payment_status, payment_method
             FROM purchases WHERE id = $1`,
            [purchaseId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Purchase not found' });
            return;
        }

        const purchase = result.rows[0];

        if (purchase.payment_status === 'completed') {
            res.json({ success: true, message: 'Purchase already completed' });
            return;
        }

        if (purchase.payment_method !== 'paypal') {
            res.status(400).json({ success: false, message: 'Only PayPal purchases can be retried' });
            return;
        }

        const { capturePayPalOrder } = await import('../services/paypalService');

        try {
            await capturePayPalOrder(purchase.payment_intent_id);
            res.json({ success: true, message: 'Captura exitosa — compra completada' });
        } catch (paypalErr: any) {
            const raw = paypalErr?.message || String(paypalErr);
            logger.warn('[Admin] retry-capture failed', { purchaseId, error: raw });

            // Identify unrecoverable PayPal errors
            if (
                raw.includes('ORDER_NOT_APPROVED') ||
                raw.includes('UNPROCESSABLE_ENTITY') ||
                raw.includes('ORDER_ALREADY_CAPTURED') ||
                raw.includes('INVALID_RESOURCE_ID') ||
                raw.includes('404')
            ) {
                res.status(422).json({
                    success: false,
                    message: 'La orden de PayPal está expirada o el cliente nunca aprobó el pago. Usa "Dar Acceso" manualmente si corresponde.',
                });
                return;
            }

            res.status(502).json({
                success: false,
                message: `Error de PayPal: ${raw.substring(0, 200)}`,
            });
        }
    })
);

/**
 * POST /api/admin/purchases/:purchaseId/grant-access
 * Manually complete a purchase and grant stream access (for expired PayPal orders)
 */
router.post(
    '/purchases/:purchaseId/grant-access',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const { purchaseId } = req.params;

        const result = await pool.query(
            `SELECT * FROM purchases WHERE id = $1`,
            [purchaseId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Purchase not found' });
            return;
        }

        const purchase = result.rows[0];

        if (purchase.payment_status === 'completed') {
            res.json({ success: true, message: 'Already completed — no action needed' });
            return;
        }

        // Mark as completed
        await pool.query(
            `UPDATE purchases SET payment_status = 'completed' WHERE id = $1`,
            [purchaseId]
        );

        // Create stream token if event purchase
        if (purchase.purchase_type === 'event' && purchase.event_id) {
            const { generateStreamToken } = await import('../middleware/auth');
            const userRes = await pool.query(
                'SELECT current_session_id FROM users WHERE id = $1',
                [purchase.user_id]
            );
            const sessionId = userRes.rows[0]?.current_session_id || 'admin-grant';
            const streamToken = generateStreamToken(purchase.user_id, purchase.event_id, sessionId);
            const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

            // Revoke existing tokens then insert fresh one
            await pool.query(
                `UPDATE stream_tokens SET is_revoked = true
                 WHERE user_id = $1 AND event_id = $2`,
                [purchase.user_id, purchase.event_id]
            );
            await pool.query(
                `INSERT INTO stream_tokens (user_id, event_id, token, expires_at)
                 VALUES ($1, $2, $3, $4)`,
                [purchase.user_id, purchase.event_id, streamToken, expiresAt]
            );
        }

        logger.info('Admin manually granted access to purchase', { purchaseId, adminId: req.user?.userId });

        res.json({ success: true, message: 'Access granted — purchase marked as completed' });
    })
);

/**
 * GET /api/admin/events/:id/purchase-analysis
 * Full purchase funnel analysis for a specific event
 */
router.get(
    '/events/:id/purchase-analysis',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const eventId = req.params.id;

        // Event info
        const eventRes = await pool.query(
            `SELECT id, title, event_date, price, currency, status FROM events WHERE id = $1`,
            [eventId]
        );
        if (eventRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        const event = eventRes.rows[0];
        const eventDate = new Date(event.event_date);
        const dayStart = new Date(eventDate); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(eventDate); dayEnd.setHours(23, 59, 59, 999);

        // Users registered on event day
        const newUsersRes = await pool.query(
            `SELECT COUNT(*) as total FROM users
             WHERE created_at >= $1 AND created_at <= $2`,
            [dayStart, dayEnd]
        );

        // Purchase funnel breakdown
        const funnelRes = await pool.query(
            `SELECT
                payment_status,
                COUNT(*)            AS total,
                COUNT(DISTINCT user_id) AS unique_users
             FROM purchases
             WHERE event_id = $1
             GROUP BY payment_status`,
            [eventId]
        );

        // Users registered on event day who purchased (completed)
        const newUsersPurchasedRes = await pool.query(
            `SELECT COUNT(DISTINCT p.user_id) as total
             FROM purchases p
             JOIN users u ON u.id = p.user_id
             WHERE p.event_id = $1
               AND p.payment_status = 'completed'
               AND u.created_at >= $2 AND u.created_at <= $3`,
            [eventId, dayStart, dayEnd]
        );

        // Users registered on event day who attempted but failed/pending
        const newUsersFailedRes = await pool.query(
            `SELECT COUNT(DISTINCT p.user_id) as total
             FROM purchases p
             JOIN users u ON u.id = p.user_id
             WHERE p.event_id = $1
               AND p.payment_status IN ('failed', 'pending')
               AND u.created_at >= $2 AND u.created_at <= $3`,
            [eventId, dayStart, dayEnd]
        );

        // Users registered on event day who never attempted a purchase
        const newUsersNoPurchaseRes = await pool.query(
            `SELECT COUNT(*) as total
             FROM users u
             WHERE u.created_at >= $1 AND u.created_at <= $2
               AND NOT EXISTS (
                   SELECT 1 FROM purchases p
                   WHERE p.user_id = u.id AND p.event_id = $3
               )`,
            [dayStart, dayEnd, eventId]
        );

        // Failed/pending purchase details (last 20)
        const failedDetailsRes = await pool.query(
            `SELECT p.id, p.payment_status, p.payment_method, p.amount,
                    p.purchased_at, u.email, u.full_name
             FROM purchases p
             JOIN users u ON u.id = p.user_id
             WHERE p.event_id = $1
               AND p.payment_status IN ('failed', 'pending')
             ORDER BY p.purchased_at DESC
             LIMIT 20`,
            [eventId]
        );

        const funnel: Record<string, { total: number; unique_users: number }> = {};
        for (const row of funnelRes.rows) {
            funnel[row.payment_status] = {
                total: parseInt(row.total),
                unique_users: parseInt(row.unique_users),
            };
        }

        res.json({
            success: true,
            data: {
                event: {
                    id: event.id,
                    title: event.title,
                    date: event.event_date,
                    price: event.price,
                    currency: event.currency,
                    status: event.status,
                },
                new_users_on_event_day: parseInt(newUsersRes.rows[0].total),
                purchase_funnel: {
                    completed:  funnel['completed']  || { total: 0, unique_users: 0 },
                    pending:    funnel['pending']    || { total: 0, unique_users: 0 },
                    failed:     funnel['failed']     || { total: 0, unique_users: 0 },
                    refunded:   funnel['refunded']   || { total: 0, unique_users: 0 },
                },
                new_users_breakdown: {
                    purchased:    parseInt(newUsersPurchasedRes.rows[0].total),
                    failed_or_pending: parseInt(newUsersFailedRes.rows[0].total),
                    never_attempted:   parseInt(newUsersNoPurchaseRes.rows[0].total),
                },
                failed_purchase_details: failedDetailsRes.rows,
            },
        });
    })
);

/**
 * POST /api/admin/test-email
 * Send a test email to verify Brevo / SMTP config (Admin only)
 */
router.post(
    '/test-email',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { sendEmail } = await import('../services/emailService');

        const to: string = (req.body.to as string) || req.user!.email;
        const provider = process.env.BREVO_API_KEY ? 'Brevo API' : (process.env.EMAIL_USER ? 'SMTP' : 'ninguno');

        if (!process.env.BREVO_API_KEY && !process.env.EMAIL_USER) {
            res.status(503).json({
                success: false,
                provider: 'ninguno',
                message: 'No hay proveedor de correo configurado. Agrega BREVO_API_KEY o EMAIL_USER en las variables de entorno de Render.',
            });
            return;
        }

        const brandName = process.env.EMAIL_FROM_NAME || 'Arena Fight Pass';
        const html = `
<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden;border:1px solid #333;">
  <div style="background:#ef4444;padding:24px;text-align:center;">
    <h1 style="margin:0;font-size:22px;text-transform:uppercase;letter-spacing:2px;">✅ Correo de Prueba</h1>
  </div>
  <div style="padding:32px 28px;">
    <p style="font-size:16px;color:#ccc;">Este es un correo de prueba enviado desde <strong style="color:#fff;">${brandName}</strong>.</p>
    <p style="font-size:15px;color:#aaa;">Si estás viendo esto, la configuración de correo funciona correctamente.</p>
    <table style="width:100%;background:#111;border-radius:8px;padding:16px;margin-top:24px;border-collapse:collapse;">
      <tr><td style="color:#555;font-size:13px;padding:6px 0;">Proveedor</td><td style="color:#fff;font-size:13px;font-weight:bold;">${provider}</td></tr>
      <tr><td style="color:#555;font-size:13px;padding:6px 0;">Enviado a</td><td style="color:#fff;font-size:13px;">${to}</td></tr>
      <tr><td style="color:#555;font-size:13px;padding:6px 0;">Fecha</td><td style="color:#fff;font-size:13px;">${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</td></tr>
    </table>
  </div>
  <div style="padding:16px;text-align:center;background:#000;border-top:1px solid #111;">
    <p style="margin:0;color:#333;font-size:12px;">&copy; ${new Date().getFullYear()} ${brandName}</p>
  </div>
</div>`;

        try {
            await sendEmail(to, `[Test] Configuración de correo - ${brandName}`, html);
            res.json({
                success: true,
                provider,
                message: `Correo de prueba enviado a ${to} vía ${provider}.`,
                to,
            });
        } catch (err: any) {
            res.status(500).json({
                success: false,
                provider,
                message: `Error al enviar: ${err.message}`,
            });
        }
    })
);

/**
 * POST /api/admin/events/:id/fetch-recording
 * Manually fetch the Cloudflare recording URL for a REPRISE event.
 * Useful when auto-fetch failed or the event was already in REPRISE before this feature.
 */
router.post(
    '/events/:id/fetch-recording',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const eventId = authReq.params.id;

        // Get the live_stream record for this event
        const streamRes = await pool.query(
            'SELECT ls.cloudflare_stream_id, e.title, e.status FROM live_streams ls JOIN events e ON e.id = ls.event_id WHERE ls.event_id = $1',
            [eventId]
        );

        if (streamRes.rows.length === 0 || !streamRes.rows[0].cloudflare_stream_id) {
            res.status(404).json({ success: false, message: 'No se encontró un live stream de Cloudflare para este evento.' });
            return;
        }

        const { cloudflare_stream_id, title } = streamRes.rows[0];

        try {
            const recordings = await CloudflareService.getRecordingsForLiveInput(cloudflare_stream_id);

            if (recordings.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Cloudflare aún no tiene grabaciones para este live input. Intenta en unos minutos.',
                });
                return;
            }

            const latest = recordings[0];
            const hlsUrl = CloudflareService.buildRecordingHlsUrl(latest.uid);

            await pool.query('UPDATE events SET stream_url = $1 WHERE id = $2', [hlsUrl, eventId]);

            logger.info(`[Admin] Recording URL manually set for "${title}": ${hlsUrl}`);

            res.json({
                success: true,
                message: `URL de grabación actualizada correctamente.`,
                data: {
                    videoUid: latest.uid,
                    hlsUrl,
                    totalRecordings: recordings.length,
                },
            });
        } catch (err: any) {
            res.status(500).json({ success: false, message: `Error al consultar Cloudflare: ${err.message}` });
        }
    })
);

/**
 * POST /api/admin/grant-access
 * Manually grant a user access to a paid event (creates a completed purchase).
 */
router.post(
    '/grant-access',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { userId, eventId } = req.body;

        if (!userId || !eventId) {
            res.status(400).json({ success: false, message: 'userId y eventId son requeridos' });
            return;
        }

        // Verify user and event exist
        const [userRes, eventRes] = await Promise.all([
            pool.query('SELECT id, email, full_name FROM users WHERE id = $1', [userId]),
            pool.query('SELECT id, title, price, currency FROM events WHERE id = $1', [eventId]),
        ]);

        if (userRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        if (eventRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Evento no encontrado' });
            return;
        }

        const event = eventRes.rows[0];

        // Upsert: if pending purchase exists, complete it; otherwise create new
        await pool.query(
            `INSERT INTO purchases (user_id, event_id, purchase_type, amount, currency, payment_method, payment_status, final_amount)
             VALUES ($1, $2, 'event', $3, $4, 'stripe', 'completed', $3)
             ON CONFLICT (user_id, event_id) WHERE purchase_type != 'season_pass'
             DO UPDATE SET payment_status = 'completed', final_amount = EXCLUDED.final_amount`,
            [userId, eventId, event.price || 0, event.currency || 'USD']
        );

        logger.info('[Admin] Manual access granted', {
            adminId: req.user!.userId,
            userId,
            eventId,
            eventTitle: event.title,
        });

        res.json({
            success: true,
            message: `Acceso otorgado a "${event.title}"`,
        });
    })
);

/**
 * POST /api/admin/promoters/create-account
 * Create a fully linked promoter + user account in one step (Admin only)
 */
router.post(
    '/promoters/create-account',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'name, email y password son requeridos' });
            return;
        }

        // Check email not taken
        const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (existing.rows.length > 0) {
            res.status(400).json({ success: false, message: 'El correo ya está registrado' });
            return;
        }

        const password_hash = await bcrypt.hash(password, 10);
        const slug = name.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-') + '-' + Date.now();

        // Transaction: create promoter + user linked together
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const promoterRes = await client.query(
                `INSERT INTO promoters (name, slug, status) VALUES ($1, $2, 'active') RETURNING id`,
                [name, slug]
            );
            const promoterId = promoterRes.rows[0].id;

            const userRes = await client.query(
                `INSERT INTO users (email, password_hash, full_name, role, promoter_id, is_verified)
                 VALUES ($1, $2, $3, 'promoter', $4, true) RETURNING id, email, full_name`,
                [email, password_hash, name, promoterId]
            );

            await client.query('COMMIT');

            logger.info('[Admin] Promoter account created', { email, promoterId });

            res.status(201).json({
                success: true,
                message: 'Cuenta de promotora creada',
                data: { user: userRes.rows[0], promoterId },
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    })
);

/**
 * POST /api/admin/users/:userId/make-promoter
 * Upgrade an existing user to promoter role and create/link a promoter profile (Admin only)
 */
router.post(
    '/users/:userId/make-promoter',
    authenticate,
    requireAdmin,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { userId } = req.params;
        const { promoterName } = req.body;

        if (!promoterName) {
            res.status(400).json({ success: false, message: 'promoterName es requerido' });
            return;
        }

        const userRes = await pool.query('SELECT id, email, full_name, role, promoter_id FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }

        const user = userRes.rows[0];
        if (user.promoter_id) {
            res.status(400).json({ success: false, message: 'El usuario ya está vinculado a una promotora' });
            return;
        }

        const slug = promoterName.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-') + '-' + Date.now();

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const promoterRes = await client.query(
                `INSERT INTO promoters (name, slug, status) VALUES ($1, $2, 'active') RETURNING id`,
                [promoterName, slug]
            );
            const promoterId = promoterRes.rows[0].id;

            await client.query(
                `UPDATE users SET role = 'promoter', promoter_id = $1 WHERE id = $2`,
                [promoterId, userId]
            );

            await client.query('COMMIT');

            logger.info('[Admin] User upgraded to promoter', { userId, email: user.email, promoterId });

            res.json({
                success: true,
                message: 'Usuario convertido a promotora exitosamente',
                data: { promoterId, promoterName, userId },
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    })
);

export default router;
