'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, DollarSign, Play, ArrowRight, Zap, Shield, Users, Star, TrendingUp, UserPlus, CreditCard, MonitorPlay } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsAPI } from '@/lib/api';
import { settingsAPI } from '@/lib/api/settings';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Footer from '@/components/Footer';
import Navbar from '@/components/ui/Navbar';
import AdSense from '@/components/ui/AdSense';
import EventCard from '@/components/events/EventCard';
import { newsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import AuthenticatedHome from '@/components/home/AuthenticatedHome';
import HeroBackground from '@/components/home/HeroBackground';

interface Event {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    price: number;
    currency: string;
    thumbnail_url?: string;
    banner_url?: string;
    status: string;
    is_featured: boolean;
    promoter_id?: string;
    promoter_name?: string;
    promoter_logo_url?: string;
}

export default function HomePage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { isAuthenticated, user } = useAuthStore();
    const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);

    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [homepageBackground, setHomepageBackground] = useState<string | null>(null);
    const [homepageVideo, setHomepageVideo] = useState<string | null>(null);
    const [homepageSlider, setHomepageSlider] = useState<string[]>([]);
    const [recentNews, setRecentNews] = useState<any[]>([]);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const [featuredRes, allEventsRes, settingsRes, newsResData] = await Promise.all([
                eventsAPI.getAll({ featured: true }),
                eventsAPI.getAll(), // Fetch all to include live + upcoming
                settingsAPI.getSettings(),
                newsAPI.getAll({ limit: 3, status: 'published' })
            ]);

            setFeaturedEvents(featuredRes.data.data.slice(0, 1));

            // Filter for live, upcoming, and reprise (only if price is 0 for reprise)
            // Only show events with future dates (live events always show)
            const now = new Date();
            const activeEvents = allEventsRes.data.data
                .filter((e: any) => {
                    const status = (e.status || '').toLowerCase();
                    const eventDate = new Date(e.event_date);
                    // Live events always show regardless of date
                    if (status === 'live') return true;
                    // Upcoming and free reprise must have a future date
                    if (status === 'upcoming' && eventDate > now) return true;
                    if (status === 'reprise' && parseFloat(e.price) === 0 && eventDate > now) return true;
                    return false;
                })
                .sort((a: any, b: any) => {
                    // Start with Live, then date asc
                    if (a.status === 'live' && b.status !== 'live') return -1;
                    if (a.status !== 'live' && b.status === 'live') return 1;
                    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
                });

            setUpcomingEvents(activeEvents.slice(0, 6));

            console.log('Settings response:', settingsRes);
            console.log('Settings data:', settingsRes.data);

            // Access nested data: response.data.data.homepage_background
            const settingsData = (settingsRes.data as any).data;
            if (settingsData) {
                setHomepageBackground(settingsData.homepage_background || null);
                setHomepageVideo(settingsData.homepage_video || null);
                setHomepageSlider(settingsData.homepage_slider || []);
            }

            const newsRes = newsResData;
            if (newsRes && newsRes.data) {
                setRecentNews(newsRes.data.data);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }

    };

    const mainEvent = featuredEvents[0];

    // If authenticated, show the dashboard view
    if (isAuthenticated && user) {
        return (
            <AuthenticatedHome
                user={user}
                featuredEvents={featuredEvents}
                upcomingEvents={upcomingEvents}
                homepageBackground={homepageBackground}
                homepageVideo={homepageVideo}
                homepageSlider={homepageSlider}
            />
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-black">
            {/* Hero Section - UFC Style */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <HeroBackground
                    videoUrl={homepageVideo}
                    sliderImages={homepageSlider}
                    staticImage={homepageBackground}
                    fallbackImage={mainEvent?.banner_url || mainEvent?.thumbnail_url}
                />

                {/* Animated Grid Pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

                {/* Content */}
                <div className="container-custom relative z-10 py-32">
                    <div className="max-w-4xl">
                        {/* Status Badge */}
                        {mainEvent && (
                            <div className="mb-6">
                                {mainEvent.status === 'live' ? (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">
                                            {t('landing.hero.live_now')}
                                        </span>
                                    </div>

                                ) : (
                                    <span className={`badge ${getEventStatusColor(mainEvent.status)} px-4 py-2 text-sm uppercase tracking-wider`}>
                                        {mainEvent.status === 'reprise' && parseFloat(String(mainEvent.price)) === 0 ? t('landing.hero.free_pass') : getEventStatusText(mainEvent.status)}
                                    </span>

                                )}
                            </div>
                        )}

                        {/* Main Heading */}
                        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight uppercase tracking-tight">
                            {mainEvent ? (
                                <span className="block text-white">{mainEvent.title}</span>
                            ) : (
                                <>
                                    <span className="block text-white">{t('landing.hero.title_part1')}</span>
                                    <span className="block text-red-600">{t('landing.hero.title_part2')}</span>
                                </>
                            )}

                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-gray-400 mb-10 uppercase tracking-wide font-semibold">
                            {t('landing.hero.subtitle')}
                        </p>


                        {/* CTA Buttons */}
                        <div className="flex flex-wrap gap-4">
                            {mainEvent ? (
                                <>
                                    <Link
                                        href={`/event/${mainEvent.id}`}
                                        className="btn-hero-primary"
                                    >
                                        <Play className="w-6 h-6 mr-2" />
                                        {mainEvent.status === 'live' ? t('home.watch_now') : t('watch.buy_access')}
                                    </Link>
                                    <Link
                                        href="/events"
                                        className="btn-hero-secondary"
                                    >
                                        {t('landing.sections.view_all_mobile')}
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Link>

                                </>
                            ) : (
                                <>
                                    <Link href="/events" className="btn-hero-primary">
                                        <Play className="w-6 h-6 mr-2" />
                                        {t('landing.hero.view_events')}
                                    </Link>
                                    <Link href="/auth/register" className="btn-hero-secondary">
                                        {t('landing.hero.register')}
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Link>
                                </>

                            )}
                        </div>

                        {/* Price Tag */}
                        {mainEvent && (
                            <div className="mt-8 inline-flex items-baseline gap-2">
                                <span className="text-gray-500 text-sm uppercase tracking-wider">{t('landing.hero.from')}</span>

                                <span className="text-5xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                                    {formatCurrency(mainEvent.price, mainEvent.currency)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-gray-700 rounded-full flex justify-center p-2">
                        <div className="w-1 h-3 bg-red-600 rounded-full" />
                    </div>
                </div>
            </section>

            {/* Upcoming Events Grid - UFC Style */}
            {upcomingEvents.length > 0 && (
                <section className="py-20 bg-black">
                    <div className="container-custom">
                        {/* Section Header */}
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-orange-500" />
                                    <h2 className="font-display text-sm font-bold uppercase tracking-widest text-gray-500">
                                        {t('landing.sections.upcoming_title')}
                                    </h2>
                                </div>
                                <h3 className="font-display text-4xl md:text-5xl font-black text-white uppercase">
                                    {t('landing.sections.upcoming_subtitle')}
                                </h3>

                            </div>
                            <Link
                                href="/events"
                                className="hidden md:flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors font-bold uppercase text-sm tracking-wider"
                            >
                                {t('landing.sections.view_all')}
                                <ArrowRight className="w-5 h-5" />
                            </Link>

                        </div>

                        {/* Events Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>

                        {/* Mobile View All Button */}
                        <div className="mt-8 text-center md:hidden">
                            <Link href="/events" className="btn-hero-secondary">
                                {t('landing.sections.view_all_mobile')}
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </div>

                    </div>
                </section>
            )}

            {/* Recent News Section - UFC Style */}
            {recentNews.length > 0 && (
                <section className="py-20 bg-zinc-950 border-t border-zinc-900">
                    <div className="container-custom">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-1 h-8 bg-red-600" />
                                    <h2 className="font-display text-sm font-bold uppercase tracking-widest text-gray-500">
                                        ÚLTIMAS NOTICIAS
                                    </h2>
                                </div>
                                <h3 className="font-display text-4xl md:text-5xl font-black text-white uppercase">
                                    MMA ECUADOR & MUNDO
                                </h3>
                            </div>
                            <Link
                                href="/noticias"
                                className="hidden md:flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors font-bold uppercase text-sm tracking-wider"
                            >
                                VER TODAS LAS NOTICIAS
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {recentNews.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/noticias/${post.slug}`}
                                    className="group flex flex-col bg-black border border-zinc-900 rounded-xl overflow-hidden hover:border-red-600/50 transition-all shadow-xl"
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <Image
                                            src={getImageUrl(post.thumbnail_url || '') || ''}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-red-600 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 block">
                                            {formatDate(post.created_at)}
                                        </span>
                                        <h4 className="text-lg font-bold mb-3 uppercase leading-tight group-hover:text-red-500 transition-colors line-clamp-2">
                                            {post.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-white font-black uppercase text-[10px] tracking-widest">
                                            Leer mas <ArrowRight className="w-4 h-4 text-red-600" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Ad between News and Features */}
            <section className="py-10 bg-zinc-950">
                <div className="container-custom">
                    <AdSense slot="5992307942" format="horizontal" />
                </div>
            </section>

            {/* How it Works Section */}
            <section className="py-20 bg-black border-y border-zinc-900">
                <div className="container-custom">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-orange-500" />
                            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-gray-500">
                                Súper Sencillo
                            </h2>
                        </div>
                        <h3 className="font-display text-4xl md:text-5xl font-black text-white uppercase">
                            ¿CÓMO VER LAS PELEAS?
                        </h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop only) */}
                        <div className="hidden md:block absolute top-[4.5rem] left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-red-600/0 via-red-600/30 to-red-600/0" />

                        <div className="relative text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform z-10 relative shadow-lg shadow-red-600/20">
                                <UserPlus className="w-10 h-10 text-white" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-dark-900 rounded-full flex items-center justify-center text-red-500 font-black border-4 border-black">
                                    1
                                </div>
                            </div>
                            <h4 className="font-display text-2xl font-bold mb-3 text-white uppercase tracking-wide">
                                CREA TU CUENTA
                            </h4>
                            <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
                                Regístrate gratis en menos de 1 minuto usando Google o tu correo electrónico.
                            </p>
                        </div>

                        <div className="relative text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform z-10 relative shadow-lg shadow-red-600/20">
                                <CreditCard className="w-10 h-10 text-white" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-dark-900 rounded-full flex items-center justify-center text-red-500 font-black border-4 border-black">
                                    2
                                </div>
                            </div>
                            <h4 className="font-display text-2xl font-bold mb-3 text-white uppercase tracking-wide">
                                COMPRA TU TICKET
                            </h4>
                            <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
                                Selecciona el evento que quieres ver y paga de forma 100% segura.
                            </p>
                        </div>

                        <div className="relative text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform z-10 relative shadow-lg shadow-red-600/20">
                                <MonitorPlay className="w-10 h-10 text-white" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-dark-900 rounded-full flex items-center justify-center text-red-500 font-black border-4 border-black">
                                    3
                                </div>
                            </div>
                            <h4 className="font-display text-2xl font-bold mb-3 text-white uppercase tracking-wide">
                                DISFRUTA EL PPV
                            </h4>
                            <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
                                ¡Listo! Prepárate para la acción en HD desde tu celular, tablet o TV.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section - UFC Style */}
            <section className="py-20 bg-dark-950 border-y border-gray-900">
                <div className="container-custom">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3 text-white uppercase tracking-wide">
                                {t('landing.features.quality_title')}
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                {t('landing.features.quality_desc')}
                            </p>
                        </div>


                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3 text-white uppercase tracking-wide">
                                {t('landing.features.secure_title')}
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                {t('landing.features.secure_desc')}
                            </p>
                        </div>


                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3 text-white uppercase tracking-wide">
                                {t('landing.features.community_title')}
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                {t('landing.features.community_desc')}
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* CTA Section - UFC Style */}
            <section className="py-32 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

                <div className="container-custom relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="font-display text-5xl md:text-7xl font-black mb-6 text-white uppercase leading-none">
                            {t('landing.cta.title_part1')}
                            <span className="block bg-gradient-to-r from-red-500 via-red-600 to-orange-500 bg-clip-text text-transparent">
                                {t('landing.cta.title_part2')}
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                            {t('landing.cta.subtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/events" className="btn-hero-primary">
                                <Play className="w-6 h-6 mr-2" />
                                EXPLORAR EVENTOS
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
