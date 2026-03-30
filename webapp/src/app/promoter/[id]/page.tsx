'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { promotersAPI, eventsAPI, handleAPIError } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { Calendar, Globe, Facebook, Instagram, Twitter, Image as ImageIcon, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import EventCard from '@/components/events/EventCard';
import Link from 'next/link';

export default function PromoterProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [promoter, setPromoter] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            const [promoterRes, eventsRes] = await Promise.all([
                promotersAPI.getById(id as string),
                eventsAPI.getAll({ promoter_id: id as string })
            ]);

            setPromoter(promoterRes.data.data);
            setEvents(eventsRes.data.data);
        } catch (error) {
            console.error('Error loading promoter profile:', error);
            handleAPIError(error);
            // If promoter not found, we could redirect or show 404
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    if (!promoter) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl font-bold text-white mb-4">Promotora no encontrada</h1>
                <p className="text-gray-400 mb-8 text-center max-w-md">El perfil que buscas no existe o ha sido eliminado.</p>
                <Link href="/events" className="btn-primary">Explorar Eventos</Link>
            </div>
        );
    }

    const { social_links = {} } = promoter;

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col">
            {/* Hero Section with Banner */}
            <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
                {promoter.banner_url ? (
                    <img
                        src={getImageUrl(promoter.banner_url)}
                        alt={promoter.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-dark-900 to-dark-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />

                {/* Promoter Header Info Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-12">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
                        {/* Logo */}
                        <div className="w-32 h-32 md:w-44 md:h-44 bg-dark-900 rounded-3xl border-4 border-dark-800 overflow-hidden shadow-2xl animate-in zoom-in duration-500">
                            {promoter.logo_url ? (
                                <img
                                    src={getImageUrl(promoter.logo_url)}
                                    alt={promoter.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary-500 font-bold text-4xl italic uppercase">
                                    {promoter.name.charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 text-center md:text-left pb-4 space-y-3">
                            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">
                                {promoter.name}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                {social_links.website && (
                                    <a href={social_links.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                        <Globe className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase tracking-widest">{new URL(social_links.website).hostname}</span>
                                    </a>
                                )}
                                <div className="flex items-center gap-3">
                                    {social_links.facebook && (
                                        <a href={social_links.facebook} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all hover:scale-110">
                                            <Facebook className="w-5 h-5 shadow-lg" />
                                        </a>
                                    )}
                                    {social_links.instagram && (
                                        <a href={social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 hover:opacity-90 text-white rounded-full transition-all hover:scale-110">
                                            <Instagram className="w-5 h-5 shadow-lg" />
                                        </a>
                                    )}
                                    {social_links.twitter && (
                                        <a href={social_links.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-full transition-all hover:scale-110">
                                            <Twitter className="w-5 h-5 shadow-lg" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="max-w-7xl mx-auto w-full px-4 py-12 space-y-20">
                {/* About & Gallery Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left: Biography */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="flex items-center gap-2 text-primary-500">
                            <ArrowRight className="w-5 h-5" />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">Biografía</h2>
                        </div>
                        <p className="text-gray-400 leading-relaxed text-lg italic whitespace-pre-wrap">
                            {promoter.description || "Esta promotora no ha proporcionado una descripción todavía."}
                        </p>
                    </div>

                    {/* Right: Photo Gallery */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 text-purple-500">
                            <ImageIcon className="w-5 h-5" />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">Galería</h2>
                        </div>

                        {promoter.gallery && promoter.gallery.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {promoter.gallery.map((img: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className="aspect-square rounded-2xl overflow-hidden bg-dark-900 border border-dark-800 shadow-xl group cursor-pointer relative"
                                        onClick={() => window.open(getImageUrl(img), '_blank')}
                                    >
                                        <img
                                            src={getImageUrl(img)}
                                            alt={`Gallery ${idx}`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-dark-900/50 rounded-3xl p-12 text-center border-2 border-dashed border-dark-800">
                                <ImageIcon className="w-12 h-12 text-dark-700 mx-auto mb-4" />
                                <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">Próximamente fotos de eventos</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Associated Events Section */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between border-b border-dark-800 pb-4">
                        <div className="flex items-center gap-2 text-red-500">
                            <Calendar className="w-6 h-6" />
                            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Eventos de {promoter.name}</h2>
                        </div>
                        <span className="bg-dark-800 px-4 py-1 rounded-full text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {events.length} {events.length === 1 ? 'Evento' : 'Eventos'}
                        </span>
                    </div>

                    {events.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {events.map((event: any) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-dark-900 rounded-3xl p-16 text-center shadow-2xl border border-dark-800">
                            <Calendar className="w-16 h-16 text-dark-700 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-white uppercase italic mb-2">Sin eventos programados</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">Esta promotora no tiene eventos públicos disponibles en este momento. ¡Vuelve pronto!</p>
                        </div>
                    )}
                </section>
            </div>

            <Footer />
        </div>
    );
}
