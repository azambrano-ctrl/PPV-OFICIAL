'use client';

import Link from 'next/link';
import { Play, TrendingUp, Star, ShieldCheck } from 'lucide-react';
import { getImageUrl, formatCurrency } from '@/lib/utils';

interface Event {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    price: number;
    currency: string;
    status: string;
}

interface BentoGridProps {
    events: Event[];
}

export default function BentoGrid({ events }: BentoGridProps) {
    if (events.length === 0) return null;

    // We only need the first 4 for the bento layout
    const displayEvents = events.slice(0, 4);

    return (
        <section className="py-24 container-custom">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-[2px] bg-red-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600">Featured</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">
                        ELITE <span className="text-white/20">SELECTION</span>
                    </h2>
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-tight max-w-sm text-sm">
                    Hand-picked premium combat events. The highest level of athleticism meets the most immersive technology.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[700px]">
                {/* Main Featured (Large) */}
                {displayEvents[0] && (
                    <Link
                        href={`/event/${displayEvents[0].id}`}
                        className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-3xl bg-dark-950 border border-white/5"
                    >
                        <img
                            src={getImageUrl(displayEvents[0].thumbnail_url)}
                            alt={displayEvents[0].title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        <div className="absolute bottom-8 left-8 right-8 space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                <TrendingUp className="w-3 h-3 text-red-500" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white">Top Headliner</span>
                            </div>
                            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">
                                {displayEvents[0].title}
                            </h3>
                            <div className="flex items-center gap-6 pt-4">
                                <span className="text-2xl font-black text-red-600">{formatCurrency(displayEvents[0].price, displayEvents[0].currency)}</span>
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-black px-6 py-3 rounded-full group-hover:bg-red-600 group-hover:text-white transition-colors">
                                    <Play className="w-4 h-4 fill-current" />
                                    Watch Live
                                </div>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Second Medium */}
                {displayEvents[1] && (
                    <Link
                        href={`/event/${displayEvents[1].id}`}
                        className="md:col-span-2 md:row-span-1 relative group overflow-hidden rounded-3xl bg-dark-950 border border-white/5"
                    >
                        <img
                            src={getImageUrl(displayEvents[1].thumbnail_url)}
                            alt={displayEvents[1].title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-all rounded-3xl" />

                        <div className="relative h-full flex flex-col justify-center p-8 space-y-3">
                            <div className="inline-flex items-center gap-2 text-red-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Co-Main Card</span>
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">{displayEvents[1].title}</h3>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">Experience it in 4K HDR</span>
                        </div>
                    </Link>
                )}

                {/* Third Small */}
                {displayEvents[2] && (
                    <Link
                        href={`/event/${displayEvents[2].id}`}
                        className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl bg-dark-950/20 backdrop-blur-3xl border border-white/5 p-6 flex flex-col justify-between"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-red-600/20 group-hover:border-red-600/30 transition-all">
                            <ShieldCheck className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight italic mb-2 line-clamp-2">{displayEvents[2].title}</h3>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Guaranteed Access</span>
                        </div>
                    </Link>
                )}

                {/* Fourth Small */}
                {displayEvents[3] && (
                    <Link
                        href={`/event/${displayEvents[3].id}`}
                        className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl bg-red-700 p-6 flex flex-col justify-between group"
                    >
                        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
                            <img src={getImageUrl(displayEvents[3].thumbnail_url)} className="w-full h-full object-cover grayscale" />
                        </div>
                        <div className="relative z-10 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                            <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div className="relative z-10 text-white">
                            <h3 className="text-lg font-black uppercase tracking-tight italic mb-1 line-clamp-2">{displayEvents[3].title}</h3>
                            <span className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-70">Coming Next</span>
                        </div>
                    </Link>
                )}
            </div>
        </section>
    );
}
