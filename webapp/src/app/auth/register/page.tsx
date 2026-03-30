'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, Eye, EyeOff, UserPlus } from 'lucide-react';
import { authAPI, handleAPIError } from '@/lib/api';
import { useAuthStore, useSettingsStore } from '@/lib/store';
import toast from 'react-hot-toast';

const registerSchema = z.object({
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const { settings } = useSettingsStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true);
        try {
            const { confirmPassword, ...registerData } = data;
            const response = await authAPI.register(registerData);
            const { user, accessToken, refreshToken } = response.data.data;

            setAuth(user, accessToken, refreshToken);
            toast.success('¡Cuenta creada exitosamente!');
            setRegistrationSuccess(true);
            // We no longer redirect to /events immediately, we show the verification message.
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-start justify-center bg-dark-950 pt-4 pb-8 px-4 sm:px-6 lg:px-8 relative overflow-y-auto md:items-center md:pt-0">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-700/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Logo Area */}
                <div className="mb-2 text-center">
                    <Link href="/" className="inline-block hover:scale-105 transition-transform duration-300">
                        <div className="relative flex items-center justify-center mx-auto" style={{ width: '180px' }}>
                            {settings?.site_logo ? (
                                <img
                                    src={settings.site_logo}
                                    alt={settings?.site_name || 'Logo'}
                                    className="max-w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                                />
                            ) : (
                                <div className="p-4 bg-primary-600 rounded-xl shadow-lg">
                                    <span className="text-white font-black text-2xl uppercase italic">
                                        {settings?.site_name?.charAt(0) || 'A'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Title Area */}
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-display font-bold text-white mb-1">
                        Crear Cuenta
                    </h2>
                    <p className="text-dark-400 text-xs uppercase tracking-widest font-bold opacity-80">
                        Únete y disfruta de los mejores eventos en vivo
                    </p>
                </div>

                {/* Form or Success State */}
                <div className="card p-8">
                    {registrationSuccess ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">¡Revisa tu Correo!</h3>
                            <p className="text-dark-400 mb-8">
                                Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor, <strong>haz clic en el enlace para verificar tu cuenta</strong> y poder comprar eventos.
                            </p>
                            <Link href="/events" className="btn-primary w-full inline-block">
                                Ir a Eventos (Requiere Verificación)
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="full_name" className="block text-sm font-medium text-dark-300 mb-2">
                                    Nombre Completo
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-dark-500" />
                                    </div>
                                    <input
                                        {...register('full_name')}
                                        type="text"
                                        id="full_name"
                                        className="input pl-10"
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                                {errors.full_name && (
                                    <p className="mt-1 text-sm text-red-400">{errors.full_name.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-dark-500" />
                                    </div>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        id="email"
                                        className="input pl-10"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Phone (Optional) */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-dark-300 mb-2">
                                    Teléfono <span className="text-dark-500">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-dark-500" />
                                    </div>
                                    <input
                                        {...register('phone')}
                                        type="tel"
                                        id="phone"
                                        className="input pl-10"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-dark-500" />
                                    </div>
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        className="input pl-10 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-dark-500 hover:text-dark-300" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-dark-500 hover:text-dark-300" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-300 mb-2">
                                    Confirmar Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-dark-500" />
                                    </div>
                                    <input
                                        {...register('confirmPassword')}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        className="input pl-10 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5 text-dark-500 hover:text-dark-300" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-dark-500 hover:text-dark-300" />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            {/* Terms */}
                            <div className="flex items-start">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    required
                                    className="h-4 w-4 mt-1 rounded border-dark-700 bg-dark-800 text-primary-600 focus:ring-primary-600"
                                />
                                <label htmlFor="terms" className="ml-2 block text-sm text-dark-400">
                                    Acepto los{' '}
                                    <Link href="/terms" className="text-primary-500 hover:text-primary-400">
                                        Términos de Servicio
                                    </Link>{' '}
                                    y la{' '}
                                    <Link href="/privacy" className="text-primary-500 hover:text-primary-400">
                                        Política de Privacidad
                                    </Link>
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="spinner border-white"></div>
                                        <span>Creando cuenta...</span>
                                    </div>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5 mr-2" />
                                        Crear Cuenta
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Login Link */}
                <p className="mt-6 text-center text-sm text-dark-400">
                    ¿Ya tienes una cuenta?{' '}
                    <Link href="/auth/login" className="text-primary-500 hover:text-primary-400 font-semibold">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}
