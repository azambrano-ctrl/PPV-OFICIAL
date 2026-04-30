'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { Music, Volume2, VolumeX, Users, Share2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatBox from '@/components/ChatBox';
import { getImageUrl } from '@/lib/utils';
import type { Socket } from 'socket.io-client';

interface WaitingRoomProps {
    event: {
        id: string;
        title: string;
        description?: string;
        event_date: string;
        status: string;
        thumbnail_url?: string;
        waiting_room_bg_url?: string;
        waiting_room_music_url?: string;
        price?: number;
    };
    socket: Socket | null;
    onEventLive: () => void;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

function getTimeLeft(targetDate: string): TimeLeft {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    return {
        total: diff,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    };
}

function pad(n: number) { return String(n).padStart(2, '0'); }

const DEFAULT_MUSIC = 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b5c2b8b5.mp3';

export default function WaitingRoom({ event, socket, onEventLive }: WaitingRoomProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(event.event_date));
    const [musicOn, setMusicOn] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [pulse, setPulse] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Countdown tick
    useEffect(() => {
        const tick = setInterval(() => {
            const t = getTimeLeft(event.event_date);
            setTimeLeft(t);
            setPulse(true);
            setTimeout(() => setPulse(false), 300);
            if (t.total <= 0) clearInterval(tick);
        }, 1000);
        return () => clearInterval(tick);
    }, [event.event_date]);

    // Poll backend every 30s to detect when event goes live
    useEffect(() => {
        pollRef.current = setInterval(async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/events/${event.id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const data = await res.json();
                if (data.data?.status === 'live') {
                    toast.success('🔴 ¡El evento ha comenzado!', { duration: 4000 });
                    onEventLive();
                }
            } catch { /* silent */ }
        }, 30000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [event.id, onEventLive]);

    // Socket: listen for live status
    useEffect(() => {
        if (!socket) return;
        const handler = (data: { status: string }) => {
            if (data.status === 'live') {
                toast.success('🔴 ¡El evento ha comenzado!', { duration: 4000 });
                onEventLive();
            }
        };
        socket.on('event_status_change', handler);
        socket.on('viewers_count', (data: { count: number }) => setViewerCount(data.count));
        return () => {
            socket.off('event_status_change', handler);
            socket.off('viewers_count');
        };
    }, [socket, onEventLive]);

    // Music toggle
    const toggleMusic = useCallback(() => {
        if (!audioRef.current) {
            const musicUrl = event.waiting_room_music_url || DEFAULT_MUSIC;
            const audio = new Audio(musicUrl);
            audio.loop = true;
            audio.volume = 0.5;
            audio.onerror = () => {
                toast.error('No se pudo cargar la música de sala de espera');
                setMusicOn(false);
                audioRef.current = null;
            };
            audioRef.current = audio;
        }
        if (musicOn) {
            audioRef.current.pause();
            setMusicOn(false);
        } else {
            audioRef.current.play()
                .then(() => setMusicOn(true))
                .catch(() => {
                    toast.error('El navegador bloqueó el audio. Intenta de nuevo.');
                    setMusicOn(false);
                });
        }
    }, [musicOn, event.waiting_room_music_url]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        };
    }, []);

    const shareEvent = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            toast.success('¡Enlace copiado!');
        }
    };

    const isToday = timeLeft.days === 0;
    const bgImage = event.waiting_room_bg_url
        ? getImageUrl(event.waiting_room_bg_url)
        : event.thumbnail_url
            ? getImageUrl(event.thumbnail_url)
            : undefined;

    return (
        <div className="fixed inset-0 flex overflow-hidden text-white">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                {bgImage ? (
                    <img src={bgImage} className="w-full h-full object-cover scale-110" alt="" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-950 via-red-950/30 to-gray-950" />
                )}
                <div className="absolute inset-0 backdrop-blur-sm bg-black/55" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.10)_0%,_transparent_70%)]" />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-1 flex-col md:flex-row overflow-hidden">

                {/* Left: Waiting area */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8 overflow-y-auto">

                    {/* Status badge */}
                    <div className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-5 py-2 rounded-full">
                        <span className={`w-2 h-2 rounded-full ${isToday ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">
                            {isToday ? 'Hoy — Próximamente' : 'Próximo Evento'}
                        </span>
                    </div>

                    {/* Event title */}
                    <div className="text-center max-w-2xl">
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none drop-shadow-2xl">
                            {event.title}
                        </h1>
                        {event.description && (
                            <p className="text-white/50 text-sm mt-4 max-w-lg mx-auto line-clamp-2">
                                {event.description}
                            </p>
                        )}
                    </div>

                    {/* Countdown */}
                    <div className="flex items-start gap-1 sm:gap-4">
                        {([
                            { label: 'Días', value: timeLeft.days },
                            { label: 'Horas', value: timeLeft.hours },
                            { label: 'Min', value: timeLeft.minutes },
                            { label: 'Seg', value: timeLeft.seconds },
                        ] as const).map((unit, i) => (
                            <div key={unit.label} className="flex items-start gap-1 sm:gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={[
                                        'relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32',
                                        'bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl',
                                        'flex items-center justify-center',
                                        'shadow-[0_0_30px_rgba(220,38,38,0.2)] transition-transform duration-300',
                                        unit.label === 'Seg' && pulse ? 'scale-95' : 'scale-100',
                                    ].join(' ')}>
                                        <span className="text-4xl sm:text-6xl md:text-7xl font-black tabular-nums tracking-tighter">
                                            {pad(unit.value)}
                                        </span>
                                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-2xl" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-2">
                                        {unit.label}
                                    </span>
                                </div>
                                {i < 3 && (
                                    <span className="text-4xl sm:text-6xl font-black text-white/20 mt-3 sm:mt-5 select-none">:</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Readable date */}
                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
                        {new Date(event.event_date).toLocaleString('es-EC', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        })}
                    </p>

                    {/* Action bar */}
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        {/* Music toggle */}
                        <button
                            onClick={toggleMusic}
                            className={[
                                'flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all',
                                musicOn
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                    : 'bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20',
                            ].join(' ')}
                        >
                            {musicOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            {musicOn ? 'Música: ON' : 'Música: OFF'}
                        </button>

                        {/* Share */}
                        <button
                            onClick={shareEvent}
                            className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                        >
                            <Share2 className="w-4 h-4" />
                            Compartir
                        </button>

                        {/* Viewers */}
                        {viewerCount > 0 && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm">
                                <Users className="w-4 h-4" />
                                <span className="font-bold">{viewerCount.toLocaleString()} esperando</span>
                            </div>
                        )}
                    </div>

                    {/* Hype */}
                    <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest animate-pulse">
                        <Zap className="w-3 h-3 text-yellow-500/60" />
                        El stream iniciará automáticamente cuando comience el evento
                        <Zap className="w-3 h-3 text-yellow-500/60" />
                    </div>
                </div>

                {/* Right: Chat */}
                <div className="hidden md:flex w-96 bg-black/40 backdrop-blur-sm border-l border-white/10 flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-white/50">Chat del Evento</span>
                        <span className="flex items-center gap-1.5 text-xs text-white/30">
                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                            Sala de espera
                        </span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Suspense fallback={<div className="flex-1" />}>
                            <ChatBox
                                eventId={event.id}
                                eventTitle={event.title}
                                eventStatus={event.status}
                                socket={socket}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
