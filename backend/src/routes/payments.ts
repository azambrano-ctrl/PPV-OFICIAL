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
