import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as settingsService from '../services/settingsService';
import { uploadSettingsImages } from '../middleware/upload';

const router = express.Router();

// Helper to safely parse JSON, handling double/triple encoding
const safeParseJSON = (input: any, fallback: any = []): any => {
    if (input === null || input === undefined) return fallback;

    // If it's already an object/array, return it
    if (typeof input === 'object') return input;

    // If it's a string, try to parse it
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            // Recursively parse if the result is still a string
            if (typeof parsed === 'string') {
                return safeParseJSON(parsed, fallback);
            }
            return parsed;
        } catch (e) {
            console.warn('JSON parse failed for input:', input.substring(0, 50) + '...', e);
            return fallback;
        }
    }

    return fallback;
};

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
    async (req: any, res: express.Response) => {
        try {
            console.log('📝 Processing Settings Update Request');
            console.log('Raw about_values type:', typeof req.body.about_values);
            console.log('Raw about_values value:', req.body.about_values);

            const updates: settingsService.UpdateSettingsDTO = {};

            const currentSettings = await settingsService.getSettings();

            // Initialize about_slider_images logic
            let currentSliderImages: any[] = [];

            // 1. Handle about_slider_images with safe parser
            if (req.body.about_slider_images) {
                currentSliderImages = safeParseJSON(
                    req.body.about_slider_images,
                    currentSettings.about_slider_images || []
                );

                // Ensure it's an array
                if (!Array.isArray(currentSliderImages)) {
                    currentSliderImages = currentSettings.about_slider_images || [];
                }
            } else {
                currentSliderImages = currentSettings.about_slider_images || [];
            }

            // 2. Handle file uploads and append to the list
            if (req.files && typeof req.files === 'object') {
                const files = req.files as { [fieldname: string]: any[] };

                // Homepage Background
                if (files.homepage_background && files.homepage_background[0]) {
                    console.log('🖼️ Updating homepage_background:', files.homepage_background[0].path);
                    updates.homepage_background = files.homepage_background[0].path;
                }

                if (files.about_background && files.about_background[0]) {
                    console.log('🖼️ Updating about_background:', files.about_background[0].path);
                    updates.about_background = files.about_background[0].path;
                }

                // Site Logo
                if (files.site_logo && files.site_logo[0]) {
                    console.log('🖼️ Updating site_logo:', files.site_logo[0].path);
                    updates.site_logo = files.site_logo[0].path;
                }

                // Site Favicon
                if (files.site_favicon && files.site_favicon[0]) {
                    console.log('🖼️ Updating site_favicon:', files.site_favicon[0].path);
                    updates.site_favicon = files.site_favicon[0].path;
                }

                // About Slider Gallery - Append new uploads
                if (files.about_gallery && files.about_gallery.length > 0) {
                    const newImages = files.about_gallery.map(f => f.path);
                    console.log('🖼️ Appending new slider images:', newImages);
                    currentSliderImages = [...currentSliderImages, ...newImages];
                }
            }

            // 3. Assign final merged list to updates
            if (req.body.about_slider_images || (req.files && req.files['about_gallery'])) {
                updates.about_slider_images = currentSliderImages;
            }

            // Handle About Page fields
            if (req.body.about_hero_title) updates.about_hero_title = req.body.about_hero_title;
            if (req.body.about_hero_subtitle !== undefined) updates.about_hero_subtitle = req.body.about_hero_subtitle;
            if (req.body.about_mission_title) updates.about_mission_title = req.body.about_mission_title;
            if (req.body.about_mission_text) updates.about_mission_text = req.body.about_mission_text;
            if (req.body.about_stats_users) updates.about_stats_users = req.body.about_stats_users;
            if (req.body.about_stats_events) updates.about_stats_events = req.body.about_stats_events;

            if (req.body.about_values) {
                updates.about_values = safeParseJSON(req.body.about_values, []);
            }

            // Handle General Settings
            if (req.body.site_name) updates.site_name = req.body.site_name;
            if (req.body.site_description) updates.site_description = req.body.site_description;
            if (req.body.contact_email) updates.contact_email = req.body.contact_email;

            if (req.body.social_links) {
                updates.social_links = safeParseJSON(req.body.social_links, { facebook: "", instagram: "", twitter: "" });
            }

            if (req.body.site_logo_width !== undefined) {
                updates.site_logo_width = parseInt(req.body.site_logo_width);
            }

            if (req.body.site_logo_offset_x !== undefined) {
                updates.site_logo_offset_x = parseInt(req.body.site_logo_offset_x);
            }

            if (req.body.site_logo_offset_y !== undefined) {
                updates.site_logo_offset_y = parseInt(req.body.site_logo_offset_y);
            }

            // Handle Payment Settings
            // Note: FormData sends booleans as 'true'/'false' strings
            if (req.body.stripe_enabled !== undefined) updates.stripe_enabled = String(req.body.stripe_enabled) === 'true';
            if (req.body.stripe_public_key) updates.stripe_public_key = req.body.stripe_public_key;
            if (req.body.stripe_secret_key) updates.stripe_secret_key = req.body.stripe_secret_key;

            if (req.body.paypal_enabled !== undefined) updates.paypal_enabled = String(req.body.paypal_enabled) === 'true';
            if (req.body.paypal_client_id) updates.paypal_client_id = req.body.paypal_client_id;
            if (req.body.paypal_secret_key) updates.paypal_secret_key = req.body.paypal_secret_key;

            // Handle Season Pass Settings
            if (req.body.season_pass_enabled !== undefined) updates.season_pass_enabled = String(req.body.season_pass_enabled) === 'true';
            if (req.body.season_pass_title) updates.season_pass_title = req.body.season_pass_title;
            if (req.body.season_pass_description) updates.season_pass_description = req.body.season_pass_description;
            if (req.body.season_pass_price !== undefined) updates.season_pass_price = parseFloat(req.body.season_pass_price);
            if (req.body.season_pass_button_text) updates.season_pass_button_text = req.body.season_pass_button_text;

            console.log('Updates object prepared:', JSON.stringify(updates, null, 2));

            const settings = await settingsService.updateSettings(updates);

            res.json({
                success: true,
                data: settings,
                message: 'Settings updated successfully',
            });
        } catch (error: any) {
            console.error('❌ Error updating settings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update settings',
                error: error.message,
                stack: error.stack, // Return stack trace for debugging
                details: error.detail // Postgres error details
            });
        }
    }
);

export default router;
