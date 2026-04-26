const { getSettings } = require('./src/services/settingsService');
const paypal = require('@paypal/checkout-server-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function diag() {
    try {
        console.log('--- PayPal Connectivity Diagnostic ---');
        const settings = await getSettings();

        const clientId = settings.paypal_client_id;
        const clientSecret = settings.paypal_secret_key;
        const mode = process.env.PAYPAL_MODE || 'live';

        console.log(`Mode: ${mode}`);
        console.log(`Client ID: ${clientId ? clientId.substring(0, 10) + '...' : 'MISSING'}`);
        console.log(`Secret: ${clientSecret ? 'PRESENT' : 'MISSING'}`);

        if (!clientId || !clientSecret) {
            console.error('ERROR: Missing credentials in database!');
            return;
        }

        const environment = mode === 'live'
            ? new paypal.core.LiveEnvironment(clientId, clientSecret)
            : new paypal.core.SandboxEnvironment(clientId, clientSecret);

        const client = new paypal.core.PayPalHttpClient(environment);

        // Try a simple request (list orders or just a dummy call)
        // We'll try to get an access token implicitly by making a simple request
        const request = new paypal.orders.OrdersGetRequest('DUMMY_ID');
        try {
            await client.execute(request);
        } catch (err) {
            // We expect a 404 for DUMMY_ID, but a 401 means auth failed
            if (err.statusCode === 401) {
                console.error('ERROR: PayPal Authentication Failed (Invalid Credentials)');
            } else if (err.statusCode === 404) {
                console.log('SUCCESS: PayPal Authentication Succeeded (received 404 as expected for dummy ID)');
            } else {
                console.error('ERROR: Unexpected PayPal error:', err.message);
                console.error('Status Code:', err.statusCode);
                console.error('Body:', err.message);
            }
        }
    } catch (error) {
        console.error('DIAGNOSTIC CRASHED:', error);
    } finally {
        process.exit();
    }
}

diag();
