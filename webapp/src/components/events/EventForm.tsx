'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Clock, Calendar, DollarSign, Image as ImageIcon, Music, Timer } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import { eventsAPI, handleAPIError } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

interface EventFormProps {
    event?: any;
    onSuccess: () => void;
    onCancel: () => void;
    isAdmin: boolean;
}

export default function EventForm({ event, onSuccess, onCancel, isAdmin }: EventFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        price: '',
        currency: 'USD',
        status: 'upcoming',
        is_featured: false,
        is_free: false,
        stream_url: '',
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [cardFile, setCardFile] = useState<File | null>(null);
    const [waitingRoomBgFile, setWaitingRoomBgFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [cardPreview, setCardPreview] = useState<string | null>(null);
    const [waitingRoomBgPreview, setWaitingRoomBgPreview] = useState<string | null>(null);
    const [waitingRoomMusicUrl, setWaitingRoomMusicUrl] = useState('');

    useEffect(() => {
        if (event) {
            // Format date for datetime-local input
            let formattedDate = '';
            if (event.event_date) {
                const d = new Date(event.event_date);
                formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            }

            setFormData({
                title: event.title || '',
                description: event.description || '',
                event_date: formattedDate,
                price: String(event.price || ''),
                currency: event.currency || 'USD',
                status: event.status || 'upcoming',
                is_featured: !!event.is_featured,
                is_free: parseFloat(String(event.price)) === 0,
                stream_url: event.stream_url || '',
            });

            if (event.thumbnail_url) setThumbnailPreview(getImageUrl(event.thumbnail_url) as string | null);
            if (event.banner_url) setBannerPreview(getImageUrl(event.banner_url) as string | null);
            if (event.card_image_url) setCardPreview(getImageUrl(event.card_image_url) as string | null);
            if (event.waiting_room_bg_url) setWaitingRoomBgPreview(getImageUrl(event.waiting_room_bg_url) as string | null);
            if (event.waiting_room_music_url) setWaitingRoomMusicUrl(event.waiting_room_music_url);
        }
    }, [event]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('event_date', new Date(formData.event_date).toISOString());
            data.append('price', formData.price);
            data.append('currency', formData.currency);

            // Restricted fields
            if (isAdmin) {
                data.append('status', formData.status);
                data.append('is_featured', String(formData.is_featured));
                data.append('stream_url', formData.stream_url);
            }

            if (thumbnailFile) data.append('thumbnail', thumbnailFile);
            if (bannerFile) data.append('banner', bannerFile);
            if (cardFile) data.append('card', cardFile);
            if (waitingRoomBgFile) data.append('waiting_room_bg', waitingRoomBgFile);
            data.append('waiting_room_music_url', waitingRoomMusicUrl);

            if (event?.id) {
                await eventsAPI.update(event.id, data);
                toast.success('Evento actualizado exitosamente');
            } else {
                await eventsAPI.create(data);
                toast.success('Evento creado exitosamente');
            }

            onSuccess();
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Info */}
                <div className="space-y-6">
                    <section className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 space-y-4">
                        <h3 className="text-lg font-bold text-white uppercase italic tracking-wider flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary-500" />
                            Información Principal
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Título del Evento</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="Ej: Gran Combate MMA"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all min-h-[120px] resize-none"
                                    placeholder="Detalles sobre el evento..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Fecha y Hora</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.event_date}
                                            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Precio (${formData.currency})</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            disabled={formData.is_free}
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_free_form"
                                            checked={formData.is_free}
                                            onChange={(e) => {
                                                const free = e.target.checked;
                                                setFormData({ ...formData, is_free: free, price: free ? '0' : (event?.price || '') });
                                            }}
                                            className="w-4 h-4 bg-dark-700 border-dark-600 rounded text-primary-500 focus:ring-primary-500"
                                        />
                                        <label htmlFor="is_free_form" className="text-xs text-gray-400 font-bold uppercase tracking-wider cursor-pointer">Evento Gratuito</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {isAdmin && (
                        <section className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 space-y-4">
                            <h3 className="text-lg font-bold text-white uppercase italic tracking-wider flex items-center gap-2 text-purple-500">
                                <Clock className="w-5 h-5" />
                                Configuración Admin
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Estado</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="upcoming">Próximamente</option>
                                        <option value="live">En Vivo</option>
                                        <option value="finished">Finalizado</option>
                                        <option value="cancelled">Cancelado</option>
                                        <option value="reprise">Reprise</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="is_featured_form"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                        className="w-5 h-5 bg-dark-700 border-dark-600 rounded text-primary-500 focus:ring-primary-500"
                                    />
                                    <label htmlFor="is_featured_form" className="text-xs text-white font-bold uppercase tracking-wider cursor-pointer font-black italic">★ Destacado</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">URL del Stream (Admin Only)</label>
                                <input
                                    type="url"
                                    value={formData.stream_url}
                                    onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="https://stream.mux.com/..."
                                />
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: Visuals */}
                <div className="space-y-6">
                    <section className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 space-y-4">
                        <h3 className="text-lg font-bold text-white uppercase italic tracking-wider flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-green-500" />
                            Activos Visuales
                        </h3>

                        <div className="space-y-6">
                            <ImageUpload
                                label="Miniatura (Portrait - 4:5 recomendado)"
                                onChange={(file) => setThumbnailFile(file)}
                                value={thumbnailPreview || undefined}
                            />

                            <ImageUpload
                                label="Banner de Fondo (Landscape - 16:9)"
                                onChange={(file) => setBannerFile(file)}
                                value={bannerPreview || undefined}
                            />

                            <ImageUpload
                                label="Cartelera del Evento (Fight Card)"
                                aspect={0}
                                onChange={(file) => setCardFile(file)}
                                value={cardPreview || undefined}
                            />
                        </div>
                    </section>

                    {isAdmin && (
                        <section className="bg-dark-900/50 p-6 rounded-3xl border border-yellow-500/20 space-y-5">
                            <h3 className="text-lg font-bold text-white uppercase italic tracking-wider flex items-center gap-2">
                                <Timer className="w-5 h-5 text-yellow-400" />
                                <span className="text-yellow-400">Sala de Espera</span>
                            </h3>
                            <p className="text-xs text-gray-500">Se muestra a los usuarios con acceso antes de que el evento inicie.</p>

                            <ImageUpload
                                label="Fondo personalizado (reemplaza el thumbnail)"
                                onChange={(file) => setWaitingRoomBgFile(file)}
                                value={waitingRoomBgPreview || undefined}
                            />
                            {waitingRoomBgPreview && (
                                <button
                                    type="button"
                                    onClick={() => { setWaitingRoomBgPreview(null); setWaitingRoomBgFile(null); }}
                                    className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
                                >
                                    × Quitar fondo personalizado
                                </button>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <Music className="w-3 h-3 text-yellow-400" />
                                    URL de Música (MP3 directo)
                                </label>
                                <input
                                    type="url"
                                    value={waitingRoomMusicUrl}
                                    onChange={(e) => setWaitingRoomMusicUrl(e.target.value)}
                                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all text-sm"
                                    placeholder="https://ejemplo.com/musica.mp3"
                                />
                                <p className="text-[10px] text-gray-600 mt-1">Pega un enlace directo a un archivo MP3. Si está vacío, se usa la música por defecto.</p>
                                {waitingRoomMusicUrl && (
                                    <div className="mt-3 flex items-center gap-3 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3">
                                        <Music className="w-4 h-4 text-yellow-400 shrink-0" />
                                        <span className="text-xs text-gray-400 truncate flex-1">{waitingRoomMusicUrl}</span>
                                        <audio controls className="h-8" src={waitingRoomMusicUrl} />
                                        <button type="button" onClick={() => setWaitingRoomMusicUrl('')} className="text-red-400 hover:text-red-300 text-xs font-bold shrink-0">× Quitar</button>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-8 py-4 text-gray-400 hover:text-white font-bold uppercase tracking-widest text-xs transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-full font-black uppercase italic transform hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary-600/30 flex items-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>{event?.id ? 'Guardar Cambios' : (isAdmin ? 'Crear Evento' : 'Enviar Solicitud')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
