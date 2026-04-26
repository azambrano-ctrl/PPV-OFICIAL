'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fightersAPI } from '@/lib/api';
import Footer from '@/components/Footer';
import Navbar from '@/components/ui/Navbar';
import { Search, User } from 'lucide-react';

interface Fighter {
    id: string;
    first_name: string;
    last_name: string;
    nickname?: string;
    slug: string;
    wins: number;
    losses: number;
    draws: number;
    profile_image_url?: string;
    base_style?: string;
}

export default function FightersDirectory() {
    const [fighters, setFighters] = useState<Fighter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadFighters = async () => {
            try {
                const res = await fightersAPI.getAll();
                setFighters(res.data.data);
            } catch (error) {
                console.error('Failed to load fighters', error);
            } finally {
                setLoading(false);
            }
        };
        loadFighters();
    }, []);

    const filteredFighters = fighters.filter(f => {
        const fullName = `${f.first_name} ${f.last_name} ${f.nickname || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Navbar />

            {/* Header Banner */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-dark-900 border-b border-dark-800" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 to-transparent" />

                <div className="container-custom relative z-10 text-center">
                    <h1 className="font-display font-black text-5xl md:text-7xl mb-4 tracking-tight">
                        Directorio de <span className="gradient-text">Peleadores</span>
                    </h1>
                    <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-8 font-light">
                        Explora la base de datos de los atletas de Arena Fight Pass y sus historiales oficiales.
                    </p>

                    <div className="max-w-xl mx-auto relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar peleador por nombre o apodo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-800 border-2 border-dark-700 text-white rounded-full py-4 pl-12 pr-6 focus:border-primary-500 focus:outline-none transition-all outline-none"
                        />
                    </div>

                    <Link
                        href="/profile/fighter"
                        className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-medium tracking-wide items-center justify-center px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full hover:bg-primary-500/20 transition-all duration-300"
                    >
                        <User className="w-4 h-4" />
                        ¿Eres Peleador? Reclama tu Perfil Aquí
                    </Link>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 pb-24">
                <div className="container-custom">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="spinner w-8 h-8" />
                        </div>
                    ) : filteredFighters.length === 0 ? (
                        <div className="text-center py-20 card max-w-2xl mx-auto border-dashed border-2 border-dark-700">
                            <User className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Aún no hay peleadores registrados</h3>
                            <p className="text-dark-400 mb-8 max-w-md mx-auto">
                                El directorio público está vacío. Si eres un atleta profesional, puedes reclamar tu perfil y enviar tus estadísticas oficiales para aparecer aquí.
                            </p>
                            <Link href="/profile/fighter" className="btn btn-primary inline-flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Soy Peleador: Crear mi Ficha
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredFighters.map(fighter => (
                                <Link href={`/fighters/${fighter.slug}`} key={fighter.id} className="group relative rounded-xl overflow-hidden bg-dark-900 border border-dark-800 hover:border-primary-500/50 transition-all duration-300">
                                    <div className="aspect-[3/4] bg-dark-800 relative">
                                        {fighter.profile_image_url ? (
                                            <Image
                                                src={fighter.profile_image_url}
                                                alt={`${fighter.first_name} ${fighter.last_name}`}
                                                fill
                                                className="object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <User className="w-20 h-20 text-dark-600" />
                                            </div>
                                        )}
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        {fighter.nickname && (
                                            <p className="text-primary-400 font-display font-medium text-sm tracking-widest uppercase mb-1">
                                                "{fighter.nickname}"
                                            </p>
                                        )}
                                        <h2 className="text-2xl font-bold text-white font-display mb-2 group-hover:text-primary-400 transition-colors">
                                            {fighter.first_name} {fighter.last_name}
                                        </h2>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-dark-300 bg-dark-800/80 px-2 py-1 rounded">
                                                {fighter.base_style || 'MMA'}
                                            </span>
                                            <span className="font-mono font-bold text-white">
                                                <span className="text-green-500">{fighter.wins}</span> - <span className="text-red-500">{fighter.losses}</span> - {fighter.draws}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
