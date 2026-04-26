'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Play, ArrowRight, TrendingUp, Settings, User, Radio, ShoppingBag, Clock, Newspaper } from 'lucide-react';
import { formatDate, formatCurrency, getImageUrl } from '@/lib/utils';
import { useLanguage } from '@/components/providers/LanguageProvider';
import HeroBackground from './HeroBackground';
import { useSettingsStore } from '@/lib/store';
import { paymentsAPI, newsAPI, authAPI } from '@/lib/api';
import Footer from '@/components/Footer';
import PaymentModal from '@/components/PaymentModal';
import EventCard from '@/components/events/EventCard';
import StickyBottomAd from '@/components/ui/StickyBottomAd';

interface AuthenticatedHomeProps {
    user: any;
    featuredEvents: any[];
    upcomingEvents: any[];
    homepageBackground?: string | null;
    homepageVideo?: string | null;
    homepageSlider?: string[];
}

function useCountdown(targetDate: string) {
    const calcTimeLeft = useCallback(() => {
        if (!targetDate) return null;
        const ts = new Date(targetDate).getTime();
        if (isNaN(ts)) return null;
        const diff = ts - Date.now();
        if (diff <= 0) return null;
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calcTimeLeft);
    useEffect(() => {
        const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
        return () => clearInterval(id);
    }, [calcTimeLeft]);
    return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-black text-white tabular-nums w-14 text-center">
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{label}</span>
        </div>
    );
}

export default function AuthenticatedHome({
    user,
    featuredEvents,
    upcomingEvents,
    homepageBackground,
    homepageVideo,
    homepageSlider
}: AuthenticatedHomeProps) {
    const { settings } = useSettingsStore();
    const { t } = useLanguage();

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [hasSeasonPass, setHasSeasonPass] = useState(false);
    const [checkingPass, setCheckingPass] = useState(true);
    const [myPurchases, setMyPurchases] = useState<any[]>([]);
    const [recentNews, setRecentNews] = useState<any[]>([]);

    const nextEvent = featuredEvents[0];
    const liveEvent = upcomingEvents.find(e => e.status === 'live');
    const nextUpcoming = upcomingEvents.find(e => e.status === 'upcoming' || e.status === 'reprise');
    const countdown = useCountdown(nextUpcoming?.event_date || '');

    useEffect(() => {
        const checkPass = async () => {
            try {
                const { data } = await paymentsAPI.checkSeasonPass();
                setHasSeasonPass(data.data.hasSeasonPass);
            } catch {
                // silently fail
            } finally {
                setCheckingPass(false);
            }
        };

        const loadPurchases = async () => {
            try {
                const { data } = await authAPI.getPurchases();
                setMyPurchases((data.data || []).slice(0, 4));
            } catch {
                // silently fail
            }
        };

        const loadNews = async () => {
            try {
                const { data } = await newsAPI.getAll({ limit: 3, status: 'published' });
                setRecentNews(data.data || []);
            } catch {
                // silently fail
            }
        };

        checkPass();
        loadPurchases();
        loadNews();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-black text-white relative">
            <HeroBackground
                videoUrl={homepageVideo}
                sliderImages={homepageSlider}
                staticImage={homepageBackground}
                isFixed
                opacity={0.3}
            />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-grow container-custom py-8 mt-20">

                    {/* ── LIVE EVENT ALERT ── */}
                    {liveEvent && (
                        <Link
                            href={`/event/${liveEvent.id}`}
                            className="flex items-center gap-4 bg-red-600 hover:bg-red-500 transition-colors rounded-2xl px-6 py-4 mb-8 group"
                        >
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                                </span>
                                <Radio className="w-5 h-5 text-white" />
                                <span className="text-sm font-black uppercase tracking-widest text-white">EN VIVO AHORA</span>
                            </div>
                            <span className="font-bold text-white truncate">{liveEvent.title}</span>
                            <ArrowRight className="w-5 h-5 text-white ml-auto shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}

                    {/* ── WELCOME ── */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-1">
                            {t('home.welcome')}, <span className="text-primary-500">{user?.full_name || 'Fanático'}</span>
                        </h1>
                        <p className="text-gray-400">{t('home.subtitle')}</p>
                    </div>

                    {/* ── MAIN GRID ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Featured Event */}
                            {nextEvent && (
                                <section className="bg-dark-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-dark-700 hover:border-primary-500/50 transition-colors">
                                    <div className="relative h-64 md:h-80">
                                        <img
                                            src={getImageUrl(nextEvent.banner_url || nextEvent.thumbnail_url)}
                                            alt={nextEvent.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                                    {t('home.featured')}
                                                </span>
                                                <span className="text-gray-300 text-sm flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(nextEvent.event_date)}
                                                </span>
                                            </div>
                                            <h2 className="text-3xl font-display font-black uppercase italic leading-none mb-4">
                                                {nextEvent.title}
                                            </h2>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Link
                                                    href={`/event/${nextEvent.id}`}
                                                    className="btn-primary inline-flex items-center"
                                                >
                                                    <Play className="w-5 h-5 mr-2" />
                                                    {nextEvent.status === 'live' ? t('home.watch_now') : t('home.view_details')}
                                                </Link>
                                                {nextEvent.price > 0 && (
                                                    <span className="text-2xl font-black text-primary-400">
                                                        {formatCurrency(nextEvent.price, nextEvent.currency)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Countdown */}
                            {nextUpcoming && countdown && (
                                <section className="bg-dark-800/80 backdrop-blur-sm rounded-2xl border border-dark-700 px-6 py-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock className="w-4 h-4 text-primary-500" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                            Próximo evento — {nextUpcoming.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CountdownUnit value={countdown.days} label="días" />
                                        <span className="text-3xl font-black text-gray-600 mb-4">:</span>
                                        <CountdownUnit value={countdown.hours} label="horas" />
                                        <span className="text-3xl font-black text-gray-600 mb-4">:</span>
                                        <CountdownUnit value={countdown.minutes} label="min" />
                                        <span className="text-3xl font-black text-gray-600 mb-4">:</span>
                                        <CountdownUnit value={countdown.seconds} label="seg" />
                                    </div>
                                </section>
                            )}

                            {/* Upcoming Events */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary-500" />
                                        {t('home.upcoming_events')}
                                    </h3>
                                    <Link href="/events" className="text-sm text-gray-400 hover:text-white transition-colors">
                                        {t('home.view_all')}
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {upcomingEvents.slice(0, 8).map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-6">

                            {/* User Card */}
                            <div className="bg-dark-800/80 backdrop-blur-sm rounded-2xl p-6 border border-dark-700">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-orange-600 rounded-full flex items-center justify-center shrink-0">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold truncate">{user?.full_name}</div>
                                        <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Link href="/profile?tab=purchases" className="w-full text-left px-4 py-3 rounded-xl bg-dark-750 hover:bg-dark-700 transition-colors flex items-center justify-between group">
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">{t('nav.purchases')}</span>
                                        <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-white" />
                                    </Link>
                                    <Link href="/settings" className="w-full text-left px-4 py-3 rounded-xl bg-dark-750 hover:bg-dark-700 transition-colors flex items-center justify-between group">
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">{t('home.settings')}</span>
                                        <Settings className="w-4 h-4 text-dark-500 group-hover:text-white" />
                                    </Link>
                                </div>
                            </div>

                            {/* My Purchased Events */}
                            {myPurchases.length > 0 && (
                                <div className="bg-dark-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-dark-700">
                                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                        <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-gray-300">
                                            <ShoppingBag className="w-4 h-4 text-primary-500" />
                                            Mis Eventos
                                        </h4>
                                        <Link href="/profile?tab=purchases" className="text-xs text-gray-500 hover:text-primary-400 transition-colors">
                                            Ver todos →
                                        </Link>
                                    </div>
                                    <div className="divide-y divide-dark-700">
                                        {myPurchases.map((p: any) => (
                                            <Link
                                                key={p.id}
                                                href={`/event/${p.event_id}`}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-dark-700/60 transition-colors group"
                                            >
                                                {/* Thumbnail */}
                                                <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-dark-700">
                                                    {p.thumbnail_url ? (
                                                        <Image
                                                            src={getImageUrl(p.thumbnail_url) || ''}
                                                            alt={p.title || ''}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900/50 to-dark-700">
                                                            <Play className="w-4 h-4 text-primary-500" />
                                                        </div>
                                                    )}
                                                    {/* Live badge */}
                                                    {p.event_status === 'live' && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                            <span className="text-[8px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                LIVE
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-1 leading-tight">
                                                        {p.title}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                                        {formatDate(p.event_date)}
                                                    </p>
                                                </div>

                                                {/* Arrow */}
                                                <ArrowRight className="w-3.5 h-3.5 text-dark-500 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Season Pass Upsell */}
                            {settings?.season_pass_enabled && !hasSeasonPass && !checkingPass && (
                                <div className="bg-gradient-to-br from-primary-900/50 to-dark-800/80 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
                                    <h4 className="font-bold text-lg mb-2 text-white">{settings.season_pass_title || 'Pase de Temporada'}</h4>
                                    <p className="text-sm text-gray-400 mb-4">{settings.season_pass_description}</p>
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="w-full py-2 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        {settings.season_pass_button_text || 'Comprar Pase'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RECENT NEWS ── */}
                    {recentNews.length > 0 && (
                        <section className="mt-12 pt-10 border-t border-dark-800">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Newspaper className="w-5 h-5 text-primary-500" />
                                    Últimas Noticias
                                </h3>
                                <Link href="/noticias" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                                    Ver todas <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {recentNews.map((post) => (
                                    <Link
                                        key={post.id}
                                        href={`/noticias/${post.slug}`}
                                        className="group flex flex-col bg-dark-800/80 border border-dark-700 rounded-xl overflow-hidden hover:border-primary-500/50 transition-all"
                                    >
                                        <div className="relative h-40 overflow-hidden">
                                            <Image
                                                src={getImageUrl(post.thumbnail_url || '') || ''}
                                                alt={post.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-primary-600 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded">
                                                    {post.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">
                                                {formatDate(post.created_at)}
                                            </span>
                                            <h4 className="text-sm font-bold uppercase leading-tight group-hover:text-primary-400 transition-colors line-clamp-2">
                                                {post.title}
                                            </h4>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                </main>
                <Footer />
            </div>

            {showPaymentModal && (
                <PaymentModal
                    purchaseType="season_pass"
                    event={{
                        title: settings?.season_pass_title || 'Pase de Temporada',
                        price: settings?.season_pass_price || 0,
                        currency: 'USD'
                    }}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}

            <StickyBottomAd />
        </div>
    );
}
