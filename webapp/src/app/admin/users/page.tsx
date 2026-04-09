'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, UserCheck, UserX, Shield, User as UserIcon, Trash2, MailCheck, MailWarning, Send } from 'lucide-react';
import { authAPI, handleAPIError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'admin' | 'promoter';
    is_verified: boolean;
    created_at: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [verifiedFilter, setVerifiedFilter] = useState<string>('all');

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter, verifiedFilter]);

    const loadUsers = async () => {
        try {
            const response = await authAPI.getAllUsers();
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = [...users];

        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        if (verifiedFilter === 'verified') {
            filtered = filtered.filter(user => user.is_verified);
        } else if (verifiedFilter === 'unverified') {
            filtered = filtered.filter(user => !user.is_verified);
        }

        setFilteredUsers(filtered);
    };

    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
        try {
            await authAPI.updateUserRole(userId, newRole);
            toast.success('Rol actualizado exitosamente');
            loadUsers();
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        }
    };

    const handleSendVerificationBulk = async () => {
        const unverifiedCount = users.filter(u => !u.is_verified).length;
        if (unverifiedCount === 0) {
            toast.success('Todos los usuarios ya están verificados.');
            return;
        }
        if (!confirm(`¿Enviar correo de verificación a los ${unverifiedCount} usuarios sin verificar?`)) return;

        setSending(true);
        try {
            const response = await authAPI.sendVerificationBulk();
            const { sent, failed } = response.data;
            toast.success(`✅ Enviados: ${sent}${failed > 0 ? ` | ❌ Fallidos: ${failed}` : ''}`);
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setSending(false);
        }
    };

    const handleVerify = async (userId: string) => {
        try {
            await authAPI.verifyUserManually(userId);
            toast.success('Correo verificado manualmente');
            loadUsers();
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.full_name || user.email}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await authAPI.deleteUser(user.id);
            toast.success('Usuario eliminado exitosamente');
            loadUsers();
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

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        verified: users.filter(u => u.is_verified).length,
        unverified: users.filter(u => !u.is_verified).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
                    <p className="text-gray-400">Administra los usuarios de la plataforma</p>
                </div>
                <button
                    onClick={handleSendVerificationBulk}
                    disabled={sending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-bold rounded-xl transition-colors"
                >
                    <Send className="w-4 h-4" />
                    {sending ? 'Enviando...' : `Enviar verificación (${users.filter(u => !u.is_verified).length} pendientes)`}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Total</p>
                            <p className="text-3xl font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Admins</p>
                            <p className="text-3xl font-bold text-white">{stats.admins}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6 cursor-pointer hover:bg-dark-800/50 transition-colors" onClick={() => setVerifiedFilter('verified')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Verificados</p>
                            <p className="text-3xl font-bold text-green-400">{stats.verified}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <MailCheck className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6 cursor-pointer hover:bg-dark-800/50 transition-colors" onClick={() => setVerifiedFilter('unverified')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Sin verificar</p>
                            <p className="text-3xl font-bold text-yellow-400">{stats.unverified}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <MailWarning className="w-6 h-6 text-yellow-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar por email o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="input pl-10"
                        >
                            <option value="all">Todos los roles</option>
                            <option value="admin">Administradores</option>
                            <option value="user">Usuarios</option>
                            <option value="promoter">Promotoras</option>
                        </select>
                    </div>

                    <div className="relative">
                        <MailCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                            value={verifiedFilter}
                            onChange={(e) => setVerifiedFilter(e.target.value)}
                            className="input pl-10"
                        >
                            <option value="all">Todos los correos</option>
                            <option value="verified">Verificados</option>
                            <option value="unverified">Sin verificar</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
                <div className="card p-12 text-center">
                    <UserX className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No se encontraron usuarios</h3>
                    <p className="text-gray-500">Intenta con otros filtros</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-800">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Usuario</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Email</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Correo</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Rol</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Registro</th>
                                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-800">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-dark-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <p className="font-semibold text-white">{user.full_name}</p>
                                        </td>
                                        <td className="py-4 px-6 text-gray-300 text-sm">
                                            {user.email}
                                        </td>
                                        <td className="py-4 px-6">
                                            {user.is_verified ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">
                                                    <MailCheck className="w-3 h-3" /> Verificado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                                                    <MailWarning className="w-3 h-3" /> Sin verificar
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`badge ${user.role === 'admin'
                                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                : user.role === 'promoter'
                                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                }`}>
                                                {user.role === 'admin' ? '🛡️ Admin' : user.role === 'promoter' ? '📢 Promotora' : '👤 Usuario'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-300 text-sm">
                                            {formatDate(user.created_at, 'PPP')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2 flex-wrap">
                                                {!user.is_verified && (
                                                    <button
                                                        onClick={() => handleVerify(user.id)}
                                                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                                                        title="Verificar correo manualmente"
                                                    >
                                                        <UserCheck className="w-4 h-4 mr-1" />
                                                        Verificar
                                                    </button>
                                                )}
                                                {user.role === 'user' ? (
                                                    <button
                                                        onClick={() => handleRoleChange(user.id, 'admin')}
                                                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        <Shield className="w-4 h-4 mr-1" />
                                                        Hacer Admin
                                                    </button>
                                                ) : user.role === 'admin' ? (
                                                    <button
                                                        onClick={() => handleRoleChange(user.id, 'user')}
                                                        className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        <UserIcon className="w-4 h-4 mr-1" />
                                                        Hacer Usuario
                                                    </button>
                                                ) : null}
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="btn btn-sm bg-dark-700 hover:bg-red-600/20 text-gray-400 hover:text-red-500 border-dark-600 transition-all"
                                                    title="Eliminar Usuario"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
                <p>Mostrando {filteredUsers.length} de {users.length} usuarios</p>
                {verifiedFilter !== 'all' && (
                    <button onClick={() => setVerifiedFilter('all')} className="text-primary-400 hover:text-primary-300">
                        Limpiar filtro
                    </button>
                )}
            </div>
        </div>
    );
}
