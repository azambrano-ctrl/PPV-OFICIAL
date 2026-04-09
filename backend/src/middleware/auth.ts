const jwt = require('jsonwebtoken');
const crypto = require('crypto');
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

import { query } from '../config/database';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    promoterId?: string;
    sessionId?: string;
}

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

/**
 * Helper to set HttpOnly cookies for authentication
 */
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 3600000, // 1h
        path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600000, // 7d
        path: '/',
    });
};

/**
 * Helper to clear authentication cookies
 */
export const clearAuthCookies = (res: Response) => {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
};

// Validate required environment variables — fail fast if not set
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/**
 * Generate access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
    return jwt.sign({ ...payload }, JWT_SECRET, {
        expiresIn: '1h',
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
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'No token provided',
        });
        return;
    }

    try {
        const decoded = verifyAccessToken(token);

        if (!decoded.sessionId) {
            res.status(401).json({
                success: false,
                message: 'Sesión inválida. Por favor, re-inicia sesión.',
                code: 'SESSION_INVALID'
            });
            return;
        }

        const userResult = await query('SELECT current_session_id FROM users WHERE id = $1', [decoded.userId]);
        const user = userResult.rows[0];

        if (!user || user.current_session_id !== decoded.sessionId) {
            res.status(401).json({
                success: false,
                message: 'Tu sesión ha expirado o se ha iniciado en otro dispositivo.',
                code: 'SESSION_CONFLICT'
            });
            return;
        }

        (req as any).user = decoded;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Token inválido o expirado',
        });
    }
};
