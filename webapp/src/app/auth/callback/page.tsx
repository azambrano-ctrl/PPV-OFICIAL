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
                const authData = {
                    type: 'AUTH_SUCCESS',
                    user,
                    accessToken: token,
                    refreshToken: refresh
                };

                // 1. Try BroadcastChannel (Modern & Robust)
                const bc = new BroadcastChannel('auth_channel');
                bc.postMessage(authData);
                setTimeout(() => bc.close(), 1000);

                // 2. Try window.opener.postMessage (Classic)
                if (window.opener) {
                    try {
                        window.opener.postMessage(authData, window.location.origin);
                    } catch (e) {
                        console.warn('Failed to postMessage to opener', e);
                    }
                }

                // Detect if we are in a popup
                const isPopup = window.opener || window.name.includes('Login') || window.innerWidth < 800;

                if (isPopup) {
                    // AGGRESSIVE CLOSING: Try to close multiple times
                    window.close();
                    setTimeout(() => window.close(), 100);
                    setTimeout(() => window.close(), 500);
                    setTimeout(() => window.close(), 1000);

                    // Do NOT redirect if it's a popup, just stay on the "Authenticating" UI
                    // until it closes. This prevents the "duplicate site" inside the popup.
                    return;
                }

                // If NOT a popup (regular redirect), then definitely push to home
                useAuthStore.getState().setAuth(user, token, refresh);
                if (user.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            } catch (err) {
                console.error('Error processing OAuth callback:', err);
                const errorData = { type: 'AUTH_ERROR', error: 'invalid_callback' };

                const bc = new BroadcastChannel('auth_channel');
                bc.postMessage(errorData);
                setTimeout(() => bc.close(), 500);

                if (window.opener) {
                    window.opener.postMessage(errorData, window.location.origin);
                }

                if (!window.opener) {
                    router.push('/auth/login?error=invalid_callback');
                }
            }
        } else {
            const errorData = { type: 'AUTH_ERROR', error: 'missing_params' };
            const bc = new BroadcastChannel('auth_channel');
            bc.postMessage(errorData);
            setTimeout(() => bc.close(), 500);

            if (window.opener) {
                window.opener.postMessage(errorData, window.location.origin);
            }

            if (!window.opener) {
                router.push('/auth/login?error=missing_params');
            }
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-600/10 blur-[100px] rounded-full" />

            <div className="text-center bg-[#1a1a20]/90 backdrop-blur-xl p-10 rounded-2xl border border-white/5 shadow-2xl max-w-sm w-full relative z-10">
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="w-16 h-16 border-2 border-red-600/30 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-t-2 border-red-600 rounded-full animate-spin" />
                    </div>
                </div>

                <h2 className="text-2xl font-display font-black text-white mb-2 uppercase tracking-tighter italic scale-y-110">
                    {searchParams.get('error') ? 'ERROR DE ACCESO' : 'AUTENTICANDO'}
                </h2>
                <div className="h-[2px] w-12 bg-red-600 mx-auto mb-4" />

                <p className="text-gray-400 text-[10px] mb-10 uppercase tracking-[0.3em] font-black leading-relaxed">
                    {searchParams.get('error')
                        ? 'Hubo un problema al ingresar'
                        : 'Preparando tu acceso al octágono'}
                </p>

                <button
                    onClick={() => window.close()}
                    className="w-full py-4 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-[0.2em] text-[11px] rounded transition-all transform active:scale-[0.98] shadow-xl"
                >
                    CONTINUAR
                </button>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
