import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';
import { findUserByEmail, createUser } from '../services/userService';
import { query } from '../config/database';
import crypto from 'crypto';

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
    let url = process.env.API_URL;
    if (!url) {
        console.warn('⚠️ API_URL no está configurada en variables de entorno');
        return '';
    }
    // Strip trailing slash if present
    return url.replace(/\/$/, '');
};
const getWebUrl = () => {
    let url = process.env.WEB_URL;
    if (!url) {
        console.warn('⚠️ WEB_URL no está configurada en variables de entorno');
        return '';
    }
    // Strip trailing slash if present
    return url.replace(/\/$/, '');
};

// ... Google Strategy (existing code) ...
if (isGoogleOAuthConfigured) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId!,
                clientSecret: googleClientSecret!,
                callbackURL: `${getApiUrl()}/api/auth/google/callback`,
                proxy: true,
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) return done(new Error('No email found in Google profile'));

                    let user = await findUserByEmail(email);
                    if (!user) {
                        user = await createUser({
                            email,
                            password: crypto.randomBytes(32).toString('hex'),
                            full_name: profile.displayName || email.split('@')[0],
                            phone: '',
                            is_verified: true
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
                profileFields: ['id', 'emails', 'name', 'displayName'], // Request email specifically
                proxy: true,
            },
            async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
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
                            password: crypto.randomBytes(32).toString('hex'),
                            full_name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
                            phone: '',
                            is_verified: true
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
    console.log('🔵 [Facebook Auth] Starting request...');
    console.log('🔵 [Facebook Auth] Config Check:', {
        hasAppID: !!facebookAppId,
        hasAppSecret: !!facebookAppSecret,
        apiUrl: getApiUrl(),
        webUrl: getWebUrl()
    });

    if (!isFacebookOAuthConfigured) {
        console.error('🔴 [Facebook Auth] Missing configuration!');
        return res.redirect(`${getWebUrl()}/auth/login?error=oauth_not_configured_facebook`);
    }

    console.log('🔵 [Facebook Auth] Configuration OK. Delegating to Passport...');
    passport.authenticate('facebook', { scope: ['email', 'public_profile'], session: false })(req, res, next);
});

// Facebook OAuth callback
router.get('/facebook/callback',
    (req, res, next) => {
        console.log('🔵 [Facebook Auth] Callback received.');
        passport.authenticate('facebook', {
            session: false,
            failureRedirect: `${getWebUrl()}/auth/login?error=facebook_auth_failed`
        })(req, res, next);
    },
    (req, res) => {
        console.log('🟢 [Facebook Auth] Authentication successful. Generating tokens...');
        handleAuthSuccess(req, res);
    }
);

// Shared auth success handler
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '../middleware/auth';

const handleAuthSuccess = async (req: any, res: Response) => {
    try {
        const user = req.user;

        // Generate and persist Session ID
        const sessionId = crypto.randomUUID();
        await query('UPDATE users SET current_session_id = $1 WHERE id = $2', [sessionId, user.id]);

        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            sessionId
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Tokens go ONLY in HttpOnly cookies — never in URL
        setAuthCookies(res, accessToken, refreshToken);

        // Pass only non-sensitive user info in URL
        const webUrl = getWebUrl();
        const safeUser = encodeURIComponent(JSON.stringify({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        }));
        res.redirect(`${webUrl}/auth/callback?user=${safeUser}`);
    } catch (error) {
        console.error('Auth callback error:', error);
        res.redirect(`${getWebUrl()}/auth/login?error=auth_failed`);
    }
};

export default router;
