'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, DollarSign, Play, ArrowLeft, Users, CheckCircle, AlertCircle, Zap, Radio, Timer, Tv, MessageCircle, Share2 } from 'lucide-react';
import { eventsAPI, paymentsAPI, handleAPIError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl, isEventUrgent } from '@/lib/utils';
import Footer from '@/components/Footer';
import PaymentModal from '@/components/PaymentModal';
import toast from 'react-hot-toast';
import AdSense from '@/components/ui/AdSense';
import { formatDistanceToNow, isPast } from 'date-fns';
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

function getEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
            const videoId = u.searchParams.get('v') || u.pathname.split('/').pop();
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : null;
        }
        if (u.hostname.includes('vimeo.com')) {
            const videoId = u.pathname.split('/').pop();
            return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
        }
        return null;
    } catch {
        return null;
    }
}

interface CountdownTime { days: number; hours: number; minutes: number; seconds: number; }

function CountdownBox({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center bg-dark-800 rounded-xl px-4 py-3 min-w-[64px]">
            <span className="text-3xl md:text-4xl font-black text-white tabular-nums">{String(value).padStart(2, '0')}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{label}</span>
        </div>
    );
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
    const [countdown, setCountdown] = useState<CountdownTime | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [showStickyCTA, setShowStickyCTA] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const handleScroll = () => setShowStickyCTA(window.scrollY > 200);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (params.id) {
            loadEvent(params.id as string);
            if (isAuthenticated) checkAccess(params.id as string);
            else setCheckingAccess(false);
        }
    }, [params.id, isAuthenticated]);

    // Countdown timer
    useEffect(() => {
        if (!event) return;
        const update = () => {
            const diff = new Date(event.event_date).getTime() - Date.now();
            if (diff <= 0) { setCountdown(null); return; }
            setCountdown({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [event]);

    const loadEvent = async (id: string) => {
        try {
            const response = await eventsAPI.getById(id);
            setEvent(response.data.data);
        } catch {
            toast.error('Error al cargar el evento');
        } finally {
            setLoading(false);
        }
    };

    const checkAccess = async (id: string) => {
        try {
            const response = await eventsAPI.checkAccess(id);
            setHasPurchased(response.data.data.hasAccess);
        } catch {
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
                setHasPurchased(true);
                loadEvent(params.id as string);
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
                        <Link href="/events" className="btn-primary">Ver todos los eventos</Link>
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
        for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
        return 120 + (Math.abs(hash) % 500);
    };

    const limit = event.free_viewers_limit || 0;
    const claimed = event.claimed_free_spots ? parseInt(event.claimed_free_spots) : 0;
    const freeSpotsRemaining = Math.max(0, limit - claimed);
    const hasFreeSpotsAvailable = limit > 0 && freeSpotsRemaining > 0;
    const isUniversallyFree = parseFloat(String(event.price)) === 0 && (!limit || limit === 0);
    const canWatch = hasPurchased || (isClient && user?.role === 'admin') || isUniversallyFree;

    const daysUntil = countdown ? countdown.days : 0;

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">

            {/* ── BANNER ── */}
            <div className="relative h-[28rem] md:h-[36rem] bg-dark-900">
                {event.banner_url || event.thumbnail_url ? (
                    <img
                        src={getImageUrl(event.banner_url || event.thumbnail_url)}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 to-dark-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-dark-950/10" />

                {/* Back */}
                <div className="absolute top-24 left-0 right-0 container-custom">
                    <Link href="/events" className="inline-flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        Volver a eventos
                    </Link>
                </div>

                {/* Title area */}
                <div className="absolute bottom-0 left-0 right-0 container-custom pb-10">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {isUrgent && (
                            <span className="badge bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                <Zap className="w-4 h-4 fill-current" />¡Últimos Boletos!
                            </span>
                        )}
                        {isLive && (
                            <span className="badge bg-red-600/90 text-white backdrop-blur-md border border-red-500/50 px-4 py-1.5 rounded-full text-xs font-black tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                                <Radio className="w-4 h-4 animate-pulse text-white" />
                                LIVE — {getViewerCount(event.id)} VIENDO
                            </span>
                        )}
                        {!isLive && (
                            <span className={`badge ${getEventStatusColor(event.status)} px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest`}>
                                {event.status === 'reprise' && parseFloat(String(event.price)) === 0 ? 'PASE LIBRE' : getEventStatusText(event.status)}
                            </span>
                        )}
                        {!isLive && event.is_featured && (
                            <span className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                                Destacado
                            </span>
                        )}
                    </div>

                    <h1 className="font-display text-4xl md:text-6xl font-black uppercase italic mb-5 leading-tight drop-shadow-xl">
                        {event.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-5 text-gray-300 text-sm font-semibold">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary-500" />
                            {formatDate(event.event_date, 'PPP')}
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            {formatDate(event.event_date, 'p')}
                        </span>
                        <span className="flex items-center gap-2 text-xl font-black gradient-text">
                            <DollarSign className="w-5 h-5" />
                            {isUniversallyFree ? 'PASE LIBRE' : hasFreeSpotsAvailable ? '¡Cupos Gratis!' : formatCurrency(event.price, event.currency)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="flex-1 py-12">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Description */}
                            <div className="card p-8">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <span className="w-1 h-7 bg-gradient-to-b from-primary-500 to-orange-500 rounded-full inline-block" />
                                    Sobre el Evento
                                </h2>
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
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    title="Trailer del evento"
                                                />
                                            ) : (
                                                <video src={trailerUrl} controls autoPlay muted loop playsInline className="w-full h-full object-cover" preload="metadata" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Event Details — icon cards */}
                            <div className="card p-8">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <span className="w-1 h-7 bg-gradient-to-b from-primary-500 to-orange-500 rounded-full inline-block" />
                                    Detalles del Evento
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-dark-800 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                                        <Calendar className="w-6 h-6 text-primary-500" />
                                        <p className="text-[10px] text-dark-400 uppercase tracking-widest font-bold">Fecha</p>
                                        <p className="font-bold text-sm leading-tight">{formatDate(event.event_date, 'PP')}</p>
                                    </div>
                                    <div className="bg-dark-800 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                                        <Clock className="w-6 h-6 text-primary-500" />
                                        <p className="text-[10px] text-dark-400 uppercase tracking-widest font-bold">Hora</p>
                                        <p className="font-bold text-sm">{formatDate(event.event_date, 'p')}</p>
                                    </div>
                                    <div className="bg-dark-800 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                                        <Timer className="w-6 h-6 text-primary-500" />
                                        <p className="text-[10px] text-dark-400 uppercase tracking-widest font-bold">Duración</p>
                                        <p className="font-bold text-sm">{event.duration_minutes} min</p>
                                    </div>
                                    <div className="bg-dark-800 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                                        <DollarSign className="w-6 h-6 text-primary-500" />
                                        <p className="text-[10px] text-dark-400 uppercase tracking-widest font-bold">Precio</p>
                                        <p className="font-bold text-sm text-primary-400">
                                            {isUniversallyFree ? 'GRATIS' : formatCurrency(event.price, event.currency)}
                                        </p>
                                    </div>
                                    {event.max_viewers && (
                                        <div className="bg-dark-800 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                                            <Users className="w-6 h-6 text-primary-500" />
                                            <p className="text-[10px] text-dark-400 uppercase tracking-widest font-bold">Capacidad</p>
                                            <p className="font-bold text-sm">{event.max_viewers.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDEBAR */}
                        <div className="space-y-5">

                            {/* Countdown */}
                            {isUpcoming && !isPast(eventDate) && countdown && (
                                <div className="card p-6 bg-gradient-to-br from-primary-900/20 to-dark-900 border-primary-500/20">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest text-center mb-4">Comienza en</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <CountdownBox value={countdown.days} label="días" />
                                        <span className="text-2xl font-black text-dark-600 mb-4">:</span>
                                        <CountdownBox value={countdown.hours} label="horas" />
                                        <span className="text-2xl font-black text-dark-600 mb-4">:</span>
                                        <CountdownBox value={countdown.minutes} label="min" />
                                        <span className="text-2xl font-black text-dark-600 mb-4">:</span>
                                        <CountdownBox value={countdown.seconds} label="seg" />
                                    </div>
                                    <p className="text-xs text-dark-400 text-center mt-4">
                                        {formatDistanceToNow(eventDate, { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                            )}

                            {/* Purchase / Access Card */}
                            <div className="card p-6 overflow-hidden relative">
                                {/* Urgency bar */}
                                {isUpcoming && countdown && daysUntil <= 7 && !canWatch && (
                                    <div className="absolute top-0 left-0 right-0 bg-red-600/90 text-white text-center text-xs font-black py-1.5 uppercase tracking-widest">
                                        <Zap className="inline w-3 h-3 mr-1" />
                                        {daysUntil === 0 ? '¡Hoy es el evento!' : `Faltan ${daysUntil} día${daysUntil > 1 ? 's' : ''}`}
                                    </div>
                                )}

                                <div className={isUpcoming && countdown && daysUntil <= 7 && !canWatch ? 'mt-7' : ''}>
                                    {checkingAccess ? (
                                        <div className="flex justify-center py-8"><div className="spinner" /></div>
                                    ) : canWatch ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="font-semibold text-sm">
                                                    {Number(event.price) === 0 ? 'Evento Gratuito' :
                                                        user?.role === 'admin' ? 'Acceso de Administrador' : 'Acceso Comprado'}
                                                </span>
                                            </div>

                                            {isLive || isPast(eventDate) || isFinished || event.status === 'reprise' ? (
                                                <button
                                                    onClick={handleWatchNow}
                                                    className={`w-full btn font-black text-base py-3 ${isLive ? 'bg-green-600 hover:bg-green-500 text-white border-green-500 shadow-lg shadow-green-600/30 animate-pulse' : 'btn-primary'}`}
                                                >
                                                    <Play className="w-5 h-5 mr-2 fill-current" />
                                                    {isLive ? '▶ Ver Ahora — En Vivo' : 'Ver Repetición'}
                                                </button>
                                            ) : (
                                                <div className="text-center py-4 bg-dark-800 rounded-xl">
                                                    <p className="text-dark-300 font-semibold">El evento comenzará pronto</p>
                                                    <p className="text-sm text-dark-500 mt-1">Recibirás una notificación cuando inicie</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            {/* Price display */}
                                            <div className="bg-gradient-to-br from-primary-900/30 to-dark-800 rounded-2xl p-5 text-center border border-primary-500/20">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                                                    {hasFreeSpotsAvailable ? `¡Solo quedan ${freeSpotsRemaining} pases gratis!` : 'Precio de acceso'}
                                                </p>
                                                <p className="text-5xl font-black gradient-text uppercase">
                                                    {isUniversallyFree ? 'GRATIS' : hasFreeSpotsAvailable ? 'GRATIS' : formatCurrency(event.price, event.currency)}
                                                </p>
                                                {!isUniversallyFree && !hasFreeSpotsAvailable && (
                                                    <p className="text-xs text-dark-400 mt-1">Acceso completo al evento</p>
                                                )}
                                            </div>

                                            {/* CTA Button */}
                                            {hasFreeSpotsAvailable ? (
                                                <button
                                                    onClick={handleClaimFree}
                                                    disabled={isFinished || isCancelled || claiming}
                                                    className="w-full btn bg-green-600 hover:bg-green-500 text-white border-none font-black py-3 text-base shadow-lg shadow-green-600/30 disabled:opacity-50"
                                                >
                                                    {claiming ? <><div className="spinner w-4 h-4 mr-2" />Reclamando...</> :
                                                        isCancelled ? 'Evento Cancelado' :
                                                        isFinished ? 'Evento Finalizado' : '🎟 Reclamar Pase Gratis'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handlePurchaseClick}
                                                    disabled={isCancelled || (event.price > 0 && event.status !== 'reprise' && !isLive && (isFinished || isPast(eventDate)))}
                                                    className="w-full btn btn-primary font-black py-3 text-base shadow-lg shadow-primary-500/20 disabled:opacity-50"
                                                >
                                                    {isCancelled ? 'Evento Cancelado' :
                                                        event.price > 0 && event.status !== 'reprise' && !isLive && (isFinished || isPast(eventDate)) ? 'Evento Finalizado' :
                                                        isUniversallyFree ? '▶ Ver Ahora' : '🎟 Comprar Acceso'}
                                                </button>
                                            )}

                                            {/* Benefits */}
                                            <ul className="space-y-2.5">
                                                {[
                                                    { icon: Tv, text: 'Stream en alta calidad' },
                                                    { icon: MessageCircle, text: 'Chat en vivo' },
                                                    { icon: Play, text: 'Repetición disponible 48h' },
                                                    { icon: Users, text: 'Múltiples dispositivos' },
                                                ].map(({ icon: Icon, text }) => (
                                                    <li key={text} className="flex items-center gap-2.5 text-sm text-dark-300">
                                                        <div className="w-5 h-5 rounded-full bg-primary-900/50 flex items-center justify-center shrink-0">
                                                            <Icon className="w-3 h-3 text-primary-400" />
                                                        </div>
                                                        {text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Share Card */}
                            <div className="card p-5">
                                <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                                    <Share2 className="w-4 h-4 text-primary-500" />
                                    Compartir Evento
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Facebook */}
                                    <button
                                        onClick={() => {
                                            const url = encodeURIComponent(window.location.href);
                                            const quote = encodeURIComponent(`¡No te pierdas: ${event.title}! 🥊`);
                                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank', 'width=600,height=400');
                                        }}
                                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-dark-800 hover:bg-[#1877F2]/20 hover:border-[#1877F2]/40 border border-dark-700 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                                            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                                        </svg>
                                        <span className="text-[10px] text-gray-400 font-bold">Facebook</span>
                                    </button>

                                    {/* WhatsApp */}
                                    <button
                                        onClick={() => {
                                            const text = encodeURIComponent(`¡No te pierdas: ${event.title}! 🥊 Míralo en Arena Fight Pass: ${window.location.href}`);
                                            window.open(`https://wa.me/?text=${text}`, '_blank');
                                        }}
                                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-dark-800 hover:bg-[#25D366]/20 hover:border-[#25D366]/40 border border-dark-700 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        <span className="text-[10px] text-gray-400 font-bold">WhatsApp</span>
                                    </button>

                                    {/* Instagram / Copy */}
                                    <button
                                        onClick={async () => {
                                            const shareData = { title: event.title, text: `¡No te pierdas: ${event.title}! 🥊`, url: window.location.href };
                                            if (navigator.share) {
                                                try { await navigator.share(shareData); } catch (_) {}
                                            } else {
                                                await navigator.clipboard.writeText(window.location.href);
                                                toast.success('¡Enlace copiado!');
                                            }
                                        }}
                                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-dark-800 hover:bg-pink-600/20 hover:border-pink-600/40 border border-dark-700 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24">
                                            <defs>
                                                <linearGradient id="ig2" x1="0%" y1="100%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#FFDC80" /><stop offset="50%" stopColor="#F56040" /><stop offset="100%" stopColor="#833AB4" />
                                                </linearGradient>
                                            </defs>
                                            <path fill="url(#ig2)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                        </svg>
                                        <span className="text-[10px] text-gray-400 font-bold">Instagram</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom">
                <AdSense slot="5992307942" format="horizontal" />
            </div>

            <Footer />

            {/* Payment Modal */}
            {showPaymentModal && event && (
                <PaymentModal
                    event={{ id: event.id, title: event.title, price: event.price, currency: event.currency, date: event.event_date, status: event.status }}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}

            {/* Sticky CTA */}
            <div className={`fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-xl border-t border-dark-800 p-4 transition-transform duration-300 ${showStickyCTA && !['finished','cancelled','draft'].includes(event.status) && !canWatch ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="container-custom flex items-center justify-between gap-4">
                    <div className="hidden md:block">
                        <h3 className="font-bold text-white truncate max-w-sm">{event.title}</h3>
                        <p className="text-primary-500 font-bold text-sm">
                            {isUniversallyFree ? 'PASE LIBRE' : formatCurrency(event.price, event.currency)}
                        </p>
                    </div>
                    <button
                        onClick={hasFreeSpotsAvailable ? handleClaimFree : handlePurchaseClick}
                        disabled={claiming}
                        className={`w-full md:w-auto btn font-black ${hasFreeSpotsAvailable ? 'bg-green-600 hover:bg-green-500 text-white border-none' : 'btn-primary'} shadow-lg`}
                    >
                        {claiming ? <><div className="spinner w-4 h-4 mr-2" />Reclamando...</> :
                            hasFreeSpotsAvailable ? `🎟 Reclamar Gratis (${freeSpotsRemaining} quedan)` :
                            `🎟 Comprar ${formatCurrency(event.price, event.currency)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
