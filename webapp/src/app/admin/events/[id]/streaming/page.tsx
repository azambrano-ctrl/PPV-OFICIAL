'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Router as RouterIcon, Key, Copy, AlertTriangle, Play, RefreshCw, Trash2, Video } from 'lucide-react';
import api from '@/lib/api';

interface LiveStream {
    id: string;
    event_id: string;
    stream_key: string;
    rtmp_url: string;
    status: string;
    mux_playback_id: string;
    mux_live_stream_id: string;
}

export default function StreamConfigPage() {
    const params = useParams();
    const router = useRouter();
    const [stream, setStream] = useState<LiveStream | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);

    const eventId = params.id as string;

    useEffect(() => {
        fetchStreamInfo();
    }, [eventId]);

    const fetchStreamInfo = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/events/${eventId}/live-stream`);
            setStream(res.data.data);
        } catch (err: any) {
            console.error(err);
            // Ignore 404/null data, just means no stream yet
            if (err.response?.status !== 404) {
                setError('Error al cargar la información del stream');
            }
        } finally {
            setLoading(false);
        }
    };

    const createStream = async () => {
        try {
            setCreating(true);
            const res = await api.post(`/admin/events/${eventId}/live-stream`);
            setStream(res.data.data);
            setError('');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al crear el stream');
        } finally {
            setCreating(false);
        }
    };

    const deleteStream = async () => {
        if (!confirm('¿Estás seguro de querer eliminar esta configuración de stream? Esto interrumpirá cualquier transmisión en curso.')) {
            return;
        }

        try {
            await api.delete(`/admin/events/${eventId}/live-stream`);
            setStream(null);
        } catch (err: any) {
            console.error(err);
            setError('Error al eliminar el stream');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast here
        alert('Copiado al portapapeles');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/events"
                        className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold">Configuración de Transmisión (Mux)</h1>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {!stream ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto text-primary-500">
                            <Video className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2">No hay stream configurado</h2>
                            <p className="text-white/60 max-w-md mx-auto">
                                Crea una configuración de transmisión en vivo para obtener las credenciales RTMP y empezar a transmitir con OBS, vMix, etc.
                            </p>
                        </div>
                        <button
                            onClick={createStream}
                            disabled={creating}
                            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-full font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating ? 'Creando...' : 'Crear Stream en Vivo'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${stream.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-white/30'}`} />
                                <div>
                                    <h3 className="font-medium text-lg">Estado: {stream.status === 'active' ? 'EN VIVO' : stream.status || 'Offline'}</h3>
                                    <p className="text-sm text-white/50">ID: {stream.mux_live_stream_id}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={fetchStreamInfo}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
                                    title="Actualizar estado"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                                <Link
                                    href={`/watch/${eventId}`}
                                    target="_blank"
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                                >
                                    <Play className="w-4 h-4" />
                                    Ver como Usuario
                                </Link>
                            </div>
                        </div>

                        {/* Credentials Card */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Video className="w-5 h-5 text-primary-400" />
                                Credenciales de Transmisión
                            </h3>

                            <div className="grid gap-6">
                                {/* Server URL */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                                        <RouterIcon className="w-4 h-4" />
                                        Servidor RTMP
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={stream.rtmp_url}
                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary-500/50"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(stream.rtmp_url)}
                                            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                            title="Copiar"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stream Key */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                                        <Key className="w-4 h-4" />
                                        Clave de Stream (Stream Key)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={stream.stream_key}
                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary-500/50"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(stream.stream_key)}
                                            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                            title="Copiar"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-amber-400/80 mt-1">
                                        ⚠️ Mantén esta clave secreta. Cualquiera con ella puede transmitir en este evento.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                                <p className="font-semibold mb-1">Configuración en OBS Studio:</p>
                                <ol className="list-decimal list-inside space-y-1 opacity-90">
                                    <li>Ve a Ajustes {'>'} Emisión</li>
                                    <li>Servicio: Personalizado</li>
                                    <li>Servidor: Copia el Servidor RTMP de arriba</li>
                                    <li>Clave de retransmisión: Copia la Clave de Stream de arriba</li>
                                    <li>Aplica los cambios e inicia la transmisión</li>
                                </ol>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="border-t border-white/10 pt-6">
                            <button
                                onClick={deleteStream}
                                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar configuración de stream (Detener transmisión)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
