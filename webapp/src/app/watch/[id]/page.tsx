'use client';

import { useEffect, useRef, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, Info, Share2, Tv, X } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import ChatBox from '@/components/ChatBox';
import ReactionLayer from '@/components/ReactionLayer';
import AdSense from '@/components/ui/AdSense';
import { initSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/lib/store';
import type { Socket } from 'socket.io-client';

interface StreamData {
    token: string;
    streamUrl: string;
    expiresAt: string;
    isMp4?: boolean;
}

interface Event {
    id: string;
    title: string;
    description: string;
    event_date: string;
    status: string;
    thumbnail_url?: string;
    price?: number;
}

export default function WatchPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [streamData, setStreamData] = useState<StreamData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [showAdOverlay, setShowAdOverlay] = useState(false);
    const [adCountdown, setAdCountdown] = useState(10);
    const [viewerCount, setViewerCount] = useState<number>(0);
    const { user } = useAuthStore();

    const lastFetchedId = useRef<string | null>(null);

    useEffect(() => {
        const fetchEventAndStream = async () => {
            if (lastFetchedId.current === eventId && (event || streamData)) return;

            try {
                if (typeof window === 'undefined') return;
                lastFetchedId.current = eventId;

                const token = localStorage.getItem('accessToken');
                if (!token) {
                    router.push(`/auth/login?redirect=/watch/${eventId}`);
                    return;
                }

                if (user && !user.is_verified) {
                    setError('Por favor, verifica tu correo electrónico para poder ver eventos.');
                    setLoading(false);
                    return;
                }

                setLoading(true);

                // Fetch event details
                const eventRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!eventRes.ok) {
                    throw new Error('No se pudo cargar el evento');
                }

                const eventData = await eventRes.json();
                setEvent(eventData.data);

                // Show ad overlay for free events (pase libre) ONLY if they are not live
                if (Number(eventData.data.price) === 0 && eventData.data.status !== 'live') {
                    setShowAdOverlay(true);
                    setAdCountdown(10);
                }

                // Check access and get stream token
                const streamRes = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/streaming/${eventId}/token`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (streamRes.status === 403) {
                    const errData = await streamRes.json().catch(() => ({}));
                    setError(errData.message || 'No tienes acceso a este evento. Por favor adquiérelo primero.');
                    setLoading(false);
                    return;
                }

                if (!streamRes.ok) {
                    const errData = await streamRes.json().catch(() => ({}));
                    throw new Error(errData.message || 'Error al obtener acceso a la transmisión');
                }

                const streamResData = await streamRes.json();
                setStreamData(streamResData.data);

                // Initialize socket
                const socketInstance = initSocket(token);
                setSocket(socketInstance);

                // Listen for viewers directly in watch page to pass to VideoPlayer
                socketInstance.on('viewers_count', (data: { count: number }) => {
                    setViewerCount(data.count);
                });

                setLoading(false);
            } catch (err: any) {
                console.error('Error loading stream:', err);
                setError(err.message || 'Error desconocido');
                setLoading(false);
            }
        };

        fetchEventAndStream();

        return () => {
            if (socket) {
                socket.off('viewers_count');
            }
            disconnectSocket();
        };
    }, [eventId, router]);

    // Ad countdown timer for free events
    useEffect(() => {
        if (!showAdOverlay || adCountdown <= 0) return;
        const timer = setTimeout(() => setAdCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [showAdOverlay, adCountdown]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
                <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-dark-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h2 className="text-xl font-display font-bold text-white mb-2">Preparando tu asiento...</h2>
                <p className="text-dark-400">Verificando acceso y conectando con el servidor.</p>
            </div>
        );
    }

    if (error || !event || !streamData) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-dark-900 rounded-2xl border border-dark-800 p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Acceso Denegado</h1>
                    <p className="text-dark-300 mb-8 leading-relaxed">
                        {error || 'No tienes permiso para ver este evento. Asegúrate de haber iniciado sesión con la cuenta correcta.'}
                    </p>
                    <div className="space-y-3">
                        <Link href={`/events`} className="btn-primary w-full block">
                            Ver Eventos Disponibles
                        </Link>
                        <Link href="/" className="btn btn-secondary w-full block">
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black flex flex-col overflow-hidden text-white font-sans">

            {/* Minimal Header - Hidden in mobile landscape to maximize video space */}
            <header className="flex-shrink-0 h-16 px-4 md:px-6 flex items-center justify-between bg-black/50 backdrop-blur-sm border-b border-white/5 z-20 landscape:max-md:hidden">
                <div className="flex items-center gap-4">
                    <Link
                        href="/events"
                        className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        title="Volver a Eventos"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg leading-tight md:text-xl truncate max-w-[200px] md:max-w-md">
                            {event.title}
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            {event.status === 'live' ? (
                                <span className="text-red-500 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                    EN VIVO
                                </span>
                            ) : (
                                <span>{new Date(event.event_date).toLocaleDateString()}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-sm font-medium text-white/90"
                        onClick={() => window.dispatchEvent(new CustomEvent('trigger-cast'))}
                        title="Enviar a TV / Chromecast"
                    >
                        <Tv className="w-4 h-4" />
                        <span className="hidden sm:inline">Transmitir</span>
                    </button>

                    <button
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-sm font-medium text-white/90"
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Enlace copiado al portapapeles');
                        }}
                    >
                        <Share2 className="w-4 h-4" />
                        <span>Compartir</span>
                    </button>

                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`p-2 rounded-full transition-colors md:hidden ${showChat ? 'bg-red-600 text-white' : 'bg-white/10 text-white/70'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Video Area */}
                <div className="flex-1 relative flex flex-col bg-black overflow-hidden">
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <VideoPlayer
                            streamUrl={streamData.streamUrl}
                            token={streamData.token}
                            eventTitle={event.title}
                            status={event.status}
                            poster={event.thumbnail_url}
                            isMp4={streamData.isMp4}
                            viewerCount={viewerCount}
                        />
                        <ReactionLayer socket={socket} eventId={eventId} />

                        {/* Ad Overlay inside video player for free events */}
                        {showAdOverlay && (
                            <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center">
                                <div className="max-w-lg w-full text-center px-4">
                                    <div className="mb-4">
                                        <span className="inline-block bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                                            PASE LIBRE
                                        </span>
                                        <p className="text-gray-400 text-xs">Anuncio patrocinado</p>
                                    </div>

                                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 mb-4">
                                        <AdSense slot="5992307942" format="auto" />
                                    </div>

                                    {adCountdown > 0 ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-10 h-10 rounded-full border-2 border-red-600 flex items-center justify-center">
                                                <span className="text-lg font-black">{adCountdown}</span>
                                            </div>
                                            <p className="text-gray-400 text-sm">El video comenzará en {adCountdown}s</p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowAdOverlay(false)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest px-6 py-3 rounded-lg transition-all hover:scale-105"
                                        >
                                            ▶ Ver Ahora
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>


                    {!showChat && (
                        <div className="absolute bottom-24 right-6 z-20">
                            <button
                                onClick={() => setShowChat(true)}
                                className="bg-dark-900/90 hover:bg-dark-800 text-white px-4 py-3 rounded-full shadow-lg border border-white/10 flex items-center gap-2 transition-all transform hover:scale-105"
                            >
                                <MessageSquare className="w-5 h-5" />
                                <span className="font-semibold">Abrir Chat</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Chat / Sidebar Area */}
                <div
                    className={`
                        w-full md:w-96 bg-dark-950 border-t md:border-t-0 md:border-l border-white/10 
                        transition-all duration-300 z-30 flex flex-col
                        ${showChat && !showAdOverlay ? 'h-[40vh] md:h-full opacity-100 flex' : showChat && showAdOverlay ? 'hidden md:h-full md:opacity-100 md:flex' : 'hidden'}
                        md:relative
                    `}
                >
                    <div className="flex-shrink-0 p-3 flex items-center justify-between border-b border-white/5 md:hidden">
                        <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Chat del Evento</span>
                        <button
                            onClick={() => setShowChat(false)}
                            className="p-1 hover:bg-white/10 rounded-full text-white/70"
                        >
                            <ChevronLeft className="w-5 h-5 rotate-[270deg]" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 bg-dark-950">
                        <ChatBox
                            eventId={eventId}
                            eventTitle={event.title}
                            eventStatus={event.status}
                            socket={socket}
                        />
                    </div>

                    <button
                        onClick={() => setShowChat(false)}
                        className="hidden md:flex absolute -left-10 top-1/2 -translate-y-1/2 bg-dark-900 border border-white/10 border-r-0 p-2 rounded-l-xl text-white/50 hover:text-white transition-colors"
                        title="Ocultar Chat"
                    >
                        <ChevronLeft className="w-5 h-5 rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
}
