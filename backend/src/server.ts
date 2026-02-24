import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import paymentRoutes from './routes/payments';
import streamingRoutes from './routes/streaming';
import oauthRoutes from './routes/oauth';
import adminRoutes from './routes/admin';
import settingsRoutes from './routes/settings';
import cleanupRoutes from './routes/cleanup';
import newsletterRoutes from './routes/newsletter';
import promoterRoutes from './routes/promoters';
import publicStatsRoutes from './routes/public-stats';
import notificationRoutes from './routes/notifications';
import newsRoutes from './routes/newsRoutes';
import { query } from './config/database';
import { verifyAccessToken } from './middleware/auth';
import { userHasAccessToEvent } from './services/eventService';
import { startBackgroundService } from './services/backgroundService';

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit, but log it properly
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // For uncaught exceptions, we should probably exit after a brief delay
    // but in some cases keeping it up might be better if it's transient
    // process.exit(1); 
});

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup for real-time chat
const allowedOrigins = [
    process.env.WEB_URL,
    'http://localhost:3000',
    'http://localhost:5173',
].filter(Boolean) as string[];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : true,
        credentials: true,
    },
});

// Inject io into global for services to use
(global as any).io = io;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:", "*"],
            mediaSrc: ["'self'", "blob:", "*"],
            connectSrc: ["'self'", "*"],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Manual CORS to fix persistent issues - restricted to allowedOrigins
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin && process.env.NODE_ENV !== 'production') {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Increased to 1000 for admin usage
    message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Strict rate limiting for auth routes (Brute force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: 'Demasiados intentos desde esta IP, por favor intenta de nuevo en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Body parsing middleware
// Note: For Stripe webhooks, we need raw body
app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
import path from 'path';
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Initialize Passport
app.set('trust proxy', 1);
app.use(passport.initialize());

// Request/Response logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    });
    next();
});

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes); // Google OAuth routes
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/streaming', streamingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cleanup', cleanupRoutes); // Temporary cleanup route
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/promoters', promoterRoutes);
app.use('/api/public-stats', publicStatsRoutes);

// Socket.io authentication middleware
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = verifyAccessToken(token);

        // Session Control for Chat
        const userResult = await query('SELECT current_session_id FROM users WHERE id = $1', [decoded.userId]);
        const user = userResult.rows[0];

        if (!user || user.current_session_id !== decoded.sessionId) {
            return next(new Error('SESSION_CONFLICT'));
        }

        socket.data.user = decoded;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

import { moderateUser, checkChatStatus, removeModeration } from './services/promoterService';
import * as notificationService from './services/notificationService';

// Socket.io connection handling
io.on('connection', (socket) => {
    logger.info('User connected to socket', {
        userId: socket.data.user.userId,
        socketId: socket.id,
    });

    const broadcastViewers = (eventId: string) => {
        const roomName = `event_${eventId}`;
        const count = io.sockets.adapter.rooms.get(roomName)?.size || 0;
        io.to(roomName).emit('viewers_count', { count });
    };

    // Each user joins their own notification room
    const userId = socket.data.user.userId;
    socket.join(`user_notifications_${userId}`);

    // Join event room
    socket.on('join_event', async (eventId: string) => {
        try {
            logger.info('[CHAT] Join attempt', { userId: socket.data.user.userId, eventId });

            const userId = socket.data.user.userId;

            // Check if user is banned
            const { isBanned } = await checkChatStatus(eventId, userId);
            if (isBanned) {
                logger.warn('[CHAT] Banned user tried to join', { userId, eventId });
                socket.emit('error', { message: 'Has sido baneado de este chat' });
                return;
            }

            // Check if user is admin or has purchased the event
            const isAdmin = socket.data.user.role === 'admin';

            if (!isAdmin) {
                // Verify user has access to event (purchased or free)
                const hasAccess = await userHasAccessToEvent(
                    userId,
                    eventId
                );

                if (!hasAccess) {
                    logger.warn('[CHAT] Access denied', { userId, eventId });
                    socket.emit('error', { message: 'Access denied to this event chat' });
                    return;
                }
            }

            const roomName = `event_${eventId}`;
            socket.join(roomName);
            logger.info('[CHAT] User joined room', {
                userId,
                room: roomName,
                isAdmin,
            });

            socket.emit('joined_event', { eventId });

            // Broadcast updated viewers count
            socket.data.currentEventId = eventId;
            broadcastViewers(eventId);
        } catch (error) {
            logger.error('[CHAT] Error in join_event:', error);
            socket.emit('error', { message: 'Failed to join event' });
        }
    });

    // Send chat message
    socket.on('send_message', async (data: { eventId: string; message: string }) => {
        try {
            const { eventId, message } = data;
            const userId = socket.data.user.userId;

            logger.info('[CHAT] New message attempt', { userId, eventId });

            if (!message || message.trim().length === 0) {
                return;
            }

            // Check moderation status
            const { isBanned, isMuted } = await checkChatStatus(eventId, userId);
            if (isBanned || isMuted) {
                socket.emit('error', {
                    message: isBanned ? 'Has sido baneado' : 'Has sido silenciado temporalmente'
                });
                return;
            }

            // Verify if user is in the room
            const roomName = `event_${eventId}`;
            if (!socket.rooms.has(roomName)) {
                // ... same re-join logic ...
                const hasAccess = socket.data.user.role === 'admin' || await userHasAccessToEvent(userId, eventId);
                if (hasAccess) {
                    socket.join(roomName);
                } else {
                    socket.emit('error', { message: 'Not authorized for this chat' });
                    return;
                }
            }

            // Save message to database
            const result = await query(
                `INSERT INTO chat_messages (event_id, user_id, message)
         VALUES ($1, $2, $3)
         RETURNING id, event_id, user_id, message, created_at, is_deleted`,
                [eventId, userId, message.trim()]
            );

            const chatMessage = result.rows[0];

            // Get user info
            const userResult = await query(
                'SELECT full_name, role FROM users WHERE id = $1',
                [userId]
            );

            const user = userResult.rows[0];

            const messageData = {
                ...chatMessage,
                user_name: user?.full_name || 'Anonymous',
                role: user?.role || 'user'
            };

            // Broadcast to event room
            io.to(roomName).emit('new_message', messageData);

        } catch (error) {
            logger.error('[CHAT] Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Delete chat message (Admin only)
    socket.on('delete_message', async (data: { eventId: string; messageId: string }) => {
        try {
            const { eventId, messageId } = data;

            if (socket.data.user.role !== 'admin') {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            await query(
                'UPDATE chat_messages SET is_deleted = true WHERE id = $1 AND event_id = $2',
                [messageId, eventId]
            );

            io.to(`event_${eventId}`).emit('message_deleted', { messageId });
        } catch (error) {
            logger.error('Error deleting message:', error);
            socket.emit('error', { message: 'Failed to delete message' });
        }
    });

    // Ban user (Admin only)
    socket.on('ban_user', async (data: { eventId: string; userId: string; userName: string }) => {
        try {
            const { eventId, userId, userName } = data;

            if (socket.data.user.role !== 'admin') {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Persist ban
            await moderateUser(eventId, userId, 'ban');

            io.to(`event_${eventId}`).emit('user_banned', { userId, userName });

            // Force disconnect the banned user from the room
            const roomName = `event_${eventId}`;
            const sockets = await io.in(roomName).fetchSockets();
            for (const s of sockets) {
                if (s.data.user?.userId === userId) {
                    s.leave(roomName);
                    s.emit('error', { message: 'Has sido expulsado del chat' });
                }
            }

            logger.info('User banned from chat by admin', {
                adminId: socket.data.user.userId,
                bannedUserId: userId,
                eventId,
            });
        } catch (error) {
            logger.error('Error banning user:', error);
            socket.emit('error', { message: 'Failed to ban user' });
        }
    });

    // Mute user (Admin only)
    socket.on('mute_user', async (data: { eventId: string; userId: string; userName: string }) => {
        try {
            const { eventId, userId, userName } = data;

            if (socket.data.user.role !== 'admin') {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Persist mute
            await moderateUser(eventId, userId, 'mute');

            io.to(`event_${eventId}`).emit('user_muted', { userId, userName });

            logger.info('User muted in chat by admin', {
                adminId: socket.data.user.userId,
                mutedUserId: userId,
                eventId,
            });
        } catch (error) {
            logger.error('Error muting user:', error);
            socket.emit('error', { message: 'Failed to mute user' });
        }
    });

    // Unmute/Unban (Admin only)
    socket.on('unmoderate_user', async (data: { eventId: string; userId: string; type: 'ban' | 'mute' }) => {
        try {
            const { eventId, userId, type } = data;

            if (socket.data.user.role !== 'admin') {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            await removeModeration(eventId, userId, type);

            io.to(`event_${eventId}`).emit('user_unmoderated', { userId, type });
        } catch (error) {
            logger.error('Error unmoderating user:', error);
        }
    });

    // Send animated reaction
    socket.on('send_reaction', (data: { eventId: string; emoji: string }) => {
        try {
            const { eventId, emoji } = data;
            if (!emoji) return;

            const roomName = `event_${eventId}`;
            // Broadcast the reaction to everyone in the room (including sender)
            io.to(roomName).emit('new_reaction', {
                emoji,
                userId: socket.data.user.userId,
                timestamp: new Date()
            });

            logger.info('[CHAT] Reaction broadcasted', {
                userId: socket.data.user.userId,
                eventId,
                emoji
            });
        } catch (error) {
            logger.error('[CHAT] Error sending reaction:', error);
        }
    });

    // Leave event room
    socket.on('leave_event', (eventId: string) => {
        socket.leave(`event_${eventId}`);
        if (socket.data.currentEventId === eventId) {
            delete socket.data.currentEventId;
        }
        broadcastViewers(eventId);
        logger.info('User left event room', {
            userId: socket.data.user.userId,
            eventId,
        });
    });

    // Disconnecting (before leaving rooms)
    socket.on('disconnecting', () => {
        if (socket.data.currentEventId) {
            const eventId = socket.data.currentEventId;
            // Delay broadcast slightly so the socket has actually left the room
            setTimeout(() => broadcastViewers(eventId), 50);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        logger.info('User disconnected from chat', {
            userId: socket.data.user.userId,
            socketId: socket.id,
        });
    });
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
/**
 * Event Reminder Cron / Interval
 * Checks every 60 seconds for events starting in the next 10 minutes
 */
const startReminderCron = () => {
    logger.info('⏰ Starting event reminder cron...');

    // Set to store notified event-user pairs for current session to avoid duplicates
    const notifiedPairs = new Set<string>();

    setInterval(async () => {
        try {
            // Find events starting in the next 10 minutes that haven't started yet
            const sql = `
                SELECT e.id, e.title, e.event_date, p.user_id
                FROM events e
                JOIN purchases p ON e.id = p.event_id
                WHERE e.event_date > NOW() 
                AND e.event_date <= NOW() + INTERVAL '10 minutes'
                AND p.payment_status = 'completed'
                AND e.status = 'upcoming'
            `;
            const result = await query(sql);

            for (const row of result.rows) {
                const key = `${row.id}-${row.user_id}`;
                if (!notifiedPairs.has(key)) {
                    const timeUntil = Math.round((new Date(row.event_date).getTime() - Date.now()) / 60000);

                    await notificationService.createNotification(
                        row.user_id,
                        '¡Evento por comenzar!',
                        `"${row.title}" comienza en ${timeUntil} minutos. ¡No te lo pierdas!`,
                        'event_reminder',
                        `/watch/${row.id}`
                    );

                    notifiedPairs.add(key);
                    logger.info(`Notification sent for event ${row.id} to user ${row.user_id}`);
                }
            }
        } catch (error) {
            logger.error('Error in reminder cron:', error);
        }
    }, 60000);
};

startReminderCron();
startBackgroundService();

const PORT = process.env.PORT || 5000;

import { repairSchema } from './scripts/repairSchema';

// Run repair then listen
repairSchema().then(() => {
    httpServer.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
        logger.info(`🛡️ Allowed Origins: ${allowedOrigins.join(', ')}`);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

export { app, httpServer, io };
