'use client';

import { useState, useEffect } from 'react';
import { settingsAPI } from '@/lib/api';
import { Save, AlertCircle, Layout, FileText, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

type Tab = 'general' | 'about' | 'gallery';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [form, setForm] = useState({
        homepage_background: '',
        about_hero_title: '',
        about_hero_subtitle: '',
        about_mission_title: '',
        about_mission_text: '',
        about_values: [] as any[]
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data } = await settingsAPI.get();
            setForm({
                homepage_background: data.data.homepage_background || '',
                about_hero_title: data.data.about_hero_title || '',
                about_hero_subtitle: data.data.about_hero_subtitle || '',
                about_mission_title: data.data.about_mission_title || '',
                about_mission_text: data.data.about_mission_text || '',
                about_values: typeof data.data.about_values === 'string'
                    ? JSON.parse(data.data.about_values)
                    : (data.data.about_values || [])
            });
        } catch (error) {
            console.error('Error loading settings:', error);
            setMessage({ type: 'error', text: 'Error al cargar configuración' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const formData = new FormData();

            // Append all fields regardless of tab to save complete state
            if (form.homepage_background) formData.append('homepage_background', form.homepage_background);

            formData.append('about_hero_title', form.about_hero_title);
            formData.append('about_hero_subtitle', form.about_hero_subtitle);
            formData.append('about_mission_title', form.about_mission_title);
            formData.append('about_mission_text', form.about_mission_text);
            formData.append('about_values', JSON.stringify(form.about_values));

            await settingsAPI.update(formData);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });

            await loadSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Error al guardar cambios' });
        } finally {
            setSaving(false);
        }
    };

    const handleValueChange = (index: number, field: string, value: string) => {
        const newValues = [...form.about_values];
        newValues[index] = { ...newValues[index], [field]: value };
        setForm({ ...form, about_values: newValues });
    };

    if (loading) return <div className="p-8 text-center text-white">Cargando...</div>;

    const tabs = [
        { id: 'general', label: 'General', icon: Layout },
        { id: 'about', label: 'Página Nosotros', icon: FileText },
        { id: 'gallery', label: 'Galería', icon: ImageIcon },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Configuración del Sitio</h1>
                    <p className="text-dark-400">Personaliza el contenido de tu web</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-dark-800 space-x-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-500'
                                    : 'border-transparent text-dark-400 hover:text-white'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'success' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                    }`}>
                    <AlertCircle className="w-5 h-5" />
                    <span>{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Tab: General */}
                {activeTab === 'general' && (
                    <div className="bg-dark-900 p-6 rounded-xl border border-dark-800 space-y-6">
                        <h2 className="text-xl font-bold mb-4 text-white">Configuración General</h2>

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-dark-300">Imagen de Fondo (Inicio)</label>
                            <div className="border-2 border-dashed border-dark-700 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors">
                                {/* Placeholder for Image Upload Component integration - using text input for now or integrate actual component if available */}
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="URL de imagen de fondo"
                                    value={form.homepage_background}
                                    onChange={(e) => setForm({ ...form, homepage_background: e.target.value })}
                                />
                                <p className="text-xs text-dark-500 mt-2">Próximamente: Subida directa de archivos aquí.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Nosotros */}
                {activeTab === 'about' && (
                    <div className="space-y-8">
                        {/* Sección Hero */}
                        <div className="bg-dark-900 p-6 rounded-xl border border-dark-800">
                            <h2 className="text-xl font-bold mb-4 text-white">Página "Nosotros" - Hero</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Título Principal</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={form.about_hero_title}
                                        onChange={(e) => setForm({ ...form, about_hero_title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Subtítulo (Gradiente)</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={form.about_hero_subtitle}
                                        onChange={(e) => setForm({ ...form, about_hero_subtitle: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección Misión */}
                        <div className="bg-dark-900 p-6 rounded-xl border border-dark-800">
                            <h2 className="text-xl font-bold mb-4 text-white">Página "Nosotros" - Misión</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Título de Misión</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={form.about_mission_title}
                                        onChange={(e) => setForm({ ...form, about_mission_title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Texto de Misión</label>
                                    <textarea
                                        className="input w-full h-32"
                                        value={form.about_mission_text}
                                        onChange={(e) => setForm({ ...form, about_mission_text: e.target.value })}
                                    />
                                    <p className="text-xs text-dark-400">Acepta saltos de línea.</p>
                                </div>
                            </div>
                        </div>

                        {/* Sección Valores (JSON) */}
                        <div className="bg-dark-900 p-6 rounded-xl border border-dark-800">
                            <h2 className="text-xl font-bold mb-4 text-white">Página "Nosotros" - Valores (Cards)</h2>
                            <div className="space-y-6">
                                {form.about_values.map((val, idx) => (
                                    <div key={idx} className="p-4 bg-dark-950 rounded-lg border border-dark-700 space-y-3">
                                        <div className="flex justify-between">
                                            <h3 className="font-semibold text-primary-400">Valor #{idx + 1}</h3>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Título (ej: Excelencia)"
                                                className="input w-full"
                                                value={val.title}
                                                onChange={(e) => handleValueChange(idx, 'title', e.target.value)}
                                            />
                                            <select
                                                className="input w-full"
                                                value={val.icon}
                                                onChange={(e) => handleValueChange(idx, 'icon', e.target.value)}
                                            >
                                                <option value="Zap">Rayo (Zap)</option>
                                                <option value="Globe">Mundo (Globe)</option>
                                                <option value="Trophy">Trofeo (Trophy)</option>
                                            </select>
                                        </div>
                                        <textarea
                                            placeholder="Descripción"
                                            className="input w-full h-20"
                                            value={val.description}
                                            onChange={(e) => handleValueChange(idx, 'description', e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Galería */}
                {activeTab === 'gallery' && (
                    <div className="bg-dark-900 p-6 rounded-xl border border-dark-800 text-center py-12">
                        <ImageIcon className="w-16 h-16 text-dark-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Galería de Imágenes</h3>
                        <p className="text-dark-400 max-w-md mx-auto">
                            Próximamente podrás subir múltiples imágenes aquí para el slider de la página "Nosotros".
                        </p>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-dark-800">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center space-x-2"
                    >
                        {saving ? (
                            <><span>Guardando...</span></>
                        ) : (
                            <><Save className="w-5 h-5" /><span>Guardar Todo</span></>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
