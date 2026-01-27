'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, DollarSign, Play, ArrowRight, Zap, Shield, Users, Star, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsAPI } from '@/lib/api';
import { settingsAPI } from '@/lib/api/settings';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import AuthenticatedHome from '@/components/home/AuthenticatedHome';

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
}

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [homepageBackground, setHomepageBackground] = useState<string | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const [featuredRes, allEventsRes, settingsRes] = await Promise.all([
                eventsAPI.getAll({ featured: true }),
                eventsAPI.getAll(), // Fetch all to include live + upcoming
                settingsAPI.getSettings(),
            ]);

            setFeaturedEvents(featuredRes.data.data.slice(0, 1));

            // Filter for live, upcoming, and reprise (only if price is 0 for reprise)
            const activeEvents = allEventsRes.data.data
                .filter((e: any) => {
                    const status = (e.status || '').toLowerCase();
                    if (status === 'live' || status === 'upcoming') return true;
                    if (status === 'reprise' && parseFloat(e.price) === 0) return true;
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
            if (settingsData?.homepage_background) {
                setHomepageBackground(settingsData.homepage_background);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Error al cargar eventos');
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
            />
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-black">
            {/* Hero Section - UFC Style */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image/Video */}
                {homepageBackground ? (
                    <div className="absolute inset-0">
                        <img
                            src={getImageUrl(homepageBackground)}
                            alt="Background"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Dark Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
                    </div>
                ) : mainEvent?.banner_url || mainEvent?.thumbnail_url ? (
                    <div className="absolute inset-0">
                        <img
                            src={getImageUrl(mainEvent.banner_url || mainEvent.thumbnail_url)}
                            alt={mainEvent.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Dark Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-dark-950 to-red-950/20" />
                )}

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
                                            EN VIVO AHORA
                                        </span>
                                    </div>
                                ) : (
                                    <span className={`badge ${getEventStatusColor(mainEvent.status)} px-4 py-2 text-sm uppercase tracking-wider`}>
                                        {mainEvent.status === 'reprise' && parseFloat(String(mainEvent.price)) === 0 ? 'PASE LIBRE' : getEventStatusText(mainEvent.status)}
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
                                    <span className="block text-white">VIVE LOS</span>
                                    <span className="block text-red-600">DEPORTES DE COMBATE</span>
                                </>
                            )}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-gray-400 mb-10 uppercase tracking-wide font-semibold">
                            Como nunca antes
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
                                        {mainEvent.status === 'live' ? 'VER AHORA' : 'COMPRAR ACCESO'}
                                    </Link>
                                    <Link
                                        href="/events"
                                        className="btn-hero-secondary"
                                    >
                                        VER TODOS LOS EVENTOS
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/events" className="btn-hero-primary">
                                        <Play className="w-6 h-6 mr-2" />
                                        VER EVENTOS
                                    </Link>
                                    <Link href="/auth/register" className="btn-hero-secondary">
                                        REGÍSTRATE AQUÍ
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Price Tag */}
                        {mainEvent && (
                            <div className="mt-8 inline-flex items-baseline gap-2">
                                <span className="text-gray-500 text-sm uppercase tracking-wider">Desde</span>
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
                                        Próximos Eventos
                                    </h2>
                                </div>
                                <h3 className="font-display text-4xl md:text-5xl font-black text-white uppercase">
                                    NO TE LO PIERDAS
                                </h3>
                            </div>
                            <Link
                                href="/events"
                                className="hidden md:flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors font-bold uppercase text-sm tracking-wider"
                            >
                                VER TODO
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        {/* Events Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/event/${event.id}`}
                                    className="group relative overflow-hidden bg-dark-950 border border-gray-900 hover:border-red-600/50 transition-all duration-300"
                                >
                                    {/* Image */}
                                    <div className="relative h-64 bg-dark-900 overflow-hidden">
                                        {event.thumbnail_url ? (
                                            <img
                                                src={getImageUrl(event.thumbnail_url)}
                                                alt={event.title}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-900 to-red-950/20">
                                                <Play className="w-16 h-16 text-gray-800" />
                                            </div>
                                        )}
                                        {/* Overlay on Hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                        {/* Status Badge */}
                                        <div className="absolute top-4 left-4">
                                            <span className={`badge ${getEventStatusColor(event.status)}`}>
                                                {event.status === 'reprise' && parseFloat(String(event.price)) === 0 ? 'PASE LIBRE' : getEventStatusText(event.status)}
                                            </span>
                                        </div>

                                        {/* Play Icon on Hover */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                                <Play className="w-8 h-8 text-white fill-white ml-1" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="font-display text-xl font-bold mb-3 text-white uppercase tracking-tight group-hover:text-red-500 transition-colors line-clamp-2">
                                            {event.title}
                                        </h3>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                <span className="font-medium">{formatDate(event.event_date, 'PP')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                <span className="font-medium">{formatDate(event.event_date, 'p')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-900">
                                            <span className="text-2xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-tight">
                                                {parseFloat(String(event.price)) === 0 ? 'PASE LIBRE' : formatCurrency(event.price, event.currency)}
                                            </span>
                                            <span className="text-red-500 group-hover:translate-x-2 transition-transform">
                                                <ArrowRight className="w-5 h-5" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Mobile View All Button */}
                        <div className="mt-8 text-center md:hidden">
                            <Link href="/events" className="btn-hero-secondary">
                                VER TODOS LOS EVENTOS
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section - UFC Style */}
            <section className="py-20 bg-dark-950 border-y border-gray-900">
                <div className="container-custom">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3 text-white uppercase tracking-wide">
                                CALIDAD 4K
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                Transmisión en ultra alta definición con tecnología adaptativa para una experiencia sin interrupciones
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3 text-white uppercase tracking-wide">
                                100% SEGURO
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                Pagos protegidos con encriptación bancaria. Stripe y PayPal certificados
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3 text-white uppercase tracking-wide">
                                COMUNIDAD GLOBAL
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                Chat en vivo con miles de fanáticos. Comparte la emoción en tiempo real
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
                            ¿LISTO PARA LA
                            <span className="block bg-gradient-to-r from-red-500 via-red-600 to-orange-500 bg-clip-text text-transparent">
                                ACCIÓN?
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                            Únete a la comunidad más grande de fanáticos del combate. No te pierdas ni un solo momento.
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
