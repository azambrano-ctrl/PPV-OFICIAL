import { Router, Response, Request } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler';
import { validateParams } from '../middleware/validation';
import { authenticate, AuthRequest, generateStreamToken, verifyStreamToken, signBunnyUrl } from '../middleware/auth';
import { query } from '../config/database';
import { userHasAccessToEvent, getEventById } from '../services/eventService';

const router = Router();

const eventIdSchema = z.object({
    id: z.string().uuid('Invalid event ID'),
});

/**
 * GET /api/streaming/:id/token
 * Get stream token for authorized user
 */
router.get(
    '/:id/token',
    authenticate,
    validateParams(eventIdSchema),
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const eventId = authReq.params.id;
        const userId = authReq.user!.userId;

        // Check if event exists
        console.log(`[Streaming] Token request for event: ${eventId} by user: ${userId}`);

        let event;
        try {
            event = await getEventById(eventId);
        } catch (dbError: any) {
            console.error(`[Streaming Error] Failed to fetch event ${eventId}:`, dbError);
            res.status(500).json({
                success: false,
                message: 'Error retrieving event details',
                debug: process.env.NODE_ENV === 'development' ? dbError.message : undefined
            });
            return;
        }

        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found',
            });
            return;
        }

        // Check if user has access
        let hasAccess = false;
        try {
            if (req.user!.role === 'admin') {
                hasAccess = true;
            } else {
                hasAccess = await userHasAccessToEvent(userId, eventId);
            }
        } catch (accessError: any) {
            console.error(`[Streaming Error] Failed to check access for user ${userId} on event ${eventId}:`, accessError);
            res.status(500).json({
                success: false,
                message: 'Error verifying access rights',
                debug: process.env.NODE_ENV === 'development' ? accessError.message : undefined
            });
            return;
        }
        console.log(`[Streaming] User access check: ${hasAccess} (Role: ${req.user!.role})`);

        if (!hasAccess) {
            res.status(403).json({
                success: false,
                message: 'You do not have access to this event. Please purchase access first.',
            });
            return;
        }

        // Check if event is live or finished (for recordings), allow admins to preview
        if (req.user!.role !== 'admin' && event.status !== 'live' && event.status !== 'finished' && event.status !== 'reprise') {
            res.status(400).json({
                success: false,
                message: 'Event is not currently available for streaming',
            });
            return;
        }

        // Check for existing valid token
        const existingTokenResult = await query(
            `SELECT token, expires_at FROM stream_tokens
       WHERE user_id = $1 AND event_id = $2 AND is_revoked = FALSE
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
            [userId, eventId]
        );

        if (existingTokenResult.rows.length > 0) {
            const existingToken = existingTokenResult.rows[0];

            // Build URL - check if it's an absolute URL or a Mux Playback ID
            // PRIORITY: Check event.stream_url first (custom URL set by admin)
            let streamUrl: string;

            if (event.stream_url && event.stream_url.startsWith('http')) {
                streamUrl = event.stream_url;
            } else {
                const streamKey = event.stream_key || '';
                const isAbsoluteUrl = streamKey.startsWith('http');

                if (isAbsoluteUrl) {
                    streamUrl = streamKey;
                } else {
                    // No valid stream source
                    streamUrl = '';
                }
            }

            if (!streamUrl && (event.status === 'live' || event.status === 'reprise')) {
                res.status(400).json({
                    success: false,
                    message: 'La transmisión aún no está configurada o la URL es inválida.',
                });
                return;
            }

            // Detect if it's an MP4 stream (explicitly or by extension)
            const isMp4 = streamUrl.toLowerCase().includes('.mp4');

            // FORCE PROXY FOR INSECURE STREAMS (Mixed Content Fix)
            if (streamUrl.startsWith('http:')) {
                const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
                const host = req.get('host');
                streamUrl = `${protocol}://${host}/api/streaming/${eventId}/proxy?token=${existingToken.token}`;
                console.log('[Token Existente] Stream inseguro. Usando proxy:', streamUrl);
            } else if (streamUrl.includes('b-cdn.net') && process.env.BUNNY_SECURITY_KEY) {
                // Sign Bunny.net URL
                streamUrl = signBunnyUrl(streamUrl, process.env.BUNNY_SECURITY_KEY);
                console.log('[Token Existente] Stream de Bunny detectado. URL firmada.');
            } else if (streamUrl.includes('cloudflarestream.com')) {
                console.log('[Token Existente] Cloudflare detectado.');
            }

            // Verify if the token belongs to the CURRENT session
            try {
                const decoded = verifyStreamToken(existingToken.token);
                if (decoded.sessionId !== authReq.user!.sessionId) {
                    console.warn(`[Streaming] Valid token found but wrong session. Generating new one.`);
                    // Fallthrough to generate new token
                } else {
                    console.log(`[Stream Token] Event: ${event.title}, Stream URL: ${streamUrl}, isMp4: ${isMp4}`);

                    res.json({
                        success: true,
                        data: {
                            token: existingToken.token,
                            expiresAt: existingToken.expires_at,
                            streamUrl,
                            isMp4,
                        },
                    });
                    return;
                }
            } catch (tokenErr) {
                // Token verification failed or session mismatch, fall through to create new one
            }
        }

        // Generate new stream token linked to session
        const token = generateStreamToken(userId, eventId, authReq.user!.sessionId!);
        const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

        // Save token to database
        await query(
            `INSERT INTO stream_tokens (user_id, event_id, token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (token) DO NOTHING`,
            [userId, eventId, token, expiresAt]
        );

        const streamKey = event.stream_key || '';
        const isAbsoluteUrl = streamKey.startsWith('http');
        let streamUrl: string;

        if (event.stream_url && event.stream_url.startsWith('http')) {
            streamUrl = event.stream_url;
        } else if (isAbsoluteUrl) {
            streamUrl = streamKey;
        } else {
            // No valid stream source
            streamUrl = '';
        }

        if (!streamUrl && (event.status === 'live' || event.status === 'reprise')) {
            res.status(400).json({
                success: false,
                message: 'No hay una dirección de transmisión configurada para este evento.',
            });
            return;
        }

        // Detect if it's an MP4 stream (explicitly or by extension)
        const isMp4 = streamUrl.toLowerCase().includes('.mp4');

        // FORCE PROXY FOR INSECURE STREAMS (Mixed Content Fix)
        // If the stream URL is http:// (not https), we MUST proxy it through our backend
        if (streamUrl.startsWith('http:')) {
            // Render/Proxies use x-forwarded-proto. Default to https if undefined in production likely
            const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
            const host = req.get('host'); // domain.com

            streamUrl = `${protocol}://${host}/api/streaming/${eventId}/proxy?token=${token}`;
            console.log('Insecure stream detected. Wrapping in proxy:', streamUrl);
        } else if (streamUrl.includes('b-cdn.net') && process.env.BUNNY_SECURITY_KEY) {
            // Sign Bunny.net URL
            streamUrl = signBunnyUrl(streamUrl, process.env.BUNNY_SECURITY_KEY);
            console.log('Bunny stream detected. Signed URL:', streamUrl);
        } else if (streamUrl.includes('cloudflarestream.com')) {
            console.log('Cloudflare stream detected.');
        }

        console.log(`[New Stream Token] Event: ${event.title}, Stream URL: ${streamUrl}, isMp4: ${isMp4}`);

        res.json({
            success: true,
            data: {
                token,
                expiresAt,
                streamUrl,
                isMp4,
            },
        });
    })
);

/**
 * GET /api/streaming/:id/url
 * Get stream URL with embedded token
 */
router.get(
    '/:id/url',
    authenticate,
    validateParams(eventIdSchema),
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        const eventId = authReq.params.id;
        const userId = authReq.user!.userId;

        // Get event
        const event = await getEventById(eventId);

        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found',
            });
            return;
        }

        // Check access
        let hasAccess = false;
        if (req.user!.role === 'admin') {
            hasAccess = true;
        } else {
            hasAccess = await userHasAccessToEvent(userId, eventId);
        }

        if (!hasAccess) {
            res.status(403).json({
                success: false,
                message: 'Access denied',
            });
            return;
        }

        // Get or create token
        const tokenResult = await query(
            `SELECT token FROM stream_tokens
       WHERE user_id = $1 AND event_id = $2 AND is_revoked = FALSE
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
            [userId, eventId]
        );

        let token: string;

        if (tokenResult.rows.length > 0) {
            token = tokenResult.rows[0].token;
        } else {
            token = generateStreamToken(userId, eventId, authReq.user!.sessionId!);
            const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

            await query(
                `INSERT INTO stream_tokens (user_id, event_id, token, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (token) DO NOTHING`,
                [userId, eventId, token, expiresAt]
            );
        }

        // Build URL with token
        const streamKey = event.stream_key || '';
        const isAbsoluteUrl = streamKey.startsWith('http');
        let streamUrl: string;

        if (event.stream_url && event.stream_url.startsWith('http')) {
            streamUrl = event.stream_url;
        } else if (isAbsoluteUrl) {
            streamUrl = `${streamKey}${streamKey.includes('?') ? '&' : '?'}token=${token}`;
        } else {
            // No valid stream source
            streamUrl = '';
        }

        // Apply Bunny signing if applicable for URL endpoint too
        if (streamUrl.includes('b-cdn.net') && process.env.BUNNY_SECURITY_KEY) {
            streamUrl = signBunnyUrl(streamUrl, process.env.BUNNY_SECURITY_KEY);
        } else if (streamUrl && !streamUrl.includes('token=')) {
            // Legacy/Generic token attachment
            streamUrl = `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}token=${token}`;
        }

        res.json({
            success: true,
            data: { streamUrl },
        });
    })
);

/**
 * POST /api/streaming/:id/revoke
 * Revoke user's stream tokens (admin only)
 */
router.post(
    '/:id/revoke',
    authenticate,
    validateParams(eventIdSchema),
    asyncHandler(async (req: any, res: Response) => {
        const authReq = req as AuthRequest;
        if (authReq.user!.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
            return;
        }

        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
            return;
        }

        await query(
            `UPDATE stream_tokens
       SET is_revoked = TRUE
       WHERE user_id = $1 AND event_id = $2`,
            [userId, req.params.id]
        );

        res.json({
            success: true,
            message: 'Stream tokens revoked successfully',
        });
    })
);

/**
 * GET /api/streaming/:id/proxy
 * Proxy external streams to bypass CORS restrictions
 */
router.get(
    '/:id/proxy',
    asyncHandler(async (req: Request, res: Response) => {
        const eventId = req.params.id;
        const token = req.query.token as string;

        console.log(`[Streaming Proxy] Attempt for event: ${eventId} with token: ${token ? 'present' : 'missing'}`);

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Stream token required',
            });
            return;
        }

        // Verify stream token
        try {
            const decoded = verifyStreamToken(token);
            if (decoded.eventId !== eventId) {
                res.status(403).json({
                    success: false,
                    message: 'Invalid token for this event',
                });
                return;
            }

            // Verify session in proxy too
            const userRes = await query('SELECT current_session_id FROM users WHERE id = $1', [decoded.userId]);
            if (userRes.rows.length === 0 || userRes.rows[0].current_session_id !== decoded.sessionId) {
                res.status(401).json({
                    success: false,
                    message: 'Sesión expirada o iniciada en otro dispositivo',
                });
                return;
            }
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired stream token',
            });
            return;
        }

        // Get event and external stream URL
        const event = await getEventById(eventId);
        if (!event || !event.stream_key) {
            res.status(404).json({
                success: false,
                message: 'Stream not found',
            });
            return;
        }

        // Only proxy external URLs
        // PRIORITY: Check event.stream_url first (custom URL set by admin)
        let streamTargetUrl = '';

        if (event.stream_url && event.stream_url.startsWith('http')) {
            streamTargetUrl = event.stream_url;
        } else {
            const streamKey = event.stream_key || '';
            if (streamKey.startsWith('http')) {
                streamTargetUrl = streamKey;
            }
        }

        if (!streamTargetUrl) {
            res.status(400).json({
                success: false,
                message: 'This endpoint only proxies external streams',
            });
            return;
        }

        try {
            // Forward Range header if present (crucial for seeking)
            const headers: any = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            };

            if (req.headers.range) {
                headers['Range'] = req.headers.range;
            }

            // Fetch the external stream
            const response = await axios.get(streamTargetUrl, {
                responseType: 'stream',
                headers,
                validateStatus: (status) => status >= 200 && status < 300 || status === 206 // Accept 206 Partial Content
            });

            // Set CORS headers to allow frontend and Chromecast access
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, X-Requested-With');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');

            // Handle preflight OPTIONS request
            if (req.method === 'OPTIONS') {
                res.status(200).end();
                return;
            }

            // Set content type from upstream response
            const contentType = response.headers['content-type'] || 'application/vnd.apple.mpegurl';
            res.setHeader('Content-Type', contentType);

            // Handle range requests for video seeking
            if (response.headers['content-range']) {
                res.setHeader('Content-Range', response.headers['content-range']);
            }
            if (response.headers['content-length']) {
                res.setHeader('Content-Length', response.headers['content-length']);
            }
            if (response.headers['accept-ranges']) {
                res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
            }

            // Set appropriate status code
            res.status(response.status);

            // Pipe the stream to the response
            response.data.pipe(res);
        } catch (error: any) {
            console.error('[Streaming Proxy] Error:', error.message);
            if (error.response) {
                console.error('[Streaming Proxy] Upstream returned status:', error.response.status);
                // Si el origen falla (ej. 404), devolvemos 502 (Bad Gateway) en lugar de 500 (Internal Error)
                res.status(502).json({
                    success: false,
                    message: `Stream provider returned ${error.response.status}`,
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch external stream (Network Error)',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    })
);

/**
 * GET /api/streaming/validate-hls-token
 * Internal endpoint called by nginx auth_request.
 * Returns 200 if the ?token query param is a valid stream JWT, 403 otherwise.
 * This endpoint must NOT require authenticate middleware (nginx calls it without cookies).
 */
router.get(
    '/validate-hls-token',
    asyncHandler(async (req: Request, res: Response) => {
        const token = req.query.token as string | undefined;
        if (!token) {
            res.status(403).json({ success: false, message: 'Missing token' });
            return;
        }
        try {
            verifyStreamToken(token);
            res.status(200).json({ success: true });
        } catch (_) {
            res.status(403).json({ success: false, message: 'Invalid or expired stream token' });
        }
    })
);

export default router;
