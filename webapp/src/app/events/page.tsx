'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Search, Play, ArrowRight, Radio, SortAsc, SortDesc } from 'lucide-react';
import { eventsAPI, authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, formatCurrency, getImageUrl } from '@/lib/utils';
import Footer from '@/components/Footer';
import EventCard from '@/components/events/EventCard';
import AdSense from '@/components/ui/AdSense';
import toast from 'react-hot-toast';

interface Event {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    price: number;
    currency: string;
    thumbnail_url?: string;
    banner_url?: string;
    status: string;
    is_featured: boolean;
    promoter_id?: string;
    promoter_name?: string;
    promoter_logo_url?: string;
}

type SortOrder = 'asc' | 'desc';

const STATUS_CHIPS = [
    { value: 'all',      label: 'Todos',        color: 'bg-dark-700 text-gray-300 border-dark-600' },
    { value: 'live',     label: 'En Vivo',      color: 'bg-red-600/20 text-red-400 border-red-600/40' },
    { value: 'upcoming', label: 'Próximos',     color: 'bg-blue-600/20 text-blue-400 border-blue-600/40' },
    { value: 'reprise',  label: 'Reprise',      color: 'bg-purple-600/20 text-purple-400 border-purple-600/40' },
    { value: 'finished', label: 'Finalizados',  color: 'bg-dark-700 text-gray-400 border-dark-600' },
];

export default function EventsPage() {
    const { isAuthenticated } = useAuthStore();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [purchasedEventIds, setPurchasedEventIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadEvents();
        if (isAuthenticated) loadPurchases();
    }, [isAuthenticated]);

    const loadEvents = async () => {
        try {
            const response = await eventsAPI.getAll();
            const publicEvents = (response.data.data || []).filter(
                (e: any) => !['draft', 'pending'].includes((e.status || '').toLowerCase())
            );
            setEvents(publicEvents);
        } catch {
            toast.error('Error al cargar eventos');
        } finally {
            setLoading(false);
        }
    };

    const loadPurchases = async () => {
        try {
            const response = await authAPI.getPurchases();
            const ids = new Set<string>((response.data.data || []).map((p: any) => p.event_id));
            setPurchasedEventIds(ids);
        } catch {
            // silently fail
        }
    };

    // Counts per status for chips
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: events.length };
        for (const e of events) {
            counts[e.status] = (counts[e.status] || 0) + 1;
        }
        return counts;
    }, [events]);

    // Filtered + sorted events
    const filteredEvents = useMemo(() => {
        let result = events;

        if (statusFilter !== 'all') {
            if (statusFilter === 'upcoming') {
                result = result.filter(e => e.status === 'upcoming' || e.status === 'reprise');
            } else {
                result = result.filter(e => e.status === statusFilter);
            }
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(e =>
                e.title.toLowerCase().includes(term) ||
                e.description?.toLowerCase().includes(term)
            );
        }

        // Live always first, then sorted by date
        return [...result].sort((a, b) => {
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (a.status !== 'live' && b.status === 'live') return 1;
            const diff = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
            return sortOrder === 'asc' ? diff : -diff;
        });
    }, [events, statusFilter, searchTerm, sortOrder]);

    // Hero event: live first, then featured, then first upcoming
    const heroEvent = useMemo(() =>
        events.find(e => e.status === 'live') ||
        events.find(e => e.is_featured) ||
        events.find(e => e.status === 'upcoming'),
    [events]);

    const heroBg = heroEvent?.banner_url || heroEvent?.thumbnail_url;

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">

            {/* ── HEADER ── */}
            <section className="relative pt-32 pb-16 overflow-hidden">
                {/* Background image */}
                {heroBg && (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center scale-105"
                            style={{ backgroundImage: `url(${getImageUrl(heroBg)})`, filter: 'blur(18px)' }}
                        />
                        <div className="absolute inset-0 bg-dark-950/80" />
                    </>
                )}
                {!heroBg && <div className="absolute inset-0 bg-gradient-to-b from-dark-900 to-dark-950" />}

                <div className="container-custom relative z-10">
                    <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                        Todos los <span className="gradient-text">Eventos</span>
                    </h1>
                    <p className="text-dark-400 text-lg max-w-2xl">
                        Explora nuestra selección completa de eventos en vivo. Encuentra tu pelea favorita y asegura tu lugar.
                    </p>
                </div>
            </section>

            {/* ── HERO EVENT CARD ── */}
            {!loading && heroEvent && (
                <section className="container-custom -mt-2 mb-10">
                    <Link
                        href={`/event/${heroEvent.id}`}
                        className="group relative flex items-end overflow-hidden rounded-2xl border border-dark-700 hover:border-primary-500/50 transition-all h-64 md:h-80 shadow-2xl"
                    >
                        {/* Background */}
                        {heroBg ? (
                            <img
                                src={getImageUrl(heroBg)}
                                alt={heroEvent.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-primary-950/30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        {/* Live badge */}
                        {heroEvent.status === 'live' && (
                            <div className="absolute top-5 left-5 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full shadow-lg shadow-red-600/40">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                                </span>
                                <Radio className="w-4 h-4 text-white" />
                                <span className="text-xs font-black uppercase tracking-widest text-white">En Vivo Ahora</span>
                            </div>
                        )}

                        {heroEvent.status !== 'live' && heroEvent.is_featured && (
                            <div className="absolute top-5 left-5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                Evento Destacado
                            </div>
                        )}

                        {/* Content */}
                        <div className="relative z-10 p-6 md:p-8 w-full flex items-end justify-between gap-4">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                                    {formatDate(heroEvent.event_date, 'PP')} · {formatDate(heroEvent.event_date, 'p')}
                                </p>
                                <h2 className="font-display text-2xl md:text-4xl font-black uppercase italic text-white leading-tight line-clamp-2">
                                    {heroEvent.title}
                                </h2>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                {heroEvent.price > 0 && (
                                    <span className="text-3xl font-black text-primary-400 hidden md:block">
                                        {formatCurrency(heroEvent.price, heroEvent.currency)}
                                    </span>
                                )}
                                <div className="w-14 h-14 bg-primary-600 group-hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors shadow-xl">
                                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </section>
            )}

            {/* ── FILTERS ── */}
            <section className="sticky top-0 z-20 bg-dark-950/95 backdrop-blur-sm border-b border-dark-800 py-4">
                <div className="container-custom space-y-3">
                    {/* Search + Sort row */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-500 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar eventos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-9 w-full"
                            />
                        </div>
                        <button
                            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 border border-dark-700 hover:border-primary-500/50 text-sm font-bold text-gray-400 hover:text-white transition-all"
                            title={sortOrder === 'asc' ? 'Más próximos primero' : 'Más recientes primero'}
                        >
                            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                            <span className="hidden sm:inline">{sortOrder === 'asc' ? 'Más próximos' : 'Más recientes'}</span>
                        </button>
                    </div>

                    {/* Status chips */}
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_CHIPS.map(chip => {
                            const count = chip.value === 'all'
                                ? statusCounts.all
                                : chip.value === 'upcoming'
                                    ? (statusCounts['upcoming'] || 0) + (statusCounts['reprise'] || 0)
                                    : statusCounts[chip.value] || 0;

                            if (count === 0 && chip.value !== 'all') return null;

                            const isActive = statusFilter === chip.value;
                            return (
                                <button
                                    key={chip.value}
                                    onClick={() => setStatusFilter(chip.value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        isActive
                                            ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-600/30'
                                            : `${chip.color} hover:opacity-80`
                                    }`}
                                >
                                    {chip.value === 'live' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                    )}
                                    {chip.label}
                                    <span className={`${isActive ? 'bg-white/20' : 'bg-dark-600/60'} px-1.5 py-0.5 rounded-full text-[10px]`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}

                        {/* Results count */}
                        <span className="ml-auto self-center text-xs text-dark-400 hidden sm:block">
                            {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </section>

            {/* ── EVENTS GRID ── */}
            <section className="py-12 flex-1">
                <div className="container-custom">
                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-96 rounded-3xl bg-dark-800/50 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-dark-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Sin resultados</h3>
                            <p className="text-dark-400 mb-8 max-w-xs mx-auto">
                                No hay eventos que coincidan con tu búsqueda o filtro
                            </p>
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                className="btn-primary"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    isPurchased={purchasedEventIds.has(event.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="container-custom pb-8">
                <AdSense slot="5992307942" format="horizontal" />
            </section>

            <Footer />
        </div>
    );
}
