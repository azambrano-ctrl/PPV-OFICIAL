'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, UserCheck, UserX, Shield, User as UserIcon } from 'lucide-react';
import { authAPI, handleAPIError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'admin';
    created_at: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter]);

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
        regularUsers: users.filter(u => u.role === 'user').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
                <p className="text-gray-400">Administra los usuarios de la plataforma</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Total Usuarios</p>
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
                            <p className="text-sm text-gray-400 mb-1">Administradores</p>
                            <p className="text-3xl font-bold text-white">{stats.admins}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Usuarios Regulares</p>
                            <p className="text-3xl font-bold text-white">{stats.regularUsers}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
                <div className="card p-12 text-center">
                    <UserX className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                        No se encontraron usuarios
                    </h3>
                    <p className="text-gray-500">
                        Intenta con otros filtros
                    </p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-800">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Usuario
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Email
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Teléfono
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Rol
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                                        Registro
                                    </th>
                                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-800">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-dark-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <p className="font-semibold text-white">{user.full_name}</p>
                                        </td>
                                        <td className="py-4 px-6 text-gray-300">
                                            {user.email}
                                        </td>
                                        <td className="py-4 px-6 text-gray-300">
                                            {user.phone || '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`badge ${user.role === 'admin'
                                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                }`}>
                                                {user.role === 'admin' ? '🛡️ Admin' : '👤 Usuario'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-300">
                                            {formatDate(user.created_at, 'PPP')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                {user.role === 'user' ? (
                                                    <button
                                                        onClick={() => handleRoleChange(user.id, 'admin')}
                                                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                                                        title="Promover a Admin"
                                                    >
                                                        <Shield className="w-4 h-4 mr-1" />
                                                        Hacer Admin
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRoleChange(user.id, 'user')}
                                                        className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                                                        title="Degradar a Usuario"
                                                    >
                                                        <UserIcon className="w-4 h-4 mr-1" />
                                                        Hacer Usuario
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <p>
                    Mostrando {filteredUsers.length} de {users.length} usuarios
                </p>
            </div>
        </div>
    );
}
