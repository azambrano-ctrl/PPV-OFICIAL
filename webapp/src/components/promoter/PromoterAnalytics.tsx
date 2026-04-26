'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { promotersAPI, handleAPIError } from '@/lib/api';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

interface StatsData {
    summary: { total_sales: string; total_revenue: string | number };
    events: Array<{ id: string; title: string; event_date: string; sales_count: string; revenue: string | number }>;
    daily_chart: Array<{ date: string; count: string; amount: string }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-dark-900 border border-dark-700 rounded-2xl p-4 shadow-2xl">
                <p className="text-gray-400 text-[10px] uppercase font-bold mb-2">{label?.split('-').slice(1).reverse().join('/')}</p>
                <p className="text-white font-black italic text-lg">{formatCurrency(Number(payload[0].value))}</p>
                {payload[1] && <p className="text-primary-400 text-xs font-bold">{payload[1].value} ventas</p>}
            </div>
        );
    }
    return null;
};

export default function PromoterAnalytics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatsData | null>(null);

    useEffect(() => {
        promotersAPI.getStats()
            .then(r => setStats(r.data.data))
            .catch(e => toast.error(handleAPIError(e)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    if (!stats) return null;

    const totalRevenue = Number(stats.summary.total_revenue);
    const totalSales = Number(stats.summary.total_sales);
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const topEvent = [...stats.events].sort((a, b) => Number(b.revenue) - Number(a.revenue))[0];

    const summaryCards = [
        {
            label: 'Ganancias Totales',
            value: formatCurrency(totalRevenue),
            icon: <DollarSign className="w-6 h-6" />,
            gradient: 'from-primary-600/20 to-primary-900/10',
            iconColor: 'text-primary-400',
            iconBg: 'bg-primary-500/10',
        },
        {
            label: 'Entradas Vendidas',
            value: totalSales.toString(),
            icon: <ShoppingCart className="w-6 h-6" />,
            gradient: 'from-blue-600/20 to-blue-900/10',
            iconColor: 'text-blue-400',
            iconBg: 'bg-blue-500/10',
        },
        {
            label: 'Eventos Realizados',
            value: stats.events.length.toString(),
            icon: <Calendar className="w-6 h-6" />,
            gradient: 'from-purple-600/20 to-purple-900/10',
            iconColor: 'text-purple-400',
            iconBg: 'bg-purple-500/10',
        },
        {
            label: 'Ticket Promedio',
            value: formatCurrency(avgTicket),
            icon: <TrendingUp className="w-6 h-6" />,
            gradient: 'from-green-600/20 to-green-900/10',
            iconColor: 'text-green-400',
            iconBg: 'bg-green-500/10',
        },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">Resumen</p>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                    Tus <span className="text-primary-500">Números</span>
                </h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                    <div key={card.label} className={`bg-gradient-to-br ${card.gradient} border border-dark-800 rounded-3xl p-5 space-y-4`}>
                        <div className={`w-11 h-11 ${card.iconBg} rounded-2xl flex items-center justify-center ${card.iconColor}`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                            <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter mt-1">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Event */}
            {topEvent && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-3xl p-6 flex items-center gap-5">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest mb-1">Mejor Evento</p>
                        <h4 className="text-white font-black italic uppercase text-lg truncate">{topEvent.title}</h4>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-yellow-400 font-black italic text-xl">{formatCurrency(Number(topEvent.revenue))}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{topEvent.sales_count} ventas</p>
                    </div>
                </div>
            )}

            {/* Chart + Event Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart */}
                <div className="lg:col-span-2 bg-dark-900/50 border border-dark-800 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="text-white font-black italic uppercase leading-tight">Ventas por Día</h4>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Últimos 30 días</p>
                        </div>
                        <div className="flex items-center gap-2 text-primary-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-bold">Ingresos</span>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.daily_chart}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="date" stroke="#374151" fontSize={10} tickFormatter={(v) => v.split('-').slice(1).reverse().join('/')} />
                                <YAxis stroke="#374151" fontSize={10} tickFormatter={(v) => `$${v}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#ef4444', strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Event Breakdown */}
                <div className="bg-dark-900/50 border border-dark-800 rounded-3xl p-6 flex flex-col">
                    <h4 className="text-white font-black italic uppercase leading-tight mb-5">Por Evento</h4>
                    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                        {stats.events.length === 0 && (
                            <p className="text-gray-600 text-sm text-center py-8">Sin eventos aún</p>
                        )}
                        {stats.events.map((event, i) => {
                            const pct = totalRevenue > 0 ? (Number(event.revenue) / totalRevenue) * 100 : 0;
                            return (
                                <div key={event.id} className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-bold truncate">{event.title}</p>
                                            <p className="text-gray-600 text-[10px] uppercase font-bold">{new Date(event.event_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-white font-black italic text-sm">{formatCurrency(Number(event.revenue))}</p>
                                            <p className="text-primary-500 text-[10px] font-bold">{event.sales_count} ventas</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
