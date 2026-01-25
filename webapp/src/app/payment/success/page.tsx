'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertCircle, Play } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Procesando tu pago...');

    // Use a ref to prevent double execution in React Strict Mode
    const processedRef = useRef(false);

    useEffect(() => {
        const confirmPayment = async () => {
            const token = searchParams.get('token');
            const paymentId = searchParams.get('paymentId');
            const payerId = searchParams.get('PayerID');

            // If we already processed this or strictly no params (direct access), stop
            if (processedRef.current) return;

            if (!token) {
                setStatus('error');
                setMessage('No se encontró información del pago');
                return;
            }

            processedRef.current = true;

            try {
                await paymentsAPI.capturePayPal(token);
                setStatus('success');
                setMessage('¡Pago completado con éxito!');
                toast.success('Pago procesado correctamente');
            } catch (error: any) {
                console.error('Payment capture error:', error);
                setStatus('error');
                setMessage('Hubo un problema al confirmar tu pago. ' + (error.response?.data?.message || ''));
            }
        };

        confirmPayment();
    }, [searchParams]);

    return (
        <div className="card max-w-md w-full p-8 text-center">
            {status === 'loading' && (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Procesando Pago</h2>
                    <p className="text-dark-400">Por favor espera un momento...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-green-500">¡Pago Exitoso!</h2>
                    <p className="text-dark-400 mb-8">
                        Ya tienes acceso al evento. Disfruta del combate.
                    </p>
                    <Link href="/events" className="btn btn-primary w-full flex items-center justify-center gap-2">
                        <Play className="w-5 h-5" />
                        Ir a mis Eventos
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-red-500">Error en el Pago</h2>
                    <p className="text-dark-400 mb-8">
                        {message}
                    </p>
                    <div className="space-y-3 w-full">
                        <Link href="/events" className="btn btn-primary w-full">
                            Intentar de nuevo
                        </Link>
                        <Link href="/" className="btn btn-secondary w-full block">
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <div className="flex-1 flex items-center justify-center p-4">
                <Suspense fallback={
                    <div className="card max-w-md w-full p-8 text-center">
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-16 h-16 text-primary-500 animate-spin mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Cargando...</h2>
                        </div>
                    </div>
                }>
                    <PaymentSuccessContent />
                </Suspense>
            </div>
        </div>
    );
}
