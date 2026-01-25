const paypal = require('@paypal/checkout-server-sdk');
import { query, transaction } from '../config/database';
import logger from '../config/logger';

// PayPal environment setup
const getPayPalEnvironment = () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId.includes('your_paypal') || clientSecret.includes('your_paypal')) {
        throw new Error('PayPal credentials are missing or invalid in .env file');
    }

    return process.env.PAYPAL_MODE === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);
};
let client: any;

try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE;
    const webUrl = process.env.WEB_URL;

    logger.info('Initializing PayPal with:', {
        clientId: clientId ? `${clientId.substring(0, 5)}...` : 'not set',
        hasSecret: !!clientSecret,
        mode,
        webUrl: webUrl || 'NOT SET'
    });

    const environment = getPayPalEnvironment();
    client = new paypal.core.PayPalHttpClient(environment);
} catch (error: any) {
    logger.error('Failed to initialize PayPal client:', error.message);
}

export interface CreatePayPalOrderInput {
    userId: string;
    eventId: string;
    amount: number;
    currency?: string;
    couponCode?: string;
}

/**
 * Create PayPal order
 */
export const createPayPalOrder = async (
    input: CreatePayPalOrderInput
): Promise<{ orderId: string; amount: number; approvalUrl: string }> => {
    if (!client) {
        logger.error('PayPal client is NULL. Environment variables might not be loaded correctly.');
        throw new Error('PayPal client is not initialized. Please check credentials.');
    }

    logger.info('Starting createPayPalOrder', { input });

    try {
        let finalAmount = Number(input.amount);
        let discountAmount = 0;

        if (isNaN(finalAmount)) {
            throw new Error(`Invalid amount provided: ${input.amount}`);
        }

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

        // Get event details
        const eventResult = await query('SELECT title FROM events WHERE id = $1', [
            input.eventId,
        ]);

        const eventTitle = eventResult.rows[0]?.title || 'PPV Event';

        // Create PayPal order
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: input.currency || 'USD',
                        value: finalAmount.toFixed(2),
                    },
                    description: `Access to ${eventTitle}`,
                    custom_id: JSON.stringify({
                        userId: input.userId,
                        eventId: input.eventId,
                        couponCode: input.couponCode || '',
                    }),
                },
            ],
            application_context: {
                brand_name: 'PPV Streaming',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                return_url: `${process.env.WEB_URL}/payment/success`,
                cancel_url: `${process.env.WEB_URL}/payment/cancel`,
            },
        });

        const response = await client.execute(request);
        logger.info('PayPal response received', {
            status: response.statusCode,
            orderId: response.result.id
        });

        const orderId = response.result.id;
        const approvalUrl = response.result.links.find((link: any) => link.rel === 'approve')?.href;

        if (!approvalUrl) {
            logger.error('Approval URL not found in PayPal response', { links: response.result.links });
            throw new Error('PayPal approval URL not found in response');
        }

        // Create or update purchase record
        const existingPurchase = await query(
            'SELECT id, payment_status FROM purchases WHERE user_id = $1 AND event_id = $2',
            [input.userId, input.eventId]
        );

        if (existingPurchase.rows.length > 0) {
            const purchase = existingPurchase.rows[0];

            if (purchase.payment_status === 'completed') {
                logger.warn('User attempted to buy an already purchased event', { userId: input.userId, eventId: input.eventId });
                throw new Error('This event has already been purchased successfully.');
            }

            logger.info('Updating existing pending purchase', { purchaseId: purchase.id, oldStatus: purchase.payment_status, newOrderId: orderId });

            await query(
                `UPDATE purchases 
                 SET payment_intent_id = $1, 
                     payment_method = 'paypal', 
                     payment_status = 'pending',
                     amount = $2, 
                     discount_amount = $3, 
                     final_amount = $4,
                     coupon_code = $5,
                     currency = $6
                 WHERE id = $7`,
                [
                    orderId,
                    input.amount,
                    discountAmount,
                    finalAmount,
                    input.couponCode || null,
                    input.currency || 'USD',
                    purchase.id
                ]
            );
        } else {
            logger.info('Creating new purchase record', { userId: input.userId, eventId: input.eventId, orderId });
            await query(
                `INSERT INTO purchases (
            user_id, event_id, amount, currency, payment_method,
            payment_intent_id, payment_status, coupon_code, discount_amount, final_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    input.userId,
                    input.eventId,
                    input.amount,
                    input.currency || 'USD',
                    'paypal',
                    orderId,
                    'pending',
                    input.couponCode || null,
                    discountAmount,
                    finalAmount,
                ]
            );
        }

        logger.info('PayPal order created successfully', {
            orderId,
            userId: input.userId,
            eventId: input.eventId,
            amount: finalAmount,
        });

        return { orderId, amount: finalAmount, approvalUrl };
    } catch (error: any) {
        logger.error('Error creating PayPal order:', {
            message: error.message,
            stack: error.stack,
            details: error.debug_id || 'no debug id'
        });
        throw error;
    }
};

/**
 * Capture PayPal order
 */
export const capturePayPalOrder = async (orderId: string): Promise<void> => {
    try {
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        const response = await client.execute(request);

        if (response.result.status === 'COMPLETED') {
            await handlePayPalSuccess(orderId, response.result);
        } else {
            throw new Error(`PayPal capture failed with status: ${response.result.status}`);
        }
    } catch (error) {
        logger.error('Error capturing PayPal order:', error);
        throw error;
    }
};

/**
 * Handle successful PayPal payment
 */
const handlePayPalSuccess = async (orderId: string, _orderDetails: any) => {
    await transaction(async (client) => {
        // Update purchase status
        const result = await client.query(
            `UPDATE purchases 
       SET payment_status = 'completed'
       WHERE payment_intent_id = $1
       RETURNING *`,
            [orderId]
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

        // Create stream token for user
        const { generateStreamToken } = await import('../middleware/auth');
        const streamToken = generateStreamToken(purchase.user_id, purchase.event_id);
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours

        await client.query(
            `INSERT INTO stream_tokens (user_id, event_id, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
            [purchase.user_id, purchase.event_id, streamToken, expiresAt]
        );

        // Generate virtual seat number (random between 1 and 5000)
        const seatNumber = Math.floor(Math.random() * 5000) + 1;

        // Update purchase with seat number
        await client.query(
            'UPDATE purchases SET seat_number = $1 WHERE id = $2',
            [seatNumber, purchase.id]
        );

        logger.info('PayPal payment successful', {
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
            const eventResult = await client.query('SELECT title, event_date, price, currency FROM events WHERE id = $1', [purchase.event_id]);

            if (userResult.rows.length > 0 && eventResult.rows.length > 0) {
                const user = userResult.rows[0];
                const event = eventResult.rows[0];

                await sendTicketEmail(
                    user.email,
                    user.full_name,
                    event.title,
                    event.event_date,
                    `${event.currency} $${event.price}`,
                    seatNumber
                );
                logger.info('Ticket email sent successfully (PayPal)');
            }
        } catch (emailError) {
            logger.error('Error sending ticket email (PayPal):', emailError);
            // Don't throw here to avoid rolling back the transaction for an email failure
        }
    });
};

/**
 * Handle PayPal webhook
 */
export const handlePayPalWebhook = async (webhookBody: any): Promise<void> => {
    try {
        const eventType = webhookBody.event_type;

        logger.info('PayPal webhook received', { type: eventType });

        switch (eventType) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                const orderId = webhookBody.resource.supplementary_data.related_ids.order_id;
                await handlePayPalSuccess(orderId, webhookBody.resource);
                break;

            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.DECLINED':
                await handlePayPalFailed(webhookBody.resource);
                break;

            default:
                logger.info('Unhandled PayPal webhook event', { type: eventType });
        }
    } catch (error) {
        logger.error('PayPal webhook error:', error);
        throw error;
    }
};

/**
 * Handle failed PayPal payment
 */
const handlePayPalFailed = async (resource: any) => {
    const orderId = resource.supplementary_data?.related_ids?.order_id;

    if (orderId) {
        await query(
            `UPDATE purchases 
       SET payment_status = 'failed'
       WHERE payment_intent_id = $1`,
            [orderId]
        );

        logger.warn('PayPal payment failed', { orderId });
    }
};

export { client as paypalClient };
