'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Eye, Calendar, BarChart3 } from 'lucide-react';
import { eventsAPI, authAPI, handleAPIError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminStatsPage() {
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalUsers: 0,
        totalRevenue: 0,
        activeViewers: 0,
        eventsThisMonth: 0,
        newUsersThisMonth: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [eventsRes, usersRes] = await Promise.all([
                eventsAPI.getAll({}),
                authAPI.getAllUsers(),
            ]);

            const events = eventsRes.data.data;
            const users = usersRes.data.data;

            // Calculate stats
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            const eventsThisMonth = events.filter((e: any) => {
                const eventDate = new Date(e.event_date);
                return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear;
            }).length;

            const newUsersThisMonth = users.filter((u: any) => {
                const createdDate = new Date(u.created_at);
                return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear;
            }).length;

            setStats({
                totalEvents: events.length,
                totalUsers: users.length,
                totalRevenue: 0, // TODO: Calculate from purchases
                activeViewers: 0, // TODO: Get from real-time data
                eventsThisMonth,
                newUsersThisMonth,
            });
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
            change: 'Próximamente',
        },
        {
            name: 'Espectadores Activos',
            value: stats.activeViewers,
            icon: Eye,
            color: 'purple',
            change: 'En tiempo real',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Estadísticas</h1>
                <p className="text-gray-400">Métricas y análisis de la plataforma</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mainStats.map((stat) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        blue: 'bg-blue-500/20 text-blue-400',
                        green: 'bg-green-500/20 text-green-400',
                        yellow: 'bg-yellow-500/20 text-yellow-400',
                        purple: 'bg-purple-500/20 text-purple-400',
                    }[stat.color];

                    return (
                        <div key={stat.name} className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-gray-400">{stat.name}</p>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-white mb-2">
                                {stat.value}
                            </p>
                            <p className="text-xs text-gray-500">
                                {stat.change}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart Placeholder */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Ingresos Mensuales</h2>
                        <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="h-64 flex items-center justify-center bg-dark-800/50 rounded-lg">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500">Gráfico próximamente</p>
                        </div>
                    </div>
                </div>

                {/* Users Growth Chart Placeholder */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Crecimiento de Usuarios</h2>
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="h-64 flex items-center justify-center bg-dark-800/50 rounded-lg">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500">Gráfico próximamente</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="card p-6">
                <h2 className="text-xl font-bold text-white mb-6">Resumen del Mes</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                        <p className="text-sm text-gray-400 mb-1">Eventos Creados</p>
                        <p className="text-2xl font-bold text-white">{stats.eventsThisMonth}</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                        <p className="text-sm text-gray-400 mb-1">Nuevos Usuarios</p>
                        <p className="text-2xl font-bold text-white">{stats.newUsersThisMonth}</p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                        <p className="text-sm text-gray-400 mb-1">Tasa de Conversión</p>
                        <p className="text-2xl font-bold text-white">-</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
