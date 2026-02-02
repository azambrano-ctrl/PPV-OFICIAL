import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
    withCredentials: true,
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
        const errorCode = (error.response?.data as any)?.code;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Break loop immediately for session conflicts or missing session IDs
            if (errorCode === 'SESSION_INVALID' || errorCode === 'SESSION_CONFLICT') {
                if (typeof window !== 'undefined') {
                    useAuthStore.getState().logout();
                    if (!window.location.pathname.startsWith('/auth') && window.location.pathname !== '/admin-auth') {
                        window.location.href = '/auth/login';
                    }
                }
                return Promise.reject(error);
            }

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
                    useAuthStore.getState().logout();

                    // Only redirect if not already on an auth page to prevent loops
                    if (!window.location.pathname.startsWith('/auth') && window.location.pathname !== '/admin-auth') {
                        window.location.href = '/auth/login';
                    }
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

    updateUserRole: (userId: string, role: 'user' | 'admin' | 'promoter') =>
        api.put(`/auth/users/${userId}/role`, { role }),

    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),

    resetPassword: (token: string, password: string) =>
        api.post('/reset-password', { token, password }),

    deleteUser: (userId: string) =>
        api.delete(`/auth/users/${userId}`),
};

export const eventsAPI = {
    getAll: (params?: { status?: string; featured?: boolean; upcoming?: boolean; promoter_id?: string }) =>
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
    createPayment: (data: { eventId?: string; purchaseType?: 'event' | 'season_pass'; paymentMethod: 'stripe' | 'paypal'; couponCode?: string }) =>
        api.post('/payments/create', data),

    capturePayPal: (orderId: string) =>
        api.post('/payments/paypal/capture', { orderId }),

    checkSeasonPass: () =>
        api.get('/payments/check-season-pass'),

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

export const settingsAPI = {
    get: () => api.get('/settings'),
    update: (data: any) => {
        const config = data instanceof FormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        } : {};
        return api.put('/settings', data, config);
    }
};

export const adminAPI = {
    getStats: () =>
        api.get('/admin/stats'),

    getRecentPurchases: (limit?: number) =>
        api.get('/admin/purchases/recent', { params: { limit } }),
};

export const newsletterAPI = {
    subscribe: (email: string) =>
        api.post('/newsletter/subscribe', { email }),
};

export const statsAPI = {
    getPublicStats: () =>
        api.get('/public-stats'),
};

export const promotersAPI = {
    getAll: () =>
        api.get('/promoters'),

    getById: (id: string) =>
        api.get(`/promoters/${id}`),

    create: (data: any) => {
        const config = data instanceof FormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        } : {};
        return api.post('/promoters', data, config);
    },

    update: (id: string, data: any) => {
        const config = data instanceof FormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        } : {};
        return api.put(`/promoters/${id}`, data, config);
    },

    delete: (id: string) =>
        api.delete(`/promoters/${id}`),

    register: (data: { name: string; description?: string; email: string; password: string; phone: string; city: string }) =>
        api.post('/promoters/register', data),

    updateStatus: (id: string, status: 'pending' | 'active' | 'suspended') =>
        api.patch(`/promoters/${id}/status`, { status }),

    getStats: () =>
        api.get('/promoters/my/stats'),
};

export const notificationsAPI = {
    getAll: () =>
        api.get('/notifications'),

    markAsRead: (id: string) =>
        api.patch(`/notifications/${id}/read`),

    markAllAsRead: () =>
        api.patch('/notifications/read-all'),
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
