'use client';

import Link from 'next/link';
import { Play, ArrowRight, Zap, ChevronRight, Activity, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsAPI } from '@/lib/api';
import { settingsAPI } from '@/lib/api/settings';
import { formatDate, formatCurrency, getImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import AuthenticatedHome from '@/components/home/AuthenticatedHome';
import LiveTimeline from '@/components/home/LiveTimeline';
import BentoGrid from '@/components/home/BentoGrid';
import EventRow from '@/components/home/EventRow';

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
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [homepageBackground, setHomepageBackground] = useState<string | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const [allEventsRes, settingsRes] = await Promise.all([
                eventsAPI.getAll(),
                settingsAPI.getSettings(),
            ]);

            setAllEvents(allEventsRes.data.data);

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

    const featuredEvents = allEvents.filter(e => e.is_featured);
    const liveEvents = allEvents.filter(e => e.status === 'live');
    const upcomingEvents = allEvents.filter(e => e.status === 'upcoming' || e.status === 'reprise');
    const pastEvents = allEvents.filter(e => e.status === 'finished');

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
        <div className="min-h-screen bg-[#050505] text-white selection:bg-red-700/30">
            {/* Ultra-Modern Float Nav */}
            <nav className="fixed top-6 inset-x-0 z-50 flex justify-center px-4">
                <div className="max-w-5xl w-full bg-black/20 backdrop-blur-2xl border border-white/5 rounded-full px-8 py-3 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-12">
                        <Link href="/" className="text-xl font-black tracking-tighter italic">
                            ELITE<span className="text-red-600">ARENA</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8 text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
                            <Link href="/events" className="hover:text-white transition-colors">Combat</Link>
                            <Link href="/events" className="hover:text-white transition-colors">Radar</Link>
                            <Link href="/events" className="hover:text-white transition-colors">Vault</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login" className="hidden sm:block text-[9px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white transition-colors">Access</Link>
                        <Link href="/auth/register" className="bg-red-700 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(185,28,28,0.4)]">
                            Get Your Pass
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Immersive Hero Section */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                {/* Background Tech Mesh */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                {/* Masked Typography Hero */}
                <div className="relative z-10 text-center space-y-8 px-4 w-full">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-700/10 border border-red-700/20 text-red-600 animate-fade-in-down mb-4">
                        <Activity className="w-3 h-3 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Next Gen Streaming</span>
                    </div>

                    <div className="relative inline-block">
                        <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none italic pointer-events-none select-none opacity-10">
                            UNSTOPPABLE
                        </h1>
                        <h1 className="absolute inset-0 text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none italic bg-clip-text text-transparent bg-cover bg-center overflow-hidden"
                            style={{
                                backgroundImage: `url('https://assets.mixkit.co/videos/preview/mixkit-boxer-training-with-a-punching-bag-31657-large.mp4')`,
                                maskImage: 'linear-gradient(to bottom, black, black)',
                                WebkitBackgroundClip: 'text',
                            }}
                        >
                            <span className="relative">
                                {/* The text that masks the video */}
                                UNSTOPPABLE
                                {/* Secret Video playing inside text */}
                                <video autoPlay muted loop playsInline className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover -z-10">
                                    <source src="https://assets.mixkit.co/videos/preview/mixkit-boxer-training-with-a-punching-bag-31657-large.mp4" type="video/mp4" />
                                </video>
                            </span>
                        </h1>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-10">
                        <p className="text-sm md:text-lg text-white/40 font-bold uppercase tracking-[0.5em] leading-relaxed">
                            No limits. No delays. Just <span className="text-white">Pure Combat</span>.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
                            <Link href="/events" className="group flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-700 hover:text-white transition-all shadow-2xl">
                                Enter The Arena
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </Link>
                            <Link href="/auth/register" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors">
                                View TV Schedule
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute bottom-12 left-12 hidden lg:flex items-center gap-4 animate-fade-in delay-500">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-3xl">
                        <Zap className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 block mb-1">Status</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Network 100% Core</span>
                    </div>
                </div>
            </section>

            {/* Surprise Sections */}
            <div className="relative z-20 space-y-0">
                {/* 1. Radar Timeline (Futurist Calendar Replaced) */}
                <LiveTimeline events={allEvents} />

                {/* 2. Bento Highlights Grid */}
                <BentoGrid events={featuredEvents.length > 0 ? featuredEvents : allEvents} />

                {/* 3. Immersive Row for Live Content */}
                {liveEvents.length > 0 && (
                    <div className="py-12 bg-gradient-to-b from-transparent to-[#080808]">
                        <EventRow title="Pulse: Live Now" events={liveEvents} variant="large" />
                    </div>
                )}

                {/* 4. The Vault Section (Upcoming) */}
                <div className="bg-[#080808]">
                    <EventRow title="The Vault: Upcoming" events={upcomingEvents} />
                </div>

                {/* 5. Experience Section */}
                <section className="py-40 container-custom">
                    <div className="grid lg:grid-cols-3 gap-24">
                        <div className="space-y-6">
                            <div className="w-12 h-12 rounded-3xl bg-red-700/10 border border-red-700/20 flex items-center justify-center">
                                <Activity className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic italic">Ultra-Low Latency</h3>
                            <p className="text-gray-500 text-sm font-bold leading-relaxed uppercase tracking-tight">
                                Our proprietary engine delivers combat sports with sub-second delay, so you're always in the cage.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <div className="w-12 h-12 rounded-3xl bg-red-700/10 border border-red-700/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Ironclad Privacy</h3>
                            <p className="text-gray-500 text-sm font-bold leading-relaxed uppercase tracking-tight">
                                Your access is secured by military-grade encryption. Your data belongs to you, always.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <div className="w-12 h-12 rounded-3xl bg-red-700/10 border border-red-700/20 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Cross-Platform Sync</h3>
                            <p className="text-gray-500 text-sm font-bold leading-relaxed uppercase tracking-tight">
                                Start on your phone, finish on your 8K TV. Perfection isn't optional, it's our standard.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <Footer />

            {/* Global Smooth Grain Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] grayscale bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
}
