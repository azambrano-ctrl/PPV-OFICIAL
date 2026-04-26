import { query } from './src/config/database';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

async function checkSettings() {
    console.log('--- Database Connection Check ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'Not defined');

    try {
        const result = await query('SELECT id, stripe_enabled, stripe_public_key, stripe_secret_key, paypal_enabled FROM settings LIMIT 1');
        if (result.rows.length === 0) {
            console.log('❌ No settings found in database.');
            return;
        }

        const settings = result.rows[0];
        console.log('--- Stripe Settings ---');
        console.log('ID:', settings.id);
        console.log('Enabled:', settings.stripe_enabled);
        console.log('Public Key:', settings.stripe_public_key ? (settings.stripe_public_key.startsWith('pk_') ? 'Valid format' : 'Invalid format') : 'Missing');
        console.log('Secret Key:', settings.stripe_secret_key ? (settings.stripe_secret_key.startsWith('sk_') ? 'Valid format' : 'Invalid format') : 'Missing');
        console.log('PayPal Enabled:', settings.paypal_enabled);

        const purchases = await query('SELECT COUNT(*) FROM purchases');
        console.log('--- Purchases ---');
        console.log('Total purchases:', purchases.rows[0].count);

    } catch (error) {
        console.error('❌ Error checking settings:', error);
    }
}

checkSettings().then(() => process.exit());
