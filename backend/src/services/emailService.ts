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
 * Send a mass email to multiple recipients
 */
export const sendMassEmail = async (recipients: string[], subject: string, html: string) => {
    logger.info(`Starting mass email to ${recipients.length} recipients...`);

    let successCount = 0;
    let errorCount = 0;

    // Send emails in batches of 10 to avoid overwhelming the server/SMTP
    const BATCH_SIZE = 10;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);

        await Promise.all(
            batch.map(async (email) => {
                try {
                    await sendEmail(email, subject, html);
                    successCount++;
                } catch (error) {
                    logger.error(`Failed to send email to ${email}:`, error);
                    errorCount++;
                }
            })
        );

        // Small delay between batches (500ms)
        if (i + BATCH_SIZE < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    logger.info(`Mass email completed. Success: ${successCount}, Failed: ${errorCount}`);
    return { successCount, errorCount };
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (to: string, token: string) => {
    const webUrl = process.env.WEB_URL;
    if (!webUrl) {
        logger.error('WEB_URL no definida. El enlace de restablecimiento de contraseña puede no funcionar.');
    }
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

/**
 * Send email verification link
 */
export const sendVerificationEmail = async (to: string, userName: string, token: string) => {
    const brandName = process.env.EMAIL_FROM_NAME || 'Arena Fight Pass';
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const verifyLink = `${webUrl}/auth/verify?token=${token}`;

    const subject = `Confirma tu cuenta - ${brandName}`;
    const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
    <div style="background-color: #ef4444; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">¡BIENVENIDO A ARENA FIGHT PASS!</h1>
    </div>
    
    <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #aaa; margin-bottom: 30px;">Hola <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Gracias por registrarte. Para poder comprar eventos y disfrutar de todo el contenido, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente botón:
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="${verifyLink}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
                CONFIRMAR MI CUENTA
            </a>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #888; margin-bottom: 30px;">
            O copia y pega este enlace en tu navegador:<br>
            <a href="${verifyLink}" style="color: #ef4444; text-decoration: none;">${verifyLink}</a>
        </p>

        <p style="font-size: 14px; color: #555; text-align: center; margin-top: 40px;">
            Si no creaste esta cuenta, puedes ignorar este correo.
        </p>
    </div>
    
    <div style="padding: 20px; text-align: center; background-color: #000; border-top: 1px solid #111;">
        <p style="margin: 0; color: #333; font-size: 12px;">&copy; ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.</p>
    </div>
</div>
    `;

    return sendEmail(to, subject, html);
};

/**
 * Send ticket confirmation email
 */
export const sendTicketEmail = async (
    to: string,
    userName: string,
    eventTitle: string,
    eventDate: string,
    price: string,
    seatNumber: number
) => {
    const brandName = process.env.EMAIL_FROM_NAME || 'Arena Fight Pass';
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';

    // Format date for display
    const formattedDate = new Date(eventDate).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Guayaquil'
    });

    const subject = `🎫 ¡Tu Ticket para ${eventTitle}! - ${brandName}`;
    const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
    <div style="background-color: #ef4444; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">¡PAGO CONFIRMADO!</h1>
    </div>
    
    <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #aaa; margin-bottom: 30px;">Hola <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            ¡Ya tienes tu acceso asegurado! Prepárate para vivir la acción de los deportes de combate como nunca antes.
        </p>
        
        <!-- Ticket Card -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%); padding: 30px; border-radius: 12px; border: 1px solid #ef4444; margin-bottom: 40px; position: relative;">
            <div style="margin-bottom: 20px; border-bottom: 1px dashed #333; padding-bottom: 15px;">
                <h2 style="margin: 0 0 5px 0; color: #ef4444; font-size: 20px; text-transform: uppercase;">${eventTitle}</h2>
                <p style="margin: 0; color: #888; font-size: 14px;">${formattedDate}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0;">
                        <span style="display: block; color: #555; font-size: 12px; text-transform: uppercase; font-weight: bold;">Asiento Virtual</span>
                        <span style="font-size: 24px; color: #ffffff; font-weight: 800;">#${seatNumber.toString().padStart(5, '0')}</span>
                    </td>
                    <td style="padding: 10px 0; text-align: right;">
                        <span style="display: block; color: #555; font-size: 12px; text-transform: uppercase; font-weight: bold;">Precio</span>
                        <span style="font-size: 18px; color: #ffffff;">${price}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="text-align: center;">
            <a href="${webUrl}/watch" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; transition: 0.3s;">
                ACCEDER AL STREAMING
            </a>
        </div>
        
        <p style="font-size: 14px; color: #555; text-align: center; margin-top: 40px;">
            Si tienes algún problema técnico, contáctanos a soporte@tupeleas.com
        </p>
    </div>
    
    <div style="padding: 20px; text-align: center; background-color: #000; border-top: 1px solid #111;">
        <p style="margin: 0; color: #333; font-size: 12px;">&copy; ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.</p>
    </div>
</div>
`;

    return sendEmail(to, subject, html);
};

/**
 * Send promoter approval email
 */
export const sendApprovalEmail = async (to: string, promoterName: string) => {
    const brandName = process.env.EMAIL_FROM_NAME || 'Arena Fight Pass';
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';

    const subject = `✅ ¡Felicidades! Tu cuenta de promotora ha sido aprobada - ${brandName}`;
    const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
    <div style="background-color: #22c55e; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">¡CUENTA APROBADA!</h1>
    </div>
    
    <div style="padding: 40px 30px;">
        <p style="font-size: 18px; color: #aaa; margin-bottom: 30px;">Hola <strong>${promoterName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Nos complace informarte que tu solicitud para unirte como promotora oficial ha sido **aprobada**.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Ya puedes acceder a tu panel de control para gestionar tus eventos, ver tus ventas y personalizar tu perfil profesional.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="${webUrl}/auth/login" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
                INGRESAR AL DASHBOARD
            </a>
        </div>
        
        <div style="background-color: #111; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
            <h3 style="color: #22c55e; margin-top: 0;">Próximos pasos:</h3>
            <ul style="color: #888; padding-left: 20px;">
                <li>Completa tu perfil comercial (Logo y Portada).</li>
                <li>Crea tu primer evento de combate.</li>
                <li>Configura tus métodos de cobro.</li>
            </ul>
        </div>
        
        <p style="font-size: 14px; color: #555; text-align: center; margin-top: 40px;">
            Si tienes dudas sobre cómo usar el panel, contacta a nuestro equipo de soporte.
        </p>
    </div>
    
    <div style="padding: 20px; text-align: center; background-color: #000; border-top: 1px solid #111;">
        <p style="margin: 0; color: #333; font-size: 12px;">&copy; ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.</p>
    </div>
</div>
`;

    return sendEmail(to, subject, html);
};
