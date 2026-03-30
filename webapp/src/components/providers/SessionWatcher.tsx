'use client';

import { useEffect, useRef } from 'react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

/**
 * Component that periodically checks if the current session is still valid.
 * If another device logs in, the backend will return 401 SESSION_CONFLICT,
 * and the axios interceptor will handle the logout and redirect.
 */
export default function SessionWatcher() {
    const { isAuthenticated, setUser, logout } = useAuthStore();
    const checkInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            if (!isAuthenticated) return;

            try {
                // We call /me which is protected by authenticate middleware
                const response = await authAPI.getProfile();
                if (response.data?.data) {
                    setUser(response.data.data);
                }
            } catch (error: any) {
                // Errors (like 401 SESSION_CONFLICT) are handled by the axios interceptor,
                // which will call logout() and redirect to login page.
                console.debug('[SessionWatcher] Session check failed, loop-breaker will handle it');
            }
        };

        // Start watching if authenticated
        if (isAuthenticated) {
            // Initial check after mount/login to ensure session is valid
            checkSession();
        }
    }, [isAuthenticated, setUser]);

    return null; // This component doesn't render anything
}
