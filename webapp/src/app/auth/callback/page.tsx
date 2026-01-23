'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        const userStr = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
            // Redirect to login with error
            router.push(`/auth/login?error=${error}`);
            return;
        }

        if (token && refresh && userStr) {
            try {
                // Parse user data first
                const user = JSON.parse(decodeURIComponent(userStr));

                // Use store action to set auth state consistently
                // This handles localStorage and state updates
                // Note: backend sends 'token' param but store expects 'accessToken'
                useAuthStore.getState().setAuth(user, token, refresh);

                // Redirect based on role
                if (user.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            } catch (err) {
                console.error('Error processing OAuth callback:', err);
                router.push('/auth/login?error=invalid_callback');
            }
        } else {
            router.push('/auth/login?error=missing_params');
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center">
            <div className="text-center">
                <div className="spinner mb-4"></div>
                <p className="text-dark-300">Completing sign in...</p>
            </div>
        </div>
    );
}
