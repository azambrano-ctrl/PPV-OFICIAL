import { Router, Response } from 'express';
import axios from 'axios';
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
        await capturePayPalOrder(purchase.payment_intent_id);

        res.json({ success: true, message: 'Capture successful — purchase is now completed' });
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

export default router;
