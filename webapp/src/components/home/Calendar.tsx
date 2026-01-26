'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    event_date: string;
    status: string;
}

interface CalendarProps {
    events: Event[];
}

export default function EventCalendar({ events }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    const getEventsForDay = (day: number) => {
        return events.filter(event => {
            const date = new Date(event.event_date);
            return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
        });
    };

    const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

    return (
        <div className="bg-dark-950/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-red-600/10 flex items-center justify-center border border-red-600/20">
                        <CalendarIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-display font-black text-white uppercase tracking-wider text-xs">Agenda</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{monthName} {year}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-7 gap-3 mb-6">
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
                        <div key={day} className="text-center text-[10px] font-black text-gray-600 tracking-widest">{day}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-3">
                    {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    {days.map(day => {
                        const dayEvents = getEventsForDay(day);
                        const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                        return (
                            <div
                                key={day}
                                className={`relative aspect-square rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center cursor-default group/day
                                    ${isToday ? 'border-red-600 bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10'}
                                    ${dayEvents.length > 0 && !isToday ? 'ring-1 ring-red-600/20' : ''}
                                `}
                            >
                                <span className={`text-xs font-black ${isToday ? 'text-white' : 'text-gray-400 group-hover/day:text-white transition-colors'}`}>{day}</span>
                                {dayEvents.length > 0 && (
                                    <div className="absolute bottom-2 flex gap-1">
                                        {dayEvents.map((_, i) => (
                                            <div key={i} className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]'}`}></div>
                                        ))}
                                    </div>
                                )}

                                {dayEvents.length > 0 && (
                                    <div className="absolute inset-0 z-30 pointer-events-none">
                                        <div className="hidden group-hover/day:block absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-dark-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] animate-fade-in">
                                            <div className="space-y-3">
                                                {dayEvents.map(event => (
                                                    <div key={event.id} className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-red-600 rounded-full"></div>
                                                            <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Main Event</span>
                                                        </div>
                                                        <p className="text-white text-[10px] leading-tight font-black uppercase tracking-tight">{event.title}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-dark-900/95"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
