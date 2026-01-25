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
    async (req: any, res: express.Response) => {
        try {
            console.log('📝 Processing Settings Update Request');
            console.log('Raw about_values type:', typeof req.body.about_values);
            console.log('Raw about_values value:', req.body.about_values);

            const updates: settingsService.UpdateSettingsDTO = {};

            const currentSettings = await settingsService.getSettings();

            // Initialize about_slider_images logic
            let currentSliderImages: any[] = [];

            // 1. First take what's in the body (this represents the user's intent for existing images, e.g. after deletions)
            if (req.body.about_slider_images) {
                try {
                    const parsed = typeof req.body.about_slider_images === 'string'
                        ? JSON.parse(req.body.about_slider_images)
                        : req.body.about_slider_images;

                    // Extra safety check for double encoding
                    if (typeof parsed === 'string') {
                        console.warn('about_slider_images parsed to string (double encoded?), re-parsing...');
                        const doubleParsed = JSON.parse(parsed);
                        if (Array.isArray(doubleParsed)) {
                            currentSliderImages = doubleParsed;
                        }
                    } else if (Array.isArray(parsed)) {
                        currentSliderImages = parsed;
                    }
                } catch (e) {
                    console.warn('Failed to parse about_slider_images', e);
                    // If parsing fails, fall back to current DB state to be safe
                    currentSliderImages = currentSettings.about_slider_images || [];
                }
            } else {
                // If field not present in body, we assume we start with existing DB state
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
            if (req.body.about_hero_subtitle) updates.about_hero_subtitle = req.body.about_hero_subtitle;
            if (req.body.about_mission_title) updates.about_mission_title = req.body.about_mission_title;
            if (req.body.about_mission_text) updates.about_mission_text = req.body.about_mission_text;

            if (req.body.about_values) {
                try {
                    // If it's a string (from FormData), parse it. If already object, use as is.
                    const parsed = typeof req.body.about_values === 'string'
                        ? JSON.parse(req.body.about_values)
                        : req.body.about_values;

                    console.log('Parsed about_values:', parsed);

                    // Extra safety check: ensure it is object/array, not a string
                    if (typeof parsed === 'string') {
                        console.warn('about_values parsed to string (double encoded?), re-parsing...');
                        updates.about_values = JSON.parse(parsed);
                    } else {
                        updates.about_values = parsed;
                    }
                } catch (e) {
                    console.warn('Failed to parse about_values', e);
                    console.log('Value that failed parse:', req.body.about_values);
                }
            }

            // Handle General Settings
            if (req.body.site_name) updates.site_name = req.body.site_name;
            if (req.body.site_description) updates.site_description = req.body.site_description;
            if (req.body.contact_email) updates.contact_email = req.body.contact_email;

            if (req.body.social_links) {
                try {
                    const parsed = typeof req.body.social_links === 'string'
                        ? JSON.parse(req.body.social_links)
                        : req.body.social_links;

                    // Extra safety check: ensure it is object/array, not a string
                    if (typeof parsed === 'string') {
                        console.warn('social_links parsed to string (double encoded?), re-parsing...');
                        updates.social_links = JSON.parse(parsed);
                    } else {
                        updates.social_links = parsed;
                    }
                } catch (e) {
                    console.warn('Failed to parse social_links', e);
                }
            }

            // Handle Payment Settings
            // Note: FormData sends booleans as 'true'/'false' strings
            if (req.body.stripe_enabled !== undefined) updates.stripe_enabled = String(req.body.stripe_enabled) === 'true';
            if (req.body.stripe_public_key) updates.stripe_public_key = req.body.stripe_public_key;
            if (req.body.stripe_secret_key) updates.stripe_secret_key = req.body.stripe_secret_key;

            if (req.body.paypal_enabled !== undefined) updates.paypal_enabled = String(req.body.paypal_enabled) === 'true';
            if (req.body.paypal_client_id) updates.paypal_client_id = req.body.paypal_client_id;
            if (req.body.paypal_secret_key) updates.paypal_secret_key = req.body.paypal_secret_key;

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
