'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Phone, Calendar, CreditCard, LogOut, Play, Clock, CheckCircle } from 'lucide-react';
import { authAPI, handleAPIError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';

interface Purchase {
    id: string;
    event_id: string;
    event_title: string;
    event_date: string;
    event_status: string;
    amount: number;
    currency: string;
    payment_method: string;
    payment_status: string;
    purchased_at: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'purchases'>('info');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        loadPurchases();
    }, [isAuthenticated]);

    const loadPurchases = async () => {
        try {
            const response = await authAPI.getPurchases();
            setPurchases(response.data.data);
        } catch (error) {
            console.error('Error loading purchases:', error);
            toast.error('Error al cargar el historial de compras');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    if (!isAuthenticated || !user) {
        return null;
    }

    const upcomingEvents = purchases.filter(p => p.event_status === 'upcoming' || p.event_status === 'live');
    const pastEvents = purchases.filter(p => p.event_status === 'finished');

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <Navbar />

            <div className="flex-1 py-12 pt-32">
                <div className="container-custom">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="font-display text-4xl font-bold mb-2">
                            Mi <span className="gradient-text">Perfil</span>
                        </h1>
                        <p className="text-dark-400">
                            Gestiona tu cuenta y revisa tus eventos
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* User Card */}
                            <div className="card p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{user.full_name}</h3>
                                        <p className="text-sm text-dark-400">{user.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="w-4 h-4 text-dark-500" />
                                        <span className="text-dark-300">{user.email}</span>
                                    </div>
                                    {user.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="w-4 h-4 text-dark-500" />
                                            <span className="text-dark-300">{user.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className={`w-4 h-4 ${user.is_verified ? 'text-green-500' : 'text-dark-500'}`} />
                                        <span className="text-dark-300">
                                            {user.is_verified ? 'Cuenta verificada' : 'Cuenta no verificada'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full mt-6 btn btn-secondary flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar Sesión
                                </button>
                            </div>

                            {/* Stats Card */}
                            <div className="card p-6">
                                <h3 className="font-semibold mb-4">Estadísticas</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-dark-500 mb-1">Total de Eventos</p>
                                        <p className="text-2xl font-bold gradient-text">{purchases.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-dark-500 mb-1">Próximos Eventos</p>
                                        <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-dark-500 mb-1">Eventos Vistos</p>
                                        <p className="text-2xl font-bold">{pastEvents.length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Link */}
                            {user.role === 'admin' && (
                                <Link href="/admin" className="card p-6 block hover:border-primary-500/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                                            <User className="w-5 h-5 text-primary-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Panel de Admin</h3>
                                            <p className="text-sm text-dark-400">Gestionar eventos</p>
                                        </div>
                                    </div>
                                </Link>
                            )}
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Tabs */}
                            <div className="flex gap-4 border-b border-dark-800">
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'info'
                                        ? 'text-primary-500'
                                        : 'text-dark-400 hover:text-white'
                                        }`}
                                >
                                    Información Personal
                                    {activeTab === 'info' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('purchases')}
                                    className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'purchases'
                                        ? 'text-primary-500'
                                        : 'text-dark-400 hover:text-white'
                                        }`}
                                >
                                    Mis Eventos ({purchases.length})
                                    {activeTab === 'purchases' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                                    )}
                                </button>
                            </div>

                            {/* Info Tab */}
                            {activeTab === 'info' && (
                                <div className="card p-8">
                                    <h2 className="text-2xl font-bold mb-6">Información Personal</h2>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-dark-300 mb-2">
                                                Nombre Completo
                                            </label>
                                            <input
                                                type="text"
                                                value={user.full_name}
                                                disabled
                                                className="input w-full opacity-75 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-dark-300 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={user.email}
                                                disabled
                                                className="input w-full opacity-75 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-dark-300 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                value={user.phone || 'No especificado'}
                                                disabled
                                                className="input w-full opacity-75 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="pt-4 border-t border-dark-800">
                                            <p className="text-sm text-dark-400">
                                                Para actualizar tu información, contacta con soporte
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Purchases Tab */}
                            {activeTab === 'purchases' && (
                                <div className="space-y-6">
                                    {loading ? (
                                        <div className="card p-12 flex justify-center">
                                            <div className="spinner w-8 h-8" />
                                        </div>
                                    ) : purchases.length === 0 ? (
                                        <div className="card p-12 text-center">
                                            <CreditCard className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold mb-2">No tienes eventos</h3>
                                            <p className="text-dark-400 mb-6">
                                                Explora nuestro catálogo y compra tu primer evento
                                            </p>
                                            <Link href="/events" className="btn-primary">
                                                Ver Eventos
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Upcoming Events */}
                                            {upcomingEvents.length > 0 && (
                                                <div>
                                                    <h3 className="text-xl font-bold mb-4">Próximos Eventos</h3>
                                                    <div className="space-y-4">
                                                        {upcomingEvents.map((purchase) => (
                                                            <div key={purchase.id} className="card p-6">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold text-lg mb-2">
                                                                            {purchase.event_title}
                                                                        </h4>
                                                                        <div className="flex flex-wrap gap-4 text-sm text-dark-400 mb-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <Calendar className="w-4 h-4" />
                                                                                {formatDate(purchase.event_date, 'PPP')}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Clock className="w-4 h-4" />
                                                                                {formatDate(purchase.event_date, 'p')}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <span className="text-sm text-dark-500">
                                                                                Pagado: {formatCurrency(purchase.amount, purchase.currency)}
                                                                            </span>
                                                                            <span className={`badge ${purchase.event_status === 'live'
                                                                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                                                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                                                }`}>
                                                                                {purchase.event_status === 'live' ? 'En Vivo' : 'Próximamente'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <Link
                                                                        href={`/watch/${purchase.event_id}`}
                                                                        className="btn-primary"
                                                                    >
                                                                        {purchase.event_status === 'live' ? (
                                                                            <>
                                                                                <Play className="w-4 h-4 mr-2" />
                                                                                Ver Ahora
                                                                            </>
                                                                        ) : (
                                                                            'Ver Detalles'
                                                                        )}
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Past Events */}
                                            {pastEvents.length > 0 && (
                                                <div>
                                                    <h3 className="text-xl font-bold mb-4">Eventos Anteriores</h3>
                                                    <div className="space-y-4">
                                                        {pastEvents.map((purchase) => (
                                                            <div key={purchase.id} className="card p-6 opacity-75">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold text-lg mb-2">
                                                                            {purchase.event_title}
                                                                        </h4>
                                                                        <div className="flex flex-wrap gap-4 text-sm text-dark-400 mb-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <Calendar className="w-4 h-4" />
                                                                                {formatDate(purchase.event_date, 'PPP')}
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-sm text-dark-500">
                                                                            Pagado: {formatCurrency(purchase.amount, purchase.currency)}
                                                                        </span>
                                                                    </div>
                                                                    <Link
                                                                        href={`/watch/${purchase.event_id}`}
                                                                        className="btn btn-secondary"
                                                                    >
                                                                        Ver Repetición
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
