'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, DollarSign, Search, Filter, Play, ArrowRight } from 'lucide-react';
import { eventsAPI } from '@/lib/api';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl } from '@/lib/utils';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';

interface Event {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    price: number;
    currency: string;
    thumbnail_url?: string;
    status: string;
    is_featured: boolean;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        filterEvents();
    }, [searchTerm, statusFilter, events]);

    const loadEvents = async () => {
        try {
            const response = await eventsAPI.getAll();
            setEvents(response.data.data);
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Error al cargar eventos');
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = () => {
        let filtered = events;

        // Filter by status
        if (statusFilter !== 'all') {
            if (statusFilter === 'upcoming') {
                filtered = filtered.filter((event) => event.status === 'upcoming' || event.status === 'reprise');
            } else {
                filtered = filtered.filter((event) => event.status === statusFilter);
            }
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter((event) =>
                event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredEvents(filtered);
    };

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            {/* Header */}
            <section className="pt-32 pb-12 bg-gradient-to-b from-dark-900 to-dark-950">
                <div className="container-custom">
                    <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                        Todos los <span className="gradient-text">Eventos</span>
                    </h1>
                    <p className="text-dark-400 text-lg max-w-2xl">
                        Explora nuestra selección completa de eventos en vivo. Encuentra tu pelea favorita y asegura tu lugar.
                    </p>
                </div>
            </section>

            {/* Filters */}
            <section className="py-8 bg-dark-900 border-b border-dark-800 sticky top-20 z-40">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-dark-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar eventos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10 w-full"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-5 w-5 text-dark-500" />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input pl-10 pr-10 appearance-none cursor-pointer"
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="upcoming">Próximamente</option>
                                <option value="reprise">Reprise</option>
                                <option value="live">En Vivo</option>
                                <option value="finished">Finalizados</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-dark-400">
                        Mostrando {filteredEvents.length} de {events.length} eventos
                    </div>
                </div>
            </section>

            {/* Events Grid */}
            <section className="py-12 flex-1">
                <div className="container-custom">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="spinner w-12 h-12" />
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-12 h-12 text-dark-600" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2">No se encontraron eventos</h3>
                            <p className="text-dark-400 mb-6">
                                Intenta ajustar tus filtros o búsqueda
                            </p>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                }}
                                className="btn-primary"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEvents.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/event/${event.id}`}
                                    className="card-hover overflow-hidden group"
                                >
                                    {/* Image */}
                                    <div className="relative h-48 bg-dark-800 overflow-hidden">
                                        {event.thumbnail_url ? (
                                            <img
                                                src={getImageUrl(event.thumbnail_url)}
                                                alt={event.title}
                                                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Play className="w-16 h-16 text-dark-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className={`badge ${getEventStatusColor(event.status)}`}>
                                                {getEventStatusText(event.status)}
                                            </span>
                                        </div>
                                        {event.is_featured && (
                                            <div className="absolute top-4 right-4">
                                                <span className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                                    Destacado
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="font-semibold text-xl mb-3 group-hover:text-primary-500 transition-colors line-clamp-2">
                                            {event.title}
                                        </h3>

                                        {event.description && (
                                            <p className="text-dark-400 text-sm mb-4 line-clamp-2">
                                                {event.description}
                                            </p>
                                        )}

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-dark-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(event.event_date, 'PPP')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-dark-400">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatDate(event.event_date, 'p')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-dark-800">
                                            <span className="text-2xl font-bold gradient-text">
                                                {formatCurrency(event.price, event.currency)}
                                            </span>
                                            <span className="text-primary-500 group-hover:translate-x-2 transition-transform">
                                                <ArrowRight className="w-5 h-5" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
