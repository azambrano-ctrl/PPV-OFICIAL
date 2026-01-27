'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Globe, Users } from 'lucide-react';
import { promotersAPI, handleAPIError } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Promoter {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    created_at: string;
}

export default function AdminPromotersPage() {
    const [promoters, setPromoters] = useState<Promoter[]>([]);
    const [filteredPromoters, setFilteredPromoters] = useState<Promoter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPromoters();
    }, []);

    useEffect(() => {
        const filtered = promoters.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPromoters(filtered);
    }, [promoters, searchTerm]);

    const loadPromoters = async () => {
        try {
            const response = await promotersAPI.getAll();
            setPromoters(response.data.data);
        } catch (error) {
            console.error('Error loading promoters:', error);
            toast.error('Error al cargar promotoras');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta promotora? Esto no eliminará los eventos asociados, pero perderán su referencia.')) {
            return;
        }

        try {
            await promotersAPI.delete(id);
            toast.success('Promotora eliminada exitosamente');
            loadPromoters();
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Promotoras</h1>
                    <p className="text-gray-400">Administra los perfiles de las organizaciones aliadas</p>
                </div>
                <Link href="/admin/promoters/new" className="btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Promotora
                </Link>
            </div>

            {/* Search */}
            <div className="card p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>
            </div>

            {/* List */}
            {filteredPromoters.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {searchTerm ? 'No se encontraron promotoras' : 'No hay promotoras'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {searchTerm ? 'Intenta con otro nombre' : 'Crea el perfil de la primera promotora'}
                    </p>
                    {!searchTerm && (
                        <Link href="/admin/promoters/new" className="btn-primary">
                            <Plus className="w-5 h-5 mr-2" />
                            Crear Primera Promotora
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPromoters.map((promoter) => (
                        <div key={promoter.id} className="card overflow-hidden flex flex-col group border-dark-700 hover:border-primary-500/50 transition-colors">
                            {/* Banner or Placeholder */}
                            <div className="h-32 bg-dark-800 relative">
                                {promoter.banner_url ? (
                                    <img
                                        src={getImageUrl(promoter.banner_url)}
                                        alt={promoter.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-dark-800 to-dark-900" />
                                )}

                                {/* Logo Overlay */}
                                <div className="absolute -bottom-6 left-6 w-16 h-16 bg-dark-900 rounded-xl border-4 border-dark-950 overflow-hidden shadow-xl">
                                    {promoter.logo_url ? (
                                        <img
                                            src={getImageUrl(promoter.logo_url)}
                                            alt="Logo"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-primary-500 font-bold text-xl uppercase italic">
                                            {promoter.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-10 p-6 flex-grow flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-2">{promoter.name}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">
                                    {promoter.description || 'Sin descripción disponible.'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-dark-800">
                                    <Link
                                        href={`/promoter/${promoter.id}`}
                                        className="text-xs text-gray-500 hover:text-white flex items-center gap-1"
                                    >
                                        <Globe className="w-3 h-3" />
                                        Ver perfil público
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/promoters/${promoter.id}/edit`}
                                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-blue-400"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(promoter.id)}
                                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-red-400"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
