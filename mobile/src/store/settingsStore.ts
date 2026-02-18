import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
    site_name: string;
    site_logo: string | null;
    site_description: string | null;
    primary_color: string;
    secondary_color: string;
}

interface SettingsState {
    settings: Settings;
    setSettings: (settings: Settings) => void;
}

const defaultSettings: Settings = {
    site_name: 'ARENA FIGHT PASS',
    site_logo: null,
    site_description: null,
    primary_color: '#ef4444',
    secondary_color: '#0f172a',
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: defaultSettings,
            setSettings: (settings) => set({ settings }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
