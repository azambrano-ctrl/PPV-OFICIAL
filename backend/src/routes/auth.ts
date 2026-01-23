import { Router, Request, Response } from 'express';
import { z } from 'zod';
import pool from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validation';
import {
    createUser,
    loginUser,
    findUserByEmail,
    findUserById,
    updateUserProfile,
    changePassword,
    getUserPurchases,
    createPasswordResetToken,
    resetPassword,
} from '../services/userService';
import { sendPasswordResetEmail } from '../services/emailService';
import {
    authenticate,
    AuthRequest,
    verifyRefreshToken,
    generateAccessToken,
    generateRefreshToken,
} from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    full_name: z.string().min(2, 'Full name is required'),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
    full_name: z.string().min(2).optional(),
    phone: z.string().optional(),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
    '/register',
    validateBody(registerSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { email, password, full_name, phone } = req.body;

        // Check if user already exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'Email already registered',
            });
            return;
        }

        // Create user
        await createUser({ email, password, full_name, phone });

        // Login automatically
        const loginResponse = await loginUser(email, password);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: loginResponse,
        });
    })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
    '/login',
    validateBody(loginSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        try {
            const loginResponse = await loginUser(email, password);

            res.json({
                success: true,
                message: 'Login successful',
                data: loginResponse,
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                message: error.message || 'Invalid credentials',
            });
        }
    })
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
    '/refresh',
    asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
            return;
        }

        try {
            const decoded = verifyRefreshToken(refreshToken);

            // Generate new tokens
            const newAccessToken = generateAccessToken(decoded);
            const newRefreshToken = generateRefreshToken(decoded);

            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                },
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
            });
        }
    })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const user = await findUserById(req.user!.userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: userWithoutPassword,
        });
    })
);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
    '/profile',
    authenticate,
    validateBody(updateProfileSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const updates = req.body;

        const updatedUser = await updateUserProfile(req.user!.userId, updates);

        const { password_hash, ...userWithoutPassword } = updatedUser;

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: userWithoutPassword,
        });
    })
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
    '/change-password',
    authenticate,
    validateBody(changePasswordSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { currentPassword, newPassword } = req.body;

        try {
            await changePassword(req.user!.userId, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    })
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
    '/forgot-password',
    validateBody(forgotPasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;

        try {
            const token = await createPasswordResetToken(email);
            await sendPasswordResetEmail(email, token);

            res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        } catch (error: any) {
            // Always return success to prevent email enumeration
            if (error.message === 'User not found') {
                res.json({
                    success: true,
                    message: 'If an account exists with this email, a password reset link has been sent.',
                });
                return;
            }
            throw error;
        }
    })
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
    '/reset-password',
    validateBody(resetPasswordSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { token, password } = req.body;

        try {
            await resetPassword(token, password);

            res.json({
                success: true,
                message: 'Password has been reset successfully',
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Invalid or expired token',
            });
        }
    })
);

/**
 * GET /api/auth/purchases
 * Get user's purchase history
 */
router.get(
    '/purchases',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const purchases = await getUserPurchases(req.user!.userId);

        res.json({
            success: true,
            data: purchases,
        });
    })
);

/**
 * GET /api/auth/users
 * Get all users (Admin only)
 */
router.get(
    '/users',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Check if user is admin
        if (req.user!.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Access denied. Admin only.',
            });
            return;
        }

        const result = await pool.query(
            `SELECT id, email, full_name, phone, role, created_at 
             FROM users 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows,
        });
    })
);

/**
 * PUT /api/auth/users/:userId/role
 * Update user role (Admin only)
 */
router.put(
    '/users/:userId/role',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Check if user is admin
        if (req.user!.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Access denied. Admin only.',
            });
            return;
        }

        const { userId } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            res.status(400).json({
                success: false,
                error: 'Invalid role. Must be "user" or "admin".',
            });
            return;
        }

        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
            [role, userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    })
);

export default router;
