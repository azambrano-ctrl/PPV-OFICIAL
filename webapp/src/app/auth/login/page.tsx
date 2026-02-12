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
        <div className="h-screen w-full flex items-center justify-center bg-black relative overflow-hidden px-4">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-90"
                style={{ backgroundImage: "url('/images/octagon-bg.png')" }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            </div>

            {/* Enhanced CSS Spotlights */}
            <div className="absolute top-0 left-0 right-0 h-[40vh] z-[1] pointer-events-none flex justify-between px-10">
                <div className="w-[150px] h-[300px] bg-white opacity-10 blur-[80px] rounded-full rotate-[25deg] -translate-y-20" />
                <div className="w-[130px] h-[300px] bg-white opacity-15 blur-[60px] rounded-full rotate-[12deg] -translate-y-20" />
                <div className="w-[130px] h-[300px] bg-white opacity-20 blur-[50px] rounded-full -translate-y-20" />
                <div className="w-[130px] h-[300px] bg-white opacity-15 blur-[60px] rounded-full -rotate-[12deg] -translate-y-20" />
                <div className="w-[150px] h-[300px] bg-white opacity-10 blur-[80px] rounded-full -rotate-[25deg] -translate-y-20" />
            </div>

            <div className="max-w-md w-full relative z-10 flex flex-col items-center">
                {/* Logo / Title Area */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-display font-black text-white mb-1 uppercase tracking-tighter italic scale-y-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        INGRESA AL<br />
                        <span className="text-4xl tracking-tight">OCTÁGONO</span>
                    </h1>
                    <div className="h-[2px] w-24 bg-red-600 mx-auto mb-2" />
                    <p className="text-gray-300 text-[9px] font-black tracking-[0.4em] uppercase opacity-90">
                        Welcome Fighter
                    </p>
                </div>

                {/* Form Card - Narrower and more compact */}
                <div className="w-full bg-[#1a1a20]/90 backdrop-blur-2xl p-7 rounded-2xl border border-white/5 relative shadow-[0_0_80px_rgba(0,0,0,0.9)]">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
                        {/* Email */}
                        <div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-3.5 w-3.5 text-gray-500 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-600/40 transition-all uppercase text-[9px] tracking-widest font-bold"
                                    placeholder="EMAIL ADDRESS"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-[8px] text-red-500 font-bold uppercase tracking-widest pl-2">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-3.5 w-3.5 text-gray-500 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-600/40 transition-all uppercase text-[9px] tracking-widest font-bold"
                                    placeholder="PASSWORD"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-[8px] text-red-500 font-bold uppercase tracking-widest pl-2">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-lg"
                        >
                            {loading ? 'CARGANDO...' : 'LOG IN'}
                        </button>

                        <div className="text-center">
                            <Link
                                href="/auth/forgot-password"
                                className="text-[9px] text-gray-500 hover:text-white uppercase font-black tracking-widest transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </form>

                    {/* Social Divider */}
                    <div className="relative my-7">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/[0.05]" />
                        </div>
                        <div className="relative flex justify-center text-[7px] font-black uppercase tracking-[0.4em]">
                            <span className="px-3 bg-[#1a1a20] text-gray-500">Social Access</span>
                        </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            className="flex items-center justify-center py-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl transition-all text-white text-[9px] font-black uppercase tracking-widest"
                        >
                            <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('facebook')}
                            className="flex items-center justify-center py-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl transition-all text-white text-[9px] font-black uppercase tracking-widest"
                        >
                            <svg className="w-3.5 h-3.5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-6 text-center space-y-3">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">
                        ¿No tienes una cuenta?{' '}
                        <Link href="/auth/register" className="text-white hover:text-red-500 transition-colors">
                            Regístrate
                        </Link>
                    </p>
                    <div className="h-px w-6 bg-white/5 mx-auto" />
                    <Link href="/promoter/register" className="inline-block text-[7px] text-red-600/80 hover:text-red-500 uppercase font-black tracking-[0.3em] border border-red-950/30 px-5 py-2 rounded-lg transition-all bg-red-600/5">
                        REGÍSTRATE COMO PROMOTORA
                    </Link>
                </div>
            </div>
        </div>
    );
}
