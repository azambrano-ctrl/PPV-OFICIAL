'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ImageUpload';
import { eventsAPI, promotersAPI, handleAPIError } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface Promoter {
    id: string;
    name: string;
}

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        price: '',
        currency: 'USD',
        status: 'upcoming',
        is_featured: false,
        is_free: false,
        free_viewers_limit: '',
        stream_url: '',
        thumbnail_url: '',
        banner_url: '',
        promoter_id: '',
        trailer_url: '',
    });
    const [promoters, setPromoters] = useState<Promoter[]>([]);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [trailerVideoFile, setTrailerVideoFile] = useState<File | null>(null);
    const [removeThumbnail, setRemoveThumbnail] = useState(false);
    const [removeBanner, setRemoveBanner] = useState(false);

    useEffect(() => {
        if (eventId) {
            loadEvent();
            loadPromoters();
        }
    }, [eventId]);

    const loadPromoters = async () => {
        try {
            const res = await promotersAPI.getAll();
            setPromoters(res.data.data);
        } catch (error) {
            console.error('Error loading promoters:', error);
        }
    };

    const loadEvent = async () => {
        try {
            const response = await eventsAPI.getById(eventId);
            const event = response.data.data;

            // Format date for datetime-local input
            // Format UTC date to Local for datetime-local input
            const eventDate = new Date(event.event_date);
            const offset = eventDate.getTimezoneOffset() * 60000;
            const localDate = new Date(eventDate.getTime() - offset);
            const formattedDate = localDate.toISOString().slice(0, 16);

            setFormData({
                title: event.title || '',
                description: event.description || '',
                event_date: formattedDate,
                price: String(event.price || ''),
                currency: event.currency || 'USD',
                status: event.status || 'upcoming',
                is_featured: event.is_featured || false,
                is_free: event.price === '0' || event.price === 0,
                free_viewers_limit: event.free_viewers_limit !== null ? String(event.free_viewers_limit) : '',
                stream_url: event.stream_url || '',
                thumbnail_url: event.thumbnail_url || '',
                banner_url: event.banner_url || '',
                promoter_id: event.promoter_id || '',
                trailer_url: event.trailer_url || '',
            });
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
            router.push('/admin/events');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('event_date', new Date(formData.event_date).toISOString());
            data.append('price', formData.price);
            data.append('currency', formData.currency);
            data.append('status', formData.status);
            data.append('is_featured', String(formData.is_featured));
            if (formData.stream_url) {
                data.append('stream_url', formData.stream_url);
            }
            if (formData.promoter_id) {
                data.append('promoter_id', formData.promoter_id);
            }
            if (formData.free_viewers_limit !== '') {
                data.append('free_viewers_limit', formData.free_viewers_limit);
            } else {
                data.append('free_viewers_limit', ''); // Will parse as null on backend
            }

            // Handle thumbnail
            if (thumbnailFile) {
                data.append('thumbnail', thumbnailFile);
            } else if (removeThumbnail) {
                data.append('remove_thumbnail', 'true');
            }

            // Handle banner
            if (bannerFile) {
                data.append('banner', bannerFile);
            } else if (removeBanner) {
                data.append('remove_banner', 'true');
            }

            let finalTrailerUrl = formData.trailer_url;

            // Direct frontend upload for trailer video to save backend RAM
            if (trailerVideoFile) {
                toast.loading('Subiendo video (esto puede tardar unos minutos)...', { id: 'upload-toast' });
                const fileExt = trailerVideoFile.name.split('.').pop();
                const fileName = `trailer-${Date.now()}.${fileExt}`;
                const { data: uploadData, error } = await supabase.storage
                    .from('event-images') // Assuming the bucket name is event-images based on your backend
                    .upload(fileName, trailerVideoFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    toast.dismiss('upload-toast');
                    throw new Error(`Error subiendo video a Supabase: ${error.message}`);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('event-images')
                    .getPublicUrl(fileName);

                finalTrailerUrl = publicUrl;
                toast.success('Video subido correctamente', { id: 'upload-toast' });
            }

            // Append final URL instead of the file itself
            if (finalTrailerUrl !== undefined) {
                data.append('trailer_url', finalTrailerUrl);
            }

            await eventsAPI.update(eventId, data);
            toast.success('Evento actualizado exitosamente');
            router.push('/admin/events');
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await eventsAPI.delete(eventId);
            toast.success('Evento eliminado exitosamente');
            router.push('/admin/events');
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
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
        <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/events"
                        className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Editar Evento</h1>
                        <p className="text-gray-400 mt-1">Actualiza la información del evento</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleDelete}
                    className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Eliminar
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="card p-6 space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4">Información Básica</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Título del Evento *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input min-h-[120px]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fecha y Hora *
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.event_date}
                            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                            className="input"
                        />
                    </div>
                </div>

                {/* Pricing */}
                <div className="card p-6 space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4">Precio</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Precio *
                            </label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="input"
                                disabled={formData.is_free}
                            />
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_free"
                                    checked={formData.is_free}
                                    onChange={(e) => {
                                        const isFree = e.target.checked;
                                        setFormData({
                                            ...formData,
                                            is_free: isFree,
                                            price: isFree ? '0' : formData.price
                                        });
                                    }}
                                    className="w-4 h-4 bg-dark-700 border-dark-600 rounded text-red-600 focus:ring-red-600"
                                />
                                <label htmlFor="is_free" className="text-sm text-gray-300">
                                    Evento Gratis (Precio $0)
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Moneda
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="input"
                            >
                                <option value="USD">USD - Dólar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="MXN">MXN - Peso Mexicano</option>
                            </select>
                        </div>
                    </div>

                    {/* Free Viewers Limit Input */}
                    {!formData.is_free && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2 mt-4">
                                Límite de Espectadores Gratuitos
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.free_viewers_limit}
                                onChange={(e) => setFormData({ ...formData, free_viewers_limit: e.target.value })}
                                className="input"
                                placeholder="Ej: 300 (opcional)"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Si se establece, esta cantidad de usuarios podrá obtener acceso gratis a un evento de pago. Deja en blanco para no tener cupos gratis.
                            </p>
                        </div>
                    )}
                </div>

                {/* Images */}
                <div className="card p-6 space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4">Imágenes</h2>

                    <ImageUpload
                        label="Miniatura (Thumbnail)"
                        value={getImageUrl(formData.thumbnail_url)}
                        onChange={(file, preview) => {
                            setThumbnailFile(file);
                            if (file === null && formData.thumbnail_url) {
                                // User removed the existing image
                                setRemoveThumbnail(true);
                                setFormData({ ...formData, thumbnail_url: '' });
                            } else if (file) {
                                // User uploaded a new image
                                setRemoveThumbnail(false);
                            }
                        }}
                    />

                    <ImageUpload
                        label="Banner (Hero Image)"
                        value={getImageUrl(formData.banner_url)}
                        onChange={(file, preview) => {
                            setBannerFile(file);
                            if (file === null && formData.banner_url) {
                                // User removed the existing image
                                setRemoveBanner(true);
                                setFormData({ ...formData, banner_url: '' });
                            } else if (file) {
                                // User uploaded a new image
                                setRemoveBanner(false);
                            }
                        }}
                    />
                </div>

                {/* Settings */}
                <div className="card p-6 space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4">Configuración</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Estado
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="input"
                        >
                            <option value="upcoming">Próximo</option>
                            <option value="live">En Vivo</option>
                            <option value="finished">Finalizado</option>
                            <option value="cancelled">Cancelado</option>
                            <option value="reprise">Reprise</option>
                            <option value="draft">Borrador (Solo Admin)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Promotora / Organización
                        </label>
                        <select
                            value={formData.promoter_id}
                            onChange={(e) => setFormData({ ...formData, promoter_id: e.target.value })}
                            className="input"
                        >
                            <option value="">Ninguna / Sin asignar</option>
                            {promoters.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                            Vincula este evento a una promotora específica.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            URL del Stream
                        </label>
                        <input
                            type="url"
                            value={formData.stream_url}
                            onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                            className="input"
                            placeholder="https://stream.example.com/event.m3u8"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            URL del stream HLS/DASH. <b>Requerido</b> si el estado es Reprise.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Trailer del Evento
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Puedes pegar un enlace de YouTube / Vimeo <strong>o</strong> subir un video directamente (MP4 o WebM, máx. 50MB).
                        </p>

                        {/* Option A: URL */}
                        <input
                            type="url"
                            value={formData.trailer_url}
                            onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
                            className="input mb-2"
                            placeholder="https://www.youtube.com/watch?v=..."
                            disabled={!!trailerVideoFile}
                        />

                        <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 border-t border-dark-600" />
                            <span className="text-xs text-gray-500">o sube un video</span>
                            <div className="flex-1 border-t border-dark-600" />
                        </div>

                        {/* Option B: File upload */}
                        <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setTrailerVideoFile(file);
                                if (file) setFormData({ ...formData, trailer_url: '' });
                            }}
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-dark-700 file:text-white hover:file:bg-dark-600 cursor-pointer"
                        />
                        {trailerVideoFile && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                                <span>✅ {trailerVideoFile.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setTrailerVideoFile(null)}
                                    className="text-red-400 hover:text-red-300 text-xs ml-2"
                                >
                                    Quitar
                                </button>
                            </div>
                        )}
                        {formData.trailer_url && !trailerVideoFile && (
                            <p className="text-xs text-blue-400 mt-1 truncate">Actual: {formData.trailer_url}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="featured"
                            checked={formData.is_featured}
                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                            className="w-4 h-4 bg-dark-700 border-dark-600 rounded text-red-600 focus:ring-red-600"
                        />
                        <label htmlFor="featured" className="text-sm text-gray-300">
                            Marcar como evento destacado
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link href="/admin/events" className="btn-secondary">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary"
                    >
                        {saving ? (
                            <>
                                <div className="spinner w-4 h-4 mr-2" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
