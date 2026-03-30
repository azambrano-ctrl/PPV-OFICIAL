'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import AdminSidebar from '@/components/admin/AdminSidebar';
import toast from 'react-hot-toast';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isAdmin } = useAuthStore();
    const [hydrated, setHydrated] = useState(false);

    // Wait for Zustand to hydrate from localStorage
    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        // Only check auth after hydration is complete
        if (!hydrated) return;

        if (!isAuthenticated) {
            toast.error('Debes iniciar sesión para acceder al panel de administración');
            router.push('/admin-auth');
            return;
        }

        if (!isAdmin) {
            toast.error('No tienes permisos de administrador');
            router.push('/');
            return;
        }
    }, [isAuthenticated, isAdmin, router, hydrated]);

    if (!hydrated || !isAuthenticated || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-950">
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-dark-950">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0">
                <AdminSidebar />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
