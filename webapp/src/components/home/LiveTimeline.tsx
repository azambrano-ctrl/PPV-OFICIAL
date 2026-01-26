'use client';

import { formatDate } from '@/lib/utils';
import { Clock, Zap } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    event_date: string;
    status: string;
}

interface TimelineProps {
    events: Event[];
}

export default function LiveTimeline({ events }: TimelineProps) {
    if (events.length === 0) return null;

    // Sort events by date
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    return (
        <div className="relative w-full py-12 px-6 bg-white/[0.01] backdrop-blur-3xl border-y border-white/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent animate-pulse" />

            <div className="container-custom">
                <div className="flex items-center gap-4 mb-10 text-center justify-center">
                    <Zap className="w-5 h-5 text-red-600 animate-bounce" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50">Live Combat Radar</h3>
                </div>

                <div className="relative flex items-center justify-between gap-8 overflow-x-auto pb-8 scrollbar-hide">
                    {/* Connecting Line */}
                    <div className="absolute top-[41px] left-0 w-full h-[1px] bg-white/10" />

                    {sortedEvents.map((event, index) => {
                        const isLive = event.status === 'live';
                        const date = new Date(event.event_date);

                        return (
                            <div key={event.id} className="relative flex flex-col items-center min-w-[200px] group">
                                {/* Time Marker */}
                                <div className={`w-3 h-3 rounded-full z-10 transition-all duration-500 border-2
                                    ${isLive ? 'bg-red-600 border-white scale-150 shadow-[0_0_20px_rgba(220,38,38,0.8)]' : 'bg-black border-white/30 group-hover:border-red-500'}
                                `} />

                                {/* Pulse for Live */}
                                {isLive && (
                                    <div className="absolute top-[37px] w-5 h-5 bg-red-600 rounded-full animate-ping opacity-30" />
                                )}

                                <div className="mt-8 text-center space-y-2 group-hover:-translate-y-2 transition-transform duration-500">
                                    <span className={`text-[10px] font-black uppercase tracking-widest block
                                        ${isLive ? 'text-red-500' : 'text-gray-500'}
                                    `}>
                                        {formatDate(event.event_date, 'H:mm')} • {formatDate(event.event_date, 'd MMM')}
                                    </span>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-tight line-clamp-2 max-w-[150px]">
                                        {event.title}
                                    </h4>
                                    {isLive && (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-red-600 text-[8px] font-black uppercase">
                                            LIVE NOW
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
}
