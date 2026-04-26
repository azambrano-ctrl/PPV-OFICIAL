import axios from 'axios';

const CLOUDFLARE_ACCOUNT_ID = 'c31035fa17b98663a1aee245999923e4';
const CLOUDFLARE_API_TOKEN = '62GR3ZJJR5yf1vJgj8xCdL1kPqHKMjn62F0KT3NG';

async function testCloudflareAPI() {
    try {
        console.log('Testing Cloudflare API credentials...');
        console.log('Account ID:', CLOUDFLARE_ACCOUNT_ID);
        console.log('Token (first 10 chars):', CLOUDFLARE_API_TOKEN.substring(0, 10) + '...');

        // Test 1: List live inputs
        console.log('\n--- Test 1: Listing live inputs ---');
        const listResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`,
            {
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ List API call successful');
        console.log('Response:', JSON.stringify(listResponse.data, null, 2));

        // Test 2: Create a test live input
        console.log('\n--- Test 2: Creating a test live input ---');
        const createResponse = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs`,
            {
                meta: { name: 'Test Stream - ' + new Date().toISOString() },
                recording: {
                    mode: 'automatic',
                    timeout_seconds: 60,
                    delete_recording_after_days: 7
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Create API call successful');
        console.log('Response:', JSON.stringify(createResponse.data, null, 2));

    } catch (error: any) {
        console.error('❌ API call failed');
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testCloudflareAPI();
