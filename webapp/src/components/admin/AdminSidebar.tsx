'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Settings,
    LogOut,
    BarChart3,
    Film,
    Globe,
    Mail
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Eventos', href: '/admin/events', icon: Calendar },
    { name: 'Promotoras', href: '/admin/promoters', icon: Globe },
    { name: 'Usuarios', href: '/admin/users', icon: Users },
    { name: 'Marketing', href: '/admin/marketing', icon: Mail },
    { name: 'Estadísticas', href: '/admin/stats', icon: BarChart3 },
    { name: 'Configuración', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    return (
        <div className="flex flex-col h-full bg-dark-900 border-r border-dark-800">
            {/* Logo */}
            <div className="p-6 border-b border-dark-800">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                        <Film className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">PPV Admin</h1>
                        <p className="text-xs text-gray-500">Panel de Control</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-dark-800">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                            {user?.full_name?.charAt(0) || 'A'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.full_name || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
}
