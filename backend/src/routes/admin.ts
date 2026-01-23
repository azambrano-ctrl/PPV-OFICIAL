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
    requireAdmin,
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        // Get total users
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = parseInt(usersResult.rows[0].count);

        // Get total events
        const eventsResult = await pool.query('SELECT COUNT(*) as count FROM events');
        const totalEvents = parseInt(eventsResult.rows[0].count);

        // Get total revenue
        const revenueResult = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM purchases WHERE status = 'completed'`
        );
        const totalRevenue = parseFloat(revenueResult.rows[0].total);

        // Get active streams (events that are currently live)
        const activeStreamsResult = await pool.query(
            `SELECT COUNT(*) as count FROM events WHERE status = 'live'`
        );
        const activeStreams = parseInt(activeStreamsResult.rows[0].count);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalEvents,
                totalRevenue,
                activeStreams,
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
            WHERE p.status = 'completed'
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
            return res.status(400).json({
                success: false,
                message: 'Live stream already exists for this event',
                data: existingStream.rows[0],
            });
        }

        // Create stream in Mux
        const streamData = await muxService.createLiveStream();

        // Save to DB
        const result = await pool.query(
            `INSERT INTO live_streams (
                event_id, 
                mux_live_stream_id, 
                stream_key, 
                rtmp_url, 
                mux_playback_id
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                eventId,
                streamData.muxLiveStreamId,
                streamData.streamKey,
                streamData.rtmpUrl,
                streamData.playbackId,
            ]
        );

        // Update event with stream URL (optional, but good for automated playback)
        // If using standard HLS player
        let hlsUrl = `https://stream.mux.com/${streamData.playbackId}.m3u8`;

        // If this is a mock stream (due to free plan limits), use a valid public test stream (Big Buck Bunny)
        if (streamData.playbackId && streamData.playbackId.startsWith('mock_')) {
            hlsUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
        }

        await pool.query(
            'UPDATE events SET stream_key = $1 WHERE id = $2',
            [hlsUrl, eventId]
        );

        res.json({
            success: true,
            data: result.rows[0],
        });
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
            return res.json({
                success: true,
                data: null,
            });
        }

        // Optionally fetch up-to-date status from Mux
        const stream = result.rows[0];
        try {
            const muxStream = await muxService.getLiveStream(stream.mux_live_stream_id);
            stream.status = muxStream.status;

            // Sync Playback ID if needed (sometimes it's not available immediately on creation)
            const currentPlaybackId = muxStream.playback_ids?.[0]?.id;

            if (currentPlaybackId && currentPlaybackId !== stream.mux_playback_id) {
                console.log('Syncing Playback ID from Mux:', currentPlaybackId);

                await pool.query(
                    'UPDATE live_streams SET mux_playback_id = $1, status = $2 WHERE id = $3',
                    [currentPlaybackId, muxStream.status, stream.id]
                );

                // Update event stream key (URL) too
                const hlsUrl = `https://stream.mux.com/${currentPlaybackId}.m3u8`;
                await pool.query(
                    'UPDATE events SET stream_key = $1 WHERE id = $2',
                    [hlsUrl, eventId]
                );

                stream.mux_playback_id = currentPlaybackId;
            } else {
                // Update status in DB
                await pool.query(
                    'UPDATE live_streams SET status = $1 WHERE id = $2',
                    [muxStream.status, stream.id]
                );
            }
        } catch (error) {
            console.error('Failed to fetch Mux status', error);
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
            return res.status(404).json({
                success: false,
                message: 'Stream not found',
            });
        }

        const stream = result.rows[0];

        // Delete from Mux
        await muxService.deleteLiveStream(stream.mux_live_stream_id);

        // Delete from DB
        await pool.query('DELETE FROM live_streams WHERE id = $1', [stream.id]);

        res.json({
            success: true,
            message: 'Stream deleted successfully',
        });
    })
);
