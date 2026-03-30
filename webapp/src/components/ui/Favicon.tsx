'use client';

import { useSettingsStore } from '@/lib/store';

export default function Favicon() {
    const { settings } = useSettingsStore();

    // Default favicon if none is set
    const faviconUrl = settings?.site_favicon || '/favicon.ico';

    return (
        <link rel="icon" href={faviconUrl} />
    );
}
