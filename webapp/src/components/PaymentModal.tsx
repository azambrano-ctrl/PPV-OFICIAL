'use client';

import { useState } from 'react';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentsAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface PaymentModalProps {
    event: {
        id: string;
        title: string;
        price: number;
        currency: string;
    };
    onClose: () => void;
}

function CheckoutForm({ event, onClose }: PaymentModalProps) {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (paymentMethod === 'stripe') {
            if (!stripe || !elements) {
                return;
            }
            await handleStripePayment();
        } else {
            await handlePayPalPayment();
        }
    };

    const handleStripePayment = async () => {
        if (!stripe || !elements) return;

        setLoading(true);

        try {
            // Create payment intent
            const response = await paymentsAPI.createPayment({
                eventId: event.id,
                paymentMethod: 'stripe',
            });

            const { clientSecret } = response.data.data;

            // Get card element
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                throw new Error('Card element not found');
            }

            // Confirm payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            if (paymentIntent.status === 'succeeded') {
                toast.success('¡Pago exitoso! Redirigiendo...');
                setTimeout(() => {
                    router.push(`/watch/${event.id}`);
                }, 1500);
            }
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handlePayPalPayment = async () => {
        setLoading(true);

        try {
            const response = await paymentsAPI.createPayment({
                eventId: event.id,
                paymentMethod: 'paypal',
            });

            const { approvalUrl } = response.data.data;

            // Redirect to PayPal
            window.location.href = approvalUrl;
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Summary */}
            <div className="bg-dark-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{event.title}</h3>
                <div className="flex items-center justify-between">
                    <span className="text-dark-400">Total a pagar:</span>
                    <span className="text-2xl font-bold gradient-text">
                        ${Number(event.price).toFixed(2)} {event.currency}
                    </span>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">
                    Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'stripe'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-dark-600'
                            }`}
                    >
                        <CreditCard className="w-6 h-6 mx-auto mb-2" />
                        <span className="text-sm font-medium">Tarjeta</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'paypal'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-dark-600'
                            } ${!stripePromise ? 'col-span-1' : ''}`}
                    >
                        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 4.47a.77.77 0 0 1 .758-.631h6.3c2.325 0 4.122.58 5.338 1.724 1.087 1.023 1.629 2.496 1.629 4.415 0 3.306-1.686 5.64-5.078 7.027l-.199.066c-1.444.48-2.812.72-4.078.72H7.076z" />
                        </svg>
                        <span className="text-sm font-medium">PayPal</span>
                    </button>
                </div>
            </div>

            {/* Stripe Card Element */}
            {paymentMethod === 'stripe' && (
                <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                        Información de la Tarjeta
                    </label>
                    <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
                        <CardElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#fff',
                                        '::placeholder': {
                                            color: '#6b7280',
                                        },
                                    },
                                    invalid: {
                                        color: '#ef4444',
                                    },
                                },
                            }}
                        />
                    </div>
                    <p className="text-xs text-dark-500 mt-2">
                        Tus datos de pago están seguros y encriptados
                    </p>
                </div>
            )}

            {/* PayPal Info */}
            {paymentMethod === 'paypal' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-blue-400">
                        Serás redirigido a PayPal para completar tu pago de forma segura
                    </p>
                </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 btn btn-secondary"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading || (paymentMethod === 'stripe' && !stripe)}
                    className="flex-1 btn btn-primary"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Procesando...</span>
                        </div>
                    ) : (
                        `Pagar ${event.currency} $${Number(event.price).toFixed(2)}`
                    )}
                </button>
            </div>
        </form >
    );
}

export default function PaymentModal({ event, onClose }: PaymentModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="card max-w-lg w-full p-8 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Completar Compra</h2>
                    <p className="text-dark-400">
                        Selecciona tu método de pago preferido
                    </p>
                </div>

                {/* Stripe Elements Provider */}
                <Elements stripe={stripePromise}>
                    <CheckoutForm event={event} onClose={onClose} />
                </Elements>
            </div>
        </div>
    );
}
