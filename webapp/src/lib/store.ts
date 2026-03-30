import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'admin' | 'promoter';
    promoter_id?: string;
    is_verified: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isPromoter: boolean;

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
            isPromoter: false,

            setAuth: (user, accessToken, refreshToken) => {
                // Save to localStorage for API interceptor
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                // Cookies are now handled by the server (HttpOnly)
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    isAdmin: user.role === 'admin',
                    isPromoter: user.role === 'promoter',
                });
            },

            setUser: (user) => set({ user }),

            logout: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                // Server-side logout should be called by the component or here via a separate fetch
                // to avoid circular dependency with api.ts. We'll use native fetch for simplicity.
                const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
                fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
                    .catch(err => console.error('Error during server logout:', err));

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isAdmin: false,
                    isPromoter: false,
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

// Settings Store
interface Settings {
    site_name: string;
    site_logo: string | null;
    site_logo_width: number;
    site_logo_offset_x: number;
    site_logo_offset_y: number;
    site_description: string;
    contact_email: string;
    homepage_background: string | null;
    social_links: {
        facebook: string;
        instagram: string;
        twitter: string;
    };
    season_pass_enabled: boolean;
    season_pass_title: string;
    season_pass_description: string;
    season_pass_price: number;
    season_pass_button_text: string;
    [key: string]: any;
}

interface SettingsState {
    settings: Settings | null;
    loading: boolean;
    initialized: boolean;
    hasHydrated: boolean;
    setSettings: (settings: Settings) => void;
    setLoading: (loading: boolean) => void;
    setHasHydrated: (state: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: null,
            loading: false,
            initialized: false,
            hasHydrated: false,
            setSettings: (settings) => set({ settings, initialized: true }),
            setLoading: (loading) => set({ loading }),
            setHasHydrated: (state) => set({ hasHydrated: state }),
        }),
        {
            name: 'settings-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
