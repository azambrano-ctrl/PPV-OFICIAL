'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ImageUpload';
import { eventsAPI, promotersAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';

interface Promoter {
    id: string;
    name: string;
}

export default function NewEventPage() {
    const router = useRouter();
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
        free_viewers_limit: '',
        stream_url: '',
        promoter_id: '',
        trailer_url: '',
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [promoters, setPromoters] = useState<Promoter[]>([]);

    useState(() => {
        promotersAPI.getAll().then(res => setPromoters(res.data.data)).catch(console.error);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create FormData for file upload
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
            data.append('trailer_url', formData.trailer_url);
            if (formData.promoter_id) {
                data.append('promoter_id', formData.promoter_id);
            }
            if (formData.free_viewers_limit) {
                data.append('free_viewers_limit', formData.free_viewers_limit);
            }

            if (thumbnailFile) {
                data.append('thumbnail', thumbnailFile);
            }
            if (bannerFile) {
                data.append('banner', bannerFile);
            }

            await eventsAPI.create(data);
            toast.success('Evento creado exitosamente');
            router.push('/admin/events');
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/events"
                    className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Crear Nuevo Evento</h1>
                    <p className="text-gray-400 mt-1">Completa la información del evento</p>
                </div>
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
                            placeholder="Ej: UFC 300 - Pereira vs. Hill"
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
                            placeholder="Describe el evento..."
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
                                placeholder="29.99"
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
                        onChange={(file, preview) => setThumbnailFile(file)}
                    />

                    <ImageUpload
                        label="Banner (Hero Image)"
                        onChange={(file, preview) => setBannerFile(file)}
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
                            URL del Trailer (YouTube / Vimeo)
                        </label>
                        <input
                            type="url"
                            value={formData.trailer_url}
                            onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
                            className="input"
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Trailer de máximo 2 minutos. Pega un enlace de YouTube o Vimeo.
                        </p>
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
                            Marcar como evento destacado (aparecerá en el hero de la página principal)
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
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? (
                            <>
                                <div className="spinner w-4 h-4 mr-2" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Crear Evento
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
