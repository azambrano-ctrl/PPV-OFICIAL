'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { useSettingsStore, useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { Users, Settings, WifiOff } from 'lucide-react';
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
    const VAST_TAG_URL = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/23341415522/midroll_video&description_url=https%3A%2F%2Farenafightpass.com%2F&tfcd=0&npa=0&sz=640x480&gdfp_req=1&unviewed_position_start=1&output=vast&env=vp&impl=s';

    useEffect(() => {
        console.log('%c>>> VideoPlayer Version: 1.0.4 (Technical Failure Overlay) <<<', 'color: #ff00ff; font-weight: bold;');
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
    const [availableLevels, setAvailableLevels] = useState<{ height: number; bitrate: number; index: number }[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<number>(-1);
    const [showQualityMenu, setShowQualityMenu] = useState(false);

    // ── Technical failure overlay ──────────────────────────────────────────
    /** True when HLS can't load the stream after it was previously working */
    const [isStreamDown, setIsStreamDown] = useState(false);
    /** How many auto-reconnect attempts have been made */
    const [reconnectCount, setReconnectCount] = useState(0);
    /** Countdown seconds until next reconnect attempt */
    const [reconnectIn, setReconnectIn] = useState(15);
    /** Only show failure overlay if stream was working at least once */
    const hadSuccessfulLoadRef = useRef(false);
    /** Consecutive network error counter (fatal + non-fatal) */
    const consecutiveErrorsRef = useRef(0);
    /** Timer ref for the 'waiting' → failure overlay delay */
    const stallTimerRef = useRef<NodeJS.Timeout | null>(null);
    // ─────────────────────────────────────────────────────────────────────

    // Mid-roll ad state
    const [lastAdTime, setLastAdTime] = useState(0);
    // Watermark position state
    const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '30%' });

    const { settings } = useSettingsStore();
    const { user } = useAuthStore();

    // ── Auto-reconnect countdown while stream is down ──────────────────────
    useEffect(() => {
        if (!isStreamDown) return;

        setReconnectIn(15);
        const countdown = setInterval(() => {
            setReconnectIn(n => {
                if (n <= 1) {
                    // Attempt to reload
                    if (hlsRef.current) {
                        console.log('[VideoPlayer] Auto-reconnect attempt #' + (reconnectCount + 1));
                        hlsRef.current.startLoad();
                        setReconnectCount(c => c + 1);
                    }
                    return 15; // Reset countdown
                }
                return n - 1;
            });
        }, 1000);

        return () => clearInterval(countdown);
    }, [isStreamDown, reconnectCount]);
    // ─────────────────────────────────────────────────────────────────────

    // ── Stall detection via native video events ───────────────────────────
    // 'waiting' fires when the browser has no more data to play (buffer empty).
    // This is more reliable than polling currentTime because it fires even
    // when video.paused becomes true due to buffer exhaustion.
    useEffect(() => {
        if (status !== 'live') return;
        const video = videoRef.current;
        if (!video) return;

        const STALL_DELAY_MS = 15_000; // show overlay after 15 s of buffering

        const clearStallTimer = () => {
            if (stallTimerRef.current) {
                clearTimeout(stallTimerRef.current);
                stallTimerRef.current = null;
            }
        };

        const onWaiting = () => {
            // Only trigger if we were already playing successfully
            if (!hadSuccessfulLoadRef.current) return;
            if (stallTimerRef.current) return; // timer already running
            console.warn('[VideoPlayer] video.waiting — starting stall timer');
            stallTimerRef.current = setTimeout(() => {
                console.warn('[VideoPlayer] Stall confirmed — showing failure overlay');
                setIsStreamDown(true);
            }, STALL_DELAY_MS);
        };

        const onRecovered = () => {
            clearStallTimer();
            consecutiveErrorsRef.current = 0;
            setIsStreamDown(false);
            setReconnectCount(0);
        };

        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onRecovered);  // playback resumed
        video.addEventListener('canplay', onRecovered);  // data available again

        return () => {
            clearStallTimer();
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onRecovered);
            video.removeEventListener('canplay', onRecovered);
        };
    }, [status]); // intentionally minimal deps — uses refs inside
    // ─────────────────────────────────────────────────────────────────────

    // Detect if browser supports casting/remote playback
    useEffect(() => {
        const checkCastSDK = setInterval(() => {
            if ((window as any).chrome && (window as any).chrome.cast && (window as any).chrome.cast.isAvailable) {
                setCanCast(true);
                clearInterval(checkCastSDK);
            }
        }, 1000);

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
                await authAPI.getProfile();
            } catch (err) {
                console.warn('Auth heartbeat failed:', err);
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(heartbeatInterval);
    }, [isPlaying, isLoading]);

    // Move watermark position periodically (anti-piracy)
    useEffect(() => {
        const positions = [
            { top: '15%', left: '20%' }, { top: '60%', left: '70%' },
            { top: '30%', left: '55%' }, { top: '75%', left: '15%' },
            { top: '45%', left: '40%' }, { top: '20%', left: '75%' },
            { top: '70%', left: '35%' }, { top: '50%', left: '60%' },
        ];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % positions.length;
            setWatermarkPos(positions[idx]);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // Anti-piracy key blocking
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (user?.role === 'admin') return;
            if (e.key === 'F12') e.preventDefault();
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') e.preventDefault();
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') e.preventDefault();
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') e.preventDefault();
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') e.preventDefault();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [user?.role]);

    const handleCast = useCallback(async () => {
        const currentStreamUrl = lastStreamUrlRef.current || streamUrl;
        if (!currentStreamUrl) return;

        const video = videoRef.current;
        const cast = (window as any).cast;
        const chrome = (window as any).chrome;

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

    const changeQuality = useCallback((levelIndex: number) => {
        if (!hlsRef.current) return;
        hlsRef.current.currentLevel = levelIndex;
        setSelectedLevel(levelIndex);
        setShowQualityMenu(false);
        if (levelIndex === -1) setQuality('');
    }, []);

    const onAdError = useCallback((adErrorEvent: any) => {
        const error = adErrorEvent.getError();
        console.error('IMA Ad Error:', { code: error.getErrorCode(), message: error.getMessage() });
        setIsAdPlaying(false);
        if (adsManagerRef.current) { try { adsManagerRef.current.destroy(); } catch (e) { } }
        if (videoRef.current) videoRef.current.play().catch(() => { });
    }, []);

    const requestAds = useCallback(() => {
        const google = (window as any).google;
        if (!google || !adsLoaderRef.current) return;
        const adsRequest = new google.ima.AdsRequest();
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
        adsRenderingSettings.maxRedirects = 10;

        const adsManager = adsManagerLoadedEvent.getAdsManager(videoRef.current, adsRenderingSettings);
        adsManagerRef.current = adsManager;

        adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
        adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => {
            setIsAdPlaying(true);
            if (videoRef.current) videoRef.current.pause();
        });
        adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => {
            setIsAdPlaying(false);
            if (videoRef.current) videoRef.current.play().catch(() => { });
        });
        adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
            setIsAdPlaying(false);
            adsManager.destroy();
        });

        try {
            adsManager.init(videoRef.current?.clientWidth || 640, videoRef.current?.clientHeight || 480, google.ima.ViewMode.NORMAL);
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

        adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded, false);
        adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);
    }, [onAdsManagerLoaded, onAdError]);

    // Load IMA SDK
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const script = document.createElement('script');
        script.src = `https://imasdk.googleapis.com/js/sdkloader/ima3.js`;
        script.async = true;
        script.onload = () => { initializeIMA(); };
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
            if (adsManagerRef.current) adsManagerRef.current.destroy();
        };
    }, [initializeIMA]);

    // ── Main stream setup ──────────────────────────────────────────────────
    useEffect(() => {
        let finalUrl = streamUrl;
        if (!finalUrl) return;

        if (finalUrl.startsWith('/')) {
            finalUrl = `${window.location.protocol}//${window.location.host}${finalUrl}`;
        }

        const isProvider = finalUrl.includes('cloudflarestream.com') ||
            finalUrl.includes('videodelivery.net') ||
            finalUrl.includes('stream.mux.com') ||
            finalUrl.includes('b-cdn.net') ||
            finalUrl.includes('/api/streaming/');

        if (!isProvider) {
            finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}token=${token}`;
        }

        setResolvedUrl(finalUrl);
        lastStreamUrlRef.current = finalUrl;

        // Reset failure state on new stream URL
        setIsStreamDown(false);
        setReconnectCount(0);
        consecutiveErrorsRef.current = 0;
        hadSuccessfulLoadRef.current = false;
        if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }

        const isCloudflare = finalUrl.includes('cloudflarestream.com') || finalUrl.includes('videodelivery.net');
        const isManifest = finalUrl.includes('.m3u8');

        if (isCloudflare && !isManifest) {
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
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                // Count ALL network errors (fatal + non-fatal).
                // With manifestLoadingMaxRetry:Infinity the fatal flag often never
                // fires, so we need non-fatal counts too.
                consecutiveErrorsRef.current++;
                if (consecutiveErrorsRef.current >= 4 && hadSuccessfulLoadRef.current && status === 'live') {
                    setIsStreamDown(true);
                }
                if (data.fatal) {
                    hlsRef.current?.startLoad();
                }
            } else if (data.fatal) {
                if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
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
                lowLatencyMode: true,
                liveSyncDurationCount: 3,
                liveMaxLatencyDurationCount: 10,
                maxBufferLength: 10,
                maxMaxBufferLength: 30,
                manifestLoadingMaxRetry: Infinity,
                manifestLoadingRetryDelay: 1000,
                levelLoadingTimeOut: 10000,
                fragLoadingTimeOut: 10000,
            });
            hlsRef.current = hls;
            hls.loadSource(finalUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const levels = hls.levels
                    .map((l, i) => ({ height: l.height || 0, bitrate: l.bitrate || 0, index: i }))
                    .filter(l => l.height > 0)
                    .sort((a, b) => b.height - a.height);
                setAvailableLevels(levels);
                handleManifestParsed();
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_: any, data: { level: number }) => {
                const level = hls.levels[data.level];
                if (level?.height) {
                    if (level.height >= 1080) setQuality('4K');
                    else if (level.height >= 720) setQuality('HD');
                    else if (level.height >= 480) setQuality('SD');
                    else setQuality('LD');
                }
            });

            // Fragment loaded successfully → stream is alive
            hls.on(Hls.Events.FRAG_LOADED, () => {
                hadSuccessfulLoadRef.current = true;
                if (consecutiveErrorsRef.current > 0 || isStreamDown) {
                    consecutiveErrorsRef.current = 0;
                    setIsStreamDown(false);
                    setReconnectCount(0);
                    console.log('[VideoPlayer] Stream recovered ✅');
                }
            });

            hls.on(Hls.Events.ERROR, handleError);

            hls.on(Hls.Events.LEVEL_LOADED, (_event: any, data: any) => {
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

    // Mid-roll ads
    useEffect(() => {
        const video = videoRef.current;
        if (!video || status !== 'reprise' || isAdPlaying) return;
        const onTimeUpdate = () => {
            const currentTime = video.currentTime;
            if (currentTime >= lastAdTime + 900) {
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
                        src={resolvedUrl.includes('/iframe') ? resolvedUrl : `${resolvedUrl}/iframe?autoplay=true&letterbox=false`}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen
                    />
                </div>
            ) : (
                <video ref={videoRef} className="w-full h-full object-contain" controls controlsList="nodownload noplaybackrate" disablePictureInPicture playsInline poster={poster} />
            )}

            {/* Loading */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-white">Cargando...</p>
                </div>
            )}

            {/* Fatal error (not technical failure) */}
            {error && !isStreamDown && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30">
                    <p className="text-white text-lg font-bold mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-lg">Reintentar</button>
                </div>
            )}

            {/* ── FALLA TÉCNICA overlay ─────────────────────────────────────── */}
            {isStreamDown && status === 'live' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/92 backdrop-blur-sm">
                    {/* Animated signal icon */}
                    <div className="relative mb-6">
                        {/* Pulsing rings */}
                        <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <span className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                        <div className="relative w-20 h-20 bg-red-500/15 border-2 border-red-500/40 rounded-full flex items-center justify-center">
                            <WifiOff className="w-9 h-9 text-red-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-white text-xl font-black tracking-wide mb-1">
                        ⚡ Falla Técnica
                    </h2>
                    <p className="text-white/50 text-sm mb-6 text-center max-w-xs px-4">
                        La señal se interrumpió. Estamos reconectando automáticamente.
                    </p>

                    {/* Countdown bar */}
                    <div className="w-48 mb-3">
                        <div className="flex justify-between text-xs text-white/40 mb-1.5">
                            <span>Reconectando en</span>
                            <span className="text-white/70 font-mono font-bold">{reconnectIn}s</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${(reconnectIn / 15) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Attempt counter */}
                    {reconnectCount > 0 && (
                        <p className="text-white/25 text-xs mt-2">
                            Intento #{reconnectCount}
                        </p>
                    )}

                    {/* Manual retry */}
                    <button
                        onClick={() => {
                            if (hlsRef.current) {
                                hlsRef.current.startLoad();
                                setReconnectCount(c => c + 1);
                                setReconnectIn(15);
                            }
                        }}
                        className="mt-5 px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 text-sm rounded-full transition-colors"
                    >
                        Reintentar ahora
                    </button>
                </div>
            )}
            {/* ─────────────────────────────────────────────────────────────── */}

            {!isLoading && !error && !isStreamDown && showPlayButton && (
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
            {status === 'live' && !isStreamDown && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 transition-opacity ${showUI ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 border border-red-500/40">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                        <span className="text-red-400 font-black text-[11px] uppercase tracking-widest">EN VIVO</span>
                    </div>
                    {viewerCount > 0 && (
                        <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                            <span className="text-base leading-none">🔥</span>
                            <span className="text-white font-bold text-sm tabular-nums">{viewerCount.toLocaleString()}</span>
                            <span className="text-white/50 text-xs">viendo</span>
                        </div>
                    )}
                    {/* Quality shown in gear button — no duplicate badge here */}
                </div>
            )}

            {/* Quality Selector */}
            {availableLevels.length > 1 && (
                <div className={`absolute bottom-14 right-4 z-50 transition-opacity ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {showQualityMenu && (
                        <div className="mb-2 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[110px]">
                            <button
                                onClick={() => changeQuality(-1)}
                                className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between gap-3 hover:bg-white/10 transition-colors ${selectedLevel === -1 ? 'text-primary-400 font-bold' : 'text-white/80'}`}
                            >
                                <span>Auto</span>
                                {selectedLevel === -1 && <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
                            </button>
                            <div className="h-px bg-white/10" />
                            {availableLevels.map(({ height, index }) => {
                                const label = height >= 2160 ? '4K' : height >= 1440 ? '2K' : `${height}p`;
                                const isHD = height >= 720;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => changeQuality(index)}
                                        className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between gap-3 hover:bg-white/10 transition-colors ${selectedLevel === index ? 'text-primary-400 font-bold' : 'text-white/80'}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            {label}
                                            {isHD && <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/15 px-1 rounded">HD</span>}
                                        </span>
                                        {selectedLevel === index && <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <button
                        onClick={() => setShowQualityMenu(v => !v)}
                        title="Calidad de video"
                        className={`flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 border text-white text-xs font-bold transition-colors ${showQualityMenu ? 'border-primary-500/60 text-primary-400' : 'border-white/10 hover:border-white/30'}`}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        <span>
                            {selectedLevel === -1
                                ? 'Auto'
                                : `${availableLevels.find(l => l.index === selectedLevel)?.height ?? ''}p`}
                        </span>
                    </button>
                </div>
            )}

            {/* Google IMA Ad Container */}
            <div
                ref={adContainerRef}
                className={`absolute inset-0 z-[60] bg-black/40 ${isAdPlaying ? 'block' : 'hidden'}`}
                style={{ pointerEvents: isAdPlaying ? 'auto' : 'none' }}
            />

            {/* User Watermark */}
            {user?.email && (
                <div
                    className="absolute z-[45] pointer-events-none select-none transition-all duration-[5000ms] ease-in-out"
                    style={{ top: watermarkPos.top, left: watermarkPos.left }}
                >
                    <span className="text-white/[0.07] text-sm font-mono tracking-wider" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                        {user.email}
                    </span>
                </div>
            )}
        </div>
    );
}
