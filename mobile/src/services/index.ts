import api from './api';

export const authService = {
    login: async (email: string, pass: string) => {
        const response = await api.post('/auth/login', { email, password: pass });
        return response.data;
    },
    register: async (userData: any) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    getPurchases: async () => {
        const response = await api.get('/auth/purchases');
        return response.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await api.post('/auth/change-password', { currentPassword, newPassword });
        return response.data;
    },
    socialLogin: async (provider: string, token: string) => {
        const response = await api.post('/oauth/login', { provider, token });
        return response.data;
    },
    updatePushToken: async (token: string | null) => {
        const response = await api.post('/auth/push-token', { token });
        return response.data;
    }
};

export const eventService = {
    getAll: async () => {
        const response = await api.get('/events');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },
    checkAccess: async (id: string) => {
        const response = await api.get(`/events/${id}/access`);
        return response.data;
    }
};

export const settingsService = {
    get: async () => {
        const response = await api.get('/settings');
        return response.data;
    }
};
