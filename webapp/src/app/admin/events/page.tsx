'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Edit, Trash2, Eye, Video, Square, ShoppingCart } from 'lucide-react';
import { eventsAPI, adminAPI, handleAPIError } from '@/lib/api';
import api from '@/lib/api';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl } from '@/lib/utils';
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

interface SalesSummary {
    id: string;
    sold: number;
    pending: number;
    revenue: number;
    currency: string;
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [salesMap, setSalesMap] = useState<Record<string, SalesSummary>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [endingStreamId, setEndingStreamId] = useState<string | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        filterEvents();
    }, [events, searchTerm, statusFilter]);

    const loadEvents = async () => {
        try {
            const [evRes, salesRes] = await Promise.all([
                eventsAPI.getAll({}),
                adminAPI.getEventsSalesSummary(),
            ]);
            setEvents(evRes.data.data);
            const map: Record<string, SalesSummary> = {};
            for (const s of (salesRes.data.data || [])) map[s.id] = s;
            setSalesMap(map);
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Error al cargar eventos');
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = () => {
        let filtered = [...events];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(event => event.status === statusFilter);
        }

        setFilteredEvents(filtered);
    };

    const handleEndStream = async (id: string, title: string) => {
        if (!confirm(`¿Terminar la transmisión EN VIVO de "${title}" ahora? El evento pasará a modo REPRISE.`)) {
            return;
        }
        try {
            setEndingStreamId(id);
            await api.post(`/admin/events/${id}/end-stream`);
            toast.success(`✅ "${title}" pasó a REPRISE`);
            loadEvents();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al terminar la transmisión';
            toast.error(msg);
        } finally {
            setEndingStreamId(null);
        }
    };

    const handleDelete = async (id: string, force = false) => {
        const confirmMsg = force
            ? '⚠️ FORZAR ELIMINACIÓN: Se borrarán también todas las compras de este evento. ¿Estás seguro?'
            : '¿Estás seguro de que quieres eliminar este evento?';

        if (!confirm(confirmMsg)) return;

        try {
            if (force) {
                await eventsAPI.deleteForce(id);
            } else {
                await eventsAPI.delete(id);
            }
            toast.success('Evento eliminado exitosamente');
            loadEvents();
        } catch (error: any) {
            const message = handleAPIError(error);
            // Si el error es por compras, ofrecer forzar eliminación
            if (message.includes('compra')) {
                const forceIt = confirm(`${message}\n\n¿Deseas forzar la eliminación y borrar también las compras?`);
                if (forceIt) handleDelete(id, true);
            } else {
                toast.error(message);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Eventos</h1>
                    <p className="text-gray-400">Administra todos los eventos de la plataforma</p>
                </div>
                <Link href="/admin/events/new" className="btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Evento
                </Link>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar eventos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input pl-10"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="upcoming">Próximos</option>
                            <option value="live">En Vivo</option>
                            <option value="finished">Finalizados</option>
                            <option value="cancelled">Cancelados</option>
                            <option value="reprise">Reprise</option>
                            <option value="draft">Borrador (Solo Admin)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Events Table */}
            {filteredEvents.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {searchTerm || statusFilter !== 'all' ? 'No se encontraron eventos' : 'No hay eventos'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Intenta con otros filtros'
                            : 'Crea tu primer evento para comenzar'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                        <Link href="/admin/events/new" className="btn-primary">
                            <Plus className="w-5 h-5 mr-2" />
                            Crear Primer Evento
                        </Link>
                    )}
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-800">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Evento
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Fecha
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Precio
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Estado
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Destacado
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Ventas
                                    </th>
                                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-800">
                                {filteredEvents.map((event) => (
                                    <tr key={event.id} className="hover:bg-dark-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                {event.thumbnail_url && (
                                                    <img
                                                        src={getImageUrl(event.thumbnail_url)}
                                                        alt={event.title}
                                                        className="w-12 h-12 rounded object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-semibold text-white">
                                                        {event.title}
                                                    </p>
                                                    {event.description && (
                                                        <p className="text-sm text-gray-500 truncate max-w-xs">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-300">
                                            {formatDate(event.event_date, 'PPP')}
                                        </td>
                                        <td className="py-4 px-6 text-white font-semibold">
                                            {formatCurrency(event.price, event.currency)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`badge ${getEventStatusColor(event.status)}`}>
                                                {getEventStatusText(event.status)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {event.is_featured ? (
                                                <span className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                                    ⭐ Sí
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">No</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            {(() => {
                                                const s = salesMap[event.id];
                                                if (!s) return <span className="text-gray-600">—</span>;
                                                return (
                                                    <div>
                                                        <p className="text-white font-bold flex items-center gap-1">
                                                            <ShoppingCart className="w-3.5 h-3.5 text-green-400" />
                                                            {s.sold}
                                                        </p>
                                                        <p className="text-xs text-green-400">{formatCurrency(s.revenue, event.currency)}</p>
                                                        {s.pending > 0 && (
                                                            <p className="text-xs text-yellow-500">{s.pending} pendiente{s.pending > 1 ? 's' : ''}</p>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                {event.status === 'live' && (
                                                    <button
                                                        onClick={() => handleEndStream(event.id, event.title)}
                                                        disabled={endingStreamId === event.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 rounded-lg transition-colors text-red-400 text-xs font-semibold disabled:opacity-50"
                                                        title="Terminar transmisión EN VIVO"
                                                    >
                                                        <Square className="w-3 h-3" />
                                                        {endingStreamId === event.id ? '...' : 'Terminar'}
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/event/${event.id}`}
                                                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Ver evento"
                                                >
                                                    <Eye className="w-4 h-4 text-gray-400" />
                                                </Link>
                                                <Link
                                                    href={`/admin/events/${event.id}/streaming`}
                                                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Configurar Streaming"
                                                >
                                                    <Video className="w-4 h-4 text-purple-400" />
                                                </Link>
                                                <Link
                                                    href={`/admin/events/${event.id}/edit`}
                                                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4 text-blue-400" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <p>
                    Mostrando {filteredEvents.length} de {events.length} eventos
                </p>
            </div>
        </div>
    );
}
