import api from '../api';

export interface Settings {
    id: string;
    homepage_background: string | null;
    homepage_video: string | null;
    homepage_slider: string[];
    about_hero_title: string;
    about_hero_subtitle: string;
    about_background: string | null;
    about_mission_title: string;
    about_mission_text: string;
    about_values: any[];
    about_slider_images: string[];
    about_stats_users: string;
    about_stats_events: string;
    site_name: string;
    site_description: string;
    contact_email: string;
    social_links: { facebook: string; instagram: string; twitter: string };
    site_logo: string | null;
    site_logo_width: number;
    site_logo_offset_x: number;
    site_logo_offset_y: number;
    site_favicon: string | null;
    stripe_enabled: boolean;
    stripe_public_key: string;
    stripe_secret_key: string;
    paypal_enabled: boolean;
    paypal_client_id: string;
    paypal_secret_key: string;
    season_pass_enabled: boolean;
    season_pass_title: string;
    season_pass_description: string;
    season_pass_price: number;
    season_pass_button_text: string;
    created_at: string;
    updated_at: string;
}

export const settingsAPI = {
    /**
     * Get application settings (public)
     */
    getSettings: async () => {
        return api.get<Settings>('/settings');
    },

    /**
     * Update application settings (admin only)
     */
    updateSettings: async (formData: FormData) => {
        return api.put<Settings>('/settings', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};
