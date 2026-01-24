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

        const currentSettings = await settingsService.getSettings();

        // Handle file uploads
        if (req.files && typeof req.files === 'object') {
            const files = req.files as { [fieldname: string]: any[] };

            // Homepage Background
            if (files.homepage_background && files.homepage_background[0]) {
                updates.homepage_background = files.homepage_background[0].path;
            }

            // About Slider Gallery
            if (files.about_gallery && files.about_gallery.length > 0) {
                const newImages = files.about_gallery.map(f => f.path);
                // Append to existing images
                const existingImages = currentSettings.about_slider_images || [];
                // Ensure it is an array
                const currentArray = Array.isArray(existingImages) ? existingImages : [];
                updates.about_slider_images = [...currentArray, ...newImages];
            }
        }

        // Handle text field (for clearing the background)
        if (req.body.homepage_background !== undefined) {
            // Only if explicitly sent as empty string or specific value, otherwise keep existing if file not uploaded
            if (req.body.homepage_background === '' || req.body.homepage_background === null) {
                updates.homepage_background = null;
            }
        }

        // Handle gallery update via JSON (e.g. for deleting images)
        if (req.body.about_slider_images) {
            try {
                const images = typeof req.body.about_slider_images === 'string'
                    ? JSON.parse(req.body.about_slider_images)
                    : req.body.about_slider_images;
                updates.about_slider_images = images;
            } catch (e) {
                console.warn('Failed to parse about_slider_images', e);
            }
        }

        // Handle About Page fields
        if (req.body.about_hero_title) updates.about_hero_title = req.body.about_hero_title;
        if (req.body.about_hero_subtitle) updates.about_hero_subtitle = req.body.about_hero_subtitle;
        if (req.body.about_mission_title) updates.about_mission_title = req.body.about_mission_title;
        if (req.body.about_mission_text) updates.about_mission_text = req.body.about_mission_text;

        if (req.body.about_values) {
            try {
                // If it's a string (from FormData), parse it. If already object, use as is.
                updates.about_values = typeof req.body.about_values === 'string'
                    ? JSON.parse(req.body.about_values)
                    : req.body.about_values;
            } catch (e) {
                console.warn('Failed to parse about_values', e);
            }
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
