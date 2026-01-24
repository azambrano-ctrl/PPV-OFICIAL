'use client';

import Link from 'next/link';
import { ArrowRight, Globe, Trophy, Zap } from 'lucide-react';

import { useState, useEffect } from 'react';
import { settingsAPI } from '@/lib/api';

export default function AboutPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await settingsAPI.get();
                setSettings(data.data);
            } catch (error) {
                console.error('Failed to load settings', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    // Default values if API data is missing
    const heroTitle = settings?.about_hero_title || 'Llevando el MMA';
    const heroSubtitle = settings?.about_hero_subtitle || 'Ecuatoriano al Mundo';
    const missionTitle = settings?.about_mission_title || 'Nuestra Misión';
    const missionText = settings?.about_mission_text || 'Nacimos con un objetivo claro: romper las barreras que limitan a nuestros atletas. Ecuador es tierra de guerreros, pero el talento necesita visibilidad para brillar.';

    // Parse values if they are stored as JSON string, or use default array
    let missionValues = [];
    try {
        missionValues = settings?.about_values ? (typeof settings.about_values === 'string' ? JSON.parse(settings.about_values) : settings.about_values) : [];
    } catch (e) {
        console.warn('Error parsing about_values', e);
    }

    if (missionValues.length === 0) {
        missionValues = [
            { title: "Energía Pura", description: "Capturamos la adrenalina del octágono. Transmisiones fluidas y de alta definición.", icon: "Zap" },
            { title: "Proyección Global", description: "El talento ecuatoriano no tiene fronteras. Nuestra tecnología conecta con el mundo.", icon: "Globe" },
            { title: "Excelencia", description: "Comprometidos con elevar el estándar de los eventos deportivos.", icon: "Trophy" }
        ];
    }

    // Helper to get Icon component
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Zap': return <Zap className="w-7 h-7 text-primary-500 group-hover:text-white" />;
            case 'Globe': return <Globe className="w-7 h-7 text-primary-500 group-hover:text-white" />;
            case 'Trophy': return <Trophy className="w-7 h-7 text-primary-500 group-hover:text-white" />;
            default: return <Zap className="w-7 h-7 text-primary-500 group-hover:text-white" />;
        }
    };

    return (
        <div className="min-h-screen bg-dark-950 text-white pt-20">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-dark-900/50 to-dark-950 z-10"></div>
                {/* Background placeholder - in production this would be a high quality MMA image */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>

                <div className="container-custom relative z-20 text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
                        <span className="block text-white">{heroTitle}</span>
                        <span className="gradient-text">{heroSubtitle}</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-dark-200 max-w-3xl mx-auto font-light">
                        La plataforma definitiva para descubrir, apoyar y vivir la pasión de las artes marciales mixtas en Ecuador.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 bg-dark-900">
                <div className="container-custom">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold font-display">
                                <span className="text-primary-500">{missionTitle}</span>
                            </h2>
                            <div className="text-dark-200 text-lg leading-relaxed whitespace-pre-line">
                                {missionText}
                            </div>
                            <div className="flex items-center space-x-4 pt-4">
                                <div className="h-1 w-20 bg-primary-600 rounded"></div>
                                <span className="text-sm font-semibold tracking-widest uppercase text-dark-400">Desde Ecuador para el mundo</span>
                            </div>
                        </div>
                        <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl shadow-primary-900/20 border border-dark-700 group">
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent z-10"></div>
                            <img
                                src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1000&auto=format&fit=crop"
                                alt="MMA Training"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute bottom-6 left-6 z-20">
                                <p className="font-bold text-white text-xl">Pasión y Disciplina</p>
                                <p className="text-primary-400">El camino del guerrero</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-24 bg-dark-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-dark-900 via-dark-950 to-dark-950">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo Que Nos Define</h2>
                        <p className="text-dark-300">Valores que impulsan cada transmisión</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {missionValues.map((val: any, idx: number) => (
                            <div key={idx} className="bg-dark-900/50 p-8 rounded-2xl border border-dark-800 hover:border-primary-500/50 transition-colors group">
                                <div className="w-14 h-14 bg-dark-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors">
                                    {getIcon(val.icon)}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{val.title}</h3>
                                <p className="text-dark-300">
                                    {val.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-900/10"></div>
                <div className="container-custom relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">¿Listo para la Acción?</h2>
                    <p className="text-xl text-dark-200 mb-10 max-w-2xl mx-auto">
                        No te quedes fuera. Únete a la comunidad de MMA más grande del país y vive los mejores combates en vivo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/auth/register"
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                        >
                            Registrarse Ahora <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/events"
                            className="bg-dark-800 hover:bg-dark-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all border border-dark-700"
                        >
                            Ver Próximos Eventos
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
