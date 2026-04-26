'use client';

import Link from 'next/link';
import { ArrowRight, Globe, Trophy, Zap, MapPin, History as HistoryIcon, Users, Tv } from 'lucide-react';
import ImageSlider from '@/components/ui/ImageSlider';
import { useState, useEffect, useRef } from 'react';
import { settingsAPI, statsAPI } from '@/lib/api';
import { motion, useInView } from 'framer-motion';
import { getImageUrl } from '@/lib/utils';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Footer from '@/components/Footer';

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(end: number, duration = 2000, active = false) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!active || end === 0) return;
        let startTime: number | null = null;

        const step = (ts: number) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(end * eased));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(end);
        };

        requestAnimationFrame(step);
    }, [end, duration, active]);

    return count;
}

function StatCard({
    value,
    suffix = '+',
    label,
    sublabel,
    ready,
}: {
    value: number;
    suffix?: string;
    label: string;
    sublabel: string;
    ready: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const count = useCountUp(value, 2200, inView && ready);

    return (
        <div
            ref={ref}
            className="p-6 rounded-2xl bg-dark-900/50 border border-dark-800 hover:border-primary-500/30 transition-colors"
        >
            <p className="text-4xl font-black text-primary-500 mb-1 tabular-nums">
                {ready ? `${count}${suffix}` : `${value}${suffix}`}
            </p>
            <p className="text-xs text-dark-400 uppercase tracking-widest font-bold">{label}</p>
            <p className="text-xs text-dark-600 mt-1">{sublabel}</p>
        </div>
    );
}

// ── Timeline data ─────────────────────────────────────────────────────────────
const TIMELINE = [
    {
        year: '2022',
        title: 'Fundación',
        desc: 'Arena Fight Pass nace en La Troncal, Ecuador, con la visión de digitalizar el deporte de combate.',
        icon: <Zap className="w-5 h-5" />,
    },
    {
        year: '2023',
        title: 'Primer PPV',
        desc: 'Primer evento Pay-Per-View transmitido en vivo con éxito ante miles de espectadores en línea.',
        icon: <Tv className="w-5 h-5" />,
    },
    {
        year: '2024',
        title: 'Crecimiento',
        desc: 'Superamos 1.000 usuarios registrados y lanzamos el sistema de reacciones en tiempo real.',
        icon: <Users className="w-5 h-5" />,
    },
    {
        year: '2025',
        title: 'Expansión',
        desc: 'Plataforma multilingüe, directorio de peleadores y transmisiones vistas desde toda Latinoamérica.',
        icon: <Globe className="w-5 h-5" />,
    },
];

// ── Page ──────────────────────────────────────────────────────────────────────
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
                    statsAPI.getPublicStats(),
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

    // Texts
    const heroTitle =
        settings?.about_hero_title || (language === 'es' ? 'Llevando el MMA' : 'Bringing MMA');
    const heroSubtitle =
        settings?.about_hero_subtitle ??
        (language === 'es' ? 'Ecuatoriano al Mundo' : 'Ecuadorian to the World');
    const missionTitle = settings?.about_mission_title || t('about.mission_title');
    const missionText = settings?.about_mission_text || t('about.mission_text');
    const historyTitle = t('about.history_title');
    const historyText = t('about.history_text');
    const locationTitle = t('about.location_title');
    const locationText = t('about.location_text');

    const historyImage1 =
        settings?.about_history_image_1 ||
        'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800&auto=format&fit=crop';
    const historyImage2 =
        settings?.about_history_image_2 ||
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop';
    const historyImage3 =
        settings?.about_history_image_3 ||
        'https://images.unsplash.com/photo-1595078472549-9df27b99c80d?q=80&w=800&auto=format&fit=crop';

    // Values
    let missionValues: any[] = [];
    try {
        missionValues =
            settings?.about_values
                ? typeof settings.about_values === 'string'
                    ? JSON.parse(settings.about_values)
                    : settings.about_values
                : [];
    } catch {
        // ignore
    }

    if (missionValues.length === 0) {
        missionValues = [
            {
                title: t('about.values.energy_title'),
                description: t('about.values.energy_desc'),
                icon: 'Zap',
            },
            {
                title: t('about.values.global_title'),
                description: t('about.values.global_desc'),
                icon: 'Globe',
            },
            {
                title: t('about.values.excellence_title'),
                description: t('about.values.excellence_desc'),
                icon: 'Trophy',
            },
        ];
    }

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Zap':   return <Zap className="w-8 h-8 text-primary-400" />;
            case 'Globe': return <Globe className="w-8 h-8 text-primary-400" />;
            case 'Trophy':return <Trophy className="w-8 h-8 text-primary-400" />;
            default:      return <Zap className="w-8 h-8 text-primary-400" />;
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    };

    // Stat values
    const statUsers  = stats?.totalUsers  ?? (settings?.about_stats_users  ? parseInt(settings.about_stats_users)  : 1000);
    const statEvents = stats?.totalEvents ?? (settings?.about_stats_events ? parseInt(settings.about_stats_events) : 50);
    const statsReady = !loading;

    return (
        <div className="min-h-screen bg-dark-950 text-dark-50 selection:bg-primary-600/30 font-sans">

            {/* ── HERO ──────────────────────────────────────────────────────────── */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-950/80 to-primary-950/40 z-10" />
                    {!loading && (
                        <img
                            src={
                                getImageUrl(settings?.about_background) ||
                                'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000&auto=format&fit=crop'
                            }
                            className="w-full h-full object-cover scale-105 animate-slow-zoom opacity-40 mix-blend-overlay transition-opacity duration-1000"
                            alt="Hero Background"
                        />
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_100%)] z-20" />
                </div>

                <motion.div
                    className="container-custom relative z-30 text-center px-4"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8 mx-auto"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                        <span className="text-sm font-medium tracking-wide text-dark-200 uppercase">
                            {t('about.official')}
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-5xl md:text-7xl lg:text-8xl font-black font-display tracking-tight mb-8 leading-tight"
                    >
                        <span className="block text-white drop-shadow-2xl">{heroTitle}</span>
                        {heroSubtitle && (
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700 filter drop-shadow-lg block">
                                {heroSubtitle}
                            </span>
                        )}
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-xl md:text-2xl text-dark-200 max-w-3xl mx-auto font-light leading-relaxed mb-10"
                    >
                        {t('about.hero_description')}
                    </motion.p>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 animate-bounce"
                >
                    <div className="w-6 h-10 rounded-full border-2 border-dark-400 flex items-start justify-center p-1">
                        <div className="w-1 h-2 bg-dark-200 rounded-full" />
                    </div>
                </motion.div>
            </section>

            {/* ── MISSION ───────────────────────────────────────────────────────── */}
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

                            {/* Animated stats grid */}
                            <div className="grid grid-cols-2 gap-6 pt-6">
                                <StatCard
                                    value={statUsers}
                                    suffix="+"
                                    label="Comunidad en crecimiento"
                                    sublabel="Fanáticos registrados"
                                    ready={statsReady}
                                />
                                <StatCard
                                    value={statEvents}
                                    suffix="+"
                                    label="Eventos transmitidos"
                                    sublabel="PPV en vivo y en diferido"
                                    ready={statsReady}
                                />
                                {/* Ecuador card */}
                                <div className="col-span-2 p-6 rounded-2xl border border-dark-800 overflow-hidden relative bg-gradient-to-r from-dark-900 to-primary-950/20 hover:border-primary-500/30 transition-colors">
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20 select-none">
                                        🇪🇨
                                    </div>
                                    <p className="text-2xl font-black text-primary-500 mb-1">🇪🇨 Ecuador</p>
                                    <p className="text-xs text-dark-400 uppercase tracking-widest font-bold">
                                        Hecho en Ecuador, visto en el mundo
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative aspect-square rounded-[40px] overflow-hidden group shadow-2xl ring-1 ring-white/10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-dark-950/80 via-transparent to-transparent z-10" />
                            {!loading &&
                                (settings?.about_slider_images &&
                                settings.about_slider_images.length > 0 ? (
                                    <ImageSlider
                                        images={
                                            typeof settings.about_slider_images === 'string'
                                                ? JSON.parse(settings.about_slider_images)
                                                : settings.about_slider_images
                                        }
                                    />
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

            {/* ── HISTORY ───────────────────────────────────────────────────────── */}
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
                                    <img
                                        src={getImageUrl(historyImage1)}
                                        className="w-full h-full object-cover"
                                        alt="Historia 1"
                                    />
                                </div>
                                <div className="h-48 rounded-3xl overflow-hidden shadow-xl border border-white/5">
                                    <img
                                        src={getImageUrl(historyImage2)}
                                        className="w-full h-full object-cover"
                                        alt="Historia 2"
                                    />
                                </div>
                            </div>
                            <div className="pt-12 space-y-6">
                                <div className="h-48 rounded-3xl overflow-hidden shadow-xl border border-white/5">
                                    <img
                                        src={getImageUrl(historyImage3)}
                                        className="w-full h-full object-cover"
                                        alt="Historia 3"
                                    />
                                </div>
                                {/* "Apoyando lo Nuestro" — visual card */}
                                <div className="h-64 rounded-3xl overflow-hidden shadow-xl border border-primary-700/40 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-dark-950" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
                                        <span className="text-5xl mb-3 drop-shadow-lg">🇪🇨</span>
                                        <p className="text-white text-xl font-black font-display uppercase leading-tight italic drop-shadow-lg">
                                            Apoyando lo Nuestro
                                        </p>
                                        <p className="text-primary-200 text-xs mt-2 font-medium tracking-wide">
                                            Orgullo ecuatoriano · Deporte de combate
                                        </p>
                                    </div>
                                    {/* subtle grid overlay */}
                                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 z-0" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── TIMELINE ──────────────────────────────────────────────────────── */}
            <section className="py-24 bg-dark-950 overflow-hidden">
                <div className="container-custom">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-500/30 px-4 py-1.5 rounded-full mb-4">
                            <span className="text-xs font-black text-primary-400 uppercase tracking-widest">
                                Nuestra Trayectoria
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white font-display uppercase tracking-tight">
                            Hitos que nos <span className="text-primary-500">definen</span>
                        </h2>
                    </motion.div>

                    {/* Desktop horizontal / Mobile vertical */}
                    <div className="relative">
                        {/* Horizontal line (desktop) */}
                        <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-600/50 to-transparent" />

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
                            {TIMELINE.map((item, idx) => (
                                <motion.div
                                    key={item.year}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.12 }}
                                    className="relative flex md:flex-col gap-5 md:gap-0 md:items-center"
                                >
                                    {/* Dot */}
                                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-dark-900 border-2 border-primary-600 flex items-center justify-center text-primary-400 shadow-lg shadow-primary-600/20 z-10">
                                        {item.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="md:mt-6 md:text-center">
                                        <span className="inline-block text-xs font-black text-primary-500 tracking-widest uppercase mb-1">
                                            {item.year}
                                        </span>
                                        <h3 className="text-lg font-black text-white mb-2 font-display uppercase">
                                            {item.title}
                                        </h3>
                                        <p className="text-dark-400 text-sm leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>

                                    {/* Vertical connector (mobile) */}
                                    {idx < TIMELINE.length - 1 && (
                                        <div className="md:hidden absolute left-8 top-16 w-px h-full bg-primary-600/30" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── LOCATION ──────────────────────────────────────────────────────── */}
            <section className="py-32 bg-dark-900 relative">
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
                        <div className="bg-dark-950/50 backdrop-blur-xl border border-white/5 p-10 md:p-16 rounded-[40px] shadow-2xl">
                            <p className="text-2xl md:text-3xl text-dark-100 font-light leading-relaxed mb-8">
                                {locationText}
                            </p>
                            <div className="flex items-center justify-center gap-4 text-primary-500 font-bold tracking-widest uppercase">
                                <span className="w-10 h-[2px] bg-primary-500" />
                                <span>🇪🇨 La Troncal, Ecuador</span>
                                <span className="w-10 h-[2px] bg-primary-500" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── VALUES ────────────────────────────────────────────────────────── */}
            <section className="py-32 bg-dark-950 relative">
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
                        <p className="text-dark-300 text-xl font-light">{t('about.define_subtitle')}</p>
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
                                <div className="absolute inset-0 bg-primary-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative h-full bg-dark-950/40 backdrop-blur-sm p-10 rounded-[32px] border border-white/5 hover:border-primary-500/20 transition-all duration-500 group-hover:-translate-y-3">
                                    <div className="w-20 h-20 bg-dark-900 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-primary-950 transition-colors">
                                        {getIcon(val.icon)}
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 text-white uppercase font-display tracking-tight group-hover:text-primary-500 transition-colors">
                                        {val.title}
                                    </h3>
                                    <p className="text-dark-400 leading-relaxed text-lg font-light group-hover:text-dark-200 transition-colors">
                                        {val.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────────────────── */}
            <section className="py-40 relative overflow-hidden flex items-center justify-center bg-dark-950">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?q=80&w=2000&auto=format&fit=crop"
                        className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
                        alt="CTA Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-dark-950" />
                    {/* Red glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.12)_0%,_transparent_70%)]" />
                </div>

                <div className="container-custom relative z-10 text-center max-w-4xl px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="space-y-10"
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-600/20 border border-primary-500/40 backdrop-blur-md">
                            <span className="text-lg">🥊</span>
                            <span className="text-sm font-black text-primary-400 uppercase tracking-widest">
                                Únete a la familia
                            </span>
                        </div>

                        <h2 className="text-5xl md:text-8xl font-black font-display tracking-tighter text-white leading-none uppercase italic">
                            {t('about.cta_title')}
                        </h2>
                        <p className="text-xl md:text-2xl text-dark-200 max-w-2xl mx-auto font-light leading-relaxed">
                            {t('about.cta_description')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                            <Link
                                href="/auth/register"
                                className="group relative bg-primary-600 text-white px-12 py-5 rounded-full font-black text-xl transition-all hover:scale-105 hover:bg-primary-700 flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(234,48,48,0.3)]"
                            >
                                <span>{t('about.register_now')}</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </Link>

                            <Link
                                href="/events"
                                className="px-12 py-5 rounded-full font-bold text-xl transition-all border-2 border-white/15 hover:bg-white/5 text-white flex items-center justify-center backdrop-blur-md"
                            >
                                {t('about.view_upcoming')}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
