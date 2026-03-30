'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando tu cuenta...');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('No se proporcionó un token de verificación.');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await authAPI.verifyEmail(token);

                if (response.data.success) {
                    setStatus('success');
                    setMessage('¡Tu cuenta ha sido verificada con éxito!');
                } else {
                    setStatus('error');
                    setMessage(response.data.message || 'El enlace de verificación es inválido o ha expirado.');
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Ocurrió un error al intentar verificar tu cuenta. Por favor, inténtalo más tarde.');
            }
        };

        verifyToken();
    }, [searchParams]);

    return (
        <div className="card p-8 text-center max-w-lg w-full">
            {status === 'loading' && (
                <>
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4">Verificando Cuenta</h2>
                    <p className="text-dark-400">{message}</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4">¡Cuenta Verificada!</h2>
                    <p className="text-dark-400 mb-8">{message}</p>
                    <Link href="/auth/login" className="btn-primary w-full block">
                        Iniciar Sesión Ahora
                    </Link>
                </>
            )}

            {status === 'error' && (
                <>
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4">Error de Verificación</h2>
                    <p className="text-dark-400 mb-8">{message}</p>
                    <Link href="/auth/login" className="btn-secondary w-full block">
                        Volver al Inicio
                    </Link>
                </>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-dark-950">
            <Suspense fallback={
                <div className="card p-8 text-center max-w-lg w-full">
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4">Cargando...</h2>
                </div>
            }>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
