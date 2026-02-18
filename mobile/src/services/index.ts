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
        const response = await api.get('/auth/profile');
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
