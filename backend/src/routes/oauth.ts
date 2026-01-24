import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
const jwt = require('jsonwebtoken');
import dotenv from 'dotenv';
import { findUserByEmail, createUser } from '../services/userService';

// Ensure environment variables are loaded
dotenv.config();

const router = Router();

// Only configure Google OAuth if credentials are provided
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isGoogleOAuthConfigured = !!(googleClientId && googleClientSecret);

// Only configure Facebook OAuth if credentials are provided
const facebookAppId = process.env.FACEBOOK_APP_ID;
const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
const isFacebookOAuthConfigured = !!(facebookAppId && facebookAppSecret);

// Helper to get base URLs with debug logging
const getApiUrl = () => {
    const url = process.env.API_URL;
    if (!url) console.warn('⚠️ API_URL no está configurada en variables de entorno');
    return url || '';
};
const getWebUrl = () => {
    const url = process.env.WEB_URL;
    if (!url) console.warn('⚠️ WEB_URL no está configurada en variables de entorno');
    return url || '';
};

// ... Google Strategy (existing code) ...
if (isGoogleOAuthConfigured) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId!,
                clientSecret: googleClientSecret!,
                callbackURL: `${getApiUrl()}/api/auth/google/callback`,
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) return done(new Error('No email found in Google profile'));

                    let user = await findUserByEmail(email);
                    if (!user) {
                        user = await createUser({
                            email,
                            password: Math.random().toString(36).slice(-8),
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

if (isFacebookOAuthConfigured) {
    passport.use(
        new FacebookStrategy(
            {
                clientID: facebookAppId!,
                clientSecret: facebookAppSecret!,
                callbackURL: `${getApiUrl()}/api/auth/facebook/callback`,
                profileFields: ['id', 'emails', 'name', 'displayName'] // Request email specifically
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        // Facebook allows accounts without email (phone only), strictly we need email for now
                        return done(null, false, { message: 'Facebook account must have a verified email' });
                    }

                    let user = await findUserByEmail(email);
                    if (!user) {
                        user = await createUser({
                            email,
                            password: Math.random().toString(36).slice(-8),
                            full_name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
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
        return res.redirect(`${getWebUrl()}/auth/login?error=oauth_not_configured`);
    }
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback',
    (req, res, next) => {
        passport.authenticate('google', {
            session: false,
            failureRedirect: `${getWebUrl()}/auth/login?error=google_auth_failed`
        })(req, res, next);
    },
    (req, res) => handleAuthSuccess(req, res)
);

// Initiate Facebook OAuth
router.get('/facebook', (req: Request, res: Response, next) => {
    if (!isFacebookOAuthConfigured) {
        return res.redirect(`${getWebUrl()}/auth/login?error=oauth_not_configured_facebook`);
    }
    passport.authenticate('facebook', { scope: ['email', 'public_profile'], session: false })(req, res, next);
});

// Facebook OAuth callback
router.get('/facebook/callback',
    (req, res, next) => {
        passport.authenticate('facebook', {
            session: false,
            failureRedirect: `${getWebUrl()}/auth/login?error=facebook_auth_failed`
        })(req, res, next);
    },
    (req, res) => handleAuthSuccess(req, res)
);

// Shared auth success handler
const handleAuthSuccess = (req: any, res: Response) => {
    try {
        const user = req.user;
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

        const webUrl = getWebUrl();
        const redirectUrl = `${webUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&user=${encodeURIComponent(JSON.stringify({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        }))}`;

        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Auth callback error:', error);
        res.redirect(`${getWebUrl()}/auth/login?error=auth_failed`);
    }
};

export default router;
