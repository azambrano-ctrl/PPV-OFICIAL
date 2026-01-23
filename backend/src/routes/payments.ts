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
    eventId: z.string().uuid('Invalid event ID'),
    paymentMethod: z.enum(['stripe', 'paypal']),
    couponCode: z.string().optional(),
});

const capturePayPalSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
});

/**
 * POST /api/payments/create
 * Create payment intent/order
 */
router.post(
    '/create',
    authenticate,
    validateBody(createPaymentSchema),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { eventId, paymentMethod, couponCode } = req.body;

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
        const paymentData = {
            userId: req.user!.userId,
            eventId,
            amount: event.price,
            currency: event.currency,
            couponCode,
        };

        // Handle Free Events (Price 0)
        if (event.price === 0) {
            // Directly create a completed purchase
            const { query } = require('../config/database');
            const { generateStreamToken } = require('../middleware/auth');
            // uuidv4 import removed as it was unused

            // Check if user already has it (idempotency)
            const existing = await query(
                'SELECT * FROM purchases WHERE user_id = $1 AND event_id = $2 AND payment_status = \'completed\'',
                [req.user!.userId, eventId]
            );

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

            // purchaseId removed as it was unused

            const result = await query(
                `INSERT INTO purchases (
                    user_id, event_id, amount, currency, payment_method,
                    payment_status, coupon_code, discount_amount, final_amount
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [
                    req.user!.userId,
                    eventId,
                    0,
                    event.currency,
                    'free',
                    'completed',
                    couponCode || null,
                    0,
                    0,
                ]
            );

            const purchase = result.rows[0];

            // Generate token
            const streamToken = generateStreamToken(req.user!.userId, eventId);
            const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours

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
                },
            });
        }
    })
);

/**
 * POST /api/payments/paypal/capture
 * Capture PayPal order
 */
router.post(
    '/paypal/capture',
    authenticate,
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

export default router;
