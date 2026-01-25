'use client';

import { useEffect } from 'react';
import { settingsAPI } from '@/lib/api';
import { useSettingsStore } from '@/lib/store';

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { hasHydrated, setSettings, setLoading } = useSettingsStore();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await settingsAPI.get();
                if (data.success) {
                    setSettings(data.data);
                }
            } catch (error) {
                console.error('Failed to load global settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [setSettings, setLoading]);

    // Prevent rendering children (and components like Navbar) until we have hydrated from localStorage
    // This avoids the "flash" of default branding (FOUC)
    if (!hasHydrated) {
        return (
            <div className="fixed inset-0 bg-dark-950 flex items-center justify-center z-[9999]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
                    <p className="text-dark-400 font-medium animate-pulse">Cargando...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
