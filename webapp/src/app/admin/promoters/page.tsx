'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Globe, Users, CheckCircle, Shield, Phone, MapPin, FileText } from 'lucide-react';
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
    status: 'pending' | 'active' | 'suspended';
    phone?: string;
    city?: string;
    experience_links?: string;
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

    const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'active' | 'suspended') => {
        try {
            await promotersAPI.updateStatus(id, newStatus);
            toast.success(`Estado actualizado a ${newStatus}`);
            loadPromoters();
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
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
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white mb-0">{promoter.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${promoter.status === 'active' ? 'bg-green-500/20 text-green-500' :
                                        promoter.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                            'bg-red-500/20 text-red-500'
                                        }`}>
                                        {promoter.status === 'active' ? 'Activo' : promoter.status === 'pending' ? 'Pendiente' : 'Suspendido'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                                    {promoter.description || 'Sin descripción disponible.'}
                                </p>

                                <div className="space-y-2 mb-4 flex-grow">
                                    {promoter.phone && (
                                        <div className="flex items-center text-xs text-gray-400 gap-2">
                                            <Phone className="w-3.5 h-3.5 text-primary-500" />
                                            <span>{promoter.phone}</span>
                                            <a
                                                href={`https://wa.me/${promoter.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-auto text-green-500 hover:text-green-400 font-medium"
                                            >
                                                WhatsApp
                                            </a>
                                        </div>
                                    )}
                                    {promoter.city && (
                                        <div className="flex items-center text-xs text-gray-400 gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-primary-500" />
                                            <span>{promoter.city}</span>
                                        </div>
                                    )}
                                    {promoter.experience_links && (
                                        <div className="flex items-center text-xs text-gray-400 gap-2">
                                            <Globe className="w-3.5 h-3.5 text-primary-500" />
                                            <a
                                                href={promoter.experience_links.startsWith('http') ? promoter.experience_links : `https://${promoter.experience_links}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-400 hover:text-primary-300 font-medium truncate"
                                            >
                                                Ver Sherdog / Tapology
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-dark-800">
                                    <Link
                                        href={`/promoter/${promoter.id}`}
                                        className="text-xs text-gray-500 hover:text-white flex items-center gap-1"
                                    >
                                        <Globe className="w-3 h-3" />
                                        Ver perfil público
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        {promoter.status === 'pending' && (
                                            <button
                                                onClick={() => handleUpdateStatus(promoter.id, 'active')}
                                                className="p-2 hover:bg-green-500/10 rounded-lg transition-colors text-green-500"
                                                title="Aprobar"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        {promoter.status === 'active' && (
                                            <button
                                                onClick={() => handleUpdateStatus(promoter.id, 'suspended')}
                                                className="p-2 hover:bg-yellow-500/10 rounded-lg transition-colors text-yellow-500"
                                                title="Suspender"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                        )}
                                        {promoter.status === 'suspended' && (
                                            <button
                                                onClick={() => handleUpdateStatus(promoter.id, 'active')}
                                                className="p-2 hover:bg-green-500/10 rounded-lg transition-colors text-green-500"
                                                title="Reactivar"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                        <Link
                                            href={`/admin/contract/${promoter.id}`}
                                            target="_blank"
                                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-green-400"
                                            title="Ver / Descargar Contrato"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </Link>
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
