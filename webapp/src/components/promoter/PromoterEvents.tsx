'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Eye, Calendar, Clock, DollarSign, ArrowRight, VideoOff } from 'lucide-react';
import { eventsAPI, handleAPIError } from '@/lib/api';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl } from '@/lib/utils';
import EventForm from '@/components/events/EventForm';
import toast from 'react-hot-toast';

interface PromoterEventsProps {
    promoterId: string;
}

export default function PromoterEvents({ promoterId }: PromoterEventsProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);

    useEffect(() => {
        loadEvents();
    }, [promoterId]);

    const loadEvents = async () => {
        try {
            const response = await eventsAPI.getAll({ promoter_id: promoterId });
            setEvents(response.data.data);
        } catch (error) {
            console.error('Error loading events:', error);
            const message = handleAPIError(error);
            toast.error('No se pudieron cargar tus eventos');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (event: any) => {
        setEditingEvent(event);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingEvent(null);
        setShowForm(true);
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showForm) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                            {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
                        </h2>
                        <p className="text-gray-400 text-sm">Configura los detalles de tu transmisión PPV</p>
                    </div>
                </div>

                <div className="card border-dark-800 bg-dark-950/50 p-6 md:p-8">
                    <EventForm
                        event={editingEvent}
                        isAdmin={false}
                        onSuccess={() => {
                            setShowForm(false);
                            loadEvents();
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header / Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar mis eventos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-900 border border-dark-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-1 focus:ring-primary-500 outline-none transition-all text-sm"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-full font-bold uppercase italic text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary-600/20"
                >
                    <Plus className="w-4 h-4" />
                    Crear Evento
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                    <div className="w-12 h-12 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs italic">Sincronizando Cartelera...</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="card p-20 text-center border-dashed border-2 border-dark-800 bg-transparent">
                    <Calendar className="w-12 h-12 text-dark-800 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 uppercase italic tracking-wider">No hay eventos registrados</h3>
                    <p className="text-gray-600 text-sm mt-2 max-w-xs mx-auto">Comienza a vender tus eventos PPV creando tu primera transmisión hoy mismo.</p>
                    <button
                        onClick={handleCreate}
                        className="mt-6 text-primary-500 hover:text-primary-400 font-black uppercase italic text-sm tracking-widest flex items-center gap-2 mx-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Crear mi primer evento
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                        <div key={event.id} className="group bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden hover:border-dark-600 transition-all flex flex-col shadow-xl">
                            <div className="relative h-48 bg-dark-800 overflow-hidden">
                                {event.thumbnail_url ? (
                                    <img src={getImageUrl(event.thumbnail_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={event.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-dark-700">
                                        <Calendar className="w-10 h-10" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className={`badge ${getEventStatusColor(event.status)} px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl`}>
                                        {getEventStatusText(event.status)}
                                    </span>
                                </div>
                                {!event.stream_url && event.status !== 'finished' && (
                                    <div className="absolute top-4 right-4" title="Stream no configurado por Admin">
                                        <div className="bg-red-600/20 text-red-500 border border-red-600/30 p-1.5 rounded-lg backdrop-blur-sm">
                                            <VideoOff className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 flex-1 flex flex-col gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-white italic uppercase tracking-tight group-hover:text-primary-500 transition-colors line-clamp-1">{event.title}</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        <Calendar className="w-3 h-3 text-primary-500" />
                                        {formatDate(event.event_date, 'PPp')}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-dark-800 mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-600 font-bold uppercase tracking-widest">Precio</span>
                                        <span className="text-xl font-black text-white italic">{formatCurrency(event.price, event.currency)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="p-2.5 bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white rounded-xl transition-all"
                                            title="Editar Información"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <a
                                            href={`/event/${event.id}`}
                                            target="_blank"
                                            className="p-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all"
                                            title="Ver Página del Evento"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
