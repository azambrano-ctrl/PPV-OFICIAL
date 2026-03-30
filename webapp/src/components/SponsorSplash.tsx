'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useSettingsStore } from '@/lib/store';
import Image from 'next/image';

export default function SponsorSplash() {
    const { settings } = useSettingsStore();
    const [show, setShow] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Only show if sponsor is enabled and has an image
        if (!settings?.sponsor_enabled || !settings?.sponsor_image) return;

        // Check if user already saw the splash this session
        const seen = sessionStorage.getItem('sponsor_splash_seen');
        if (seen) return;

        setShow(true);
        sessionStorage.setItem('sponsor_splash_seen', '1');
    }, [settings?.sponsor_enabled, settings?.sponsor_image]);

    // Countdown timer
    useEffect(() => {
        if (!show || countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [show, countdown]);

    if (!show || !settings?.sponsor_image) return null;

    const handleClose = () => {
        if (countdown > 0) return; // Can't close before countdown
        setShow(false);
    };

    const handleSponsorClick = () => {
        if (settings?.sponsor_link) {
            window.open(settings.sponsor_link, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Close Button */}
            <button
                onClick={handleClose}
                disabled={countdown > 0}
                className={`absolute top-6 right-6 z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all
                    ${countdown > 0
                        ? 'bg-white/10 text-white/50 cursor-not-allowed'
                        : 'bg-white/20 hover:bg-white/30 text-white cursor-pointer hover:scale-105'
                    }`}
            >
                {countdown > 0 ? (
                    <>
                        <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center text-xs font-black">
                            {countdown}
                        </div>
                        Cerrar en {countdown}s
                    </>
                ) : (
                    <>
                        <X className="w-4 h-4" />
                        Cerrar
                    </>
                )}
            </button>

            {/* Sponsor Label */}
            <div className="absolute top-6 left-6 z-10">
                <span className="bg-primary-600/80 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Patrocinador
                </span>
            </div>

            {/* Sponsor Image */}
            <div
                className={`relative max-w-3xl max-h-[80vh] w-full mx-4 ${settings?.sponsor_link ? 'cursor-pointer' : ''}`}
                onClick={handleSponsorClick}
            >
                <img
                    src={settings.sponsor_image}
                    alt="Patrocinador"
                    className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                />
            </div>
        </div>
    );
}
