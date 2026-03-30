const axios = require('axios');

async function testBrevo() {
    const apiKey = "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"; // Provided by user

    try {
        console.log("Testing Brevo API Key...");
        const response = await axios.get('https://api.brevo.com/v3/account', {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        console.log("SUCCESS! Account Details:", response.data);
    } catch (error) {
        console.error("ERROR testing Brevo API:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testBrevo();
