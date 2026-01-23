import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'admin';
    is_verified: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;

    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isAdmin: false,

            setAuth: (user, accessToken, refreshToken) => {
                // Save to localStorage for API interceptor
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                // Save to cookies for middleware (server-side)
                document.cookie = `accessToken=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
                document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`;

                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    isAdmin: user.role === 'admin',
                });
            },

            setUser: (user) => set({ user }),

            logout: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                // Clear cookies
                document.cookie = 'accessToken=; path=/; max-age=0';
                document.cookie = 'refreshToken=; path=/; max-age=0';

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isAdmin: false,
                });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

// Events Store
interface Event {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    price: number;
    currency: string;
    thumbnail_url?: string;
    banner_url?: string;
    status: 'upcoming' | 'live' | 'finished' | 'cancelled';
    is_featured: boolean;
}

interface EventsState {
    events: Event[];
    currentEvent: Event | null;
    loading: boolean;
    error: string | null;

    setEvents: (events: Event[]) => void;
    setCurrentEvent: (event: Event | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useEventsStore = create<EventsState>((set) => ({
    events: [],
    currentEvent: null,
    loading: false,
    error: null,

    setEvents: (events) => set({ events }),
    setCurrentEvent: (event) => set({ currentEvent: event }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
}));

// UI Store
interface UIState {
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;

    toggleSidebar: () => void;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    mobileMenuOpen: false,

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    closeMobileMenu: () => set({ mobileMenuOpen: false }),
}));
