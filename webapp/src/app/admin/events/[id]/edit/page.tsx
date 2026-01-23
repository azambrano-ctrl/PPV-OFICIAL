'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ImageUpload';
import { eventsAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';

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
        stream_url: '',
        thumbnail_url: '',
        banner_url: '',
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [removeThumbnail, setRemoveThumbnail] = useState(false);
    const [removeBanner, setRemoveBanner] = useState(false);

    useEffect(() => {
        if (eventId) {
            loadEvent();
        }
    }, [eventId]);

    const loadEvent = async () => {
        try {
            const response = await eventsAPI.getById(eventId);
            const event = response.data.data;

            // Format date for datetime-local input
            const eventDate = new Date(event.event_date);
            const formattedDate = eventDate.toISOString().slice(0, 16);

            setFormData({
                title: event.title || '',
                description: event.description || '',
                event_date: formattedDate,
                price: String(event.price || ''),
                currency: event.currency || 'USD',
                status: event.status || 'upcoming',
                is_featured: event.is_featured || false,
                is_free: event.price === '0' || event.price === 0,
                stream_url: event.stream_url || '',
                thumbnail_url: event.thumbnail_url || '',
                banner_url: event.banner_url || '',
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
            data.append('event_date', formData.event_date);
            data.append('price', formData.price);
            data.append('currency', formData.currency);
            data.append('status', formData.status);
            data.append('is_featured', String(formData.is_featured));
            if (formData.stream_url) {
                data.append('stream_url', formData.stream_url);
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
                </div>

                {/* Images */}
                <div className="card p-6 space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4">Imágenes</h2>

                    <ImageUpload
                        label="Miniatura (Thumbnail)"
                        value={formData.thumbnail_url}
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
                        value={formData.banner_url}
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
                        </select>
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
