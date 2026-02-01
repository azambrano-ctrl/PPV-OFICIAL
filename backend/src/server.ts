import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
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
import { query } from './config/database';
import { verifyAccessToken } from './middleware/auth';
import { userHasAccessToEvent } from './services/eventService';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup for real-time chat
// Socket.io setup for real-time chat
const allowedOrigins = [
    process.env.WEB_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    '*' // Fallback for debugging, though specific origins are better
];

const io = new Server(httpServer, {
    cors: {
        origin: true, // Allow any origin
        credentials: true,
    },
});

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
    }
}));

// Manual CORS to fix persistent issues
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
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

// Body parsing middleware
// Note: For Stripe webhooks, we need raw body
app.use('/api/payments/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
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
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes); // Google OAuth routes
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/streaming', streamingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cleanup', cleanupRoutes); // Temporary cleanup route
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/promoters', promoterRoutes);
app.use('/api/public-stats', publicStatsRoutes);

// Socket.io authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = verifyAccessToken(token);
        socket.data.user = decoded;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    logger.info('User connected to chat', {
        userId: socket.data.user.userId,
        socketId: socket.id,
    });

    // Join event room
    socket.on('join_event', async (eventId: string) => {
        try {
            logger.info('[CHAT] Join attempt', { userId: socket.data.user.userId, eventId });

            // Check if user is admin or has purchased the event
            const isAdmin = socket.data.user.role === 'admin';

            if (!isAdmin) {
                // Verify user has access to event (purchased or free)
                const hasAccess = await userHasAccessToEvent(
                    socket.data.user.userId,
                    eventId
                );

                if (!hasAccess) {
                    logger.warn('[CHAT] Access denied', { userId: socket.data.user.userId, eventId });
                    socket.emit('error', { message: 'Access denied to this event chat' });
                    return;
                }
            }

            const roomName = `event_${eventId}`;
            socket.join(roomName);
            logger.info('[CHAT] User joined room', {
                userId: socket.data.user.userId,
                room: roomName,
                isAdmin,
            });

            socket.emit('joined_event', { eventId });
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

            // Verify if user is in the room (optional check for security)
            const roomName = `event_${eventId}`;
            if (!socket.rooms.has(roomName)) {
                logger.warn('[CHAT] User not in room but trying to send message', { userId, roomName });
                // Re-join them if they have access
                const hasAccess = socket.data.user.role === 'admin' || await userHasAccessToEvent(userId, eventId);
                if (hasAccess) {
                    socket.join(roomName);
                    logger.info('[CHAT] Auto-rejoined user to room', { userId, roomName });
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

            // Get user info and check if banned
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

            logger.info('[CHAT] Message broadcasted', {
                userId,
                eventId,
                room: roomName
            });
        } catch (error) {
            logger.error('[CHAT] Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Delete chat message (Admin only)
    socket.on('delete_message', async (data: { eventId: string; messageId: string }) => {
        try {
            const { eventId, messageId } = data;

            // Check if user is admin
            if (socket.data.user.role !== 'admin') {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // Update message in database
            await query(
                'UPDATE chat_messages SET is_deleted = true WHERE id = $1 AND event_id = $2',
                [messageId, eventId]
            );

            // Broadcast to event room
            io.to(`event_${eventId}`).emit('message_deleted', { messageId });

            logger.info('Chat message deleted by admin', {
                adminId: socket.data.user.userId,
                messageId,
                eventId,
            });
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

            // In a real app, you'd save this to a 'chat_bans' table
            // For now, we'll broadcast the ban to sync all clients
            io.to(`event_${eventId}`).emit('user_banned', { userId, userName });

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
        logger.info('User left event room', {
            userId: socket.data.user.userId,
            eventId,
        });
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
