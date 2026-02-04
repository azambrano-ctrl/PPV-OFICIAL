import Stripe from 'stripe';
import { query, transaction } from '../config/database';
import logger from '../config/logger';

let stripeInstance: Stripe | null = null;

const getStripe = async () => {
    if (stripeInstance) return stripeInstance;

    let secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
        // Fallback to database settings
        try {
            const { getSettings } = await import('./settingsService');
            const settings = await getSettings();
            secretKey = settings.stripe_secret_key;
        } catch (error) {
            logger.error('Failed to fetch Stripe secret key from database:', error);
        }
    }

    if (!secretKey || secretKey === 'your_stripe_secret_key') {
        throw new Error('Stripe secret key is not configured. Please set it in .env or settings dashboard.');
    }

    stripeInstance = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
    });

    return stripeInstance;
};

export interface CreatePaymentIntentInput {
    userId: string;
    eventId?: string; // Optional for season pass
    purchaseType?: 'event' | 'season_pass';
    amount: number;
    currency?: string;
    couponCode?: string;
}

export interface PaymentIntent {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
}

/**
 * Create Stripe payment intent
 */
export const createPaymentIntent = async (
    input: CreatePaymentIntentInput
): Promise<PaymentIntent> => {
    try {
        let finalAmount = input.amount;
        let discountAmount = 0;

        // Apply coupon if provided
        if (input.couponCode) {
            const couponResult = await query(
                `SELECT * FROM coupons 
         WHERE code = $1 AND is_active = TRUE 
         AND (valid_until IS NULL OR valid_until > NOW())
         AND (max_uses IS NULL OR current_uses < max_uses)`,
                [input.couponCode]
            );

            if (couponResult.rows.length > 0) {
                const coupon = couponResult.rows[0];

                if (coupon.discount_type === 'percentage') {
                    discountAmount = (input.amount * coupon.discount_value) / 100;
                } else {
                    discountAmount = coupon.discount_value;
                }

                finalAmount = Math.max(input.amount - discountAmount, 0);
            }
        }

        // Create Stripe payment intent
        const stripe = await getStripe();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalAmount * 100), // Convert to cents
            currency: input.currency || 'usd',
            metadata: {
                userId: input.userId,
                eventId: input.eventId || '',
                purchaseType: input.purchaseType || 'event',
                couponCode: input.couponCode || '',
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Create purchase record
        await query(
            `INSERT INTO purchases (
        user_id, event_id, purchase_type, amount, currency, payment_method,
        payment_intent_id, payment_status, coupon_code, discount_amount, final_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                input.userId,
                input.eventId || null,
                input.purchaseType || 'event',
                input.amount,
                input.currency || 'USD',
                'stripe',
                paymentIntent.id,
                'pending',
                input.couponCode || null,
                discountAmount,
                finalAmount,
            ]
        );

        logger.info('Payment intent created', {
            userId: input.userId,
            eventId: input.eventId,
            amount: finalAmount,
        });

        return {
            clientSecret: paymentIntent.client_secret!,
            paymentIntentId: paymentIntent.id,
            amount: finalAmount,
        };
    } catch (error) {
        logger.error('Error creating payment intent:', error);
        throw error;
    }
};

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (
    signature: string,
    rawBody: Buffer
): Promise<void> => {
    try {
        const stripe = await getStripe();
        const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );

        logger.info('Stripe webhook received', { type: event.type });

        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            case 'charge.refunded':
                await handleRefund(event.data.object as Stripe.Charge);
                break;

            default:
                logger.info('Unhandled webhook event type', { type: event.type });
        }
    } catch (error) {
        logger.error('Webhook error:', error);
        throw error;
    }
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
    await transaction(async (client) => {
        // Update purchase status
        const result = await client.query(
            `UPDATE purchases 
       SET payment_status = 'completed'
       WHERE payment_intent_id = $1
       RETURNING *`,
            [paymentIntent.id]
        );

        if (result.rows.length === 0) {
            throw new Error('Purchase not found');
        }

        const purchase = result.rows[0];

        // Update coupon usage if applicable
        if (purchase.coupon_code) {
            await client.query(
                'UPDATE coupons SET current_uses = current_uses + 1 WHERE code = $1',
                [purchase.coupon_code]
            );
        }

        // Create stream token for user (ONLY if it's an event purchase)
        if (purchase.purchase_type === 'event' && purchase.event_id) {
            const { generateStreamToken } = await import('../middleware/auth');
            const streamToken = generateStreamToken(purchase.user_id, purchase.event_id);
            const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours

            await client.query(
                `INSERT INTO stream_tokens (user_id, event_id, token, expires_at)
           VALUES ($1, $2, $3, $4)`,
                [purchase.user_id, purchase.event_id, streamToken, expiresAt]
            );
        }

        // Generate virtual seat number (random between 1 and 5000)
        const seatNumber = Math.floor(Math.random() * 5000) + 1;

        // Update purchase with seat number
        await client.query(
            'UPDATE purchases SET seat_number = $1 WHERE id = $2',
            [seatNumber, purchase.id]
        );

        logger.info('Payment successful', {
            purchaseId: purchase.id,
            userId: purchase.user_id,
            eventId: purchase.event_id,
            seatNumber
        });

        // Send confirmation email
        try {
            const { sendTicketEmail } = await import('./emailService');

            // Get user and event details for the email
            const userResult = await client.query('SELECT email, full_name FROM users WHERE id = $1', [purchase.user_id]);

            let eventTitle = 'Pase de Temporada';
            let eventDate = new Date();
            let eventPrice = `${purchase.currency} $${purchase.amount}`;

            if (purchase.purchase_type === 'event' && purchase.event_id) {
                const eventResult = await client.query('SELECT title, event_date, price, currency FROM events WHERE id = $1', [purchase.event_id]);
                if (eventResult.rows.length > 0) {
                    const event = eventResult.rows[0];
                    eventTitle = event.title;
                    eventDate = event.event_date;
                    eventPrice = `${event.currency} $${event.price}`;
                }
            }

            if (userResult.rows.length > 0) {
                const user = userResult.rows[0];
                await sendTicketEmail(
                    user.email,
                    user.full_name,
                    eventTitle,
                    eventDate.toISOString(),
                    eventPrice,
                    seatNumber
                );
                logger.info('Ticket email sent successfully');
            }
        } catch (emailError) {
            logger.error('Error sending ticket email:', emailError);
            // Don't throw here to avoid rolling back the transaction for an email failure
        }
    });
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
    await query(
        `UPDATE purchases 
     SET payment_status = 'failed'
     WHERE payment_intent_id = $1`,
        [paymentIntent.id]
    );

    logger.warn('Payment failed', { paymentIntentId: paymentIntent.id });
};

/**
 * Handle refund
 */
const handleRefund = async (charge: Stripe.Charge) => {
    await transaction(async (client) => {
        // Update purchase status
        await client.query(
            `UPDATE purchases 
       SET payment_status = 'refunded'
       WHERE payment_intent_id = $1`,
            [charge.payment_intent]
        );

        // Revoke stream tokens
        await client.query(
            `UPDATE stream_tokens 
       SET is_revoked = TRUE
       WHERE user_id IN (
         SELECT user_id FROM purchases WHERE payment_intent_id = $1
       )`,
            [charge.payment_intent]
        );

        logger.info('Refund processed', { chargeId: charge.id });
    });
};

/**
 * Create refund
 */
export const createRefund = async (purchaseId: string): Promise<void> => {
    const result = await query(
        'SELECT * FROM purchases WHERE id = $1',
        [purchaseId]
    );

    if (result.rows.length === 0) {
        throw new Error('Purchase not found');
    }

    const purchase = result.rows[0];

    if (purchase.payment_method !== 'stripe') {
        throw new Error('Only Stripe payments can be refunded through this method');
    }

    if (purchase.payment_status !== 'completed') {
        throw new Error('Only completed payments can be refunded');
    }

    const stripe = await getStripe();
    await stripe.refunds.create({
        payment_intent: purchase.payment_intent_id,
    });

    logger.info('Refund initiated', { purchaseId });
};

export default { createPaymentIntent, handleStripeWebhook, createRefund };
