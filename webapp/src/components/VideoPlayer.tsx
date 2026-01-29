'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useSettingsStore } from '@/lib/store';

interface VideoPlayerProps {
    streamUrl: string;
    token: string;
    eventTitle: string;
    status: string;
    poster?: string;
    isMp4?: boolean;
}

export default function VideoPlayer({ streamUrl, token, eventTitle, status, poster, isMp4 }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(false);
    const [showUI, setShowUI] = useState(true);
    const [canCast, setCanCast] = useState(false);
    const [lastStreamUrl, setLastStreamUrl] = useState<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { settings } = useSettingsStore();

    // Detect if browser supports casting/remote playback
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // 1. Check for native Remote Playback API (Safari/AirPlay)
        if ('remote' in video) {
            const remote = (video as any).remote;
            if (remote.state !== 'disabled') {
                setCanCast(true);
            }
        }

        // 2. Check for Google Cast SDK (Chrome/Chromecast)
        // We check if the script we added to layout.tsx has loaded
        const checkCastSDK = setInterval(() => {
            if ((window as any).chrome && (window as any).chrome.cast && (window as any).chrome.cast.isAvailable) {
                setCanCast(true);
                clearInterval(checkCastSDK);
                console.log('Google Cast SDK detected and available');
            }
        }, 1000);

        // Max check 10 seconds
        setTimeout(() => clearInterval(checkCastSDK), 10000);

        return () => clearInterval(checkCastSDK);
    }, []);

    const handleCast = async () => {
        const video = videoRef.current;
        if (!video) return;

        // Try Google Cast SDK first (more reliable for Chrome)
        const cast = (window as any).cast;
        const chrome = (window as any).chrome;

        if (cast && cast.framework && chrome && chrome.cast) {
            console.log('Starting Google Cast SDK session...');
            const castContext = cast.framework.CastContext.getInstance();

            // Set options if not already set
            castContext.setOptions({
                receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
                autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
            });

            try {
                await castContext.requestSession();
                const session = castContext.getCurrentSession();
                if (session) {
                    const mediaInfo = new chrome.cast.media.MediaInfo(lastStreamUrl, 'application/x-mpegurl');
                    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
                    mediaInfo.metadata.title = eventTitle;
                    if (poster) mediaInfo.metadata.images = [{ url: poster }];

                    const request = new chrome.cast.media.LoadRequest(mediaInfo);
                    await session.loadMedia(request);
                    console.log('Media loaded to Chromecast successfully');
                    return; // Success!
                }
            } catch (err: any) {
                console.log('Cast SDK failed or cancelled:', err);
                // Fallback to Remote Playback if SDK fails but didn't error out completely
                if (err === 'cancel') return;
            }
        }

        // Fallback or Native Remote Playback (Safari/Legacy)
        if ('remote' in video) {
            try {
                const originalSrc = video.src;
                const isBlob = originalSrc.startsWith('blob:');

                // If on Safari (native HLS support), swapping works. 
                // If on Chrome (no native HLS), swapping to HLS URL might fail, 
                // but we already tried SDK above.
                if (isBlob && lastStreamUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = lastStreamUrl;
                }

                await (video as any).remote.prompt();
            } catch (err: any) {
                if (err.name === 'NotFoundError') {
                    const message = `No se detectaron dispositivos de transmisión (TV o Chromecast).
                    
Pasos para solucionar:
1. Asegúrate de que el TV esté en la misma red Wi-Fi.
2. Si usas PC, verifica que Chrome esté actualizado.
3. Reinicia el Wi-Fi de tu dispositivo si el problema persiste.`;
                    alert(message);
                } else if (err.name === 'NotAllowedError') {
                    console.log('Casting prompt cancelled or blocked');
                } else {
                    console.error('Remote playback prompt failed:', err);
                }
            }
        } else {
            alert('Tu navegador no soporta transmisiones nativas. Prueba usando Google Chrome en PC o Safari en iPhone.');
        }
    };

    // Listen for global cast trigger
    useEffect(() => {
        const handleGlobalCast = () => handleCast();
        window.addEventListener('trigger-cast', handleGlobalCast);
        return () => window.removeEventListener('trigger-cast', handleGlobalCast);
    }, [canCast]); // Re-bind if canCast changes

    const handleMouseMove = () => {
        setShowUI(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowUI(false);
        }, 3000);
    };

    const handleMouseLeave = () => {
        if (isPlaying) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setShowUI(false);
        }
    };

    useEffect(() => {
        if (!videoRef.current || !streamUrl) return;

        const video = videoRef.current;

        // SMART URL LOGIC:
        // 1. If it's a proxy link from our API, it already has the token.
        // 2. If it's a Mux link, we DON'T add our internal token (it's public or signed by Mux).
        // 3. Otherwise, append the token.
        let finalUrl = streamUrl;

        if (streamUrl.includes('/api/streaming/') && streamUrl.includes('token=')) {
            // Already proxied with token
            console.log('Proxy URL detected - Using as is');
        } else if (streamUrl.includes('stream.mux.com')) {
            // Use Mux URL as provided (might be signed or have custom params)
            finalUrl = streamUrl;
            console.log('Mux Stream detected - Using URL:', finalUrl);
        } else {
            finalUrl = `${streamUrl}${streamUrl.includes('?') ? '&' : '?'}token=${token}`;
        }

        console.log('Loading stream:', finalUrl);
        setLastStreamUrl(finalUrl);

        const handleManifestParsed = () => {
            console.log('HLS manifest parsed successfully');
            setIsLoading(false);
            setError(null);

            // Auto-play for live streams
            if (status === 'live' || status === 'reprise') {
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
        // SPECIAL CASE: If it's an MP4 file (detected by flag or extension), play natively, do NOT use HLS.js
        if (isMp4 || finalUrl.includes('.mp4')) {
            console.log('MP4 detected (forced or by extension), using native playback');
            video.src = finalUrl;
            video.addEventListener('loadedmetadata', handleManifestParsed);
            video.addEventListener('error', (e) => handleError(null, { fatal: true, type: 'native', details: e }));

            return () => {
                video.removeEventListener('loadedmetadata', handleManifestParsed);
                video.removeEventListener('error', () => { });
            };
        }
        else if (Hls.isSupported()) {
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
        <div
            className="relative w-full h-full bg-black group overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
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
                <div className={`absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-red-600/90 rounded text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
                    <div className={`w-2 h-2 rounded-full bg-white ${isPlaying ? 'animate-pulse' : ''}`}></div>
                    EN VIVO
                </div>
            )}

            {/* Cast Button Overlay */}
            {!isLoading && !error && canCast && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCast();
                    }}
                    className={`absolute top-4 right-4 z-20 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all duration-500 border border-white/10 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                    title="Enviar a TV"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
                        <line x1="2" y1="20" x2="2.01" y2="20" />
                    </svg>
                </button>
            )}

            {/* Logo Watermark */}
            {settings?.site_logo && (
                <div
                    className={`absolute top-4 right-14 z-20 transition-all duration-500 pointer-events-none select-none ${showUI ? 'opacity-40 scale-100' : 'opacity-20 scale-90'
                        }`}
                    style={{
                        maxWidth: '80px',
                    }}
                >
                    <img
                        src={settings.site_logo}
                        alt="Watermark"
                        className="w-full h-auto object-contain brightness-0 invert opacity-80"
                        onDragStart={(e) => e.preventDefault()}
                    />
                </div>
            )}

        </div>
    );
}
