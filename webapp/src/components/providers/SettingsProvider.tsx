'use client';

import { useEffect } from 'react';
import { settingsAPI } from '@/lib/api';
import { useSettingsStore } from '@/lib/store';

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { initialized, setSettings, setLoading } = useSettingsStore();

    useEffect(() => {
        const fetchSettings = async () => {
            // If already initialized (from cache), maybe don't show loading UI
            // unless we want a very strict freshness.
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

    return <>{children}</>;
}
