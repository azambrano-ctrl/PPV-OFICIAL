'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, DollarSign, Play, ArrowLeft, Users, CheckCircle, AlertCircle, Zap, Radio } from 'lucide-react';
import { eventsAPI, paymentsAPI, handleAPIError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl, isEventUrgent } from '@/lib/utils';
import Footer from '@/components/Footer';
import PaymentModal from '@/components/PaymentModal';
import toast from 'react-hot-toast';
import AdSense from '@/components/ui/AdSense';
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
    trailer_url?: string;
    status: string;
    is_featured: boolean;
    max_viewers?: number;
    free_viewers_limit?: number | null;
    claimed_free_spots?: string;
}

/** Convert a YouTube or Vimeo watch URL to its embed URL, or return null for direct video files */
function getEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        // YouTube
        if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
            const videoId = u.searchParams.get('v') || u.pathname.split('/').pop();
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : null;
        }
        // Vimeo
        if (u.hostname.includes('vimeo.com')) {
            const videoId = u.pathname.split('/').pop();
            return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
        }
        return null; // direct video file
    } catch {
        return null;
    }
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
    const [claiming, setClaiming] = useState(false);
    const [countdown, setCountdown] = useState('');
    const [isClient, setIsClient] = useState(false);
    const [showStickyCTA, setShowStickyCTA] = useState(false);

    useEffect(() => {
        setIsClient(true);

        const handleScroll = () => {
            // Se reduce de 500 a 200 para que aparezca mucho antes al hacer scroll
            if (window.scrollY > 200) {
                setShowStickyCTA(true);
            } else {
                setShowStickyCTA(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
        if (user && !user.is_verified) {
            toast.error('Por favor, verifica tu correo electrónico para poder comprar eventos.');
            return;
        }
        setShowPaymentModal(true);
    };

    const handleWatchNow = () => {
        if (user && !user.is_verified) {
            toast.error('Por favor, verifica tu correo electrónico para poder ver eventos.');
            return;
        }
        router.push(`/watch/${params.id}`);
    };

    const handleClaimFree = async () => {
        if (!isAuthenticated) {
            toast.error('Debes iniciar sesión para reclamar este pase gratis');
            router.push(`/auth/login?redirect=/event/${params.id}`);
            return;
        }
        if (user && !user.is_verified) {
            toast.error('Por favor, verifica tu correo electrónico.');
            return;
        }

        setClaiming(true);
        try {
            const response = await eventsAPI.claimFree(params.id as string);
            if (response.data.success) {
                toast.success('¡Pase gratuito reclamado con éxito! Tienes acceso al evento.');
                setHasPurchased(true); // Grant immediate access visually
                loadEvent(params.id as string); // Reload event to update spot counts
            }
        } catch (error) {
            toast.error(handleAPIError(error) || 'Error al intentar reclamar el pase gratuito');
        } finally {
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-950">
                <div className="flex-1 flex items-center justify-center">
                    <div className="spinner w-12 h-12" />
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col bg-dark-950">
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
    const isCancelled = event.status === 'cancelled';
    const isUrgent = isEventUrgent(event.event_date) && isUpcoming;

    const getViewerCount = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return 120 + (Math.abs(hash) % 500);
    };

    // Free Spots logic
    const limit = event.free_viewers_limit || 0;
    const claimed = event.claimed_free_spots ? parseInt(event.claimed_free_spots) : 0;
    const freeSpotsRemaining = Math.max(0, limit - claimed);
    const hasFreeSpotsAvailable = limit > 0 && freeSpotsRemaining > 0;

    // Check if truly free unconditionally or conditionally via pass
    const isUniversallyFree = parseFloat(String(event.price)) === 0 && (!limit || limit === 0);
    const canWatch = hasPurchased || (isClient && user?.role === 'admin') || isUniversallyFree;

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">

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
                        {isUrgent && (
                            <span className="badge bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                <Zap className="w-4 h-4 fill-current" />
                                ¡Últimos Boletos!
                            </span>
                        )}

                        {isLive && (
                            <span className="badge bg-red-600/90 text-white backdrop-blur-md border border-red-500/50 px-4 py-1.5 rounded-full text-xs font-black tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                                <Radio className="w-4 h-4 animate-pulse text-white" />
                                LIVE - {getViewerCount(event.id)} VIENDO
                            </span>
                        )}

                        {!isLive && event.is_featured && (
                            <span className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                Destacado
                            </span>
                        )}
                        {!isLive && (
                            <span className={`badge ${getEventStatusColor(event.status)}`}>
                                {event.status === 'reprise' && parseFloat(String(event.price)) === 0 ? 'PASE LIBRE' : getEventStatusText(event.status)}
                            </span>
                        )}
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
                                {isUniversallyFree
                                    ? 'PASE LIBRE'
                                    : hasFreeSpotsAvailable
                                        ? '¡Cupos Gratis Disponibles!'
                                        : formatCurrency(event.price, event.currency)}
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

                            {/* Trailer */}
                            {(event as any).trailer_url && (() => {
                                const trailerUrl = (event as any).trailer_url as string;
                                const embedUrl = getEmbedUrl(trailerUrl);
                                return (
                                    <div className="card p-6">
                                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Play className="w-5 h-5 text-primary-500" />
                                            Ver Trailer
                                        </h2>
                                        <div className="rounded-xl overflow-hidden aspect-video bg-black">
                                            {embedUrl ? (
                                                <iframe
                                                    src={embedUrl.includes('youtube.com') ? embedUrl.replace('autoplay=0', 'autoplay=1') + '&mute=1' : embedUrl}
                                                    className="w-full h-full max-h-[500px]"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    title="Trailer del evento"
                                                />
                                            ) : (
                                                <video
                                                    src={trailerUrl}
                                                    controls
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                    className="w-full h-full max-h-[500px] object-cover"
                                                    preload="metadata"
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

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
                                        <p className="font-semibold text-primary-500">
                                            {isUniversallyFree ? 'PASE LIBRE' : formatCurrency(event.price, event.currency)}
                                        </p>
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
                                            <span className="font-semibold">
                                                {Number(event.price) === 0 ? 'Tienes Acceso (Evento Gratuito)' :
                                                    user?.role === 'admin' ? 'Acceso de Administrador' :
                                                        'Ya compraste este evento'}
                                            </span>
                                        </div>
                                        {isLive || isPast(eventDate) || isFinished || event.status === 'reprise' ? (
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
                                            <p className="text-3xl font-bold gradient-text mb-2 uppercase">
                                                {isUniversallyFree
                                                    ? 'PASE LIBRE'
                                                    : hasFreeSpotsAvailable
                                                        ? 'GRATIS'
                                                        : formatCurrency(event.price, event.currency)}
                                            </p>
                                            <p className="text-sm text-dark-400">
                                                {hasFreeSpotsAvailable ? `¡Aprovéchalo! Quedan ${freeSpotsRemaining} pases gratuitos.` : 'Acceso completo al evento'}
                                            </p>
                                        </div>

                                        {hasFreeSpotsAvailable ? (
                                            <button
                                                onClick={handleClaimFree}
                                                disabled={isFinished || isCancelled || claiming}
                                                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white border-none"
                                            >
                                                {claiming ? (
                                                    <><div className="spinner w-4 h-4 mr-2" />Reclamando...</>
                                                ) : isCancelled ? (
                                                    'Evento Cancelado'
                                                ) : isFinished ? (
                                                    'Evento Finalizado'
                                                ) : (
                                                    'Reclamar Pase Gratis'
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handlePurchaseClick}
                                                disabled={isCancelled || (event.price > 0 && event.status !== 'reprise' && !isLive && (isFinished || isPast(eventDate)))}
                                                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isCancelled
                                                    ? 'Evento Cancelado'
                                                    : event.price > 0 && event.status !== 'reprise' && !isLive && (isFinished || isPast(eventDate))
                                                        ? 'Evento Finalizado'
                                                        : isUniversallyFree
                                                            ? 'Ver Ahora'
                                                            : 'Comprar Acceso'}
                                            </button>
                                        )}

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
                                    <button
                                        onClick={() => {
                                            const url = encodeURIComponent(window.location.href);
                                            const quote = encodeURIComponent(`¡No te pierdas: ${event.title}! 🥊`);
                                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank', 'width=600,height=400');
                                        }}
                                        className="flex-1 btn btn-secondary text-sm flex items-center justify-center gap-1.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                                            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                                        </svg>
                                        Facebook
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const shareData = {
                                                title: event.title,
                                                text: `¡No te pierdas: ${event.title}! 🥊 Míralo en Arena Fight Pass`,
                                                url: window.location.href,
                                            };
                                            if (navigator.share) {
                                                try { await navigator.share(shareData); } catch (_) { }
                                            } else {
                                                await navigator.clipboard.writeText(window.location.href);
                                                toast.success('¡Enlace copiado! Pégalo en tu publicación de Instagram 📸');
                                            }
                                        }}
                                        className="flex-1 btn btn-secondary text-sm flex items-center justify-center gap-1.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24">
                                            <defs>
                                                <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#FFDC80" />
                                                    <stop offset="25%" stopColor="#FCAF45" />
                                                    <stop offset="50%" stopColor="#F77737" />
                                                    <stop offset="75%" stopColor="#F56040" />
                                                    <stop offset="90%" stopColor="#C13584" />
                                                    <stop offset="100%" stopColor="#833AB4" />
                                                </linearGradient>
                                            </defs>
                                            <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                        </svg>
                                        Instagram
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ad Banner */}
            <div className="container-custom">
                <AdSense slot="5992307942" format="horizontal" />
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
                        date: event.event_date,
                        status: event.status,
                    }}
                    onClose={() => setShowPaymentModal(false)}
                />
            )
            }

            <div className={`fixed bottom-0 left-0 right-0 z-50 bg-dark-950/90 backdrop-blur-xl border-t border-dark-800 p-4 transition-transform duration-300 ease-in-out ${showStickyCTA && event.status !== 'finished' && event.status !== 'cancelled' && event.status !== 'draft' && !canWatch ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="container-custom flex items-center justify-between gap-4">
                    <div className="hidden md:block">
                        <h3 className="font-bold text-white mb-1 truncate max-w-sm">{event.title}</h3>
                        <p className="text-primary-500 font-bold">
                            {isUniversallyFree ? 'PASE LIBRE' : formatCurrency(event.price, event.currency)}
                        </p>
                    </div>
                    <div className="w-full md:w-auto flex-1 md:flex-none flex justify-end">
                        <button
                            onClick={hasFreeSpotsAvailable ? handleClaimFree : handlePurchaseClick}
                            disabled={claiming}
                            className={`w-full md:w-auto btn ${hasFreeSpotsAvailable ? 'bg-green-600 hover:bg-green-700 text-white' : 'btn-primary'} shadow-lg shadow-primary-500/20`}
                        >
                            {claiming ? (
                                <><div className="spinner w-4 h-4 mr-2" />Reclamando...</>
                            ) : hasFreeSpotsAvailable ? (
                                `Reclamar Gratis (${freeSpotsRemaining} quedan)`
                            ) : (
                                `Comprar ${formatCurrency(event.price, event.currency)}`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
