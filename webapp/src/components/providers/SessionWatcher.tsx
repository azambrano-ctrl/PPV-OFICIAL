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
            // Initial check after mount/login
            checkSession();

            // Set up interval (every 30 seconds is enough to not overload the server 
            // but still feel "proactive")
            checkInterval.current = setInterval(checkSession, 30000);
        } else {
            // Clean up if not authenticated
            if (checkInterval.current) {
                clearInterval(checkInterval.current);
            }
        }

        return () => {
            if (checkInterval.current) {
                clearInterval(checkInterval.current);
            }
        };
    }, [isAuthenticated, setUser]);

    return null; // This component doesn't render anything
}
