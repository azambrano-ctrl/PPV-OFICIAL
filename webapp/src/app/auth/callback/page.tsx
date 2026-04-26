'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams.get('error');

        if (error) {
            const errorData = { type: 'AUTH_ERROR', error };
            const bc = new BroadcastChannel('auth_channel');
            bc.postMessage(errorData);
            setTimeout(() => bc.close(), 500);
            if (window.opener) {
                window.opener.postMessage(errorData, window.location.origin);
                window.close();
            } else {
                router.push(`/auth/login?error=${error}`);
            }
            return;
        }

        // Exchange HttpOnly cookie for tokens via secure API call
        fetch(`${API_URL}/api/auth/session`, {
            method: 'GET',
            credentials: 'include',
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data.success) throw new Error(data.message || 'Session error');

                const { accessToken, refreshToken, user } = data.data;
                const authData = {
                    type: 'AUTH_SUCCESS',
                    user,
                    accessToken,
                    refreshToken,
                };

                // 1. BroadcastChannel (Modern)
                const bc = new BroadcastChannel('auth_channel');
                bc.postMessage(authData);
                setTimeout(() => bc.close(), 1000);

                // 2. window.opener.postMessage (Classic popup flow)
                if (window.opener) {
                    try {
                        window.opener.postMessage(authData, window.location.origin);
                    } catch (e) {
                        console.warn('Failed to postMessage to opener', e);
                    }
                }

                const isPopup =
                    window.opener || window.name.includes('Login') || window.innerWidth < 800;

                if (isPopup) {
                    window.close();
                    setTimeout(() => window.close(), 100);
                    setTimeout(() => window.close(), 500);
                    setTimeout(() => window.close(), 1000);
                    return;
                }

                // Regular redirect flow
                useAuthStore.getState().setAuth(user, accessToken, refreshToken);
                router.push(user.role === 'admin' ? '/admin' : '/');
            })
            .catch((err) => {
                console.error('Error processing OAuth callback:', err);
                const errorData = { type: 'AUTH_ERROR', error: 'invalid_callback' };
                const bc = new BroadcastChannel('auth_channel');
                bc.postMessage(errorData);
                setTimeout(() => bc.close(), 500);
                if (window.opener) {
                    window.opener.postMessage(errorData, window.location.origin);
                } else {
                    router.push('/auth/login?error=invalid_callback');
                }
            });
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
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
        <Suspense
            fallback={
                <div className="min-h-screen bg-black flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            }
        >
            <AuthCallbackContent />
        </Suspense>
    );
}
