'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
    return (
        <div className="min-h-screen flex flex-col bg-dark-950">

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="card max-w-md w-full p-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-white">Pago Cancelado</h2>
                        <p className="text-dark-400 mb-8">
                            Has cancelado el proceso de pago. No se ha realizado ningún cargo a tu cuenta.
                        </p>
                        <div className="space-y-3 w-full">
                            <Link href="/events" className="btn btn-primary w-full">
                                Ver otros eventos
                            </Link>
                            <Link href="/" className="btn btn-secondary w-full block">
                                Volver al Inicio
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
