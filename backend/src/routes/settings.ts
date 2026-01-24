import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as settingsService from '../services/settingsService';
import { uploadSettingsImages } from '../middleware/upload';

const router = express.Router();

/**
 * @route   GET /api/settings
 * @desc    Get application settings (public)
 * @access  Public
 */
router.get(
    '/',
    asyncHandler(async (_req: express.Request, res: express.Response) => {
        const settings = await settingsService.getSettings();
        res.json({
            success: true,
            data: settings,
        });
    })
);

/**
 * @route   PUT /api/settings
 * @desc    Update application settings
 * @access  Admin only
 */
router.put(
    '/',
    authenticate,
    requireAdmin,
    uploadSettingsImages,
    asyncHandler(async (req: any, res: express.Response) => {
        const updates: settingsService.UpdateSettingsDTO = {};

        // Handle file uploads
        if (req.files && typeof req.files === 'object' && 'homepage_background' in req.files) {
            const files = req.files as { [fieldname: string]: any[] };
            if (files.homepage_background && files.homepage_background[0]) {
                updates.homepage_background = files.homepage_background[0].path;
            }
        }

        // Handle text field (for clearing the background)
        if (req.body.homepage_background !== undefined) {
            updates.homepage_background = req.body.homepage_background || null;
        }

        const settings = await settingsService.updateSettings(updates);

        res.json({
            success: true,
            data: settings,
            message: 'Settings updated successfully',
        });
    })
);

export default router;
