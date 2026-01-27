'use client';

import Link from 'next/link';
import { ArrowRight, Globe, Trophy, Zap, PlayCircle } from 'lucide-react';
import ImageSlider from '@/components/ui/ImageSlider';
import { useState, useEffect } from 'react';
import { settingsAPI, statsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/utils';

export default function AboutPage() {
    const [settings, setSettings] = useState<any>(null);
    const [stats, setStats] = useState<{ totalUsers: number; totalEvents: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsRes, statsRes] = await Promise.all([
                    settingsAPI.get(),
                    statsAPI.getPublicStats()
                ]);
                setSettings(settingsRes.data.data);
                setStats(statsRes.data.data);
            } catch (error) {
                console.error('Failed to load about page data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Default values if API data is missing
    const heroTitle = settings?.about_hero_title || 'Llevando el MMA';
    const heroSubtitle = settings?.about_hero_subtitle ?? 'Ecuatoriano al Mundo';
    const missionTitle = settings?.about_mission_title || 'Nuestra Misión';
    const missionText = settings?.about_mission_text || 'Nacimos con un objetivo claro: romper las barreras que limitan a nuestros atletas. Ecuador es tierra de guerreros, pero el talento necesita visibilidad para brillar.';

    // Parse values if they are stored as JSON string, or use default array
    let missionValues = [];
    try {
        missionValues = settings?.about_values ? (typeof settings.about_values === 'string' ? JSON.parse(settings.about_values) : settings.about_values) : [];
    } catch (e) {
        console.warn('Error parsing about_values', e);
    }

    if (missionValues.length === 0) {
        missionValues = [
            { title: "Energía Pura", description: "Capturamos la adrenalina del octágono. Transmisiones fluidas y de alta definición.", icon: "Zap" },
            { title: "Proyección Global", description: "El talento ecuatoriano no tiene fronteras. Nuestra tecnología conecta con el mundo.", icon: "Globe" },
            { title: "Excelencia", description: "Comprometidos con elevar el estándar de los eventos deportivos.", icon: "Trophy" }
        ];
    }

    // Helper to get Icon component
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Zap': return <Zap className="w-8 h-8 text-primary-400" />;
            case 'Globe': return <Globe className="w-8 h-8 text-primary-400" />;
            case 'Trophy': return <Trophy className="w-8 h-8 text-primary-400" />;
            default: return <Zap className="w-8 h-8 text-primary-400" />;
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen bg-dark-950 text-dark-50 selection:bg-primary-600/30">
            {/* Hero Section with Cinematic Background */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                {/* Background Layer */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-950/80 to-primary-950/40 z-10"></div>
                    {!loading && (
                        <img
                            src={getImageUrl(settings?.about_background) || "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000&auto=format&fit=crop"}
                            className="w-full h-full object-cover scale-105 animate-slow-zoom opacity-40 mix-blend-overlay transition-opacity duration-1000"
                            alt="Hero Background"
                        />
                    )}
                    {/* Vignette */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_100%)] z-20"></div>
                </div>

                {/* Content */}
                <motion.div
                    className="container-custom relative z-30 text-center px-4"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8 mx-auto">
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                        <span className="text-sm font-medium tracking-wide text-dark-200">PPV Streaming Oficial</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black font-display tracking-tight mb-8 leading-tight">
                        <span className="block text-white drop-shadow-2xl">{heroTitle}</span>
                        {heroSubtitle && (
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700 filter drop-shadow-lg block">
                                {heroSubtitle}
                            </span>
                        )}
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-xl md:text-2xl text-dark-200 max-w-3xl mx-auto font-light leading-relaxed mb-10">
                        La plataforma definitiva para descubrir, apoyar y vivir la pasión de las <span className="text-white font-medium">artes marciales mixtas</span> en Ecuador.
                    </motion.p>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 animate-bounce"
                >
                    <div className="w-6 h-10 rounded-full border-2 border-dark-400 flex items-start justify-center p-1">
                        <div className="w-1 h-2 bg-dark-200 rounded-full"></div>
                    </div>
                </motion.div>
            </section>

            {/* Mission Section with Modern Split Layout */}
            <section className="py-32 bg-dark-950 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-900/10 blur-[120px] pointer-events-none"></div>

                <div className="container-custom relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="space-y-8"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold font-display">
                                <span className="border-l-4 border-primary-600 pl-6 text-white">{missionTitle}</span>
                            </h2>
                            <div className="text-dark-200 text-lg leading-relaxed whitespace-pre-line pl-6 border-l border-dark-800">
                                {missionText}
                            </div>

                            <div className="pl-6 pt-4">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-4xl font-bold text-white mb-1">
                                            {stats?.totalUsers !== undefined ? `${stats.totalUsers}+` : (settings?.about_stats_users || '10k+')}
                                        </p>
                                        <p className="text-sm text-dark-400 uppercase tracking-widest">Usuarios Activos</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-bold text-white mb-1">
                                            {stats?.totalEvents !== undefined ? `${stats.totalEvents}+` : (settings?.about_stats_events || '50+')}
                                        </p>
                                        <p className="text-sm text-dark-400 uppercase tracking-widest">Eventos en Vivo</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-dark-700 group"
                        >
                            {!loading && (settings?.about_slider_images && settings.about_slider_images.length > 0 ? (
                                <ImageSlider images={typeof settings.about_slider_images === 'string' ? JSON.parse(settings.about_slider_images) : settings.about_slider_images} />
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent z-10"></div>
                                    <img
                                        src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1000&auto=format&fit=crop"
                                        alt="MMA Training"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                    />
                                    <div className="absolute bottom-8 left-8 z-20 max-w-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="p-2 bg-primary-600 rounded-full">
                                                <PlayCircle className="w-5 h-5 text-white" />
                                            </span>
                                            <span className="text-sm font-semibold tracking-wider uppercase text-dark-200">Highlight Reel</span>
                                        </div>
                                        <p className="font-bold text-white text-2xl leading-tight">Vive la intensidad de cada golpe, en tiempo real.</p>
                                    </div>
                                </>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values Section with Glassmorphism Cards */}
            <section className="py-32 bg-dark-950 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

                <div className="container-custom relative z-10">
                    <div className="text-center mb-20 max-w-2xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-5xl font-bold font-display mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-dark-400">
                                Lo Que Nos Define
                            </h2>
                            <p className="text-dark-300 text-lg">
                                Más que una plataforma de streaming, somos el hogar del MMA ecuatoriano.
                            </p>
                        </motion.div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {missionValues.map((val: any, idx: number) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                className="relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl"></div>
                                <div className="relative h-full bg-dark-900/60 backdrop-blur-xl p-10 rounded-3xl border border-dark-800 hover:border-primary-600/30 transition-all duration-300 group-hover:-translate-y-2">
                                    <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary-600/10 transition-colors border border-dark-700 group-hover:border-primary-600/20">
                                        {getIcon(val.icon)}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-primary-500 transition-colors font-display">{val.title}</h3>
                                    <p className="text-dark-300 leading-relaxed text-lg">
                                        {val.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 relative overflow-hidden flex items-center justify-center bg-dark-900">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?q=80&w=2000&auto=format&fit=crop"
                        className="w-full h-full object-cover opacity-10 mix-blend-overlay"
                        alt="CTA Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/80 to-transparent"></div>
                </div>

                <div className="container-custom relative z-10 text-center max-w-4xl px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-5xl md:text-7xl font-black font-display mb-8 tracking-tighter text-white">
                            ¿Listo para la <span className="text-primary-600 italic">Acción?</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-dark-200 mb-12 max-w-2xl mx-auto font-light">
                            Únete hoy y sé parte de la revolución del deporte de combate en Latinoamérica.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link
                                href="/auth/register"
                                className="group relative bg-white text-dark-950 px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105 flex items-center justify-center gap-3 overflow-hidden shadow-xl"
                            >
                                <span className="relative z-10">Registrarse Ahora</span>
                                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-primary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                            </Link>
                            <Link
                                href="/events"
                                className="group px-10 py-5 rounded-full font-bold text-lg transition-all border border-dark-700 hover:bg-dark-800 hover:border-dark-600 backdrop-blur-sm text-white flex items-center justify-center"
                            >
                                Ver Próximos Eventos
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
