import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                if (typeof window === 'undefined') {
                    throw new Error('Cannot refresh token on server');
                }

                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Try to refresh token
                const response = await axios.post(`${API_URL}/api/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                // Save new tokens
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - logout user
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/auth/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// API Methods
export const authAPI = {
    register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
        api.post('/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),

    getProfile: () =>
        api.get('/auth/me'),

    updateProfile: (data: { full_name?: string; phone?: string }) =>
        api.put('/auth/profile', data),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        api.post('/auth/change-password', data),

    getPurchases: () =>
        api.get('/auth/purchases'),

    getAllUsers: () =>
        api.get('/auth/users'),

    updateUserRole: (userId: string, role: 'user' | 'admin') =>
        api.put(`/auth/users/${userId}/role`, { role }),
};

export const eventsAPI = {
    getAll: (params?: { status?: string; featured?: boolean; upcoming?: boolean }) =>
        api.get('/events', { params }),

    getById: (id: string) =>
        api.get(`/events/${id}`),

    create: (data: any) => {
        // If data is FormData, we need to let axios set the Content-Type automatically
        // to include the boundary parameter for multipart/form-data
        const config = data instanceof FormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        } : {};
        return api.post('/events', data, config);
    },

    update: (id: string, data: any) => {
        // Handle FormData for image uploads
        const config = data instanceof FormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        } : {};
        return api.put(`/events/${id}`, data, config);
    },

    delete: (id: string) =>
        api.delete(`/events/${id}`),

    getStats: (id: string) =>
        api.get(`/events/${id}/stats`),

    checkAccess: (id: string) =>
        api.get(`/events/${id}/access`),

    updateStatus: (id: string, status: string) =>
        api.patch(`/events/${id}/status`, { status }),
};

export const paymentsAPI = {
    createPayment: (data: { eventId: string; paymentMethod: 'stripe' | 'paypal'; couponCode?: string }) =>
        api.post('/payments/create', data),

    capturePayPal: (orderId: string) =>
        api.post('/payments/paypal/capture', { orderId }),

    refund: (purchaseId: string) =>
        api.post(`/payments/refund/${purchaseId}`),
};

export const streamingAPI = {
    getToken: (eventId: string) =>
        api.get(`/streaming/${eventId}/token`),

    getUrl: (eventId: string) =>
        api.get(`/streaming/${eventId}/url`),

    revokeTokens: (eventId: string, userId: string) =>
        api.post(`/streaming/${eventId}/revoke`, { userId }),
};

// Error handler helper
export const handleAPIError = (error: any): string => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        return message;
    }
    return 'An unexpected error occurred';
};

export default api;
