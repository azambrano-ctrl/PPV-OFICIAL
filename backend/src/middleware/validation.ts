import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../config/logger';

/**
 * Middleware to validate request body against Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                logger.warn('Validation error:', { errors, body: req.body });

                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors,
                });
                return;
            }

            logger.error('Unexpected validation error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    };
};

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors,
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    };
};

/**
 * Middleware to validate URL parameters
 */
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                res.status(400).json({
                    success: false,
                    message: 'Invalid URL parameters',
                    errors,
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    };
};
