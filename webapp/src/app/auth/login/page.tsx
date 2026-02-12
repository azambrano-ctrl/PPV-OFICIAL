'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI, handleAPIError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            const response = await authAPI.login(data);
            const { user, accessToken, refreshToken } = response.data.data;

            setAuth(user, accessToken, refreshToken);
            toast.success('¡Bienvenido de vuelta!');

            if (user.role === 'admin') {
                router.push('/admin');
            } else if (user.role === 'promoter') {
                router.push('/promoter-dashboard');
            } else {
                router.push('/events');
            }
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: 'google' | 'facebook') => {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}`;
        const windowFeatures = `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`;
        window.open(url, `Login with ${provider}`, windowFeatures);
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'AUTH_SUCCESS') {
                const { user, accessToken, refreshToken } = event.data;
                setAuth(user, accessToken, refreshToken);
                toast.success('¡Bienvenido de vuelta!');
                if (user.role === 'admin') router.push('/admin');
                else if (user.role === 'promoter') router.push('/promoter-dashboard');
                else router.push('/events');
            } else if (event.data?.type === 'AUTH_ERROR') {
                toast.error(event.data.error || 'Error al iniciar sesión');
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [router, setAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Cinematic Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-top bg-no-repeat transition-opacity duration-1000"
                style={{ backgroundImage: "url('/images/octagon-bg.png')" }}
            >
                {/* Darker overlay to ensure text visibility */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            </div>

            <div className="max-w-xl w-full relative z-10">
                {/* Logo / Title Area - Matching Image 3 exactly */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-display font-black text-white mb-2 uppercase tracking-tighter italic scale-y-110">
                        INGRESA AL<br />
                        <span className="text-6xl tracking-tight">OCTÁGONO</span>
                    </h1>
                    <div className="h-[4px] w-48 bg-red-600 mx-auto mb-4" />
                    <p className="text-gray-300 text-sm font-black tracking-[0.4em] uppercase opacity-90">
                        Welcome Fighter
                    </p>
                </div>

                {/* Form Wrapper - Higher contrast as requested */}
                <div className="bg-[#2D2D35]/90 backdrop-blur-xl p-10 rounded-2xl border border-white/10 relative shadow-[0_0_100px_rgba(0,0,0,1)]">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                        {/* Email */}
                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600/30 transition-all uppercase text-xs tracking-widest font-bold"
                                    placeholder="EMAIL ADDRESS"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-[10px] text-red-500 font-bold uppercase tracking-widest">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600/30 transition-all uppercase text-xs tracking-widest font-bold"
                                    placeholder="PASSWORD"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-[10px] text-red-500 font-bold uppercase tracking-widest">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-[0.3em] text-sm rounded shadow-2xl transition-all transform active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'CARGANDO...' : 'LOG IN'}
                        </button>

                        <div className="text-center">
                            <Link
                                href="/auth/forgot-password"
                                className="text-[11px] text-gray-400 hover:text-white uppercase font-black tracking-widest transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </form>

                    {/* Social Divider */}
                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.5em]">
                            <span className="px-5 bg-[#2D2D35] text-gray-400">Social Access</span>
                        </div>
                    </div>

                    {/* Social Login Buttons - Higher contrast and white text */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            className="flex items-center justify-center py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-white text-[11px] font-black uppercase tracking-widest shadow-lg"
                        >
                            <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('facebook')}
                            className="flex items-center justify-center py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all text-white text-[11px] font-black uppercase tracking-widest shadow-lg"
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>
                </div>

                {/* Footer Link Promoter */}
                <div className="mt-10 text-center space-y-6">
                    <p className="text-sm text-gray-400 uppercase font-black tracking-[0.3em]">
                        ¿No tienes una cuenta?{' '}
                        <span className="text-white hover:text-red-500 transition-colors">
                            <Link href="/auth/register">REGÍSTRATE</Link>
                        </span>
                    </p>
                    <div className="h-px w-10 bg-white/10 mx-auto" />
                    <Link href="/promoter/register" className="inline-block text-[9px] text-red-600 hover:text-red-400 uppercase font-black tracking-[0.5em] border border-red-950/20 bg-red-600/5 px-8 py-3 rounded-lg transition-all">
                        REGÍSTRATE COMO PROMOTORA
                    </Link>
                </div>
            </div>
        </div>
    );
}
