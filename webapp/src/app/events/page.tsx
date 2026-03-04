'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Search, Filter } from 'lucide-react';
import { eventsAPI, authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getImageUrl } from '@/lib/utils';
import Footer from '@/components/Footer';
import EventCard from '@/components/events/EventCard';
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
    promoter_id?: string;
    promoter_name?: string;
    promoter_logo_url?: string;
}

export default function EventsPage() {
    const { isAuthenticated } = useAuthStore();
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [purchasedEventIds, setPurchasedEventIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadEvents();
        if (isAuthenticated) {
            loadPurchases();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        filterEvents();
    }, [searchTerm, statusFilter, events]);

    const loadEvents = async () => {
        try {
            const response = await eventsAPI.getAll();
            // Exclude draft and pending events from the public page
            const publicEvents = (response.data.data || []).filter(
                (e: any) => !['draft', 'pending'].includes((e.status || '').toLowerCase())
            );
            setEvents(publicEvents);
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Error al cargar eventos');
        } finally {
            setLoading(false);
        }
    };

    const loadPurchases = async () => {
        try {
            const response = await authAPI.getPurchases();
            const ids = new Set<string>(
                (response.data.data || []).map((p: any) => p.event_id)
            );
            setPurchasedEventIds(ids);
        } catch (error) {
            console.error('Error loading purchases:', error);
        }
    };

    const filterEvents = () => {
        let filtered = events;

        // Filter by status
        if (statusFilter !== 'all') {
            if (statusFilter === 'upcoming') {
                filtered = filtered.filter((event) => event.status === 'upcoming' || (event.status === 'reprise' && parseFloat(String(event.price)) === 0));
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
                                <EventCard key={event.id} event={event} isPurchased={purchasedEventIds.has(event.id)} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
