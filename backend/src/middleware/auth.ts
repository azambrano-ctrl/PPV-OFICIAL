import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

// Validate required environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';

/**
 * Generate access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
    return jwt.sign({ ...payload }, JWT_SECRET, {
        expiresIn: '15m',
    }) as string;
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
    return jwt.sign({ ...payload }, JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    }) as string;
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Middleware to authenticate requests
 */
export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No token provided',
            });
            return;
        }

        const token = authHeader.substring(7);
        const decoded = verifyAccessToken(token);

        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Admin access required',
        });
        return;
    }

    next();
};

/**
 * Generate stream token for video access
 */
export const generateStreamToken = (
    userId: string,
    eventId: string
): string => {
    return jwt.sign(
        { userId, eventId, type: 'stream' },
        JWT_SECRET,
        { expiresIn: '3h' }
    ) as string;
};

/**
 * Verify stream token
 */
export const verifyStreamToken = (token: string): { userId: string; eventId: string } => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.type !== 'stream') {
            throw new Error('Invalid token type');
        }
        return { userId: decoded.userId, eventId: decoded.eventId };
    } catch (error) {
        throw new Error('Invalid or expired stream token');
    }
};
