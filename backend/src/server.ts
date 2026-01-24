import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
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
import { query } from './config/database';
import { verifyAccessToken } from './middleware/auth';

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
            connectSrc: ["'self'", "*"], // Allow connections to everywhere (for API/Socket)
        }
    }
}));
app.use(cors({
    origin: true, // Reflects the request origin, effectively allowing all
    credentials: true,
}));

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
app.use(passport.initialize());

// Request logging
app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
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
            // Check if user is admin or has purchased the event
            const isAdmin = socket.data.user.role === 'admin';

            if (!isAdmin) {
                // Verify user has access to event
                const result = await query(
                    `SELECT COUNT(*) as count FROM purchases
         WHERE user_id = $1 AND event_id = $2 AND payment_status = 'completed'`,
                    [socket.data.user.userId, eventId]
                );

                if (parseInt(result.rows[0].count) === 0) {
                    socket.emit('error', { message: 'Access denied to this event' });
                    return;
                }
            }

            socket.join(`event_${eventId}`);
            logger.info('User joined event room', {
                userId: socket.data.user.userId,
                eventId,
                isAdmin,
            });

            socket.emit('joined_event', { eventId });
        } catch (error) {
            logger.error('Error joining event:', error);
            socket.emit('error', { message: 'Failed to join event' });
        }
    });

    // Send chat message
    socket.on('send_message', async (data: { eventId: string; message: string }) => {
        try {
            const { eventId, message } = data;

            if (!message || message.trim().length === 0) {
                return;
            }

            // Save message to database
            const result = await query(
                `INSERT INTO chat_messages (event_id, user_id, message)
         VALUES ($1, $2, $3)
         RETURNING id, event_id, user_id, message, created_at`,
                [eventId, socket.data.user.userId, message.trim()]
            );

            const chatMessage = result.rows[0];

            // Get user info
            const userResult = await query(
                'SELECT full_name FROM users WHERE id = $1',
                [socket.data.user.userId]
            );

            const messageData = {
                ...chatMessage,
                user_name: userResult.rows[0]?.full_name || 'Anonymous',
            };

            // Broadcast to event room
            io.to(`event_${eventId}`).emit('new_message', messageData);

            logger.info('Chat message sent', {
                userId: socket.data.user.userId,
                eventId,
            });
        } catch (error) {
            logger.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
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

httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);
    logger.info(`🛡️ Allowed Origins: ${allowedOrigins.join(', ')}`);
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
