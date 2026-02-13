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
            {/* Event Summary - Glass Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-50" />
                <div className="relative">
                    <p className="text-[10px] text-primary-400 font-black uppercase tracking-[0.2em] mb-1">Tu Selección</p>
                    <h3 className="font-display font-black text-xl text-white uppercase tracking-tighter italic leading-none mb-3">
                        {event?.title || 'Pase de Temporada'}
                    </h3>
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-xs text-dark-400 font-bold uppercase tracking-widest">Inversión Final:</span>
                        <span className="text-2xl font-black text-white tracking-tighter italic">
                            ${Number(event?.price || 0).toFixed(2)} <span className="text-xs text-dark-500 not-italic ml-1">{event?.currency || 'USD'}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div>
                <label className="block text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] mb-4">
                    Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`group p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${paymentMethod === 'card'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                            }`}
                    >
                        <div className={`p-2 rounded-lg transition-colors ${paymentMethod === 'card' ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-white/5 text-dark-400'}`}>
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <span className={`block text-xs font-black uppercase tracking-widest ${paymentMethod === 'card' ? 'text-white' : 'text-dark-300'}`}>Tarjeta</span>
                            <span className="text-[9px] text-dark-500 uppercase font-bold tracking-tighter">Débito / Crédito</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`group p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${paymentMethod === 'paypal'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                            }`}
                    >
                        <div className={`p-2 rounded-lg transition-colors ${paymentMethod === 'paypal' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-white/5 text-dark-400'}`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 4.47a.77.77 0 0 1 .758-.631h6.3c2.325 0 4.122.58 5.338 1.724 1.087 1.023 1.629 2.496 1.629 4.415 0 3.306-1.686 5.64-5.078 7.027l-.199.066-1.444.48-2.812.72-4.078.72H7.076z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <span className={`block text-xs font-black uppercase tracking-widest ${paymentMethod === 'paypal' ? 'text-white' : 'text-dark-300'}`}>PayPal</span>
                            <span className="text-[9px] text-dark-500 uppercase font-bold tracking-tighter">Cuenta Oficial</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* PayPal Buttons Integration */}
            <div className="space-y-4 pt-2">
                <div className="relative z-0">
                    <PayPalButtons
                        key={paymentMethod}
                        style={{
                            layout: "vertical",
                            color: paymentMethod === 'card' ? "black" : "blue",
                            shape: "rect",
                            label: "pay",
                            height: 48
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

                <p className="text-[9px] text-dark-500 uppercase font-bold tracking-[0.2em] text-center">
                    Transacción segura encriptada punto a punto
                </p>
            </div>
        </div>
    );
}

export default function PaymentModal({ event, purchaseType = 'event', onClose }: PaymentModalProps) {
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-dark-900/90 border border-white/10 backdrop-blur-md max-w-lg w-full rounded-2xl relative shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
                {/* Header - Fixed */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-display font-black text-white uppercase tracking-tighter italic">
                            Completar Compra
                        </h2>
                        <p className="text-xs text-dark-400 font-bold uppercase tracking-widest mt-0.5">
                            Seguridad Garantizada 🔒
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-dark-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <PaymentFormContent event={event} purchaseType={purchaseType} onClose={onClose} />
                </div>
            </div>
        </div>
    );
}
