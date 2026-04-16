'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { useSettingsStore, useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { Users } from 'lucide-react';
import Image from 'next/image';
import AdSense from './ui/AdSense';

interface VideoPlayerProps {
    streamUrl: string;
    token: string;
    eventTitle: string;
    status: string;
    poster?: string;
    isMp4?: boolean;
    viewerCount?: number;
}

export default function VideoPlayer({ streamUrl, token, eventTitle, status, poster, isMp4, viewerCount = 0 }: VideoPlayerProps) {
    // === CONFIGURACIÓN DE PUBLICIDAD (VAST TAG) ===
    // ========================================================
    // Reemplaza esta URL de prueba por tu enlace real de Google Ad Manager/AdSense cuando lo tengas.
    //
    // ## Solución de Problemas (Error 303)
    // Si ves el error **"303: No Ads VAST response"**, ¡felicidades! Significa que:
    // 1.  **El código funciona perfectamente**: Tu sitio está conectando con Google con éxito.
    // 2.  **Falta de Inventario**: Google simplemente no tiene un anuncio para mostrarte en este momento (común en cuentas nuevas).
    // 3.  **Siguiente Paso**: Debes ir a Google Ad Manager y crear un **"Pedido" (Order)** y una **"Línea de pedido" (Line Item)** apuntando a tu bloque `midroll_video` para que Google empiece a enviar anuncios reales.
    const VAST_TAG_URL = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/23341415522/midroll_video&description_url=https%3A%2F%2Farenafightpass.com%2F&tfcd=0&npa=0&sz=640x480&gdfp_req=1&unviewed_position_start=1&output=vast&env=vp&impl=s';
    // ========================================================

    useEffect(() => {
        console.log('%c>>> VideoPlayer Version: 1.0.3 (Fixed VAST & Cache) <<<', 'color: #ff00ff; font-weight: bold;');
    }, []);

    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(false);
    const [showUI, setShowUI] = useState(true);
    const [canCast, setCanCast] = useState(false);
    const [resolvedUrl, setResolvedUrl] = useState<string>('');
    const lastStreamUrlRef = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // IMA SDK Refs & State
    const adContainerRef = useRef<HTMLDivElement>(null);
    const adsLoaderRef = useRef<any>(null);
    const adsManagerRef = useRef<any>(null);
    const [isAdPlaying, setIsAdPlaying] = useState(false);
    const [quality, setQuality] = useState<string>('');

    // Mid-roll ad state
    const [lastAdTime, setLastAdTime] = useState(0);
    // Watermark position state
    const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '30%' });

    const { settings } = useSettingsStore();
    const { user } = useAuthStore();

    // Detect if browser supports casting/remote playback
    useEffect(() => {
        const checkCastSDK = setInterval(() => {
            if ((window as any).chrome && (window as any).chrome.cast && (window as any).chrome.cast.isAvailable) {
                setCanCast(true);
                clearInterval(checkCastSDK);
                console.log('Google Cast SDK detected and available');
            }
        }, 1000);

        // Native AirPlay support (Safari)
        if (typeof window !== 'undefined' && 'WebKitPlaybackTargetAvailabilityEvent' in window) {
            setCanCast(true);
        }

        setTimeout(() => clearInterval(checkCastSDK), 10000);
        return () => clearInterval(checkCastSDK);
    }, []);

    // Heartbeat to keep session alive during long playback
    useEffect(() => {
        if (!isPlaying && !isLoading) return;

        const heartbeatInterval = setInterval(async () => {
            try {
                // Use a simple profile call as heartbeat
                await authAPI.getProfile();
                console.log('Auth heartbeat: session active');
            } catch (err) {
                console.warn('Auth heartbeat failed:', err);
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        return () => clearInterval(heartbeatInterval);
    }, [isPlaying, isLoading]);

    // Move watermark position periodically (anti-piracy)
    useEffect(() => {
        const positions = [
            { top: '15%', left: '20%' },
            { top: '60%', left: '70%' },
            { top: '30%', left: '55%' },
            { top: '75%', left: '15%' },
            { top: '45%', left: '40%' },
            { top: '20%', left: '75%' },
            { top: '70%', left: '35%' },
            { top: '50%', left: '60%' },
        ];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % positions.length;
            setWatermarkPos(positions[idx]);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Anti-piracy: Block right click and common dev tools shortcuts (except for admins)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Allow admins to use dev tools
            if (user?.role === 'admin') return;

            // Block F12
            if (e.key === 'F12') e.preventDefault();
            // Block Ctrl+Shift+I / Cmd+Opt+I (DevTools)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') e.preventDefault();
            // Block Ctrl+Shift+J / Cmd+Opt+J (Console)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') e.preventDefault();
            // Block Ctrl+Shift+C / Cmd+Opt+C (Element Inspector)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') e.preventDefault();
            // Block Ctrl+U / Cmd+U (View Source)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') e.preventDefault();
        };

        // Attach to document body
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [user?.role]);

    const handleCast = useCallback(async () => {
        const currentStreamUrl = lastStreamUrlRef.current || streamUrl;
        if (!currentStreamUrl) return;

        const video = videoRef.current;
        const cast = (window as any).cast;
        const chrome = (window as any).chrome;

        // Try Google Cast SDK
        if (cast && cast.framework && chrome && chrome.cast) {
            const castContext = cast.framework.CastContext.getInstance();
            castContext.setOptions({
                receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
                autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
            });

            try {
                await castContext.requestSession();
                const session = castContext.getCurrentSession();
                if (session) {
                    const contentType = isMp4 || currentStreamUrl.toLowerCase().includes('.mp4') ? 'video/mp4' : 'application/x-mpegurl';
                    const mediaInfo = new chrome.cast.media.MediaInfo(currentStreamUrl, contentType);
                    mediaInfo.streamType = status === 'live' ? chrome.cast.media.StreamType.LIVE : chrome.cast.media.StreamType.BUFFERED;
                    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
                    mediaInfo.metadata.title = eventTitle;
                    if (poster) {
                        const absPoster = poster.startsWith('/') ? `${window.location.protocol}//${window.location.host}${poster}` : poster;
                        mediaInfo.metadata.images = [{ url: absPoster }];
                    }
                    const request = new chrome.cast.media.LoadRequest(mediaInfo);
                    request.autoplay = true;
                    await session.loadMedia(request);
                    return;
                }
            } catch (err) { console.warn('Cast failed:', err); }
        }

        // Fallback to Native Remote Playback (Safari/AirPlay)
        if (video && 'remote' in video) {
            try {
                const isBlob = video.src.startsWith('blob:');
                if (isBlob && video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = currentStreamUrl;
                }
                await (video as any).remote.prompt();
            } catch (err) { console.error('Remote prompt failed:', err); }
        } else if (!cast) {
            alert('Tu dispositivo no soporta transmisión nativa. Prueba usar Google Chrome desde una PC.');
        }
    }, [streamUrl, isMp4, status, eventTitle, poster]);

    // Listen for global cast trigger
    useEffect(() => {
        const handleGlobalCast = () => handleCast();
        window.addEventListener('trigger-cast', handleGlobalCast);
        return () => window.removeEventListener('trigger-cast', handleGlobalCast);
    }, [canCast, streamUrl, handleCast]);

    const handleMouseMove = () => {
        setShowUI(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => { if (isPlaying) setShowUI(false); }, 3000);
    };

    const handleMouseLeave = () => { if (isPlaying) setShowUI(false); };



    const onAdError = useCallback((adErrorEvent: any) => {
        const error = adErrorEvent.getError();
        console.error('IMA Ad Error:', {
            code: error.getErrorCode(),
            message: error.getMessage(),
            type: error.getType()
        });
        setIsAdPlaying(false);
        if (adsManagerRef.current) {
            try { adsManagerRef.current.destroy(); } catch (e) { }
        }
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.warn('Video play after error failed:', e));
        }
    }, []);

    const requestAds = useCallback(() => {
        const google = (window as any).google;
        if (!google || !adsLoaderRef.current) return;

        const adsRequest = new google.ima.AdsRequest();
        // Usar la URL configurada al principio del componente
        adsRequest.adTagUrl = VAST_TAG_URL;

        adsRequest.linearAdSlotWidth = videoRef.current?.clientWidth || 640;
        adsRequest.linearAdSlotHeight = videoRef.current?.clientHeight || 480;
        adsRequest.nonLinearAdSlotWidth = videoRef.current?.clientWidth || 640;
        adsRequest.nonLinearAdSlotHeight = videoRef.current?.clientHeight || 150;

        adsLoaderRef.current.requestAds(adsRequest);
    }, [VAST_TAG_URL]);

    const onAdsManagerLoaded = useCallback((adsManagerLoadedEvent: any) => {
        const google = (window as any).google;
        const adsRenderingSettings = new google.ima.AdsRenderingSettings();
        adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
        // Aumentar el límite de redirecciones para evitar que se rompa la cadena de VAST
        adsRenderingSettings.maxRedirects = 10;

        const adsManager = adsManagerLoadedEvent.getAdsManager(videoRef.current, adsRenderingSettings);
        adsManagerRef.current = adsManager;

        adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
        adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => {
            setIsAdPlaying(true);
            if (videoRef.current) {
                videoRef.current.pause();
            }
        });
        adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => {
            setIsAdPlaying(false);
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.warn('Main video play interrupted:', e));
            }
        });
        adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
            setIsAdPlaying(false);
            adsManager.destroy();
        });

        try {
            console.log('AdsManager initializing...');
            adsManager.init(videoRef.current?.clientWidth || 640, videoRef.current?.clientHeight || 480, google.ima.ViewMode.NORMAL);
            console.log('AdsManager starting...');
            adsManager.start();
        } catch (adError) {
            console.error('AdsManager error:', adError);
        }
    }, [onAdError]);

    const initializeIMA = useCallback(() => {
        const google = (window as any).google;
        if (!google || !google.ima || !videoRef.current || !adContainerRef.current) return;

        const adDisplayContainer = new google.ima.AdDisplayContainer(adContainerRef.current, videoRef.current);
        adDisplayContainer.initialize();

        const adsLoader = new google.ima.AdsLoader(adDisplayContainer);
        adsLoaderRef.current = adsLoader;

        adsLoader.addEventListener(
            google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
            onAdsManagerLoaded,
            false
        );
        adsLoader.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            onAdError,
            false
        );
    }, [onAdsManagerLoaded, onAdError]);

    // Load IMA SDK
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const script = document.createElement('script');
        // Usar la versión cacheable del SDK para no demorar la carga del reproductor
        script.src = `https://imasdk.googleapis.com/js/sdkloader/ima3.js`;
        script.async = true;
        script.onload = () => {
            console.log('Google IMA SDK loaded');
            initializeIMA();
        };
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
            if (adsManagerRef.current) adsManagerRef.current.destroy();
        };
    }, [initializeIMA]);

    useEffect(() => {
        let finalUrl = streamUrl;
        if (!finalUrl) return;

        if (finalUrl.startsWith('/')) {
            finalUrl = `${window.location.protocol}//${window.location.host}${finalUrl}`;
        }

        // URL Security / Provider logic
        const isProvider = finalUrl.includes('cloudflarestream.com') ||
            finalUrl.includes('videodelivery.net') ||
            finalUrl.includes('stream.mux.com') ||
            finalUrl.includes('b-cdn.net') ||
            finalUrl.includes('/api/streaming/');

        if (!isProvider) {
            finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}token=${token}`;
        }

        console.log('Resolved Stream URL:', finalUrl);
        setResolvedUrl(finalUrl);
        lastStreamUrlRef.current = finalUrl;

        // If it's a Cloudflare URL and it's NOT a manifest, we might need the iframe.
        // BUT if it IS a manifest, HLS.js is much better (supports Cast button).
        const isCloudflare = finalUrl.includes('cloudflarestream.com') || finalUrl.includes('videodelivery.net');
        const isManifest = finalUrl.includes('.m3u8');

        if (isCloudflare && !isManifest) {
            console.log('Cloudflare ID detected (no manifest) - Using iframe mode');
            setIsLoading(false);
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        const handleManifestParsed = () => {
            setIsLoading(false);
            setError(null);
            if (status === 'live' || status === 'reprise') {
                video.play().catch(() => {
                    setShowPlayButton(true);
                    video.muted = true;
                    video.play().catch(() => { });
                });
            }
        };

        const handleError = (_: any, data: any) => {
            if (data.fatal) {
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    hlsRef.current?.startLoad();
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hlsRef.current?.recoverMediaError();
                } else {
                    setError('Error al cargar la transmisión.');
                    setIsLoading(false);
                }
            }
        };

        if (isMp4 || finalUrl.includes('.mp4')) {
            video.src = finalUrl;
            video.addEventListener('loadedmetadata', handleManifestParsed);
            return () => video.removeEventListener('loadedmetadata', handleManifestParsed);
        } else if (Hls.isSupported()) {
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true, // Enable for faster live playback
                liveSyncDurationCount: 3, // Reduce safety buffer to keep closer to live edge
                liveMaxLatencyDurationCount: 10,
                maxBufferLength: 10, // Reduce buffer length to prevent downloading too far ahead and causing memory/network spikes
                maxMaxBufferLength: 30,
                manifestLoadingMaxRetry: Infinity,
                manifestLoadingRetryDelay: 1000,
                levelLoadingTimeOut: 10000, // Timeout faster on bad connections to trigger quality drop
                fragLoadingTimeOut: 10000,
            });
            hlsRef.current = hls;
            hls.loadSource(finalUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
            hls.on(Hls.Events.LEVEL_SWITCHED, (_: any, data: { level: number }) => {
                const level = hls.levels[data.level];
                if (level?.height) {
                    if (level.height >= 1080) setQuality('4K');
                    else if (level.height >= 720) setQuality('HD');
                    else if (level.height >= 480) setQuality('SD');
                    else setQuality('LD');
                }
            });
            hls.on(Hls.Events.ERROR, handleError);

            // For live streams, ensure we are close to the edge
            hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
                if (data.details.live && video.paused && !video.currentTime) {
                    console.log('Live stream detected, seeking to edge');
                }
            });

            return () => hls.destroy();
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = finalUrl;
            video.addEventListener('loadedmetadata', handleManifestParsed);
            return () => video.removeEventListener('loadedmetadata', handleManifestParsed);
        } else {
            setError('Tu navegador no soporta HLS.');
            setIsLoading(false);
        }
    }, [streamUrl, token, status, isMp4]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onPlay = () => { setIsPlaying(true); setShowPlayButton(false); };
        const onPause = () => { setIsPlaying(false); if (!isLoading) setShowPlayButton(true); };
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        return () => { video.removeEventListener('play', onPlay); video.removeEventListener('pause', onPause); };
    }, [isLoading]);

    // Logic for mid-roll ads (only for 'reprise')
    useEffect(() => {
        const video = videoRef.current;
        if (!video || status !== 'reprise' || isAdPlaying) return;

        const onTimeUpdate = () => {
            const currentTime = video.currentTime;
            // Trigger ad every 15 minutes (900 seconds)
            // For testing, you can change 900 to 30
            if (currentTime >= lastAdTime + 900) {
                console.log('Triggering mid-roll video ad at:', currentTime);
                requestAds();
                setLastAdTime(currentTime);
            }
        };

        video.addEventListener('timeupdate', onTimeUpdate);
        return () => video.removeEventListener('timeupdate', onTimeUpdate);
    }, [status, lastAdTime, isAdPlaying, requestAds]);

    const handleManualPlay = () => {
        if (videoRef.current) {
            videoRef.current.play();
            videoRef.current.muted = false;
        }
    };

    return (
        <div className="relative w-full h-full bg-black group overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onContextMenu={(e) => e.preventDefault()}>
            {(resolvedUrl.includes('cloudflarestream.com') || resolvedUrl.includes('videodelivery.net')) && !resolvedUrl.includes('.m3u8') ? (
                <div className="w-full h-full">
                    <iframe
                        src={
                            resolvedUrl.includes('/iframe')
                                ? resolvedUrl
                                : `${resolvedUrl}/iframe?autoplay=true&letterbox=false`
                        }
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen
                    ></iframe>
                </div>
            ) : (
                <video ref={videoRef} className="w-full h-full object-contain" controls controlsList="nodownload noplaybackrate" disablePictureInPicture playsInline poster={poster} />
            )}

            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white">Cargando...</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30">
                    <p className="text-white text-lg font-bold mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-lg">Reintentar</button>
                </div>
            )}

            {!isLoading && !error && showPlayButton && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 cursor-pointer" onClick={handleManualPlay}>
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                </div>
            )}

            {!isLoading && !error && canCast && (
                <button onClick={(e) => { e.stopPropagation(); handleCast(); }} className={`absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full transition-all ${showUI ? 'opacity-100' : 'opacity-0'}`} title="Enviar a TV">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /><line x1="2" y1="20" x2="2.01" y2="20" /></svg>
                </button>
            )}

            {settings?.site_logo && (
                <div className={`absolute top-6 left-6 z-40 transition-opacity pointer-events-none ${showUI ? 'opacity-80' : 'opacity-40'}`} style={{ maxWidth: '100px' }}>
                    <Image src={settings.site_logo} alt="Logo" width={100} height={50} className="w-full h-auto object-contain" />
                </div>
            )}

            {/* Viewer Count + Quality Overlay */}
            {status === 'live' && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 transition-opacity ${showUI ? 'opacity-100' : 'opacity-0'}`}>
                    {/* LIVE badge */}
                    <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 border border-red-500/40">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                        <span className="text-red-400 font-black text-[11px] uppercase tracking-widest">EN VIVO</span>
                    </div>
                    {/* Viewer count */}
                    {viewerCount > 0 && (
                        <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                            <span className="text-base leading-none">🔥</span>
                            <span className="text-white font-bold text-sm tabular-nums">{viewerCount.toLocaleString()}</span>
                            <span className="text-white/50 text-xs">viendo</span>
                        </div>
                    )}
                    {/* Quality badge */}
                    {quality && (
                        <div className="flex items-center bg-black/70 backdrop-blur-md rounded-full px-2.5 py-1.5 border border-white/10">
                            <span className={`text-[11px] font-black tracking-widest ${quality === 'HD' || quality === '4K' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                {quality}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Contenedor de Publicidad Google IMA */}
            <div
                ref={adContainerRef}
                className={`absolute inset-0 z-[60] bg-black/40 ${isAdPlaying ? 'block' : 'hidden'}`}
                style={{ pointerEvents: isAdPlaying ? 'auto' : 'none' }}
            />

            {/* User Watermark - Anti-piracy */}
            {user?.email && (
                <div
                    className="absolute z-[45] pointer-events-none select-none transition-all duration-[5000ms] ease-in-out"
                    style={{
                        top: watermarkPos.top,
                        left: watermarkPos.left,
                    }}
                >
                    <span className="text-white/[0.07] text-sm font-mono tracking-wider" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                        {user.email}
                    </span>
                </div>
            )}
        </div>
    );
}
