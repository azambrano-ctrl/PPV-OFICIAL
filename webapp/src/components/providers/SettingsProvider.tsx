'use client';

import { useEffect } from 'react';
import { settingsAPI } from '@/lib/api';
import { useSettingsStore } from '@/lib/store';

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { setSettings, setLoading } = useSettingsStore();

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

    // Always render children immediately — Navbar handles its own hydration placeholder
    // to avoid blocking the entire app when localStorage is slow or empty
    return <>{children}</>;
}
