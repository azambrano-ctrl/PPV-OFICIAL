'use client';

import Link from 'next/link';
import { Calendar, Clock, Play, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { formatDate, formatCurrency, getEventStatusColor, getEventStatusText, getImageUrl } from '@/lib/utils';
import { useLanguage } from '@/components/providers/LanguageProvider';


interface EventCardProps {
    event: {
        id: string;
        title: string;
        description?: string;
        event_date: string;
        price: number | string;
        currency: string;
        thumbnail_url?: string;
        status: string;
        is_featured?: boolean;
        promoter_id?: string;
        promoter_name?: string;
        promoter_logo_url?: string;
    };
    isPurchased?: boolean;
}

export default function EventCard({ event, isPurchased = false }: EventCardProps) {
    const { t } = useLanguage();
    const isFree = parseFloat(String(event.price)) === 0;


    return (
        <div className="group relative overflow-hidden bg-dark-900/50 border border-dark-800 hover:border-primary-500/50 transition-all duration-500 rounded-3xl flex flex-col h-full shadow-lg hover:shadow-primary-500/10">
            {/* Image Section */}
            <div className="relative h-56 bg-dark-800 overflow-hidden">
                {event.thumbnail_url ? (
                    <img
                        src={getImageUrl(event.thumbnail_url)}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-900 to-primary-950/20">
                        <Play className="w-16 h-16 text-dark-700" />
                    </div>
                )}

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className={`badge ${getEventStatusColor(event.status)} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg`}>
                        {event.status === 'reprise' && isFree ? t('landing.hero.free_pass') : getEventStatusText(event.status)}
                    </span>

                    {event.is_featured && (
                        <span className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Destaque
                        </span>
                    )}

                    {isPurchased && (
                        <span className="badge bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            COMPRADO
                        </span>
                    )}
                </div>

                {/* Promoter Logo Overlay */}
                {event.promoter_logo_url && (
                    <Link
                        href={`/promoter/${event.promoter_id}`}
                        className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-dark-900 border border-white/10 overflow-hidden shadow-xl hover:scale-110 transition-transform z-10 block"
                        title={event.promoter_name}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={getImageUrl(event.promoter_logo_url)}
                            alt={event.promoter_name}
                            className="w-full h-full object-cover"
                        />
                    </Link>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <Link
                        href={`/event/${event.id}`}
                        className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-primary-500 transition-colors"
                    >
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </Link>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-1 gap-4">
                <div className="space-y-2">
                    {/* Promoter Name */}
                    {event.promoter_name && (
                        <Link
                            href={`/promoter/${event.promoter_id}`}
                            className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                        >
                            <ShieldCheck className="w-3 h-3" />
                            {event.promoter_name}
                        </Link>
                    )}

                    <Link href={`/event/${event.id}`}>
                        <h3 className="font-black text-xl text-white uppercase italic tracking-tight group-hover:text-primary-400 transition-colors line-clamp-2 leading-tight">
                            {event.title}
                        </h3>
                    </Link>
                </div>

                <div className="space-y-1.5 mt-auto">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5 text-primary-500" />
                        <span>{formatDate(event.event_date, 'PP')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5 text-primary-500" />
                        <span>{formatDate(event.event_date, 'p')}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dark-800">
                    <span className="text-2xl font-black bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent uppercase tracking-tighter">
                        {isFree ? t('landing.hero.free_pass') : formatCurrency(Number(event.price), event.currency)}
                    </span>

                    <Link
                        href={`/event/${event.id}`}
                        className="p-2 bg-dark-800 hover:bg-primary-600 text-gray-400 hover:text-white rounded-xl transition-all hover:translate-x-1"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
