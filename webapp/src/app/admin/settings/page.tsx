'use client';

import { useState, useEffect } from 'react';
import { Save, Server, Mail, CreditCard, Shield, Bell, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '@/lib/api/settings';
import { getImageUrl } from '@/lib/utils';

export default function AdminSettingsPage() {
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [homepageBackground, setHomepageBackground] = useState<string | null>(null);
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        siteName: 'PPV Streaming',
        siteDescription: 'Plataforma de streaming de eventos PPV',
        contactEmail: 'contact@ppvstreaming.com',
        supportEmail: 'support@ppvstreaming.com',
        stripeEnabled: true,
        paypalEnabled: true,
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        pushNotifications: false,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await settingsAPI.getSettings();
            setHomepageBackground(response.data.homepage_background);
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBackgroundFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackgroundPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBackground = () => {
        setBackgroundFile(null);
        setBackgroundPreview(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (backgroundFile) {
                const formData = new FormData();
                formData.append('homepage_background', backgroundFile);
                await settingsAPI.updateSettings(formData);
                toast.success('Imagen de fondo guardada exitosamente');
                await loadSettings();
                setBackgroundFile(null);
                setBackgroundPreview(null);
            } else {
                toast.success('No hay cambios para guardar');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
                    <p className="text-gray-400">Ajustes generales del sistema</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                >
                    {saving ? (
                        <>
                            <div className="spinner w-5 h-5 mr-2" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>

            {/* General Settings */}
            <div className="card p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Server className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Configuración General</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nombre del Sitio
                        </label>
                        <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Descripción del Sitio
                        </label>
                        <textarea
                            value={settings.siteDescription}
                            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                            className="input min-h-[100px]"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="maintenance"
                            checked={settings.maintenanceMode}
                            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                            className="w-4 h-4 bg-dark-700 border-dark-600 rounded text-red-600 focus:ring-red-600"
                        />
                        <label htmlFor="maintenance" className="text-sm text-gray-300">
                            Modo de Mantenimiento (el sitio no estará disponible para usuarios)
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="registration"
                            checked={settings.allowRegistration}
                            onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                            className="w-4 h-4 bg-dark-700 border-dark-600 rounded text-blue-600 focus:ring-blue-600"
                        />
                        <label htmlFor="registration" className="text-sm text-gray-300">
                            Permitir registro de nuevos usuarios
                        </label>
                    </div>

                    {/* Homepage Background */}
                    <div className="card p-6 space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-pink-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Imagen de Fondo de Inicio</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Imagen de Fondo del Hero
                                </label>
                                <p className="text-sm text-gray-500 mb-4">
                                    Esta imagen se mostrará como fondo en la sección principal de la página de inicio.
                                </p>

                                {/* Current Background Preview */}
                                {homepageBackground && !backgroundPreview && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-400 mb-2">Imagen actual:</p>
                                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-dark-800">
                                            <img
                                                src={getImageUrl(homepageBackground)}
                                                alt="Fondo actual"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* New Background Preview */}
                                {backgroundPreview && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-400 mb-2">Nueva imagen:</p>
                                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-dark-800">
                                            <img
                                                src={backgroundPreview}
                                                alt="Vista previa"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={handleRemoveBackground}
                                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* File Input */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBackgroundChange}
                                    className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary-600 file:text-white
                                hover:file:bg-primary-700
                                cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Settings */}
            <div className="card p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Configuración de Email</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email de Contacto
                        </label>
                        <input
                            type="email"
                            value={settings.contactEmail}
                            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email de Soporte
                        </label>
                        <input
                            type="email"
                            value={settings.supportEmail}
                            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                            className="input"
                        />
                    </div>
                </div>
            </div>

            {/* Payment Settings */}
            <div className="card p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Métodos de Pago</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded flex items-center justify-center">
                                <span className="text-xl">💳</span>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Stripe</p>
                                <p className="text-sm text-gray-500">Tarjetas de crédito/débito</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.stripeEnabled}
                                onChange={(e) => setSettings({ ...settings, stripeEnabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded flex items-center justify-center">
                                <span className="text-xl">🅿️</span>
                            </div>
                            <div>
                                <p className="font-semibold text-white">PayPal</p>
                                <p className="text-sm text-gray-500">PayPal y tarjetas</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.paypalEnabled}
                                onChange={(e) => setSettings({ ...settings, paypalEnabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Notifications Settings */}
            <div className="card p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Notificaciones</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="emailNotif"
                            checked={settings.emailNotifications}
                            onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                            className="w-4 h-4 bg-dark-700 border-dark-600 rounded text-blue-600 focus:ring-blue-600"
                        />
                        <label htmlFor="emailNotif" className="text-sm text-gray-300">
                            Enviar notificaciones por email
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="pushNotif"
                            checked={settings.pushNotifications}
                            onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                            className="w-4 h-4 bg-dark-700 border-dark-600 rounded text-blue-600 focus:ring-blue-600"
                        />
                        <label htmlFor="pushNotif" className="text-sm text-gray-300">
                            Enviar notificaciones push
                        </label>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="card p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Seguridad</h2>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-dark-800 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Versión de la API</p>
                        <p className="text-white font-mono">v1.0.0</p>
                    </div>

                    <div className="p-4 bg-dark-800 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Última actualización</p>
                        <p className="text-white">{new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
