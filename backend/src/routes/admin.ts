import { Router, Response } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { bunnyService } from '../services/bunnyService';
import { cloudflareService } from '../services/cloudflareService';
import { getEventById } from '../services/eventService';

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
                error: error.message
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

            console.log('[Admin] Calling cloudflareService for event:', event.title);
            const streamData = await cloudflareService.createLiveInput(event.title);
            console.log('[Admin] Cloudflare stream created:', streamData.cloudflareStreamId);

            console.log('[Admin] Inserting into live_streams table...');
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
                console.error('[Admin] DB INSERT FAILED:', dbError.message, dbError.detail || '');
                throw new Error(`Error en base de datos: ${dbError.message}`);
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
            if (error.response) {
                console.error('[Admin DEBUG] Cloudflare Response Data:', JSON.stringify(error.response.data, null, 2));
                console.error('[Admin DEBUG] Cloudflare Response Status:', error.response.status);
            }
            res.status(500).json({
                success: false,
                message: 'Error interno al procesar el stream',
                error: error.message || 'Unknown error',
                providerDetails: error.response?.data ? JSON.stringify(error.response.data) : 'No response data'
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
                const cfInput = await cloudflareService.getLiveInput(stream.cloudflare_stream_id);
                // Cloudflare status from live_inputs response
                stream.status = cfInput.status === 'connected' ? 'active' : 'idle';
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
                await cloudflareService.deleteLiveInput(stream.cloudflare_stream_id);
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



export default router;
