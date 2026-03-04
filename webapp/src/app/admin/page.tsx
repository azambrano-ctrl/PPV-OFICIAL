'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
    totalUsers: number;
    totalEvents: number;
    totalRevenue: number;
    activeStreams: number;
}

interface AnalyticsData {
    total: number;
    today: number;
    week: number;
    month: number;
    uniqueVisitors: number;
    daily: { date: string; views: string }[];
    topPages: { page: string; views: string }[];
}

interface RecentPurchase {
    id: string;
    user_email: string;
    event_title: string;
    amount: number;
    currency: string;
    purchased_at: string;
}

interface Event {
    id: string;
    title: string;
    status: string;
    event_date: string;
    price: number;
    currency: string;
    purchases_count: number;
}

export default function AdminPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'users'>('dashboard');

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    router.push('/login?redirect=/admin');
                    return;
                }

                // Fetch stats
                const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData.data);
                }

                // Fetch recent purchases
                const purchasesRes = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/purchases/recent`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (purchasesRes.ok) {
                    const purchasesData = await purchasesRes.json();
                    setRecentPurchases(purchasesData.data || []);
                }

                // Fetch all events
                const eventsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (eventsRes.ok) {
                    const eventsData = await eventsRes.json();
                    setEvents(eventsData.data || []);
                }

                // Fetch analytics
                const analyticsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (analyticsRes.ok) {
                    const analyticsData = await analyticsRes.json();
                    setAnalytics(analyticsData.data);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error loading admin data:', err);
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950">
            {/* Header */}
            <header className="bg-dark-900 border-b border-dark-800">
                <div className="container-custom py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-dark-400 mt-1">Manage your PPV streaming platform</p>
                        </div>
                        <Link href="/profile" className="btn-secondary">
                            Back to Profile
                        </Link>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-dark-900 border-b border-dark-800">
                <div className="container-custom">
                    <nav className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-6 py-4 font-semibold transition-colors border-b-2 ${activeTab === 'dashboard'
                                ? 'border-primary-600 text-white'
                                : 'border-transparent text-dark-400 hover:text-white'
                                }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`px-6 py-4 font-semibold transition-colors border-b-2 ${activeTab === 'events'
                                ? 'border-primary-600 text-white'
                                : 'border-transparent text-dark-400 hover:text-white'
                                }`}
                        >
                            Events
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-4 font-semibold transition-colors border-b-2 ${activeTab === 'users'
                                ? 'border-primary-600 text-white'
                                : 'border-transparent text-dark-400 hover:text-white'
                                }`}
                        >
                            Users
                        </button>
                    </nav>
                </div>
            </div>

            <div className="container-custom py-8">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-dark-400 text-sm font-medium">Total Users</h3>
                                    <div className="text-3xl">👥</div>
                                </div>
                                <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                            </div>

                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-dark-400 text-sm font-medium">Total Events</h3>
                                    <div className="text-3xl">🎬</div>
                                </div>
                                <p className="text-3xl font-bold text-white">{stats?.totalEvents || 0}</p>
                            </div>

                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-dark-400 text-sm font-medium">Total Revenue</h3>
                                    <div className="text-3xl">💰</div>
                                </div>
                                <p className="text-3xl font-bold text-white">
                                    ${Number(stats?.totalRevenue || 0).toFixed(2)}
                                </p>
                            </div>

                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-dark-400 text-sm font-medium">Active Streams</h3>
                                    <div className="text-3xl">📡</div>
                                </div>
                                <p className="text-3xl font-bold text-white">{stats?.activeStreams || 0}</p>
                            </div>
                        </div>

                        {/* Visit Analytics */}
                        <div className="card p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">📊 Visitas del Sitio</h2>

                            {analytics ? (
                                <div className="space-y-6">
                                    {/* Visit Stats Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="bg-dark-800 p-4 rounded-lg text-center">
                                            <p className="text-dark-400 text-xs font-medium mb-1">Hoy</p>
                                            <p className="text-2xl font-bold text-green-400">{analytics.today}</p>
                                        </div>
                                        <div className="bg-dark-800 p-4 rounded-lg text-center">
                                            <p className="text-dark-400 text-xs font-medium mb-1">Últimos 7 días</p>
                                            <p className="text-2xl font-bold text-blue-400">{analytics.week}</p>
                                        </div>
                                        <div className="bg-dark-800 p-4 rounded-lg text-center">
                                            <p className="text-dark-400 text-xs font-medium mb-1">Últimos 30 días</p>
                                            <p className="text-2xl font-bold text-purple-400">{analytics.month}</p>
                                        </div>
                                        <div className="bg-dark-800 p-4 rounded-lg text-center">
                                            <p className="text-dark-400 text-xs font-medium mb-1">Total</p>
                                            <p className="text-2xl font-bold text-white">{analytics.total}</p>
                                        </div>
                                        <div className="bg-dark-800 p-4 rounded-lg text-center">
                                            <p className="text-dark-400 text-xs font-medium mb-1">Visitantes Únicos</p>
                                            <p className="text-2xl font-bold text-yellow-400">{analytics.uniqueVisitors}</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Daily Breakdown */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3">Visitas por Día (7 días)</h3>
                                            <div className="space-y-2">
                                                {analytics.daily.length === 0 ? (
                                                    <p className="text-dark-400 text-sm">Sin datos aún</p>
                                                ) : (
                                                    analytics.daily.map((d) => {
                                                        const maxViews = Math.max(...analytics.daily.map(x => parseInt(x.views)));
                                                        const pct = maxViews > 0 ? (parseInt(d.views) / maxViews) * 100 : 0;
                                                        return (
                                                            <div key={d.date} className="flex items-center gap-3">
                                                                <span className="text-dark-400 text-xs w-20 shrink-0">
                                                                    {new Date(d.date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                </span>
                                                                <div className="flex-1 bg-dark-800 rounded h-5 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded"
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-white text-sm font-bold w-10 text-right">{d.views}</span>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>

                                        {/* Top Pages */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-3">Páginas Más Visitadas (30 días)</h3>
                                            <div className="space-y-1">
                                                {analytics.topPages.length === 0 ? (
                                                    <p className="text-dark-400 text-sm">Sin datos aún</p>
                                                ) : (
                                                    analytics.topPages.map((p, i) => (
                                                        <div key={p.page} className="flex items-center justify-between py-2 px-3 rounded hover:bg-dark-800/50">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-dark-500 text-xs font-bold w-5">{i + 1}.</span>
                                                                <span className="text-dark-200 text-sm truncate max-w-[200px]">{p.page}</span>
                                                            </div>
                                                            <span className="text-primary-400 font-bold text-sm">{p.views}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-dark-400 text-center py-4">Recopilando datos de visitas...</p>
                            )}
                        </div>

                        {/* Recent Purchases */}
                        <div className="card p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Recent Purchases</h2>

                            {recentPurchases.length === 0 ? (
                                <p className="text-dark-400 text-center py-8">No purchases yet</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-dark-800">
                                                <th className="text-left py-3 px-4 text-dark-400 font-medium">User</th>
                                                <th className="text-left py-3 px-4 text-dark-400 font-medium">Event</th>
                                                <th className="text-left py-3 px-4 text-dark-400 font-medium">Amount</th>
                                                <th className="text-left py-3 px-4 text-dark-400 font-medium">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentPurchases.map((purchase) => (
                                                <tr key={purchase.id} className="border-b border-dark-800 hover:bg-dark-800/50">
                                                    <td className="py-3 px-4 text-white">{purchase.user_email}</td>
                                                    <td className="py-3 px-4 text-white">{purchase.event_title}</td>
                                                    <td className="py-3 px-4 text-white">
                                                        ${Number(purchase.amount || 0).toFixed(2)} {purchase.currency}
                                                    </td>
                                                    <td className="py-3 px-4 text-dark-300">
                                                        {new Date(purchase.purchased_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">All Events</h2>
                            <Link href="/admin/events/new" className="btn-primary">
                                Create New Event
                            </Link>
                        </div>

                        {events.length === 0 ? (
                            <div className="card p-12 text-center">
                                <div className="text-6xl mb-4">🎬</div>
                                <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
                                <p className="text-dark-400 mb-6">Create your first event to get started</p>
                                <Link href="/admin/events/new" className="btn-primary inline-block">
                                    Create Event
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {events.map((event) => (
                                    <div key={event.id} className="card-hover p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                                            <span className={`badge ${event.status === 'live' ? 'badge-danger' :
                                                event.status === 'upcoming' ? 'badge-warning' :
                                                    event.status === 'finished' ? 'badge-info' :
                                                        'badge-success'
                                                }`}>
                                                {event.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm text-dark-300 mb-4">
                                            <p>📅 {new Date(event.event_date).toLocaleDateString()}</p>
                                            <p>💵 ${Number(event.price).toFixed(2)} {event.currency}</p>
                                            <p>🎟️ {event.purchases_count || 0} purchases</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href={`/admin/events/${event.id}/edit`}
                                                className="btn-secondary flex-1 text-center"
                                            >
                                                Edit
                                            </Link>
                                            <Link
                                                href={`/event/${event.id}`}
                                                className="btn-outline flex-1 text-center"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="card p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
                        <p className="text-dark-400">User management features coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
