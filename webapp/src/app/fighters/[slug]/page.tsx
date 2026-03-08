'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fightersAPI } from '@/lib/api';
import Footer from '@/components/Footer';
import Navbar from '@/components/ui/Navbar';
import { ArrowLeft, MapPin, Calendar, Ruler, Scale, Dumbbell, Activity, Shield, Trophy, Play } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function FighterHub() {
    const params = useParams();
    const router = useRouter();
    const [fighter, setFighter] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFighter = async () => {
            try {
                const slug = params.slug as string;
                if (!slug) return;

                const res = await fightersAPI.getBySlug(slug);
                if (res.data.success && res.data.data) {
                    setFighter(res.data.data);
                } else {
                    router.push('/fighters');
                }
            } catch (error) {
                console.error(error);
                router.push('/fighters');
            } finally {
                setLoading(false);
            }
        };
        loadFighter();
    }, [params.slug, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="spinner w-8 h-8" />
            </div>
        );
    }

    if (!fighter) return null;

    const totalFights = fighter.wins + fighter.losses + fighter.draws;
    const koPercentage = fighter.wins > 0 ? Math.round((fighter.kos / fighter.wins) * 100) : 0;
    const subPercentage = fighter.wins > 0 ? Math.round((fighter.submissions / fighter.wins) * 100) : 0;
    const decPercentage = 100 - koPercentage - subPercentage;

    return (
        <div className="min-h-screen flex flex-col bg-dark-950 text-white selection:bg-primary-500/30">
            <Navbar />

            {/* Hero / Banner Section */}
            <div className="relative pt-24 lg:pt-32 pb-12 lg:pb-0 overflow-hidden min-h-[500px] flex items-end">
                {/* Background Banner */}
                {fighter.banner_image_url ? (
                    <div className="absolute inset-0 z-0 opacity-40">
                        <Image src={fighter.banner_image_url} alt="Banner" fill className="object-cover" />
                    </div>
                ) : (
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-dark-900 to-dark-950" />
                )}

                {/* Overlays */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-dark-950 via-dark-950/80 to-transparent" />

                <div className="container-custom relative z-20 w-full">
                    <div className="flex flex-col lg:flex-row items-end gap-8 pb-8">

                        {/* Avatar */}
                        <div className="relative w-48 h-64 lg:w-64 lg:h-80 flex-shrink-0 -mb-4 lg:-mb-12 overflow-hidden rounded-t-2xl border-b-4 border-primary-500 bg-dark-800 shadow-2xl">
                            {fighter.profile_image_url ? (
                                <Image
                                    src={fighter.profile_image_url}
                                    alt={`${fighter.first_name} ${fighter.last_name}`}
                                    fill
                                    className="object-cover object-top"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Shield className="w-24 h-24 text-dark-600" />
                                </div>
                            )}
                            <div className="absolute inset-0 shadow-[inset_0_-40px_40px_rgba(0,0,0,0.8)]" />
                        </div>

                        {/* Title Info */}
                        <div className="flex-1 pb-4">
                            <Link href="/fighters" className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium mb-4 transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Directorio de Peleadores
                            </Link>

                            {fighter.nickname && (
                                <h3 className="text-primary-500 font-display font-medium text-xl md:text-2xl tracking-[0.2em] uppercase mb-1">
                                    "{fighter.nickname}"
                                </h3>
                            )}
                            <h1 className="font-display font-black text-5xl md:text-7xl mb-4 leading-none uppercase">
                                {fighter.first_name} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">
                                    {fighter.last_name}
                                </span>
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                <span className="px-3 py-1 bg-dark-800 rounded text-dark-200 border border-dark-700">
                                    {fighter.base_style || 'MMA'}
                                </span>
                                {(fighter.city || fighter.country) && (
                                    <span className="flex items-center text-dark-300">
                                        <MapPin className="w-4 h-4 mr-1 text-primary-500" />
                                        {fighter.city}{fighter.city && fighter.country ? ', ' : ''}{fighter.country}
                                    </span>
                                )}
                                {fighter.team_association && (
                                    <span className="flex items-center text-dark-300">
                                        <Shield className="w-4 h-4 mr-1 text-primary-500" />
                                        {fighter.team_association}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Big Record Badge */}
                        <div className="hidden lg:flex flex-col items-end pb-4">
                            <div className="text-right">
                                <p className="text-dark-400 font-medium uppercase tracking-wider mb-1">
                                    {fighter.is_amateur ? 'Récord Amateur' : 'Récord Profesional'}
                                </p>
                                <div className="font-mono text-5xl font-black">
                                    <span className="text-green-500">{fighter.wins}</span>-
                                    <span className="text-red-500">{fighter.losses}</span>-
                                    <span className="text-gray-500">{fighter.draws}</span>
                                </div>
                                <p className="text-dark-500 mt-2">{totalFights} Combates en Total</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 bg-dark-950 py-12 lg:pt-20">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* Left Column: Physical Stats */}
                        <div className="space-y-6">
                            <div className="card p-8 border border-dark-800 bg-dark-900/50">
                                <h3 className="font-display font-bold text-xl uppercase tracking-widest text-dark-300 mb-6 border-b border-dark-800 pb-4">
                                    Atributos Físicos
                                </h3>

                                <ul className="space-y-6 font-mono">
                                    <li>
                                        <p className="text-dark-500 text-xs mb-1 uppercase tracking-wider">Altura</p>
                                        <div className="flex items-center text-lg">
                                            <Ruler className="w-5 h-5 mr-3 text-primary-500" />
                                            {fighter.height_cm ? `${fighter.height_cm} cm` : 'No registrado'}
                                        </div>
                                    </li>
                                    <li>
                                        <p className="text-dark-500 text-xs mb-1 uppercase tracking-wider">Peso</p>
                                        <div className="flex items-center text-lg">
                                            <Scale className="w-5 h-5 mr-3 text-primary-500" />
                                            {fighter.weight_kg ? `${fighter.weight_kg} kg` : 'No registrado'}
                                        </div>
                                    </li>
                                    <li>
                                        <p className="text-dark-500 text-xs mb-1 uppercase tracking-wider">Alcance</p>
                                        <div className="flex items-center text-lg">
                                            <Activity className="w-5 h-5 mr-3 text-primary-500" />
                                            {fighter.reach_cm ? `${fighter.reach_cm} cm` : 'No registrado'}
                                        </div>
                                    </li>
                                    <li>
                                        <p className="text-dark-500 text-xs mb-1 uppercase tracking-wider">Guardia (Stance)</p>
                                        <div className="flex items-center text-lg">
                                            <Dumbbell className="w-5 h-5 mr-3 text-primary-500" />
                                            {fighter.stance || 'No registrado'}
                                        </div>
                                    </li>
                                    <li>
                                        <p className="text-dark-500 text-xs mb-1 uppercase tracking-wider">Nacimiento</p>
                                        <div className="flex items-center text-lg">
                                            <Calendar className="w-5 h-5 mr-3 text-primary-500" />
                                            {fighter.date_of_birth ? formatDate(fighter.date_of_birth, 'PP') : 'No registrado'}
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Titles Section */}
                            {fighter.titles && (
                                <div className="card p-8 border border-yellow-500/20 bg-dark-900/50">
                                    <div className="flex items-center gap-3 mb-6 border-b border-dark-800 pb-4">
                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                        <h3 className="font-display font-bold text-xl uppercase tracking-widest text-dark-300">
                                            Campeonatos
                                        </h3>
                                    </div>
                                    <p className="text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                                        {fighter.titles}
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Middle & Right Column: Fight Stats */}
                        <div className="lg:col-span-2 space-y-8">

                            <div className="card p-6 border-primary-500/20 lg:hidden text-center">
                                <p className="text-dark-400 font-medium uppercase tracking-wider mb-2">
                                    {fighter.is_amateur ? 'Récord Amateur' : 'Récord Profesional'}
                                </p>
                                <div className="font-mono text-4xl font-black">
                                    <span className="text-green-500">{fighter.wins}</span>-
                                    <span className="text-red-500">{fighter.losses}</span>-
                                    <span className="text-gray-500">{fighter.draws}</span>
                                </div>
                            </div>

                            {/* Win breakdown */}
                            <div className="card p-8 border border-dark-800 bg-dark-900/50">
                                <div className="flex items-center gap-4 mb-8 border-b border-dark-800 pb-4">
                                    <Trophy className="w-6 h-6 text-primary-500" />
                                    <h3 className="font-display font-bold text-2xl uppercase tracking-widest text-white">
                                        Desglose de Victorias
                                    </h3>
                                </div>

                                {fighter.wins === 0 ? (
                                    <p className="text-dark-400">Sin victorias registradas o desglose de datos.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {/* KO/TKO */}
                                        <div>
                                            <div className="flex justify-between text-sm mb-2 font-medium">
                                                <span className="uppercase text-dark-200">K.O. / T.K.O. ({fighter.kos})</span>
                                                <span className="text-primary-400">{koPercentage}%</span>
                                            </div>
                                            <div className="w-full bg-dark-800 rounded-full h-3">
                                                <div className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all duration-1000" style={{ width: `${koPercentage}%` }} />
                                            </div>
                                        </div>

                                        {/* Submission */}
                                        <div>
                                            <div className="flex justify-between text-sm mb-2 font-medium">
                                                <span className="uppercase text-dark-200">Sumisión ({fighter.submissions})</span>
                                                <span className="text-primary-400">{subPercentage}%</span>
                                            </div>
                                            <div className="w-full bg-dark-800 rounded-full h-3">
                                                <div className="bg-gradient-to-r from-primary-600 to-primary-400 h-3 rounded-full transition-all duration-1000" style={{ width: `${subPercentage}%` }} />
                                            </div>
                                        </div>

                                        {/* Decision */}
                                        <div>
                                            <div className="flex justify-between text-sm mb-2 font-medium">
                                                <span className="uppercase text-dark-200">Decisión ({fighter.wins - fighter.kos - fighter.submissions})</span>
                                                <span className="text-primary-400">{decPercentage}%</span>
                                            </div>
                                            <div className="w-full bg-dark-800 rounded-full h-3">
                                                <div className="bg-dark-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${decPercentage}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bóveda de Peleas (Promotional Hook) */}
                            <div className="card p-8 border border-primary-500/20 bg-gradient-to-br from-dark-900 to-primary-950/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Play className="w-32 h-32" />
                                </div>
                                <h3 className="font-display font-bold text-2xl uppercase tracking-widest text-white mb-4 relative z-10">
                                    Arena Bóveda
                                </h3>
                                <p className="text-dark-300 max-w-lg mb-6 relative z-10">
                                    Revive todos los combates históricos de {fighter.last_name} dentro del octágono de Arena Fight Pass.
                                </p>
                                <Link href="/events" className="btn btn-primary relative z-10">
                                    Explorar Eventos Pasados
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
