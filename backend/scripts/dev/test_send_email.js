require('dotenv').config();
const { sendVerificationEmail } = require('./dist/services/emailService');

async function testEmail() {
    process.env.BREVO_API_KEY = "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";
    process.env.EMAIL_FROM = "arenafightpass@roaima.net";
    process.env.EMAIL_FROM_NAME = "Arena Fight Pass";

    try {
        console.log("Sending test email...");
        const result = await sendVerificationEmail("luismiguelrs@live.com", "Luis", "TEST_TOKEN_123");
        console.log("Success! Server Response:", result);
    } catch (e) {
        console.error("Failed to send email:", e);
    }
}

testEmail();
