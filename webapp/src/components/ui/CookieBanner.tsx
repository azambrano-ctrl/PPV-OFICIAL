'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100]"
                >
                    <div className="bg-dark-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                        {/* Decorative Background Gradient */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-600/10 blur-[80px] rounded-full group-hover:bg-primary-600/20 transition-all duration-700" />

                        <div className="relative flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center text-primary-500 border border-primary-500/20">
                                <ShieldCheck className="w-6 h-6" />
                            </div>

                            <div className="flex-1 space-y-3">
                                <div>
                                    <h3 className="text-white font-bold text-lg leading-tight">Configuración de Cookies</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mt-1">
                                        Utilizamos cookies para personalizar tu experiencia, mantener tu sesión activa y analizar el tráfico para mejorar nuestro servicio de streaming.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        onClick={handleAccept}
                                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-900/30 active:scale-95"
                                    >
                                        Aceptar Todo
                                    </button>
                                    <Link
                                        href="/privacy"
                                        className="px-4 py-2 text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                                    >
                                        Leer política <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsVisible(false)}
                                className="absolute top-0 right-0 p-1 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
