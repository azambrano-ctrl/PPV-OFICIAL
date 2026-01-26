'use client';

import Link from 'next/link';
import { Play, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRef } from 'react';
import { getImageUrl, formatCurrency, formatDate, getEventStatusColor, getEventStatusText } from '@/lib/utils';

interface Event {
    id: string;
    title: string;
    event_date: string;
    price: number;
    currency: string;
    thumbnail_url?: string;
    status: string;
}

interface EventRowProps {
    title: string;
    events: Event[];
    variant?: 'default' | 'large';
}

export default function EventRow({ title, events, variant = 'default' }: EventRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (events.length === 0) return null;

    return (
        <section className="py-8 group/row">
            <div className="container-custom flex items-center justify-between mb-4">
                <h2 className="font-display text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                    {title}
                </h2>
                <div className="flex gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <button
                        onClick={() => scroll('left')}
                        className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/10"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/10"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide px-[clamp(1rem,5vw,2rem)] overflow-y-hidden"
                style={{ scrollSnapType: 'x mandatory' }}
            >
                {events.map((event) => (
                    <Link
                        key={event.id}
                        href={`/event/${event.id}`}
                        className={`flex-shrink-0 relative group overflow-hidden bg-dark-950 border border-white/5 transition-all duration-300 scroll-snap-align-start
                            ${variant === 'large' ? 'w-[300px] md:w-[450px]' : 'w-[240px] md:w-[320px]'}
                        `}
                    >
                        {/* Thumbnail */}
                        <div className={`relative w-full aspect-video overflow-hidden`}>
                            {event.thumbnail_url ? (
                                <img
                                    src={getImageUrl(event.thumbnail_url)}
                                    alt={event.title}
                                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-full h-full bg-dark-900 flex items-center justify-center">
                                    <Play className="w-12 h-12 text-white/20" />
                                </div>
                            )}

                            {/* Static Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                            {/* Play Hover Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-red-600 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                                    <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-white ml-1" />
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-3 left-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${getEventStatusColor(event.status)}`}>
                                    {getEventStatusText(event.status)}
                                </span>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="p-4 border-t border-white/5">
                            <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-tight line-clamp-1 group-hover:text-red-500 transition-colors">
                                {event.title}
                            </h3>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    {formatDate(event.event_date, 'd MMM')} • {formatDate(event.event_date, 'H:mm')}
                                </span>
                                <span className="text-sm font-black text-red-600">
                                    {formatCurrency(event.price, event.currency)}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
