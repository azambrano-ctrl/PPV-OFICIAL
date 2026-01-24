'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, DollarSign, Play, ArrowLeft, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { eventsAPI, paymentsAPI, handleAPIError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PaymentModal from '@/components/PaymentModal';
import toast from 'react-hot-toast';
import { formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    duration_minutes: number;
    price: number;
    currency: string;
    thumbnail_url?: string;
    banner_url?: string;
    status: string;
    is_featured: boolean;
    max_viewers?: number;
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [countdown, setCountdown] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (params.id) {
            loadEvent(params.id as string);
            if (isAuthenticated) {
                checkAccess(params.id as string);
            } else {
                setCheckingAccess(false);
            }
        }
    }, [params.id, isAuthenticated]);

    // Countdown timer
    useEffect(() => {
        if (!event) return;

        const updateCountdown = () => {
            const eventDate = new Date(event.event_date);
            const now = new Date();
            const diff = eventDate.getTime() - now.getTime();

            if (diff <= 0) {
                setCountdown('¡El evento ha comenzado!');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [event]);

    const loadEvent = async (id: string) => {
        try {
            const response = await eventsAPI.getById(id);
            setEvent(response.data.data);
        } catch (error) {
            console.error('Error loading event:', error);
            toast.error('Error al cargar el evento');
        } finally {
            setLoading(false);
        }
    };

    const checkAccess = async (id: string) => {
        try {
            const response = await eventsAPI.checkAccess(id);
            setHasPurchased(response.data.data.hasAccess);
        } catch (error) {
            setHasPurchased(false);
        } finally {
            setCheckingAccess(false);
        }
    };

    const handlePurchaseClick = () => {
        if (!isAuthenticated) {
            toast.error('Debes iniciar sesión para comprar');
            router.push(`/auth/login?redirect=/event/${params.id}`);
            return;
        }
        setShowPaymentModal(true);
    };

    const handleWatchNow = () => {
        router.push(`/watch/${params.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-950">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="spinner w-12 h-12" />
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-950">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Evento no encontrado</h2>
                        <p className="text-dark-400 mb-6">El evento que buscas no existe o fue eliminado</p>
                        <Link href="/events" className="btn-primary">
                            Ver todos los eventos
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const eventDate = new Date(event.event_date);
    const isLive = event.status === 'live';
    const isUpcoming = event.status === 'upcoming';
    const isFinished = event.status === 'finished';

    const canWatch = hasPurchased || (isClient && user?.role === 'admin');

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Navbar />

            {/* Banner */}
            <div className="relative h-96 bg-dark-900">
                {event.banner_url || event.thumbnail_url ? (
                    <img
                        src={getImageUrl(event.banner_url || event.thumbnail_url)}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-dark-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-24 left-0 right-0 container-custom">
                    <Link
                        href="/events"
                        className="inline-flex items-center gap-2 text-dark-300 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver a eventos
                    </Link>
                </div>

                {/* Event Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 container-custom pb-8">
                    <div className="flex items-start gap-4">
                        {event.is_featured && (
                            <span className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                Destacado
                            </span>
                        )}
                        <span className={`badge ${getEventStatusColor(event.status)}`}>
                            {getEventStatusText(event.status)}
                        </span>
                    </div>
                    <h1 className="font-display text-4xl md:text-6xl font-bold mt-4 mb-4">
                        {event.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-dark-300">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            <span>{formatDate(event.event_date, 'PPP')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>{formatDate(event.event_date, 'p')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            <span className="text-2xl font-bold gradient-text">
                                {formatCurrency(event.price, event.currency)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 py-12">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Description */}
                            <div className="card p-8">
                                <h2 className="text-2xl font-bold mb-4">Sobre el Evento</h2>
                                <p className="text-dark-300 leading-relaxed whitespace-pre-line">
                                    {event.description || 'No hay descripción disponible para este evento.'}
                                </p>
                            </div>

                            {/* Event Details */}
                            <div className="card p-8">
                                <h2 className="text-2xl font-bold mb-6">Detalles del Evento</h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-dark-500 text-sm mb-1">Fecha y Hora</p>
                                        <p className="font-semibold">{formatDate(event.event_date, 'PPPp')}</p>
                                    </div>
                                    <div>
                                        <p className="text-dark-500 text-sm mb-1">Duración Estimada</p>
                                        <p className="font-semibold">{event.duration_minutes} minutos</p>
                                    </div>
                                    <div>
                                        <p className="text-dark-500 text-sm mb-1">Precio</p>
                                        <p className="font-semibold text-primary-500">{formatCurrency(event.price, event.currency)}</p>
                                    </div>
                                    {event.max_viewers && (
                                        <div>
                                            <p className="text-dark-500 text-sm mb-1">Capacidad</p>
                                            <p className="font-semibold">{event.max_viewers} espectadores</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Countdown Card - Only show if truly upcoming and in the future */}
                            {isUpcoming && !isPast(eventDate) && (
                                <div className="card p-6 bg-gradient-to-br from-primary-900/20 to-dark-900 border-primary-500/20">
                                    <h3 className="font-semibold mb-2 text-center">Comienza en:</h3>
                                    <div className="text-3xl font-bold text-center gradient-text mb-4">
                                        {countdown}
                                    </div>
                                    <p className="text-sm text-dark-400 text-center">
                                        {formatDistanceToNow(eventDate, { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                            )}

                            {/* Purchase Card */}
                            <div className="card p-6">
                                {checkingAccess ? (
                                    <div className="flex justify-center py-8">
                                        <div className="spinner" />
                                    </div>
                                ) : canWatch ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-green-500 mb-4">
                                            <CheckCircle className="w-6 h-6" />
                                            <span className="font-semibold">Ya compraste este evento</span>
                                        </div>
                                        {isLive || isPast(eventDate) || isFinished ? (
                                            <button
                                                onClick={handleWatchNow}
                                                className="w-full btn btn-primary"
                                            >
                                                <Play className="w-5 h-5 mr-2" />
                                                {isLive ? 'Ver Ahora (En Vivo)' : 'Ver Repetición'}
                                            </button>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-dark-400">El evento comenzará pronto</p>
                                                <p className="text-sm text-dark-500 mt-2">
                                                    Recibirás una notificación cuando inicie
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="text-center py-4">
                                            <p className="text-3xl font-bold gradient-text mb-2">
                                                {event.price === 0 ? 'Gratis' : formatCurrency(event.price, event.currency)}
                                            </p>
                                            <p className="text-sm text-dark-400">Acceso completo al evento</p>
                                        </div>
                                        <button
                                            onClick={handlePurchaseClick}
                                            disabled={event.price > 0 && (isFinished || isPast(eventDate))}
                                            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {event.price > 0 && (isFinished || isPast(eventDate))
                                                ? 'Evento Finalizado'
                                                : event.price === 0
                                                    ? 'Ver Ahora'
                                                    : 'Comprar Acceso'}
                                        </button>
                                        <ul className="space-y-2 text-sm text-dark-400">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                Acceso completo al stream
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                Chat en vivo
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                Múltiples calidades de video
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                Repetición disponible 48h
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Share Card */}
                            <div className="card p-6">
                                <h3 className="font-semibold mb-4">Compartir Evento</h3>
                                <div className="flex gap-2">
                                    <button className="flex-1 btn btn-secondary text-sm">
                                        Facebook
                                    </button>
                                    <button className="flex-1 btn btn-secondary text-sm">
                                        Twitter
                                    </button>
                                    <button className="flex-1 btn btn-secondary text-sm">
                                        Copiar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            {/* Payment Modal */}
            {showPaymentModal && event && (
                <PaymentModal
                    event={{
                        id: event.id,
                        title: event.title,
                        price: event.price,
                        currency: event.currency,
                    }}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}
        </div>
    );
}
