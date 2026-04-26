import { getSettings } from './src/services/settingsService';
import { getPayPalClient as getClient } from './src/services/paypalService';
const paypal = require('@paypal/checkout-server-sdk');
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function diag() {
    try {
        console.log('--- PayPal Backend Diagnostic ---');
        const settings = await getSettings();

        console.log('Database Settings Fetch:');
        console.log(`- paypal_client_id: ${settings.paypal_client_id ? settings.paypal_client_id.substring(0, 10) + '...' : 'MISSING'}`);
        console.log(`- paypal_secret_key: ${settings.paypal_secret_key ? 'PRESENT' : 'MISSING'}`);
        console.log(`- paypal_enabled: ${settings.paypal_enabled}`);

        console.log('\nEnvironment Verification:');
        console.log(`- PAYPAL_MODE: ${process.env.PAYPAL_MODE}`);

        try {
            console.log('\nTesting Client Initialization...');
            const client = await getClient();
            console.log('Client initialized. Testing authentication call...');

            const request = new paypal.orders.OrdersGetRequest('DUMMY_ID');
            try {
                await client.execute(request);
            } catch (err: any) {
                if (err.statusCode === 401) {
                    console.error('\nCRITICAL ERROR: PayPal Authentication Failed! Invalid Client ID or Secret.');
                } else if (err.statusCode === 404) {
                    console.log('\nSUCCESS: PayPal Connected Successfully (Authenticated).');
                } else {
                    console.error(`\nERROR: Unexpected Response (${err.statusCode}):`, err.message);
                }
            }
        } catch (initErr: any) {
            console.error('\nCRITICAL ERROR: Failed to initialize PayPal client:', initErr.message);
        }

    } catch (error: any) {
        console.error('\nDIAGNOSTIC FAILED:', error.message);
    } finally {
        process.exit();
    }
}

diag();
