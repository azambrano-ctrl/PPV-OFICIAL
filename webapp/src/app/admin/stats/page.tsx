'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Eye, Calendar, BarChart3 } from 'lucide-react';
import { adminAPI, handleAPIError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ChartData {
    month: string;
    total?: string;
    count?: string;
}

export default function AdminStatsPage() {
    const [stats, setStats] = useState<any>({
        totalEvents: 0,
        totalUsers: 0,
        totalRevenue: 0,
        activeStreams: 0,
        eventsThisMonth: 0,
        newUsersThisMonth: 0,
        charts: {
            revenue: [],
            users: []
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await adminAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Error loading stats:', error);
            toast.error('Error al cargar estadísticas');
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

    const mainStats = [
        {
            name: 'Total Eventos',
            value: stats.totalEvents,
            icon: Calendar,
            color: 'blue',
            change: `+${stats.eventsThisMonth} este mes`,
        },
        {
            name: 'Total Usuarios',
            value: stats.totalUsers,
            icon: Users,
            color: 'green',
            change: `+${stats.newUsersThisMonth} este mes`,
        },
        {
            name: 'Ingresos Totales',
            value: formatCurrency(stats.totalRevenue, 'USD'),
            icon: DollarSign,
            color: 'yellow',
            change: 'Actualizado ahora',
        },
        {
            name: 'Eventos en Vivo',
            value: stats.activeStreams,
            icon: Eye,
            color: 'purple',
            change: 'En tiempo real',
        },
    ];

    // Simple Bar Chart Component
    const BarChart = ({ data, dataKey, color }: { data: ChartData[], dataKey: 'total' | 'count', color: string }) => {
        if (!data || data.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                    <p>No hay datos suficientes</p>
                </div>
            );
        }

        const values = data.map(d => parseFloat(d[dataKey] || '0'));
        const maxValue = Math.max(...values, 1);

        return (
            <div className="h-full flex items-end justify-between gap-2 px-2">
                {data.map((item, i) => {
                    const value = parseFloat(item[dataKey] || '0');
                    const height = (value / maxValue) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-white text-dark-950 text-xs py-1 px-2 rounded font-bold whitespace-nowrap z-10">
                                {dataKey === 'total' ? formatCurrency(value, 'USD') : `${value} usuarios`}
                            </div>
                            <div
                                className={`w-full rounded-t-sm transition-all duration-500 ${color}`}
                                style={{ height: `${Math.max(height, 5)}%` }}
                            />
                            <span className="text-[10px] text-gray-500 mt-2 font-medium uppercase">{item.month}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Estadísticas</h1>
                    <p className="text-gray-400">Métricas y análisis en tiempo real</p>
                </div>
                <button
                    onClick={loadStats}
                    className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors border border-dark-700"
                    title="Actualizar"
                >
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                </button>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mainStats.map((stat) => {
                    const Icon = stat.icon;
                    const colors: { [key: string]: string } = {
                        blue: 'bg-blue-500/20 text-blue-400',
                        green: 'bg-green-500/20 text-green-400',
                        yellow: 'bg-yellow-500/20 text-yellow-400',
                        purple: 'bg-purple-500/20 text-purple-400',
                    };
                    const colorClasses = colors[stat.color] || 'bg-gray-500/20 text-gray-400';

                    return (
                        <div key={stat.name} className="card p-6 border-l-4 border-l-current transition-transform hover:scale-[1.02]" style={{ borderColor: stat.color }}>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-gray-400">{stat.name}</p>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-white mb-2">
                                {stat.value}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-400" />
                                {stat.change}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white">Ingresos Mensuales</h2>
                            <p className="text-xs text-gray-500">Últimos 6 meses</p>
                        </div>
                        <div className="p-2 bg-yellow-500/10 rounded-full">
                            <DollarSign className="w-5 h-5 text-yellow-400" />
                        </div>
                    </div>
                    <div className="h-64">
                        <BarChart
                            data={stats.charts?.revenue || []}
                            dataKey="total"
                            color="bg-gradient-to-t from-yellow-600 to-yellow-400 opacity-80 group-hover:opacity-100"
                        />
                    </div>
                </div>

                {/* Users Growth Chart */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white">Crecimiento de Usuarios</h2>
                            <p className="text-xs text-gray-500">Últimos 6 meses</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-full">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                    <div className="h-64">
                        <BarChart
                            data={stats.charts?.users || []}
                            dataKey="count"
                            color="bg-gradient-to-t from-blue-600 to-blue-400 opacity-80 group-hover:opacity-100"
                        />
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-6 text-white">
                    <BarChart3 className="w-5 h-5 text-primary-500" />
                    <h2 className="text-xl font-bold">Resumen del Mes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-dark-800/40 p-5 rounded-xl border border-white/5">
                        <p className="text-sm text-gray-400 mb-1">Eventos Creados</p>
                        <p className="text-2xl font-bold text-white">{stats.eventsThisMonth}</p>
                        <div className="w-full h-1 bg-blue-500/20 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-blue-500 w-[60%]" />
                        </div>
                    </div>
                    <div className="bg-dark-800/40 p-5 rounded-xl border border-white/5">
                        <p className="text-sm text-gray-400 mb-1">Nuevos Usuarios</p>
                        <p className="text-2xl font-bold text-white">{stats.newUsersThisMonth}</p>
                        <div className="w-full h-1 bg-green-500/20 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-green-500 w-[45%]" />
                        </div>
                    </div>
                    <div className="bg-dark-800/40 p-5 rounded-xl border border-white/5">
                        <p className="text-sm text-gray-400 mb-1">Promedio por Venta</p>
                        <p className="text-2xl font-bold text-white">
                            {stats.totalUsers > 0 ? formatCurrency(stats.totalRevenue / stats.totalUsers, 'USD') : '$0.00'}
                        </p>
                        <div className="w-full h-1 bg-yellow-500/20 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-yellow-500 w-[80%]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
