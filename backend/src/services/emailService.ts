import nodemailer from 'nodemailer';
import axios from 'axios';
import logger from '../config/logger';

// Create generic transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Send generic email
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        // Option 1: Brevo API (Preferred if key is available)
        if (process.env.BREVO_API_KEY) {
            try {
                const response = await axios.post(
                    'https://api.brevo.com/v3/smtp/email',
                    {
                        sender: {
                            name: process.env.EMAIL_FROM_NAME || 'PPV Streaming',
                            email: process.env.EMAIL_FROM || 'noreply@tupeleas.com'
                        },
                        to: [{ email: to }],
                        subject: subject,
                        htmlContent: html
                    },
                    {
                        headers: {
                            'api-key': process.env.BREVO_API_KEY,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );
                logger.info('Email sent via Brevo API:', response.data.messageId);
                return response.data;
            } catch (apiError: any) {
                logger.error('Brevo API Error:', apiError.response?.data || apiError.message);
                // Fallback to SMTP if API fails? No, better to throw or let SMTP try if configured.
                // For now, let's assuming if Key is there, we want to use it.
                // If it fails, maybe we try SMTP.
            }
        }

        // Option 2: SMTP (Nodemailer) - Existing fallback
        if (!process.env.EMAIL_USER) {
            logger.warn('⚠️ EMAIL_USER not configured. Email would have been sent to:', to);
            logger.info('📧 Email Check:', { to, subject, bodyPreview: html.substring(0, 100) });
            return;
        }

        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'PPV Streaming'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        logger.info('Email sent via SMTP:', info.messageId);
        return info;
    } catch (error) {
        logger.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (to: string, token: string) => {
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const resetLink = `${webUrl}/auth/reset-password?token=${token}`;

    const subject = 'Restablecer contraseña - PPV Streaming';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Restablecer Contraseña
            </a>
        </p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p><small>El enlace expirará en 1 hora.</small></p>
    </div>
    `;

    return sendEmail(to, subject, html);
};
