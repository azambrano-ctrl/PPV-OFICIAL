import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findUserByEmail, createUser } from '../services/userService';

// Ensure environment variables are loaded
dotenv.config();

const router = Router();

// Only configure Google OAuth if credentials are provided
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isGoogleOAuthConfigured = !!(googleClientId && googleClientSecret);

if (isGoogleOAuthConfigured) {
    // Configure Google OAuth Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId!,
                clientSecret: googleClientSecret!,
                callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    // Check if user exists
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(new Error('No email found in Google profile'));
                    }

                    let user = await findUserByEmail(email);

                    // Create user if doesn't exist
                    if (!user) {
                        user = await createUser({
                            email,
                            password: Math.random().toString(36).slice(-8), // Random password for OAuth users
                            full_name: profile.displayName || email.split('@')[0],
                            phone: '',
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );
}

// Initiate Google OAuth
router.get('/google', (req: Request, res: Response, next) => {
    if (!isGoogleOAuthConfigured) {
        return res.status(503).json({
            success: false,
            message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment variables.',
        });
    }

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })(req, res, next);
});

// Google OAuth callback
router.get(
    '/google/callback',
    (req: Request, res: Response, next) => {
        if (!isGoogleOAuthConfigured) {
            return res.redirect(`${process.env.WEB_URL || 'http://localhost:3000'}/login?error=oauth_not_configured`);
        }

        passport.authenticate('google', {
            session: false,
            failureRedirect: `${process.env.WEB_URL || 'http://localhost:3000'}/login?error=google_auth_failed`
        })(req, res, next);
    },
    (req: Request, res: Response) => {
        try {
            const user = req.user as any;

            // Generate JWT tokens
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
            const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

            const accessToken = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { userId: user.id },
                JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            // Redirect to frontend with tokens
            const webUrl = process.env.WEB_URL || 'http://localhost:3000';
            const redirectUrl = `${webUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&user=${encodeURIComponent(JSON.stringify({
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }))}`;

            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            const webUrl = process.env.WEB_URL || 'http://localhost:3000';
            res.redirect(`${webUrl}/login?error=auth_failed`);
        }
    }
);

export default router;
