
const { paypalClient } = require('./src/services/paypalService');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

console.log('--- PayPal Initialization Diagnostic ---');
console.log('PAYPAL_MODE:', process.env.PAYPAL_MODE);
console.log('PAYPAL_CLIENT_ID starts with:', process.env.PAYPAL_CLIENT_ID ? process.env.PAYPAL_CLIENT_ID.substring(0, 5) + '...' : 'MISSING');

if (!paypalClient) {
    console.error('❌ PayPal client failed to initialize at module level.');
} else {
    console.log('✅ PayPal client module loaded.');
    // Check internal state if possible, though it's an opaque object usually
}
