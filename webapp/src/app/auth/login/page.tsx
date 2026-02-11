'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Swords } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-display">
            {/* High-Fidelity Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80"
                style={{ backgroundImage: "url('/images/octagon-bg.png')" }}
            >
                {/* Dark overlay to ensure contrast */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Logo / Header Area */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-600/10 border border-red-600/30 mb-4 shadow-[0_0_20px_rgba(220,38,38,0.2)] animate-pulse">
                        <Swords className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-gray-300 text-[10px] font-black tracking-[0.5em] uppercase opacity-90">
                        Welcome Fighter
                    </p>
                </div>

                {/* Form Wrapper - Ultra Dark Glass */}
                <div className="bg-[#111118]/80 backdrop-blur-2xl p-8 rounded-2xl border border-white/5 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                    {/* Interior Glows */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-[60px]" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/5 rounded-full blur-[60px]" />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                        {/* Email */}
                        <div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-600/50 focus:bg-white/[0.08] transition-all uppercase text-[10px] tracking-widest font-bold"
                                    placeholder="EMAIL ADDRESS"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-[9px] text-red-500 font-bold uppercase tracking-widest pl-2">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-600/50 focus:bg-white/[0.08] transition-all uppercase text-[10px] tracking-widest font-bold"
                                    placeholder="PASSWORD"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-[9px] text-red-500 font-bold uppercase tracking-widest pl-2">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Forgot Password */}
                        <div className="text-center">
                            <Link
                                href="/auth/forgot-password"
                                className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-[0.3em] text-[11px] rounded transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                        >
                            {loading ? 'CARGANDO...' : 'INGRESA AL OCTÁGONO'}
                        </button>
                    </form>

                    {/* Social Divider */}
                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/[0.05]" />
                        </div>
                        <div className="relative flex justify-center text-[7px] font-black uppercase tracking-[0.6em]">
                            <span className="px-5 bg-[#111118] text-gray-600">Secure Access</span>
                        </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            className="flex items-center justify-center py-4 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 rounded-xl transition-all text-white text-[9px] font-black uppercase tracking-widest"
                        >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
                            className="flex items-center justify-center py-4 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 rounded-xl transition-all text-white text-[9px] font-black uppercase tracking-widest"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-10 text-center space-y-5">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.3em]">
                        ¿No tienes una cuenta?{' '}
                        <Link href="/auth/register" className="text-white hover:text-red-500 transition-colors">
                            Regístrate
                        </Link>
                    </p>
                    <div className="h-px w-8 bg-white/5 mx-auto" />
                    <Link href="/promoter/register" className="inline-block text-[8px] text-red-600/80 hover:text-red-500 uppercase font-black tracking-[0.4em] border border-red-950/30 px-6 py-2 rounded-lg transition-all">
                        REGÍSTRATE COMO PROMOTORA
                    </Link>
                </div>
            </div>
        </div>
    );
}
