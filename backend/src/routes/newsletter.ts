import { Router } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

const router = Router();

/**
 * @route POST /api/newsletter/subscribe
 * @desc Subscribe to newsletter
 * @access Public
 */
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'El correo electrónico es requerido',
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Formato de correo electrónico inválido',
            });
        }

        // Check if already subscribed
        const existingResult = await query(
            'SELECT id FROM newsletter_subscribers WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingResult.rows.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Este correo ya está suscrito a nuestro newsletter',
            });
        }

        // Insert new subscriber
        await query(
            'INSERT INTO newsletter_subscribers (email) VALUES ($1)',
            [email.toLowerCase()]
        );

        logger.info(`New newsletter subscriber: ${email}`);

        return res.status(200).json({
            status: 'success',
            message: '¡Gracias por suscribirte a nuestro newsletter!',
        });
    } catch (error) {
        logger.error('Error in newsletter subscription:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Ocurrió un error al procesar tu suscripción. Por favor, intenta de nuevo más tarde.',
        });
    }
});

export default router;
