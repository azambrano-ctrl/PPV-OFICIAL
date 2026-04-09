'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authAPI, handleAPIError } from '@/lib/api';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import {
    Lock,
    Bell,
    Shield,
    CreditCard,
    Mail,
    Smartphone,
    LogOut
} from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const [activeSection, setActiveSection] = useState<'security' | 'notifications' | 'billing'>('security');

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const [preferences, setPreferences] = useState({
        emailReminders: true,
        pushNotifications: false,
        twoFactor: false
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) router.push('/auth/login');
    }, [isAuthenticated, router]);

    // Check push subscription state on mount
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        navigator.serviceWorker.ready
            .then(reg => reg.pushManager.getSubscription())
            .then(sub => {
                setPreferences(p => ({ ...p, pushNotifications: !!sub }));
            })
            .catch(() => {});
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setLoading(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Contraseña actualizada correctamente');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    const togglePushNotifications = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            toast.error('Tu navegador no soporta notificaciones push');
            return;
        }

        try {
            const reg = await navigator.serviceWorker.ready;

            if (preferences.pushNotifications) {
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    const token = localStorage.getItem('accessToken');
                    await fetch(`${API_URL}/api/notifications/web-push/subscribe`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ endpoint: sub.endpoint }),
                    });
                    await sub.unsubscribe();
                }
                setPreferences(p => ({ ...p, pushNotifications: false }));
                toast.success('Notificaciones desactivadas');
            } else {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    toast.error('Permiso denegado para notificaciones');
                    return;
                }

                const token = localStorage.getItem('accessToken');
                const keyRes = await fetch(`${API_URL}/api/notifications/vapid-public-key`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const keyData = await keyRes.json();
                if (!keyData.success) throw new Error('VAPID key not available');

                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: keyData.data,
                });

                await fetch(`${API_URL}/api/notifications/web-push/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                    body: JSON.stringify(sub.toJSON()),
                });

                setPreferences(p => ({ ...p, pushNotifications: true }));
                toast.success('¡Notificaciones activadas!');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al configurar notificaciones');
        }
    };

    const togglePreference = (key: keyof typeof preferences) => {
        if (key === 'pushNotifications') { togglePushNotifications(); return; }
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
        toast.success('Preferencia actualizada');
    };

    if (!user) return null;

    const sections = [
        { id: 'security', label: 'Seguridad', icon: Shield },
        { id: 'notifications', label: 'Notificaciones', icon: Bell },
        { id: 'billing', label: 'Facturación', icon: CreditCard },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">

            <div className="flex-1 py-12 pt-32">
                <div className="container-custom">
                    <div className="mb-8">
                        <h1 className="font-display text-4xl font-bold mb-2">
                            Configuración de <span className="gradient-text">Cuenta</span>
                        </h1>
                        <p className="text-dark-400">
                            Gestiona tu seguridad y preferencias
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1 space-y-2">
                            {sections.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveSection(id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === id
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                                        : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{label}</span>
                                </button>
                            ))}

                            <div className="pt-4 mt-4 border-t border-dark-800">
                                <button
                                    onClick={() => logout()}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-3">
                            {activeSection === 'security' && (
                                <div className="space-y-6">
                                    {/* Change Password Card */}
                                    <div className="card p-8">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center">
                                                <Lock className="w-6 h-6 text-primary-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold">Cambiar Contraseña</h2>
                                                <p className="text-dark-400 text-sm">Mantén tu cuenta segura actualizando tu contraseña periódicamente.</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                                            <div>
                                                <label className="block text-sm font-medium text-dark-300 mb-2">Contraseña Actual</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="input w-full"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-dark-300 mb-2">Nueva Contraseña</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="input w-full"
                                                    required
                                                    minLength={8}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-dark-300 mb-2">Confirmar Nueva Contraseña</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="input w-full"
                                                    required
                                                    minLength={8}
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <button
                                                    type="submit"
                                                    className="btn-primary w-full sm:w-auto"
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* 2FA Section (Mock) */}
                                    <div className="card p-8 opacity-75">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center">
                                                    <Smartphone className="w-6 h-6 text-green-500" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold">Autenticación de Dos Factores</h2>
                                                    <p className="text-dark-400 text-sm mt-1">Añade una capa extra de seguridad a tu cuenta.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => togglePreference('twoFactor')}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.twoFactor ? 'bg-primary-600' : 'bg-dark-700'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.twoFactor ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'notifications' && (
                                <div className="card p-8">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                                        <Mail className="w-6 h-6 text-primary-500" />
                                        Preferencias de Notificaciones
                                    </h2>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between pb-6 border-b border-dark-800 text-left w-full group cursor-pointer" onClick={() => togglePreference('emailReminders')}>
                                            <div>
                                                <h3 className="font-semibold text-white">Recordatorios de Eventos</h3>
                                                <p className="text-sm text-dark-400">Te avisaremos cuando un evento que compraste esté por comenzar.</p>
                                            </div>
                                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.emailReminders ? 'bg-primary-600' : 'bg-dark-700'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.emailReminders ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-left w-full group cursor-pointer" onClick={() => togglePreference('pushNotifications')}>
                                            <div>
                                                <h3 className="font-semibold text-white">Notificaciones Push</h3>
                                                <p className="text-sm text-dark-400">Recibe alertas en tu navegador en tiempo real.</p>
                                            </div>
                                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.pushNotifications ? 'bg-primary-600' : 'bg-dark-700'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'billing' && (
                                <div className="card p-8 text-center py-16">
                                    <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CreditCard className="w-10 h-10 text-dark-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Métodos de Pago</h2>
                                    <p className="text-dark-400 max-w-md mx-auto mb-8">
                                        Actualmente procesamos los pagos de forma segura a través de PayPal. Tus tarjetas y métodos de pago se gestionan directamente en su plataforma.
                                    </p>
                                    <a
                                        href="https://www.paypal.com/myaccount/money/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary inline-flex items-center gap-2"
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        Gestionar en PayPal
                                    </a>
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
