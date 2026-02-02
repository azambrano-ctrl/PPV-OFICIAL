'use client';

import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { promotersAPI, handleAPIError } from '@/lib/api';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

interface StatsData {
    summary: {
        total_sales: string;
        total_revenue: string | number;
    };
    events: Array<{
        id: string;
        title: string;
        event_date: string;
        sales_count: string;
        revenue: string | number;
    }>;
    daily_chart: Array<{
        date: string;
        count: string;
        amount: string;
    }>;
}

export default function PromoterAnalytics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatsData | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await promotersAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Error loading stats:', error);
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card-premium p-6 overflow-hidden relative group">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ganancias Totales</p>
                            <h3 className="text-4xl font-black text-white italic tracking-tighter">
                                {formatCurrency(totalRevenue)}
                            </h3>
                        </div>
                        <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <DollarSign className="w-7 h-7 text-primary-500" />
                        </div>
                    </div>
                </div>

                <div className="card-premium p-6 overflow-hidden relative group">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entradas Vendidas</p>
                            <h3 className="text-4xl font-black text-white italic tracking-tighter">
                                {totalSales}
                            </h3>
                        </div>
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <ShoppingCart className="w-7 h-7 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="card-premium p-6 overflow-hidden relative group">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Eventos Realizados</p>
                            <h3 className="text-4xl font-black text-white italic tracking-tighter">
                                {stats.events.length}
                            </h3>
                        </div>
                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Calendar className="w-7 h-7 text-purple-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Sales Chart */}
                <div className="lg:col-span-2 card bg-dark-900/50 p-6 rounded-3xl border border-dark-800">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-white font-black italic uppercase text-lg leading-tight">Ventas por Día</h4>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Últimos 30 días</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                    </div>

                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.daily_chart}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#4b5563"
                                    fontSize={10}
                                    tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                                />
                                <YAxis stroke="#4b5563" fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                                    itemStyle={{ color: '#ffffff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Event Breakdown */}
                <div className="lg:col-span-1 space-y-4">
                    <h4 className="text-white font-black italic uppercase text-lg leading-tight px-2">Desglose por Evento</h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                        {stats.events.map((event) => (
                            <div key={event.id} className="bg-dark-900/80 border border-dark-800 p-4 rounded-2xl flex items-center justify-between hover:border-primary-500/50 transition-colors">
                                <div className="min-w-0">
                                    <h5 className="text-white font-bold truncate text-sm">{event.title}</h5>
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                                        {new Date(event.event_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-black italic">{formatCurrency(Number(event.revenue))}</p>
                                    <p className="text-[10px] text-primary-500 font-bold uppercase">{event.sales_count} ventas</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

