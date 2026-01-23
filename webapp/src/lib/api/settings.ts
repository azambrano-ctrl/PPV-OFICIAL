import api from '../api';

export interface Settings {
    id: string;
    homepage_background: string | null;
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
