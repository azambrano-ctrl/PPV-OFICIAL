'use client';

import { useState } from 'react';
import { X, CreditCard, Tag, CheckCircle, XCircle } from 'lucide-react';
import { paymentsAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { isToday, parseISO, isFuture } from 'date-fns';

interface PaymentModalProps {
    event?: {
        id?: string;
        title: string;
        price: number;
        currency: string;
        date?: string;
        status?: string;
    };
    purchaseType?: 'event' | 'season_pass';
    onClose: () => void;
}

function PaymentFormContent({ event, purchaseType = 'event', onClose }: PaymentModalProps) {
    const { settings } = useSettingsStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

    // Coupon state
    const [couponInput, setCouponInput] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
    } | null>(null);
    const [couponError, setCouponError] = useState('');

    const originalPrice = Number(event?.price || 0);
    const discountAmount = appliedCoupon
        ? appliedCoupon.discountType === 'percentage'
            ? Math.min(originalPrice * appliedCoupon.discountValue / 100, originalPrice)
            : Math.min(appliedCoupon.discountValue, originalPrice)
        : 0;
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        setAppliedCoupon(null);
        try {
            const res = await paymentsAPI.validateCoupon(couponInput.trim(), event?.id);
            setAppliedCoupon({
                code: res.data.data.code,
                discountType: res.data.data.discountType,
                discountValue: res.data.data.discountValue,
            });
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Cupón inválido');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
        setCouponError('');
    };

    const handlePayPalSuccess = (orderId: string) => {
        toast.success('¡Pago exitoso! Redirigiendo...');

        if (event?.id) {
            sessionStorage.setItem('lastPurchasedEventId', event.id);
        }

        setTimeout(() => {
            if (purchaseType === 'season_pass') {
                window.location.reload();
            } else if (event?.id) {
                // Determine redirection based on event date
                const eventDate = event.date ? parseISO(event.date) : null;
                const isEventToday = eventDate ? isToday(eventDate) : false;
                const isEventLive = event.status === 'live';

                if (isEventToday || isEventLive) {
                    toast.success('¡Evento en curso! Redirigiendo al reproductor...');
                    router.push(`/watch/${event.id}`);
                } else if (eventDate && isFuture(eventDate)) {
                    toast.success('Compra exitosa. El evento estará disponible pronto.');
                    router.push('/profile?tab=purchases');
                } else {
                    // Fallback for finished events or missing date
                    router.push(`/watch/${event.id}`);
                }
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
                    <div className="pt-3 border-t border-white/5 space-y-1">
                        {appliedCoupon && (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-dark-400 font-bold uppercase tracking-widest">Precio original:</span>
                                    <span className="text-sm text-dark-400 line-through">${originalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-green-400 font-bold uppercase tracking-widest">
                                        Descuento ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `$${appliedCoupon.discountValue}`}):
                                    </span>
                                    <span className="text-sm text-green-400 font-bold">-${discountAmount.toFixed(2)}</span>
                                </div>
                            </>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-dark-400 font-bold uppercase tracking-widest">Total a pagar:</span>
                            <span className="text-2xl font-black text-white tracking-tighter italic">
                                ${finalPrice.toFixed(2)} <span className="text-xs text-dark-500 not-italic ml-1">{event?.currency || 'USD'}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coupon Code */}
            {purchaseType === 'event' && (
                <div>
                    <label className="block text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] mb-2">
                        <Tag className="inline w-3 h-3 mr-1" />Código de descuento
                    </label>
                    {appliedCoupon ? (
                        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="font-mono font-black text-green-400 tracking-widest">{appliedCoupon.code}</span>
                                <span className="text-xs text-green-300">aplicado</span>
                            </div>
                            <button onClick={handleRemoveCoupon} className="text-dark-400 hover:text-red-400 transition-colors">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={couponInput}
                                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                placeholder="FIGHT20"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono tracking-widest placeholder:text-dark-600 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:border-primary-500 text-sm uppercase"
                            />
                            <button
                                onClick={handleApplyCoupon}
                                disabled={couponLoading || !couponInput.trim()}
                                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors whitespace-nowrap"
                            >
                                {couponLoading ? '...' : 'Aplicar'}
                            </button>
                        </div>
                    )}
                    {couponError && (
                        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />{couponError}
                        </p>
                    )}
                </div>
            )}

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
                                    couponCode: appliedCoupon?.code,
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
