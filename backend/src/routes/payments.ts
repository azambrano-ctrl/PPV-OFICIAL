import { Router, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
    createPaymentIntent,
    handleStripeWebhook,
    createRefund,
} from '../services/stripeService';
import {
    createPayPalOrder,
    capturePayPalOrder,
    handlePayPalWebhook,
} from '../services/paypalService';
import { getEventById } from '../services/eventService';

const router = Router();

// Validation schemas
const createPaymentSchema = z.object({
    eventId: z.string().uuid('Invalid event ID').optional(),
    purchaseType: z.enum(['event', 'season_pass']).default('event'),
    paymentMethod: z.enum(['stripe', 'paypal']),
    couponCode: z.string().optional(),
});

const capturePayPalSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
});

/**
 * GET /api/payments/paypal-diag
 * Diagnostic endpoint for PayPal
 */
router.get(
    '/paypal-diag',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Only admins should see details, but for now we'll allow it for debugging
        if (req.user!.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Admin only' });
            return;
        }

        const { getPayPalClient } = require('../services/paypalService');
        const paypal = require('@paypal/checkout-server-sdk');

        try {
            const client = await getPayPalClient();
            const request = new paypal.orders.OrdersGetRequest('DUMMY_ID');
            let authSuccess = false;
            let errorDetails = null;

            try {
                await client.execute(request);
            } catch (err: any) {
                // 404 means auth worked but order not found
                if (err.statusCode === 404) authSuccess = true;
                else errorDetails = err.message || JSON.parse(err.message || '{}');
            }

            res.json({
                success: true,
                mode: process.env.PAYPAL_MODE,
                authenticated: authSuccess,
                error: errorDetails,
                node_env: process.env.NODE_ENV
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message,
                mode: process.env.PAYPAL_MODE
            });
        }
    })
);

/**
 * POST /api/payments/create
 * Create payment intent/order
 */
router.post(
    '/create',
    authenticate,
    validateBody(createPaymentSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { eventId, purchaseType, paymentMethod, couponCode } = req.body;
        let amount = 0;
        let currency = 'USD';

        if (purchaseType === 'season_pass') {
            const { getSettings } = require('../services/settingsService');
            const settings = await getSettings();

            if (!settings.season_pass_enabled) {
                res.status(400).json({ success: false, message: 'Season Pass is not enabled' });
                return;
            }
            amount = settings.season_pass_price;
        } else {
            if (!eventId) {
                res.status(400).json({ success: false, message: 'Event ID is required' });
                return;
            }
            // Get event details
            const event = await getEventById(eventId);

            if (!event) {
                res.status(404).json({
                    success: false,
                    message: 'Event not found',
                });
                return;
            }

            // Check if event is available for purchase
            if (event.status === 'cancelled' || event.status === 'finished') {
                res.status(400).json({
                    success: false,
                    message: 'Event is not available for purchase',
                });
                return;
            }
            amount = event.price;
            currency = event.currency;
        }

        // Apply coupon discount if provided
        let discountAmount = 0;
        if (couponCode) {
            const pool = require('../config/database').default;
            const couponResult = await pool.query(
                `SELECT * FROM coupons
                 WHERE UPPER(code) = UPPER($1)
                   AND is_active = TRUE
                   AND (valid_until IS NULL OR valid_until > NOW())
                   AND (max_uses IS NULL OR current_uses < max_uses)
                   AND (event_id IS NULL OR event_id = $2)`,
                [couponCode, eventId || null]
            );
            if (couponResult.rows.length > 0) {
                const coupon = couponResult.rows[0];
                if (coupon.discount_type === 'percentage') {
                    discountAmount = Math.min(amount * (parseFloat(coupon.discount_value) / 100), amount);
                } else {
                    discountAmount = Math.min(parseFloat(coupon.discount_value), amount);
                }
                amount = Math.max(0, amount - discountAmount);
            }
        }

        const paymentData = {
            userId: req.user!.userId,
            eventId,
            purchaseType,
            amount,
            currency,
            couponCode,
        };

        // Handle Free Items (Price 0)
        if (amount === 0) {
            // Directly create a completed purchase
            const { query } = require('../config/database');
            const { generateStreamToken } = require('../middleware/auth');

            // Check if user already has it (idempotency)
            let existingQuery = 'SELECT * FROM purchases WHERE user_id = $1 AND event_id = $2 AND payment_status = \'completed\'';
            let existingParams = [req.user!.userId, eventId];

            if (purchaseType === 'season_pass') {
                existingQuery = 'SELECT * FROM purchases WHERE user_id = $1 AND purchase_type = \'season_pass\' AND payment_status = \'completed\'';
                existingParams = [req.user!.userId];
            }

            const existing = await query(existingQuery, existingParams);

            if (existing.rows.length > 0) {
                res.json({
                    success: true,
                    message: 'Already purchased',
                    data: {
                        paymentMethod: 'free',
                        status: 'completed'
                    }
                });
                return;
            }

            const result = await query(
                `INSERT INTO purchases (
                    user_id, event_id, purchase_type, amount, currency, payment_method,
                    payment_status, coupon_code, discount_amount, final_amount
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (user_id, event_id) WHERE purchase_type != 'season_pass'
                DO NOTHING RETURNING *`,
                [
                    req.user!.userId,
                    eventId || null,
                    purchaseType,
                    0,
                    currency,
                    'free',
                    'completed',
                    couponCode || null,
                    0,
                    0,
                ]
            );

            const purchase = result.rows[0];

            // Generate token linked to session
            const streamToken = generateStreamToken(req.user!.userId, eventId, req.user!.sessionId!);
            const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

            await query(
                `INSERT INTO stream_tokens (user_id, event_id, token, expires_at)
                VALUES ($1, $2, $3, $4)`,
                [req.user!.userId, eventId, streamToken, expiresAt]
            );

            res.json({
                success: true,
                data: {
                    paymentMethod: 'free',
                    status: 'completed',
                    purchaseId: purchase.id
                },
            });
            return;
        }

        if (paymentMethod === 'stripe') {
            const paymentIntent = await createPaymentIntent(paymentData);

            res.json({
                success: true,
                data: {
                    paymentMethod: 'stripe',
                    clientSecret: paymentIntent.clientSecret,
                    amount: paymentIntent.amount,
                },
            });
        } else {
            const paypalOrder = await createPayPalOrder(paymentData);

            res.json({
                success: true,
                data: {
                    paymentMethod: 'paypal',
                    orderId: paypalOrder.orderId,
                    amount: paypalOrder.amount,
                    approvalUrl: paypalOrder.approvalUrl,
                },
            });
        }
    })
);

/**
 * GET /api/payments/check-season-pass
 * Check if user has an active season pass
 */
router.get(
    '/check-season-pass',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { query } = require('../config/database');
        const result = await query(
            `SELECT * FROM purchases 
             WHERE user_id = $1 AND purchase_type = 'season_pass' AND payment_status = 'completed'
             LIMIT 1`,
            [req.user!.userId]
        );

        res.json({
            success: true,
            data: {
                hasSeasonPass: result.rows.length > 0,
                purchase: result.rows[0] || null
            }
        });
    })
);

/**
 * POST /api/payments/paypal/capture
 * Capture PayPal order
 */
router.post(
    '/paypal/capture',
    validateBody(capturePayPalSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { orderId } = req.body;

        await capturePayPalOrder(orderId);

        res.json({
            success: true,
            message: 'Payment captured successfully',
        });
    })
);

/**
 * POST /api/payments/webhooks/stripe
 * Stripe webhook endpoint
 */
router.post(
    '/webhooks/stripe',
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            res.status(400).json({
                success: false,
                message: 'Missing stripe-signature header',
            });
            return;
        }

        // Note: req.body should be raw buffer for webhook verification
        await handleStripeWebhook(signature, req.body);

        res.json({ received: true });
    })
);

/**
 * POST /api/payments/webhooks/paypal
 * PayPal webhook endpoint
 */
router.post(
    '/webhooks/paypal',
    asyncHandler(async (req: AuthRequest, res: Response) => {
        await handlePayPalWebhook(req.body);

        res.json({ received: true });
    })
);

/**
 * POST /api/payments/refund/:purchaseId
 * Create refund (admin only)
 */
router.post(
    '/refund/:purchaseId',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        // Check admin role
        if (req.user!.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Admin access required',
            });
            return;
        }

        await createRefund(req.params.purchaseId);

        res.json({
            success: true,
            message: 'Refund initiated successfully',
        });
    })
);

/**
 * POST /api/payments/validate-coupon
 * Validate a coupon code for a specific event and return discount info
 */
router.post(
    '/validate-coupon',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { code, eventId } = req.body as { code: string; eventId?: string };

        if (!code) {
            res.status(400).json({ success: false, message: 'Código requerido' });
            return;
        }

        const pool = require('../config/database').default;
        const result = await pool.query(
            `SELECT c.*, e.title as event_title, e.price as event_price
             FROM coupons c
             LEFT JOIN events e ON c.event_id = e.id
             WHERE UPPER(c.code) = UPPER($1)
               AND c.is_active = TRUE
               AND (c.valid_until IS NULL OR c.valid_until > NOW())
               AND (c.max_uses IS NULL OR c.current_uses < c.max_uses)`,
            [code]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Cupón inválido o expirado' });
            return;
        }

        const coupon = result.rows[0];

        // If coupon is event-specific, check it matches
        if (coupon.event_id && eventId && coupon.event_id !== eventId) {
            res.status(400).json({
                success: false,
                message: `Este cupón solo aplica para el evento: ${coupon.event_title}`
            });
            return;
        }

        res.json({
            success: true,
            data: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discount_type,
                discountValue: parseFloat(coupon.discount_value),
                eventId: coupon.event_id,
                eventTitle: coupon.event_title,
                minAmount: parseFloat(coupon.min_amount || '0'),
            }
        });
    })
);

/**
 * GET /api/payments/coupons
 * List all coupons (Admin only)
 */
router.get(
    '/coupons',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        if (req.user!.role !== 'admin') {
            res.status(403).json({ success: false, error: 'Admin only' });
            return;
        }
        const pool = require('../config/database').default;
        const result = await pool.query(
            `SELECT c.*, e.title as event_title
             FROM coupons c
             LEFT JOIN events e ON c.event_id = e.id
             ORDER BY c.created_at DESC`
        );
        res.json({ success: true, data: result.rows });
    })
);

/**
 * POST /api/payments/coupons
 * Create a coupon (Admin only)
 */
router.post(
    '/coupons',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        if (req.user!.role !== 'admin') {
            res.status(403).json({ success: false, error: 'Admin only' });
            return;
        }
        const { code, discountType, discountValue, eventId, maxUses, validUntil, minAmount } = req.body;

        if (!code || !discountType || !discountValue) {
            res.status(400).json({ success: false, message: 'Código, tipo y valor son obligatorios' });
            return;
        }

        const pool = require('../config/database').default;
        const result = await pool.query(
            `INSERT INTO coupons (code, discount_type, discount_value, event_id, max_uses, valid_until, min_amount, is_active)
             VALUES (UPPER($1), $2, $3, $4, $5, $6, $7, TRUE)
             RETURNING *`,
            [code, discountType, discountValue, eventId || null, maxUses || null, validUntil || null, minAmount || 0]
        );
        res.json({ success: true, data: result.rows[0] });
    })
);

/**
 * DELETE /api/payments/coupons/:id
 * Delete / deactivate a coupon (Admin only)
 */
router.delete(
    '/coupons/:id',
    authenticate,
    asyncHandler(async (req: AuthRequest, res: Response) => {
        if (req.user!.role !== 'admin') {
            res.status(403).json({ success: false, error: 'Admin only' });
            return;
        }
        const pool = require('../config/database').default;
        await pool.query('UPDATE coupons SET is_active = FALSE WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Cupón desactivado' });
    })
);

export default router;
