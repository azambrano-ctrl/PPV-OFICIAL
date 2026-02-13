'use client';

import { useState } from 'react';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { paymentsAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store';
import { PayPalButtons } from '@paypal/react-paypal-js';

interface PaymentModalProps {
    event?: {
        id?: string;
        title: string;
        price: number;
        currency: string;
    };
    purchaseType?: 'event' | 'season_pass';
    onClose: () => void;
}

function PaymentFormContent({ event, purchaseType = 'event', onClose }: PaymentModalProps) {
    const { settings } = useSettingsStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

    const handlePayPalSuccess = (orderId: string) => {
        toast.success('¡Pago exitoso! Redirigiendo...');

        if (event?.id) {
            sessionStorage.setItem('lastPurchasedEventId', event.id);
        }

        setTimeout(() => {
            if (purchaseType === 'season_pass') {
                window.location.reload();
            } else if (event?.id) {
                router.push(`/watch/${event.id}`);
            } else {
                onClose();
            }
        }, 1500);
    };

    return (
        <div className="space-y-6">
            {/* Event Summary */}
            <div className="bg-dark-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{event?.title || 'Pase de Temporada'}</h3>
                <div className="flex items-center justify-between">
                    <span className="text-dark-400">Total a pagar:</span>
                    <span className="text-2xl font-bold gradient-text">
                        ${Number(event?.price || 0).toFixed(2)} {event?.currency || 'USD'}
                    </span>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">
                    Selecciona tu Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${paymentMethod === 'card'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-dark-600'
                            }`}
                    >
                        <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-primary-400' : 'text-dark-400'}`} />
                        <span className="text-sm font-bold">Tarjeta</span>
                        <span className="text-[10px] text-dark-400 uppercase font-black">Débito / Crédito</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${paymentMethod === 'paypal'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-dark-600'
                            }`}
                    >
                        <svg className={`w-6 h-6 ${paymentMethod === 'paypal' ? 'text-blue-400' : 'text-dark-400'}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 4.47a.77.77 0 0 1 .758-.631h6.3c2.325 0 4.122.58 5.338 1.724 1.087 1.023 1.629 2.496 1.629 4.415 0 3.306-1.686 5.64-5.078 7.027l-.199.066-1.444.48-2.812.72-4.078.72H7.076z" />
                        </svg>
                        <span className="text-sm font-bold">PayPal</span>
                        <span className="text-[10px] text-dark-400 uppercase font-black">Cuenta PayPal</span>
                    </button>
                </div>
            </div>

            {/* PayPal Buttons Integration */}
            <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-blue-400">
                        {paymentMethod === 'card'
                            ? 'Paga directamente con tu tarjeta de forma segura'
                            : 'Inicia sesión en PayPal para completar tu compra'}
                    </p>
                </div>

                <div className="relative z-0">
                    <PayPalButtons
                        key={paymentMethod} // Re-mount when switching to clear state
                        style={{
                            layout: "vertical",
                            color: paymentMethod === 'card' ? "black" : "blue",
                            shape: "rect",
                            label: "pay",
                            height: 45
                        }}
                        fundingSource={paymentMethod === 'card' ? "card" : "paypal"}
                        disabled={loading}
                        createOrder={async () => {
                            try {
                                const response = await paymentsAPI.createPayment({
                                    eventId: event?.id,
                                    purchaseType,
                                    paymentMethod: 'paypal',
                                });
                                return response.data.data.orderId;
                            } catch (error) {
                                const message = handleAPIError(error);
                                toast.error(message);
                                throw error;
                            }
                        }}
                        onApprove={async (data) => {
                            setLoading(true);
                            try {
                                await paymentsAPI.capturePayPal(data.orderID);
                                handlePayPalSuccess(data.orderID);
                            } catch (error) {
                                const message = handleAPIError(error);
                                toast.error(message);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        onError={(err) => {
                            console.error('PayPal Error:', err);
                            toast.error('Error al procesar el pago');
                        }}
                    />
                </div>
            </div>

            {/* Cancel Button */}
            <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full btn btn-secondary mt-2"
            >
                Cancelar
            </button>
        </div>
    );
}

export default function PaymentModal({ event, purchaseType = 'event', onClose }: PaymentModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="card max-w-lg w-full p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Completar Compra</h2>
                    <p className="text-dark-400">
                        Selecciona cómo deseas realizar el pago
                    </p>
                </div>

                <PaymentFormContent event={event} purchaseType={purchaseType} onClose={onClose} />
            </div>
        </div>
    );
}
