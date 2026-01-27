'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, DollarSign, Play, ArrowRight, Zap, Shield, Users, Star, TrendingUp, LogOut, Settings, User } from 'lucide-react';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl } from '@/lib/utils';
import { useSettingsStore } from '@/lib/store';
import { paymentsAPI } from '@/lib/api';
import Footer from '@/components/Footer';
import PaymentModal from '@/components/PaymentModal';

interface AuthenticatedHomeProps {
    user: any;
    featuredEvents: any[];
    upcomingEvents: any[];
    homepageBackground?: string | null;
}

export default function AuthenticatedHome({ user, featuredEvents, upcomingEvents, homepageBackground }: AuthenticatedHomeProps) {
    const { settings } = useSettingsStore();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [hasSeasonPass, setHasSeasonPass] = useState(false);
    const [checkingPass, setCheckingPass] = useState(true);
    const nextEvent = featuredEvents[0];

    useEffect(() => {
        const checkPass = async () => {
            try {
                const { data } = await paymentsAPI.checkSeasonPass();
                setHasSeasonPass(data.data.hasSeasonPass);
            } catch (error) {
                console.error('Error checking season pass:', error);
            } finally {
                setCheckingPass(false);
            }
        };
        checkPass();
    }, []);

    const handleBuySeasonPass = () => {
        setShowPaymentModal(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white relative">
            {/* Background Image */}
            {homepageBackground && (
                <div className="fixed inset-0 z-0">
                    <img
                        src={getImageUrl(homepageBackground)}
                        alt="Background"
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                    {/* Gradient Overlay for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
                </div>
            )}

            <div className="relative z-10 flex flex-col min-h-screen">

                <main className="flex-grow container-custom py-8 mt-20">
                    {/* Welcome Section */}
                    <div className="mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                            Hola, <span className="text-primary-500">{user?.full_name || 'Fanático'}</span>
                        </h1>
                        <p className="text-gray-400">
                            Bienvenido de nuevo a tu centro de combate.
                        </p>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column: Featured/Next Event */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Next Big Event Card */}
                            {nextEvent && (
                                <section className="bg-dark-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-dark-700 hover:border-primary-500/50 transition-colors">
                                    <div className="relative h-64 md:h-80">
                                        <img
                                            src={getImageUrl(nextEvent.banner_url || nextEvent.thumbnail_url)}
                                            alt={nextEvent.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 p-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                                    Destacado
                                                </span>
                                                <span className="text-gray-300 text-sm flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(nextEvent.event_date)}
                                                </span>
                                            </div>
                                            <h2 className="text-3xl font-display font-black uppercase italic leading-none mb-4">
                                                {nextEvent.title}
                                            </h2>
                                            <Link
                                                href={`/event/${nextEvent.id}`}
                                                className="btn-primary inline-flex items-center"
                                            >
                                                <Play className="w-5 h-5 mr-2" />
                                                {nextEvent.status === 'live' ? 'VER AHORA' : 'VER DETALLES'}
                                            </Link>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Recent/Recommended Rows */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary-500" />
                                        Próximos Eventos
                                    </h3>
                                    <Link href="/events" className="text-sm text-gray-400 hover:text-white transition-colors">
                                        Ver todos
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {upcomingEvents.slice(0, 8).map((event) => (
                                        <Link key={event.id} href={`/event/${event.id}`} className="group">
                                            <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-3 flex gap-4 hover:bg-dark-750 transition-colors border border-transparent hover:border-dark-600">
                                                <div className="w-24 h-24 flex-shrink-0 bg-dark-900 rounded-lg overflow-hidden relative">
                                                    <img
                                                        src={getImageUrl(event.thumbnail_url)}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h4 className="font-bold text-white truncate group-hover:text-primary-400 transition-colors">
                                                        {event.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-400 mb-2">
                                                        {formatDate(event.event_date)}
                                                    </p>
                                                    <div className="text-primary-500 font-bold text-sm uppercase">
                                                        {parseFloat(String(event.price)) === 0 ? 'PASE LIBRE' : formatCurrency(event.price, event.currency)}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: User Sidebar/Quick Actions */}
                        <div className="space-y-6">
                            {/* Quick Stats/Profile Card */}
                            <div className="bg-dark-800/80 backdrop-blur-sm rounded-2xl p-6 border border-dark-700">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-dark-700 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold">{user?.full_name}</div>
                                        <div className="text-xs text-gray-500">{user?.email}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <button className="w-full text-left px-4 py-3 rounded-xl bg-dark-750 hover:bg-dark-700 transition-colors flex items-center justify-between group">
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Mis Compras</span>
                                        <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-white" />
                                    </button>
                                    <Link href="/settings" className="w-full text-left px-4 py-3 rounded-xl bg-dark-750 hover:bg-dark-700 transition-colors flex items-center justify-between group">
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Configuración</span>
                                        <Settings className="w-4 h-4 text-dark-500 group-hover:text-white" />
                                    </Link>
                                </div>
                            </div>

                            {/* Promo/Upsell */}
                            {settings?.season_pass_enabled && !hasSeasonPass && !checkingPass && (
                                <div className="bg-gradient-to-br from-primary-900/50 to-dark-800/80 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
                                    <h4 className="font-bold text-lg mb-2 text-white">{settings.season_pass_title || 'Pase de Temporada'}</h4>
                                    <p className="text-sm text-gray-400 mb-4">
                                        {settings.season_pass_description}
                                    </p>
                                    <button
                                        onClick={handleBuySeasonPass}
                                        className="w-full py-2 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        {settings.season_pass_button_text || 'Comprar Pase'}
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
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
        </div>
    );
}
