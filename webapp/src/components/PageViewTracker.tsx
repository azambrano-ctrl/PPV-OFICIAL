'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Don't track admin pages
        if (pathname.startsWith('/admin')) return;

        const trackView = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                await fetch(`${apiUrl}/api/analytics/pageview`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(typeof window !== 'undefined' && localStorage.getItem('accessToken')
                            ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
                            : {}),
                    },
                    body: JSON.stringify({ page: pathname }),
                });
            } catch (err) {
                // Silently fail - don't break the app for analytics
            }
        };

        trackView();
    }, [pathname]);

    return null; // This component doesn't render anything
}
