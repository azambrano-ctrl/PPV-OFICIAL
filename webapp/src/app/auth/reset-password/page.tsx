'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI, handleAPIError } from '@/lib/api';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) {
            toast.error('Token inválido o expirado');
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.resetPassword(token, data.password);
            setIsSuccess(true);
            toast.success('Contraseña actualizada correctamente');

            // Redirect after delay
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <h2 className="text-xl font-bold text-red-500">Enlace inválido</h2>
                <p className="text-gray-400">
                    El enlace de recuperación no es válido o falta el token.
                </p>
                <Link href="/auth/forgot-password" className="btn-secondary inline-block">
                    Solicitar nuevo enlace
                </Link>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-white">¡Contraseña Actualizada!</h1>
                <p className="text-gray-400">
                    Tu contraseña ha sido cambiada exitosamente.
                    Serás redirigido al inicio de sesión en unos segundos...
                </p>
                <Link href="/auth/login" className="btn-primary w-full block">
                    Ir al inicio de sesión ahora
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Nueva Contraseña</h1>
                <p className="text-gray-400 mt-2">
                    Ingresa tu nueva contraseña segurá
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nueva Contraseña
                    </label>
                    <div className="relative">
                        <input
                            {...register('password')}
                            type="password"
                            className="input pl-10"
                            placeholder="••••••••"
                        />
                        <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirmar Contraseña
                    </label>
                    <div className="relative">
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            className="input pl-10"
                            placeholder="••••••••"
                        />
                        <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
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
                            Actualizando...
                        </>
                    ) : (
                        'Cambiar Contraseña'
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
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
            <div className="card max-w-md w-full p-8">
                <Suspense fallback={<div className="text-center text-white">Cargando...</div>}>
                    <ResetPasswordContent />
                </Suspense>
            </div>
        </div>
    );
}
