const axios = require('axios');

const BREVO_API_KEY = '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';
const EMAIL_FROM = 'arenafightpass@roaima.net';
const EMAIL_FROM_NAME = 'Arena Fight Pass';
const TO = 'azambrano@troncal.net';

async function sendTestEmail() {
    console.log(`Sending test verification email to ${TO}...`);
    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM },
                to: [{ email: TO }],
                subject: 'Test - Confirma tu cuenta - Arena Fight Pass',
                htmlContent: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
    <div style="background-color: #ef4444; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">¡BIENVENIDO A ARENA FIGHT PASS!</h1>
    </div>
    <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #aaa;">Hola <strong>Test User</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">Este es un correo de prueba para verificar que el sistema de emails está funcionando correctamente.</p>
        <div style="text-align: center; margin: 40px 0;">
            <a href="#" style="display: inline-block; background-color: #ef4444; color: #fff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase;">
                CONFIRMAR MI CUENTA
            </a>
        </div>
        <p style="font-size: 12px; color: #555; text-align: center;">Este es un email de prueba generado el ${new Date().toISOString()}</p>
    </div>
</div>`
            },
            {
                headers: {
                    'api-key': BREVO_API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', response.data.messageId);
    } catch (error) {
        console.error('❌ Failed to send email:');
        console.error('Status:', error.response?.status);
        console.error('Error:', JSON.stringify(error.response?.data || error.message, null, 2));
    }
}

sendTestEmail();
