'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { fightersAPI } from '@/lib/api';
import { Shield, CheckCircle, XCircle, Search, User, Filter, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface Fighter {
    id: string;
    first_name: string;
    last_name: string;
    nickname?: string;
    slug: string;
    status: 'pending' | 'approved' | 'rejected';
    wins: number;
    losses: number;
    draws: number;
    profile_image_url?: string;
    created_at: string;
    user_id: string;
}

export default function AdminFighters() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [fighters, setFighters] = useState<Fighter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin-auth');
            return;
        }
        loadFighters();
    }, [isAuthenticated, user]);

    const loadFighters = async () => {
        try {
            // Because we added ?all=true requirement in the backend for admins
            const res = await fightersAPI.getAll(true);
            if (res.data.success) {
                setFighters(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load fighters', error);
            toast.error('Error cargando la base de datos de peleadores');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
        try {
            await fightersAPI.updateStatus(id, newStatus);
            toast.success(`Atleta marcado como ${newStatus}`);
            // Optimistic UI update
            setFighters(prev =>
                prev.map(f => f.id === id ? { ...f, status: newStatus } : f)
            );
        } catch (error) {
            toast.error('Error al actualizar el estado del atleta');
        }
    };

    const filteredFighters = fighters.filter(f => {
        const matchesSearch = `${f.first_name} ${f.last_name} ${f.nickname || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="spinner w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Solicitudes de Peleadores</h1>
                    <p className="text-dark-400">Revisa y aprueba las fichas que los atletas han creado.</p>
                </div>
            </div>

            <div className="card p-6 border-primary-500/20">
                <div className="flex items-start gap-4 mb-2">
                    <Shield className="w-6 h-6 text-primary-500 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">Control de Calidad de Peleadores</h3>
                        <p className="text-sm text-dark-400">
                            Cuando un usuario reclama/crea un perfil de peleador, su ficha aparece aquí como <span className="text-yellow-500 font-bold">Pending</span>.
                            Revisa que sus datos e historial sean reales. Solo los atletas <span className="text-green-500 font-bold">Approved</span> aparecen en la página pública <code>/fighters</code>.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-dark-900 border border-dark-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-dark-800 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                        <input
                            type="text"
                            placeholder="Buscar peleador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input w-full pl-9 h-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="input h-10"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendientes de Tí</option>
                            <option value="approved">Aprobados</option>
                            <option value="rejected">Rechazados</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-dark-800 text-dark-300 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-medium">Atleta</th>
                                <th className="px-6 py-4 font-medium">Récord Ingresado</th>
                                <th className="px-6 py-4 font-medium">Fecha de Envío</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-800">
                            {filteredFighters.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-dark-400">
                                        No se encontraron peleadores con esos filtros.
                                    </td>
                                </tr>
                            ) : (
                                filteredFighters.map((fighter) => (
                                    <tr key={fighter.id} className="hover:bg-dark-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center overflow-hidden relative">
                                                    {fighter.profile_image_url ? (
                                                        <Image src={fighter.profile_image_url} alt="" fill className="object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-dark-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">
                                                        {fighter.first_name} {fighter.last_name}
                                                    </div>
                                                    {fighter.nickname && <div className="text-sm text-dark-400">"{fighter.nickname}"</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono whitespace-nowrap">
                                            <span className="text-green-500 font-bold">{fighter.wins}</span>-
                                            <span className="text-red-500 font-bold">{fighter.losses}</span>-
                                            <span className="text-gray-500 font-bold">{fighter.draws}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-300">
                                            {formatDate(fighter.created_at, 'PP')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${fighter.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    fighter.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                                {fighter.status === 'approved' ? 'Aprobado' :
                                                    fighter.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {fighter.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(fighter.id, 'approved')}
                                                        className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                                                        title="Aprobar"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {fighter.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(fighter.id, 'rejected')}
                                                        className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                                        title="Rechazar"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/admin/fighters/${fighter.slug}/edit`}
                                                    className="p-1 text-blue-500 hover:bg-blue-500/10 rounded ml-2"
                                                    title="Editar Perfil"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => window.open(`/fighters/${fighter.slug}`, '_blank')}
                                                    className="p-1 text-dark-300 hover:text-white hover:bg-dark-700 rounded ml-2"
                                                    title="Ver Perfil Público"
                                                >
                                                    <User className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
