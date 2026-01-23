import mercadopago from 'mercadopago';
import { pool } from '../config/database';

// Configure Mercado Pago
mercadopago.configure({
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

interface CreatePreferenceData {
    eventId: string;
    userId: string;
    title: string;
    price: number;
    currency: string;
}

/**
 * Create a payment preference in Mercado Pago
 */
export const createPreference = async (data: CreatePreferenceData) => {
    try {
        const preference = {
            items: [
                {
                    title: data.title,
                    unit_price: data.price,
                    quantity: 1,
                    currency_id: data.currency,
                }
            ],
            payer: {
                email: '', // Will be filled by Mercado Pago checkout
            },
            back_urls: {
                success: `${process.env.WEB_URL}/payment/success`,
                failure: `${process.env.WEB_URL}/payment/failure`,
                pending: `${process.env.WEB_URL}/payment/pending`,
            },
            auto_return: 'approved' as const,
            external_reference: `${data.eventId}-${data.userId}`,
            notification_url: `${process.env.API_URL}/api/payments/mercadopago/webhook`,
            metadata: {
                event_id: data.eventId,
                user_id: data.userId,
            },
        };

        const response = await mercadopago.preferences.create(preference);
        return response.body;
    } catch (error) {
        console.error('Error creating Mercado Pago preference:', error);
        throw error;
    }
};

/**
 * Process Mercado Pago webhook notification
 */
export const processWebhook = async (paymentId: string) => {
    try {
        const payment = await mercadopago.payment.get(paymentId);
        const paymentData = payment.body;

        if (paymentData.status === 'approved') {
            // Extract metadata
            const eventId = paymentData.metadata?.event_id;
            const userId = paymentData.metadata?.user_id;

            if (!eventId || !userId) {
                throw new Error('Missing event_id or user_id in payment metadata');
            }

            // Check if purchase already exists
            const existingPurchase = await pool.query(
                'SELECT id FROM purchases WHERE user_id = $1 AND event_id = $2',
                [userId, eventId]
            );

            if (existingPurchase.rows.length > 0) {
                console.log('Purchase already exists, skipping');
                return { success: true, alreadyExists: true };
            }

            // Create purchase record
            await pool.query(
                `INSERT INTO purchases (
                    user_id, 
                    event_id, 
                    amount, 
                    currency, 
                    payment_method, 
                    payment_status, 
                    transaction_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    userId,
                    eventId,
                    paymentData.transaction_amount,
                    paymentData.currency_id,
                    'mercadopago',
                    'completed',
                    paymentData.id.toString(),
                ]
            );

            console.log('Purchase created successfully for Mercado Pago payment:', paymentData.id);
            return { success: true, alreadyExists: false };
        }

        return { success: false, status: paymentData.status };
    } catch (error) {
        console.error('Error processing Mercado Pago webhook:', error);
        throw error;
    }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (paymentId: string) => {
    try {
        const payment = await mercadopago.payment.get(paymentId);
        return payment.body;
    } catch (error) {
        console.error('Error checking Mercado Pago payment status:', error);
        throw error;
    }
};
