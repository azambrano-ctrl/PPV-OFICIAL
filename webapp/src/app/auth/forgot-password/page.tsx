'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI, handleAPIError } from '@/lib/api';
import { ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
    email: z.string().email('Correo electrónico inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        try {
            await authAPI.forgotPassword(data.email);
            setIsSuccess(true);
            toast.success('Correo de recuperación enviado');
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
                <div className="card max-w-md w-full p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">¡Correo Enviado!</h1>
                    <p className="text-gray-400">
                        Hemos enviado un enlace de recuperación a tu dirección de correo electrónico.
                        Por favor revisa tu bandeja de entrada (y spam).
                    </p>
                    <Link href="/auth/login" className="btn-primary w-full block">
                        Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center pt-24 pb-12 px-4 relative overflow-y-auto">
            <div className="max-w-md w-full relative z-10">
                {/* Logo Area */}
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-block hover:scale-105 transition-transform duration-300">
                        <div className="relative flex items-center justify-center mx-auto" style={{ width: '140px' }}>
                            <img
                                src="/images/logo.png"
                                alt="Logo"
                                className="max-w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).classList.add('hidden');
                                }}
                            />
                        </div>
                    </Link>
                </div>

                <div className="card p-8 space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-display font-bold text-white">Recuperar Contraseña</h1>
                        <p className="text-gray-400 mt-2">
                            Ingresa tu correo y te enviaremos instrucciones
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="input pl-10"
                                    placeholder="tu@email.com"
                                />
                                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full"
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner w-5 h-5 mr-2" />
                                    Enviando...
                                </>
                            ) : (
                                'Enviar enlace de recuperación'
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <Link
                            href="/auth/login"
                            className="text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
