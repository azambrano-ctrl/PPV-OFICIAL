'use client';

import Link from 'next/link';
import { ArrowRight, Globe, Trophy, Zap, PlayCircle, MapPin, History as HistoryIcon } from 'lucide-react';
import ImageSlider from '@/components/ui/ImageSlider';
import { useState, useEffect } from 'react';
import { settingsAPI, statsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/utils';
import { useLanguage } from '@/components/providers/LanguageProvider';


export default function AboutPage() {
    const { t, language } = useLanguage();
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
    const heroTitle = settings?.about_hero_title || (language === 'es' ? 'Llevando el MMA' : 'Bringing MMA');
    const heroSubtitle = settings?.about_hero_subtitle ?? (language === 'es' ? 'Ecuatoriano al Mundo' : 'Ecuadorian to the World');
    const missionTitle = settings?.about_mission_title || t('about.mission_title');
    const missionText = settings?.about_mission_text || t('about.mission_text');
    const historyTitle = t('about.history_title');
    const historyText = t('about.history_text');
    const locationTitle = t('about.location_title');
    const locationText = t('about.location_text');


    // Parse values if they are stored as JSON string, or use default array
    let missionValues = [];
    try {
        missionValues = settings?.about_values ? (typeof settings.about_values === 'string' ? JSON.parse(settings.about_values) : settings.about_values) : [];
    } catch (e) {
        console.warn('Error parsing about_values', e);
    }

    if (missionValues.length === 0) {
        missionValues = [
            { title: t('about.values.energy_title'), description: t('about.values.energy_desc'), icon: "Zap" },
            { title: t('about.values.global_title'), description: t('about.values.global_desc'), icon: "Globe" },
            { title: t('about.values.excellence_title'), description: t('about.values.excellence_desc'), icon: "Trophy" }
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
        <div className="min-h-screen bg-dark-950 text-dark-50 selection:bg-primary-600/30 font-sans">
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
                        <span className="text-sm font-medium tracking-wide text-dark-200 uppercase">{t('about.official')}</span>
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
                        {t('about.hero_description')}
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

            {/* Mission Section */}
            <section className="py-32 bg-dark-950 relative overflow-hidden border-b border-dark-900">
                <div className="container-custom relative z-10">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="inline-flex p-3 bg-primary-950/50 rounded-2xl border border-primary-500/20 mb-2">
                                <Zap className="w-6 h-6 text-primary-500" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white font-display uppercase tracking-tight">
                                {missionTitle}
                            </h2>
                            <p className="text-dark-200 text-xl leading-relaxed font-light">
                                {missionText}
                            </p>
                            <div className="grid grid-cols-2 gap-10 pt-6">
                                <div className="p-6 rounded-2xl bg-dark-900/50 border border-dark-800">
                                    <p className="text-4xl font-black text-primary-500 mb-1">
                                        {stats?.totalUsers !== undefined ? `${stats.totalUsers}+` : (settings?.about_stats_users || '10k+')}
                                    </p>
                                    <p className="text-xs text-dark-400 uppercase tracking-widest font-bold">{t('about.active_users')}</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-dark-900/50 border border-dark-800">
                                    <p className="text-4xl font-black text-primary-500 mb-1">
                                        {stats?.totalEvents !== undefined ? `${stats.totalEvents}+` : (settings?.about_stats_events || '50+')}
                                    </p>
                                    <p className="text-xs text-dark-400 uppercase tracking-widest font-bold">{t('about.live_events')}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative aspect-square rounded-[40px] overflow-hidden group shadow-2xl ring-1 ring-white/10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-dark-950/80 via-transparent to-transparent z-10"></div>
                            {!loading && (settings?.about_slider_images && settings.about_slider_images.length > 0 ? (
                                <ImageSlider images={typeof settings.about_slider_images === 'string' ? JSON.parse(settings.about_slider_images) : settings.about_slider_images} />
                            ) : (
                                <img
                                    src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1000&auto=format&fit=crop"
                                    alt="MMA Intensity"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                                />
                            ))}
                            <div className="absolute bottom-10 left-10 z-20">
                                <p className="text-white text-3xl font-black leading-tight max-w-xs uppercase italic drop-shadow-lg">
                                    {t('about.highlight_title')}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* History Section */}
            <section className="py-32 bg-dark-900 relative overflow-hidden">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row-reverse gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="lg:w-1/2 space-y-8"
                        >
                            <div className="inline-flex p-3 bg-primary-950/50 rounded-2xl border border-primary-500/20 mb-2">
                                <HistoryIcon className="w-6 h-6 text-primary-500" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white font-display uppercase tracking-tight">
                                {historyTitle}
                            </h2>
                            <p className="text-dark-200 text-xl leading-relaxed font-light italic border-l-4 border-primary-600 pl-8">
                                {historyText}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="lg:w-1/2 grid grid-cols-2 gap-6"
                        >
                            <div className="space-y-6">
                                <div className="h-64 rounded-3xl overflow-hidden shadow-xl border border-white/5">
                                    <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="History 1" />
                                </div>
                                <div className="h-48 rounded-3xl overflow-hidden shadow-xl border border-white/5">
                                    <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="History 2" />
                                </div>
                            </div>
                            <div className="pt-12 space-y-6">
                                <div className="h-48 rounded-3xl overflow-hidden shadow-xl border border-white/5">
                                    <img src="https://images.unsplash.com/photo-1595078472549-9df27b99c80d?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="History 3" />
                                </div>
                                <div className="h-64 rounded-3xl overflow-hidden shadow-xl border border-white/5 bg-primary-600 flex items-center justify-center p-8 text-center">
                                    <p className="text-white text-2xl font-black font-display uppercase leading-tight italic">Apoyando lo Nuestro</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <section className="py-32 bg-dark-950 relative">
                <div className="container-custom text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="inline-flex p-4 bg-primary-600 rounded-full mb-8 shadow-lg shadow-primary-600/20">
                            <MapPin className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white font-display uppercase tracking-tight mb-8">
                            {locationTitle}
                        </h2>
                        <div className="bg-dark-900/50 backdrop-blur-xl border border-white/5 p-10 md:p-16 rounded-[40px] shadow-2xl">
                            <p className="text-2xl md:text-3xl text-dark-100 font-light leading-relaxed mb-8">
                                {locationText}
                            </p>
                            <div className="flex items-center justify-center gap-4 text-primary-500 font-bold tracking-widest uppercase">
                                <span className="w-10 h-[2px] bg-primary-500"></span>
                                <span>La Troncal, Ecuador</span>
                                <span className="w-10 h-[2px] bg-primary-500"></span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-32 bg-dark-900 relative">
                <div className="container-custom relative z-10">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-black text-white font-display mb-6 uppercase tracking-tight"
                        >
                            {t('about.define_title')}
                        </motion.h2>
                        <p className="text-dark-300 text-xl font-light">
                            {t('about.define_subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {missionValues.map((val: any, idx: number) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-primary-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative h-full bg-dark-950/40 backdrop-blur-sm p-10 rounded-[32px] border border-white/5 hover:border-primary-500/20 transition-all duration-500 group-hover:-translate-y-3">
                                    <div className="w-20 h-20 bg-dark-900 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-primary-950 transition-colors">
                                        {getIcon(val.icon)}
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 text-white uppercase font-display tracking-tight group-hover:text-primary-500 transition-colors">{val.title}</h3>
                                    <p className="text-dark-400 leading-relaxed text-lg font-light group-hover:text-dark-200 transition-colors">
                                        {val.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-40 relative overflow-hidden flex items-center justify-center bg-dark-950">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?q=80&w=2000&auto=format&fit=crop"
                        className="w-full h-full object-cover opacity-10 grayscale mix-blend-overlay"
                        alt="CTA Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950"></div>
                </div>

                <div className="container-custom relative z-10 text-center max-w-4xl px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="space-y-12"
                    >
                        <h2 className="text-5xl md:text-8xl font-black font-display tracking-tighter text-white leading-none uppercase italic">
                            {t('about.cta_title')}
                        </h2>
                        <p className="text-xl md:text-3xl text-dark-300 max-w-2xl mx-auto font-light leading-relaxed">
                            {t('about.cta_description')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
                            <Link
                                href="/auth/register"
                                className="group relative bg-primary-600 text-white px-12 py-6 rounded-full font-black text-xl transition-all hover:scale-110 flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(234,48,48,0.3)]"
                            >
                                <span>{t('about.register_now')}</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </Link>

                            <Link
                                href="/events"
                                className="px-12 py-6 rounded-full font-bold text-xl transition-all border-2 border-white/10 hover:bg-white/5 text-white flex items-center justify-center backdrop-blur-md"
                            >
                                {t('about.view_upcoming')}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
