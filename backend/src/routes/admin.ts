import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

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

export default router;

import { muxService } from '../services/muxService';
import { bunnyService } from '../services/bunnyService';
import { getEventById } from '../services/eventService';

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
            // Create stream in Bunny.net (replacing Mux)
            const event = await getEventById(eventId);
            const streamData = await bunnyService.createLiveStream(event?.title || 'Event Stream');

            // Save to DB
            const result = await pool.query(
                `INSERT INTO live_streams (
                    event_id, 
                    bunny_live_stream_id, 
                    stream_key, 
                    rtmp_url, 
                    mux_playback_id,
                    mux_live_stream_id
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    eventId,
                    streamData.bunnyLiveStreamId,
                    streamData.streamKey,
                    streamData.rtmpUrl,
                    streamData.playbackId,
                    'bunny_' + streamData.bunnyLiveStreamId,
                ]
            );

            // Update event with stream details
            const bunnyHostname = process.env.BUNNY_STREAM_HOSTNAME || 'vz-8118499b-e3c.b-cdn.net';
            let hlsUrl = `https://${bunnyHostname}/${streamData.playbackId}/playlist.m3u8`;

            if (streamData.playbackId && streamData.playbackId.startsWith('mock_')) {
                hlsUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
            }

            // stream_url = HLS Manifest URL
            // stream_key = RTMP Stream Key
            await pool.query(
                'UPDATE events SET stream_url = $1, stream_key = $2 WHERE id = $3',
                [hlsUrl, streamData.streamKey, eventId]
            );

            res.json({
                success: true,
                data: result.rows[0],
            });
        } catch (error: any) {
            console.error('Error in create-live-stream route:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create live stream',
                error: error.message,
                details: error.response?.data || 'Check database or environment variables'
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
            if (stream.bunny_live_stream_id) {
                const bunnyStream = await bunnyService.getLiveStream(stream.bunny_live_stream_id);
                // Bunny status: 0: Created, 1: Uploading, 2: Processing, 3: Transcoding, 4: Finished, 5: Error, 6: UploadFailed
                // For Live: It might be different. 
                stream.status = bunnyStream.status === 3 ? 'active' : 'idle';
            } else if (stream.mux_live_stream_id) {
                const muxStream = await muxService.getLiveStream(stream.mux_live_stream_id);
                stream.status = muxStream.status;
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
        if (stream.bunny_live_stream_id) {
            await bunnyService.deleteLiveStream(stream.bunny_live_stream_id);
        } else if (stream.mux_live_stream_id) {
            await muxService.deleteLiveStream(stream.mux_live_stream_id);
        }

        // Delete from DB
        await pool.query('DELETE FROM live_streams WHERE id = $1', [stream.id]);

        res.json({
            success: true,
            message: 'Stream deleted successfully',
        });
    })
);
