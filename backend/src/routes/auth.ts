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
    updatePushToken,
    createEmailVerificationToken,
    verifyEmailToken,
} from '../services/userService';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/emailService';
import {
    authenticate,
    AuthRequest,
    verifyRefreshToken,
    generateAccessToken,
    generateRefreshToken,
    setAuthCookies,
    clearAuthCookies,
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
        const newUser = await createUser({ email, password, full_name, phone });

        // Generate verification token and send email
        try {
            const token = await createEmailVerificationToken(newUser.id);
            await sendVerificationEmail(email, full_name, token);
        } catch (error) {
            console.error('Error sending verification email during registration:', error);
            // We don't fail the registration if the email fails to send, 
            // they can request it again later.
        }

        // Login automatically
        const loginResponse = await loginUser(email, password);

        // Set secure cookies
        setAuthCookies(res, loginResponse.accessToken, loginResponse.refreshToken);

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

            // Set secure cookies
            setAuthCookies(res, loginResponse.accessToken, loginResponse.refreshToken);

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
 * POST /api/auth/logout
 * Logout user
 */
router.post(
    '/logout',
    asyncHandler(async (_req: Request, res: Response) => {
        clearAuthCookies(res);
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    })
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
    '/refresh',
    asyncHandler(async (req: Request, res: Response) => {
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

        if (!refreshToken) {
            res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
            return;
        }

        try {
            const decoded = verifyRefreshToken(refreshToken);

            // Session Control Check: Strictly require sessionId for refresh
            if (!decoded.sessionId) {
                res.status(401).json({
                    success: false,
                    message: 'Session session mismatch, please login again',
                });
                return;
            }

            const user = await findUserById(decoded.userId);
            if (!user || user.current_session_id !== decoded.sessionId) {
                res.status(401).json({
                    success: false,
                    message: 'Session expired',
                });
                return;
            }

            // Extract only the necessary data to avoid injecting old 'iat' and 'exp' into the new token
            // which causes jsonwebtoken to throw an error silently caught as 401
            const newPayload = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                promoterId: decoded.promoterId,
                sessionId: decoded.sessionId
            };

            // Generate new tokens
            const newAccessToken = generateAccessToken(newPayload);
            const newRefreshToken = generateRefreshToken(newPayload);

            // Set secure cookies
            setAuthCookies(res, newAccessToken, newRefreshToken);

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
 * GET /api/auth/verify-email
 * Verify email with token
 */
router.post(
    '/verify-email',
    asyncHandler(async (req: Request, res: Response) => {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({ success: false, message: 'Token is required' });
            return;
        }

        try {
            await verifyEmailToken(token);
            res.json({
                success: true,
                message: 'Email verified successfully',
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
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post(
    '/resend-verification',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const user = await findUserById(req.user!.userId);

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (user.is_verified) {
            res.status(400).json({ success: false, message: 'Email is already verified' });
            return;
        }

        try {
            const token = await createEmailVerificationToken(user.id);
            await sendVerificationEmail(user.email, user.full_name, token);

            res.json({
                success: true,
                message: 'Verification email sent successfully',
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to send verification email',
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

        if (!['user', 'admin', 'promoter'].includes(role)) {
            res.status(400).json({
                success: false,
                error: 'Invalid role. Must be "user", "admin", or "promoter".',
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

/**
 * DELETE /api/auth/users/:userId
 * Delete a user (Admin only)
 */
router.delete(
    '/users/:userId',
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

        // 1. Check if user has purchases
        const purchasesCheck = await pool.query(
            'SELECT COUNT(*) as count FROM purchases WHERE user_id = $1',
            [userId]
        );

        if (parseInt(purchasesCheck.rows[0].count) > 0) {
            res.status(400).json({
                success: false,
                message: 'No se puede eliminar el usuario porque tiene compras registradas. Esto podría afectar los registros financieros y el acceso del cliente.',
            });
            return;
        }

        // 2. Prevent self-deletion
        if (userId === req.user!.userId) {
            res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta de administrador.',
            });
            return;
        }

        // 3. Delete the user
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, email',
            [userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.',
            });
            return;
        }

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente.',
            data: result.rows[0],
        });
    })
);

/**
 * POST /api/auth/push-token
 * Update user's push notification token
 */
router.post(
    '/push-token',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { token } = req.body;

        await updatePushToken(req.user!.userId, token);

        res.json({
            success: true,
            message: 'Push token updated successfully',
        });
    })
);

/**
 * GET /api/auth/session
 * Exchange HttpOnly cookie for access/refresh tokens (used after OAuth redirect)
 * The tokens are read from the HttpOnly cookie set during OAuth flow
 */
router.get(
    '/session',
    asyncHandler(async (req: Request, res: Response) => {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        if (!accessToken || !refreshToken) {
            res.status(401).json({ success: false, message: 'No active session' });
            return;
        }

        try {
            const { verifyAccessToken } = require('../middleware/auth');
            const decoded = verifyAccessToken(accessToken);
            const user = await findUserById(decoded.userId);
            if (!user) {
                res.status(401).json({ success: false, message: 'User not found' });
                return;
            }
            const { password_hash, ...safeUser } = user;
            res.json({ success: true, data: { accessToken, refreshToken, user: safeUser } });
        } catch (_) {
            res.status(401).json({ success: false, message: 'Invalid session' });
        }
    })
);

export default router;
