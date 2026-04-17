'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fightersAPI } from '@/lib/api';
import Footer from '@/components/Footer';
import Navbar from '@/components/ui/Navbar';
import { Search, User, Shield } from 'lucide-react';

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
    weight_class?: string;
}

const STYLES = ['Todos', 'MMA', 'Boxeo', 'Kickboxing', 'Muay Thai', 'BJJ', 'Lucha'];

export default function FightersDirectory() {
    const [fighters, setFighters] = useState<Fighter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [styleFilter, setStyleFilter] = useState('Todos');

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

    const filteredFighters = useMemo(() => {
        return fighters.filter(f => {
            const fullName = `${f.first_name} ${f.last_name} ${f.nickname || ''}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm.toLowerCase());
            const matchesStyle = styleFilter === 'Todos' || (f.base_style || '').toLowerCase().includes(styleFilter.toLowerCase());
            return matchesSearch && matchesStyle;
        });
    }, [fighters, searchTerm, styleFilter]);

    // Styles that actually exist in the data
    const availableStyles = useMemo(() => {
        const set = new Set(fighters.map(f => f.base_style).filter(Boolean));
        return STYLES.filter(s => s === 'Todos' || set.has(s) || set.size === 0);
    }, [fighters]);

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Navbar />

            {/* ── HEADER ── */}
            <div className="relative pt-32 pb-16 overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-dark-900" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-dark-900 to-dark-950" />
                {/* Hex grid decoration */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                {/* Red accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

                <div className="container-custom relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-500/30 px-4 py-1.5 rounded-full mb-6">
                        <Shield className="w-3.5 h-3.5 text-primary-400" />
                        <span className="text-xs font-black text-primary-400 uppercase tracking-widest">Directorio Oficial</span>
                    </div>

                    <h1 className="font-display font-black text-5xl md:text-7xl mb-4 tracking-tight uppercase">
                        Los <span className="gradient-text">Guerreros</span>
                    </h1>
                    <p className="text-lg text-dark-400 max-w-xl mx-auto mb-8">
                        Conoce a los atletas que suben al octágono en Arena Fight Pass
                    </p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 w-5 h-5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o apodo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-800 border-2 border-dark-700 text-white rounded-full py-4 pl-12 pr-6 focus:border-primary-500 focus:outline-none transition-all"
                        />
                    </div>

                    {/* Style filter chips */}
                    {!loading && fighters.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {availableStyles.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setStyleFilter(style)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        styleFilter === style
                                            ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-600/30'
                                            : 'bg-dark-800 text-dark-400 border-dark-700 hover:border-primary-500/40 hover:text-white'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    )}

                    <Link
                        href="/profile/fighter"
                        className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-medium px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full hover:bg-primary-500/20 transition-all"
                    >
                        <User className="w-4 h-4" />
                        ¿Eres Peleador? Reclama tu Perfil
                    </Link>
                </div>
            </div>

            {/* ── GRID ── */}
            <div className="flex-1 py-12">
                <div className="container-custom">

                    {/* Results count */}
                    {!loading && fighters.length > 0 && (
                        <p className="text-sm text-dark-500 mb-6 font-medium">
                            {filteredFighters.length} peleador{filteredFighters.length !== 1 ? 'es' : ''}
                            {styleFilter !== 'Todos' ? ` · ${styleFilter}` : ''}
                            {searchTerm ? ` · "${searchTerm}"` : ''}
                        </p>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="aspect-[3/4] rounded-xl bg-dark-800/60 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredFighters.length === 0 ? (
                        <div className="text-center py-24 max-w-md mx-auto">
                            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <User className="w-10 h-10 text-dark-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                                {fighters.length === 0 ? 'Aún no hay peleadores' : 'Sin resultados'}
                            </h3>
                            <p className="text-dark-400 mb-8">
                                {fighters.length === 0
                                    ? 'Si eres atleta profesional, reclama tu perfil para aparecer aquí.'
                                    : 'Intenta con otro nombre o cambia el filtro de estilo.'}
                            </p>
                            {fighters.length === 0 ? (
                                <Link href="/profile/fighter" className="btn btn-primary inline-flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Crear mi Ficha
                                </Link>
                            ) : (
                                <button onClick={() => { setSearchTerm(''); setStyleFilter('Todos'); }} className="btn btn-primary">
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {filteredFighters.map(fighter => (
                                <Link
                                    href={`/fighters/${fighter.slug}`}
                                    key={fighter.id}
                                    className="group relative rounded-2xl overflow-hidden bg-dark-900 border border-dark-800 hover:border-primary-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10"
                                >
                                    <div className="aspect-[3/4] bg-dark-800 relative">
                                        {fighter.profile_image_url ? (
                                            <Image
                                                src={fighter.profile_image_url}
                                                alt={`${fighter.first_name} ${fighter.last_name}`}
                                                fill
                                                className="object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-dark-800 to-primary-950/20">
                                                <User className="w-16 h-16 text-dark-600" />
                                            </div>
                                        )}
                                        {/* Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/30 to-transparent" />

                                        {/* Style badge top-right */}
                                        {fighter.base_style && (
                                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                                <span className="text-[9px] font-black text-primary-400 uppercase tracking-widest">{fighter.base_style}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        {fighter.nickname && (
                                            <p className="text-primary-400 font-display text-xs tracking-widest uppercase mb-0.5 truncate">
                                                "{fighter.nickname}"
                                            </p>
                                        )}
                                        <h2 className="text-base font-black text-white font-display leading-tight group-hover:text-primary-400 transition-colors line-clamp-2">
                                            {fighter.first_name} {fighter.last_name}
                                        </h2>

                                        {/* Record */}
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <span className="text-xs font-black text-green-400">{fighter.wins}V</span>
                                            <span className="text-dark-600 text-xs">·</span>
                                            <span className="text-xs font-black text-red-400">{fighter.losses}D</span>
                                            {fighter.draws > 0 && (
                                                <>
                                                    <span className="text-dark-600 text-xs">·</span>
                                                    <span className="text-xs font-bold text-dark-400">{fighter.draws}E</span>
                                                </>
                                            )}
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
