'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useSettingsStore } from '@/lib/store';
import { authAPI } from '@/lib/api';

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
    const [resolvedUrl, setResolvedUrl] = useState<string>('');
    const lastStreamUrlRef = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { settings } = useSettingsStore();

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

    // Heartbeat to keep session alive
    useEffect(() => {
        if (!isPlaying && !isLoading) return;
        const heartbeatInterval = setInterval(async () => {
            try { await authAPI.getProfile(); } catch (err) { }
        }, 5 * 60 * 1000);
        return () => clearInterval(heartbeatInterval);
    }, [isPlaying, isLoading]);

    const handleCast = async () => {
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
    };

    // Listen for global cast trigger
    useEffect(() => {
        const handleGlobalCast = () => handleCast();
        window.addEventListener('trigger-cast', handleGlobalCast);
        return () => window.removeEventListener('trigger-cast', handleGlobalCast);
    }, [canCast, streamUrl]);

    const handleMouseMove = () => {
        setShowUI(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => { if (isPlaying) setShowUI(false); }, 3000);
    };

    const handleMouseLeave = () => { if (isPlaying) setShowUI(false); };

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

        // If Iframe Provider
        if (finalUrl.includes('cloudflarestream.com') || finalUrl.includes('videodelivery.net')) {
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
            const hls = new Hls({ debug: false, enableWorker: true, lowLatencyMode: true });
            hlsRef.current = hls;
            hls.loadSource(finalUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
            hls.on(Hls.Events.ERROR, handleError);
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

    const handleManualPlay = () => {
        if (videoRef.current) {
            videoRef.current.play();
            videoRef.current.muted = false;
        }
    };

    return (
        <div className="relative w-full h-full bg-black group overflow-hidden" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            {resolvedUrl.includes('cloudflarestream.com') || resolvedUrl.includes('videodelivery.net') ? (
                <div className="w-full h-full">
                    <iframe
                        src={
                            resolvedUrl.includes('/manifest/video.m3u8')
                                ? `${resolvedUrl.replace('/manifest/video.m3u8', '/iframe')}?autoplay=true&letterbox=false`
                                : resolvedUrl.includes('/iframe') ? resolvedUrl : `${resolvedUrl}/iframe?autoplay=true`
                        }
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen
                    ></iframe>
                </div>
            ) : (
                <video ref={videoRef} className="w-full h-full object-contain" controls playsInline poster={poster} />
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
                <div className={`absolute top-6 left-6 z-50 transition-opacity pointer-events-none ${showUI ? 'opacity-80' : 'opacity-40'}`} style={{ maxWidth: '100px' }}>
                    <img src={settings.site_logo} alt="Logo" className="w-full h-auto object-contain" />
                </div>
            )}
        </div>
    );
}
