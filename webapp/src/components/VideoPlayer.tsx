'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
    streamUrl: string;
    token: string;
    eventTitle: string;
    status: string;
    poster?: string;
}

export default function VideoPlayer({ streamUrl, token, eventTitle, status, poster }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(false);

    useEffect(() => {
        if (!videoRef.current || !streamUrl) return;

        const video = videoRef.current;

        // LOGIN INTELIGENTE DE URL:
        // Si es Mux (stream.mux.com), NO debemos enviar nuestro token interno 
        // porque Mux lo interpretará como una firma inválida si el stream es público.
        let finalUrl = streamUrl;

        if (streamUrl.includes('stream.mux.com')) {
            // Limpiar token interno para streams de Mux
            const parts = streamUrl.split('?');
            finalUrl = parts[0];
            console.log('Mux Stream detectado - Token limpiado:', finalUrl);
        } else {
            // Para otros streams (proxy interno), SÍ necesitamos el token
            finalUrl = `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}token=${token}`;
        }

        console.log('Loading stream:', finalUrl);

        const handleManifestParsed = () => {
            console.log('HLS manifest parsed successfully');
            setIsLoading(false);
            setError(null);

            // Auto-play for live streams
            if (status === 'live') {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Autoplay prevented:', error);
                        // Show play button if autoplay fails
                        setShowPlayButton(true);
                        // Try playing muted as fallback
                        video.muted = true;
                        video.play().catch(e => console.log('Muted autoplay also failed:', e));
                    });
                }
            }
        };

        const handleError = (event: any, data: any) => {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log('Network error, trying to recover...');
                        hlsRef.current?.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log('Media error, trying to recover...');
                        hlsRef.current?.recoverMediaError();
                        break;
                    default:
                        console.error('Fatal streaming error:', data);
                        setError('No se pudo cargar la transmisión. Verifica tu conexión.');
                        setIsLoading(false);
                        break;
                }
            }
        };

        // Check if HLS is supported
        if (Hls.isSupported()) {
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
            });

            hlsRef.current = hls;

            hls.loadSource(finalUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
            hls.on(Hls.Events.ERROR, handleError);

            return () => {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                }
            };
        }
        // Native HLS support (Safari)
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = finalUrl;

            video.addEventListener('loadedmetadata', handleManifestParsed);
            video.addEventListener('error', (e) => handleError(null, { fatal: true, type: 'native', details: e }));

            return () => {
                video.removeEventListener('loadedmetadata', handleManifestParsed);
                video.removeEventListener('error', () => { });
            };
        } else {
            setError('Tu navegador no soporta reproducción HLS.');
            setIsLoading(false);
        }
    }, [streamUrl, token, status]);

    // Handle play/pause events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPlay = () => {
            setIsPlaying(true);
            setShowPlayButton(false);
        };
        const onPause = () => {
            setIsPlaying(false);
            // Only show play button if not seeking/loading
            if (!isLoading) setShowPlayButton(true);
        };

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);

        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
        };
    }, [isLoading]);

    const handleManualPlay = () => {
        if (videoRef.current) {
            videoRef.current.play();
            videoRef.current.muted = false; // Unmute on manual interaction
        }
    };

    return (
        <div className="relative w-full h-full bg-black group overflow-hidden">
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                playsInline
                poster={poster}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-medium">Cargando transmisión...</p>
                </div>
            )}

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30">
                    <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-white text-lg font-bold mb-2">Error de Reproducción</p>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Manual Play Button Overlay - Mejorado para móviles */}
            {!isLoading && !error && showPlayButton && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors cursor-pointer z-10"
                    onClick={handleManualPlay}
                >
                    <div className="w-20 h-20 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <svg className="w-10 h-10 text-white translate-x-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Live Indicator */}
            {status === 'live' && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-red-600/90 rounded text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                    <div className={`w-2 h-2 rounded-full bg-white ${isPlaying ? 'animate-pulse' : ''}`}></div>
                    EN VIVO
                </div>
            )}

            {/* Event Title Overlay */}
            {!isLoading && !error && (
                <div className="absolute bottom-20 left-4 right-4 md:left-6 md:right-6 pointer-events-none">
                    <div className="bg-gradient-to-t from-black/80 to-transparent p-4 rounded-lg">
                        <h2 className="text-white text-xl md:text-2xl font-bold">{eventTitle}</h2>
                    </div>
                </div>
            )}
        </div>
    );
}
