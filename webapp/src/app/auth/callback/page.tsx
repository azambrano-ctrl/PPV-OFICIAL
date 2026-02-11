'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        const userStr = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
            if (window.opener) {
                window.opener.postMessage({ type: 'AUTH_ERROR', error }, window.location.origin);
                window.close();
            } else {
                router.push(`/auth/login?error=${error}`);
            }
            return;
        }

        if (token && refresh && userStr) {
            try {
                // Parse user data first
                const user = JSON.parse(decodeURIComponent(userStr));

                if (window.opener) {
                    // If we are in a popup, send data back and close
                    window.opener.postMessage({
                        type: 'AUTH_SUCCESS',
                        user,
                        accessToken: token,
                        refreshToken: refresh
                    }, window.location.origin);
                    window.close();
                } else {
                    // Regular redirect flow
                    useAuthStore.getState().setAuth(user, token, refresh);
                    if (user.role === 'admin') {
                        router.push('/admin');
                    } else {
                        router.push('/');
                    }
                }
            } catch (err) {
                console.error('Error processing OAuth callback:', err);
                if (window.opener) {
                    window.opener.postMessage({ type: 'AUTH_ERROR', error: 'invalid_callback' }, window.location.origin);
                    window.close();
                } else {
                    router.push('/auth/login?error=invalid_callback');
                }
            }
        } else {
            if (window.opener) {
                window.opener.postMessage({ type: 'AUTH_ERROR', error: 'missing_params' }, window.location.origin);
                window.close();
            } else {
                router.push('/auth/login?error=missing_params');
            }
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

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
