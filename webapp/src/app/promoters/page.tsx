'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Globe, MapPin, Users, ArrowRight } from 'lucide-react';
import { promotersAPI } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Footer from '@/components/Footer';

export default function PromotersDirectoryPage() {
    const [promoters, setPromoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPromoters();
    }, []);

    const loadPromoters = async () => {
        try {
            const response = await promotersAPI.getAll();
            // Only show active promoters in the public directory
            setPromoters(response.data.data.filter((p: any) => p.status === 'active'));
        } catch (error) {
            console.error('Error loading promoters:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPromoters = promoters.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
                </div>

                <div className="container-custom relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-6">
                        Nuestras <span className="text-primary-500">Promotoras</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                        Descubre las organizaciones que hacen posible el crecimiento del MMA en Ecuador y Latinoamérica.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar promotora por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-800 rounded-2xl pl-14 pr-6 py-5 text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all shadow-2xl"
                        />
                    </div>
                </div>
            </section>

            {/* Promoters Grid */}
            <section className="container-custom py-12 flex-grow">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="spinner w-12 h-12" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando directorio...</p>
                    </div>
                ) : filteredPromoters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPromoters.map((promoter) => (
                            <Link
                                key={promoter.id}
                                href={`/promoter/${promoter.id}`}
                                className="group block h-full"
                            >
                                <div className="card h-full overflow-hidden flex flex-col border-dark-800 hover:border-primary-500/50 transition-all duration-300 hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-primary-500/10">
                                    {/* Banner */}
                                    <div className="h-32 relative bg-dark-800 overflow-hidden">
                                        {promoter.banner_url ? (
                                            <img
                                                src={getImageUrl(promoter.banner_url)}
                                                alt={promoter.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-dark-800 to-dark-900" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />

                                        {/* Logo Overlay */}
                                        <div className="absolute -bottom-6 left-6 w-20 h-20 bg-dark-900 rounded-2xl border-4 border-dark-950 overflow-hidden shadow-2xl">
                                            {promoter.logo_url ? (
                                                <img
                                                    src={getImageUrl(promoter.logo_url)}
                                                    alt="Logo"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary-500 font-bold text-2xl italic uppercase">
                                                    {promoter.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="pt-10 p-8 flex-grow flex flex-col items-start space-y-4">
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-primary-500 transition-colors">
                                            {promoter.name}
                                        </h3>

                                        <p className="text-gray-400 text-sm line-clamp-3 italic flex-grow">
                                            {promoter.description || "Esta promotora es parte de la red de Arena Fight Pass, llevando el deporte al siguiente nivel."}
                                        </p>

                                        <div className="w-full pt-4 flex items-center justify-between border-t border-dark-800">
                                            <div className="flex items-center gap-2 text-dark-400">
                                                <MapPin className="w-4 h-4 text-primary-500" />
                                                <span className="text-xs font-bold uppercase tracking-widest">{promoter.city || "Ecuador"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-primary-500 font-bold text-sm uppercase italic group-hover:gap-3 transition-all">
                                                Ver Perfil
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="card p-20 text-center bg-dark-900/50 border-dashed">
                        <Users className="w-16 h-16 text-dark-800 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-white uppercase italic mb-2">No se encontraron promotoras</h3>
                        <p className="text-gray-500">Intenta buscar con otro nombre o vuelve más tarde.</p>
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-dark-900/50 border-t border-dark-800">
                <div className="container-custom text-center">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">¿Quieres ser parte de nuestra red?</h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">Únete a Arena Fight Pass y lleva tus eventos de MMA a una audiencia global con la mejor tecnología de streaming.</p>
                    <Link href="/promoter/register" className="btn-primary inline-flex">
                        Registrar mi Promotora
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
