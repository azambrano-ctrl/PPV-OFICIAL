'use client';

import { useState, useEffect } from 'react';
import { settingsAPI } from '@/lib/api';
import { Save, AlertCircle, Layout, FileText, Image as ImageIcon, X, CreditCard, Facebook, Instagram, Twitter, Video, Plus, Trash2 } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

type Tab = 'general' | 'about' | 'gallery' | 'payments' | 'season-pass';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // To hold actual File objects
    const [fileState, setFileState] = useState({
        homepage_background: null as File | null,
        homepage_video: null as File | null,
        homepage_slider: [] as File[],
        about_background: null as File | null,
        about_gallery: [] as File[],
        site_logo: null as File | null,
        site_favicon: null as File | null
    });

    const [form, setForm] = useState({
        // General
        site_name: 'PPV Streaming',
        site_description: '',
        contact_email: '',
        homepage_background: '',
        homepage_video: '',
        homepage_slider: [] as string[],
        site_logo: '',
        site_logo_width: 40,
        site_logo_offset_x: 0,
        site_logo_offset_y: 0,
        site_favicon: '',
        social_links: { facebook: '', instagram: '', twitter: '' } as any,

        // About
        about_hero_title: '',
        about_hero_subtitle: '',
        about_background: '',
        about_mission_title: '',
        about_mission_text: '',
        about_values: [] as any[],
        // Stored as string array in DB JSONB, but usually parsed by API. 
        // We handle it as array here.
        about_slider_images: [] as string[],
        about_stats_users: '10k+',
        about_stats_events: '50+',

        // Payments
        stripe_enabled: false,
        stripe_public_key: '',
        stripe_secret_key: '',
        paypal_enabled: false,
        paypal_client_id: '',
        paypal_secret_key: '',

        // Season Pass
        season_pass_enabled: false,
        season_pass_title: '',
        season_pass_description: '',
        season_pass_price: 0,
        season_pass_button_text: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data } = await settingsAPI.get();
            const d = data.data;

            setForm({
                site_name: d.site_name || '',
                site_description: d.site_description || '',
                contact_email: d.contact_email || '',
                homepage_background: d.homepage_background || '',
                homepage_video: d.homepage_video || '',
                homepage_slider: typeof d.homepage_slider === 'string' ? JSON.parse(d.homepage_slider) : (d.homepage_slider || []),
                site_logo: d.site_logo || '',
                site_logo_width: d.site_logo_width || 40,
                site_logo_offset_x: d.site_logo_offset_x || 0,
                site_logo_offset_y: d.site_logo_offset_y || 0,
                site_favicon: d.site_favicon || '',
                social_links: typeof d.social_links === 'string' ? JSON.parse(d.social_links) : (d.social_links || { facebook: '', instagram: '', twitter: '' }),

                about_hero_title: d.about_hero_title || '',
                about_hero_subtitle: d.about_hero_subtitle || '',
                about_background: d.about_background || '',
                about_mission_title: d.about_mission_title || '',
                about_mission_text: d.about_mission_text || '',
                about_values: typeof d.about_values === 'string' ? JSON.parse(d.about_values) : (d.about_values || []),
                about_slider_images: typeof d.about_slider_images === 'string' ? JSON.parse(d.about_slider_images) : (d.about_slider_images || []),
                about_stats_users: d.about_stats_users || '10k+',
                about_stats_events: d.about_stats_events || '50+',

                stripe_enabled: d.stripe_enabled || false,
                stripe_public_key: d.stripe_public_key || '',
                stripe_secret_key: d.stripe_secret_key || '',
                paypal_enabled: d.paypal_enabled || false,
                paypal_client_id: d.paypal_client_id || '',
                paypal_secret_key: d.paypal_secret_key || '',

                season_pass_enabled: d.season_pass_enabled || false,
                season_pass_title: d.season_pass_title || '',
                season_pass_description: d.season_pass_description || '',
                season_pass_price: d.season_pass_price || 0,
                season_pass_button_text: d.season_pass_button_text || ''
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

            // Files
            if (fileState.homepage_background) {
                formData.append('homepage_background', fileState.homepage_background);
            } else if (form.homepage_background) {
                formData.append('homepage_background', form.homepage_background);
            }

            if (fileState.homepage_video) {
                formData.append('homepage_video', fileState.homepage_video);
            } else {
                formData.append('homepage_video', form.homepage_video || '');
            }

            fileState.homepage_slider.forEach((file) => {
                formData.append('homepage_slider', file);
            });
            formData.append('homepage_slider', JSON.stringify(form.homepage_slider));

            if (fileState.about_background) {
                formData.append('about_background', fileState.about_background);
            } else if (form.about_background) {
                formData.append('about_background', form.about_background);
            }

            fileState.about_gallery.forEach((file) => {
                formData.append('about_gallery', file);
            });

            if (fileState.site_logo) {
                formData.append('site_logo', fileState.site_logo);
            } else if (form.site_logo) {
                formData.append('site_logo', form.site_logo);
            }

            if (fileState.site_favicon) {
                formData.append('site_favicon', fileState.site_favicon);
            } else if (form.site_favicon) {
                formData.append('site_favicon', form.site_favicon);
            }

            // General
            formData.append('site_name', form.site_name);
            formData.append('site_description', form.site_description);
            formData.append('contact_email', form.contact_email);
            formData.append('social_links', JSON.stringify(form.social_links));
            formData.append('site_logo_width', String(form.site_logo_width));
            formData.append('site_logo_offset_x', String(form.site_logo_offset_x));
            formData.append('site_logo_offset_y', String(form.site_logo_offset_y));

            // About
            formData.append('about_hero_title', form.about_hero_title);
            formData.append('about_hero_subtitle', form.about_hero_subtitle);
            formData.append('about_mission_title', form.about_mission_title);
            formData.append('about_mission_text', form.about_mission_text);
            formData.append('about_values', JSON.stringify(form.about_values));
            formData.append('about_slider_images', JSON.stringify(form.about_slider_images));
            formData.append('about_stats_users', form.about_stats_users);
            formData.append('about_stats_events', form.about_stats_events);

            // Payments
            formData.append('stripe_enabled', String(form.stripe_enabled));
            formData.append('stripe_public_key', form.stripe_public_key);
            formData.append('stripe_secret_key', form.stripe_secret_key);
            formData.append('paypal_enabled', String(form.paypal_enabled));
            formData.append('paypal_client_id', form.paypal_client_id);
            formData.append('paypal_secret_key', form.paypal_secret_key);

            // Season Pass
            formData.append('season_pass_enabled', String(form.season_pass_enabled));
            formData.append('season_pass_title', form.season_pass_title);
            formData.append('season_pass_description', form.season_pass_description);
            formData.append('season_pass_price', String(form.season_pass_price));
            formData.append('season_pass_button_text', form.season_pass_button_text);

            await settingsAPI.update(formData);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });

            setFileState({
                homepage_background: null,
                homepage_video: null,
                homepage_slider: [],
                about_background: null,
                about_gallery: [],
                site_logo: null,
                site_favicon: null
            });
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
        { id: 'payments', label: 'Pagos', icon: CreditCard },
        { id: 'season-pass', label: 'Pase de Temporada', icon: Save },
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
                            //@ts-ignore
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
                        <h2 className="text-xl font-bold mb-4 text-white">Información Básica</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-dark-300">Nombre del Sitio</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={form.site_name}
                                    onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-dark-300">Email de Contacto</label>
                                <input
                                    type="email"
                                    className="input w-full"
                                    value={form.contact_email}
                                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-dark-300">Descripción del Sitio</label>
                                <textarea
                                    className="input w-full h-20"
                                    value={form.site_description}
                                    onChange={(e) => setForm({ ...form, site_description: e.target.value })}
                                />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold pt-4 text-white">Redes Sociales</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-dark-300">
                                    <Facebook className="w-4 h-4 text-primary-500" /> Facebook
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="https://facebook.com/..."
                                    value={form.social_links.facebook || ''}
                                    onChange={(e) => setForm({
                                        ...form,
                                        social_links: { ...form.social_links, facebook: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-dark-300">
                                    <Instagram className="w-4 h-4 text-primary-500" /> Instagram
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="https://instagram.com/..."
                                    value={form.social_links.instagram || ''}
                                    onChange={(e) => setForm({
                                        ...form,
                                        social_links: { ...form.social_links, instagram: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-dark-300">
                                    <Twitter className="w-4 h-4 text-primary-500" /> X (Twitter)
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="https://twitter.com/..."
                                    value={form.social_links.twitter || ''}
                                    onChange={(e) => setForm({
                                        ...form,
                                        social_links: { ...form.social_links, twitter: e.target.value }
                                    })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-dark-800">
                            <ImageUpload
                                label="Imagen de Fondo (Inicio)"
                                value={form.homepage_background}
                                maxSize={50}
                                onChange={(file, previewUrl) => {
                                    if (file) {
                                        setFileState(prev => ({ ...prev, homepage_background: file }));
                                    }
                                    setForm({ ...form, homepage_background: previewUrl || '' });
                                }}
                            />

                            {/* Video Background Section */}
                            <div className="space-y-4 p-4 bg-dark-950 rounded-lg border border-dark-800">
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <Video className="w-5 h-5 text-primary-500" />
                                    <span>Video de Fondo (Opcional)</span>
                                </div>
                                <p className="text-xs text-dark-500">Si se sube un video, este tendrá prioridad sobre la imagen o el slider. MP4/WebM máx 50MB.</p>

                                {form.homepage_video || fileState.homepage_video ? (
                                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black group">
                                        <video
                                            src={fileState.homepage_video ? URL.createObjectURL(fileState.homepage_video) : form.homepage_video}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFileState({ ...fileState, homepage_video: null });
                                                    setForm({ ...form, homepage_video: '' });
                                                }}
                                                className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-dark-800 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="video/mp4,video/webm"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setFileState({ ...fileState, homepage_video: file });
                                                }
                                            }}
                                        />
                                        <Video className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                                        <span className="text-sm text-dark-400">Seleccionar Video</span>
                                    </div>
                                )}
                            </div>

                            {/* Slider Background Section */}
                            <div className="space-y-4 p-4 bg-dark-950 rounded-lg border border-dark-800">
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <ImageIcon className="w-5 h-5 text-primary-500" />
                                    <span>Slider de Imágenes (Slidephoto)</span>
                                </div>
                                <p className="text-xs text-dark-500">Se usará si no hay un video configurado. Las imágenes rotarán automáticamente.</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {form.homepage_slider.map((img, idx) => (
                                        <div key={idx} className="relative group aspect-video bg-dark-800 rounded-lg overflow-hidden border border-dark-700">
                                            <img src={img} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = form.homepage_slider.filter((_, i) => i !== idx);
                                                    setForm({ ...form, homepage_slider: newImages });
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {fileState.homepage_slider.map((file, idx) => (
                                        <div key={`new-sl-${idx}`} className="relative group aspect-video bg-dark-800 rounded-lg overflow-hidden border border-primary-500/50">
                                            <img src={URL.createObjectURL(file)} alt="New slide" className="w-full h-full object-cover opacity-70" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[10px] font-bold bg-primary-600 px-2 py-0.5 rounded">NUEVA</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newFiles = fileState.homepage_slider.filter((_, i) => i !== idx);
                                                    setFileState(prev => ({ ...prev, homepage_slider: newFiles }));
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white opacity-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="border-2 border-dashed border-dark-800 rounded-lg aspect-video flex items-center justify-center hover:border-primary-500 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length > 0) {
                                                    setFileState(prev => ({
                                                        ...prev,
                                                        homepage_slider: [...prev.homepage_slider, ...files]
                                                    }));
                                                }
                                            }}
                                        />
                                        <Plus className="w-6 h-6 text-dark-600" />
                                    </div>
                                </div>
                            </div>

                            <ImageUpload
                                label="Logo del Sitio"
                                value={form.site_logo}
                                maxSize={50}
                                aspect={0}
                                onChange={(file, previewUrl) => {
                                    if (file) {
                                        setFileState(prev => ({ ...prev, site_logo: file }));
                                    }
                                    setForm({ ...form, site_logo: previewUrl || '' });
                                }}
                            />

                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-dark-300">Ancho del Logo (px)</label>
                                    <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-1 rounded">{form.site_logo_width}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="300"
                                    step="1"
                                    className="w-full accent-primary-500 bg-dark-800 rounded-lg h-2"
                                    value={form.site_logo_width}
                                    onChange={(e) => setForm({ ...form, site_logo_width: parseInt(e.target.value) })}
                                />
                                <div className="flex justify-between text-[10px] text-dark-500">
                                    <span>20px</span>
                                    <span>150px</span>
                                    <span>300px</span>
                                </div>
                            </div>

                            <ImageUpload
                                label="Favicon (Icono de Pestaña)"
                                value={form.site_favicon}
                                maxSize={5}
                                aspect={1}
                                onChange={(file, previewUrl) => {
                                    if (file) {
                                        setFileState(prev => ({ ...prev, site_favicon: file }));
                                    }
                                    setForm({ ...form, site_favicon: previewUrl || '' });
                                }}
                            />
                            <p className="text-xs text-dark-500">- Recomendado: Cuadrado, min 32x32px .png o .ico</p>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-dark-300">Desplazamiento X</label>
                                        <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-1 rounded">{form.site_logo_offset_x}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        step="1"
                                        className="w-full accent-primary-500 bg-dark-800 rounded-lg h-2"
                                        value={form.site_logo_offset_x}
                                        onChange={(e) => setForm({ ...form, site_logo_offset_x: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-dark-300">Desplazamiento Y</label>
                                        <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-1 rounded">{form.site_logo_offset_y}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        step="1"
                                        className="w-full accent-primary-500 bg-dark-800 rounded-lg h-2"
                                        value={form.site_logo_offset_y}
                                        onChange={(e) => setForm({ ...form, site_logo_offset_y: parseInt(e.target.value) })}
                                    />
                                </div>
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
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
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

                            <div className="space-y-2">
                                <ImageUpload
                                    label="Imagen de Fondo (Nosotros)"
                                    value={form.about_background}
                                    maxSize={50}
                                    onChange={(file, previewUrl) => {
                                        if (file) {
                                            setFileState(prev => ({ ...prev, about_background: file }));
                                        }
                                        setForm({ ...form, about_background: previewUrl || '' });
                                    }}
                                />
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
                                <div className="grid md:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-dark-300">Contador Usuarios (Manual)</label>
                                            <span className="text-[10px] bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full font-bold">Auto-Cálculo Activo</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            value={form.about_stats_users}
                                            onChange={(e) => setForm({ ...form, about_stats_users: e.target.value })}
                                            placeholder="Ej: 10k+"
                                        />
                                        <p className="text-[10px] text-dark-500 italic">Este valor se usa como respaldo mientras se cargan los datos reales.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-dark-300">Contador Eventos (Manual)</label>
                                            <span className="text-[10px] bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full font-bold">Auto-Cálculo Activo</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            value={form.about_stats_events}
                                            onChange={(e) => setForm({ ...form, about_stats_events: e.target.value })}
                                            placeholder="Ej: 50+"
                                        />
                                        <p className="text-[10px] text-dark-500 italic">Este valor se usa como respaldo mientras se cargan los datos reales.</p>
                                    </div>
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
                    <div className="bg-dark-900 p-6 rounded-xl border border-dark-800 space-y-6">
                        <h2 className="text-xl font-bold mb-4 text-white">Galería "Nosotros"</h2>

                        {/* Existing Images Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {(form.about_slider_images || []).map((img, idx) => (
                                <div key={idx} className="relative group aspect-video bg-dark-800 rounded-lg overflow-hidden border border-dark-700">
                                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newImages = form.about_slider_images.filter((_, i) => i !== idx);
                                            setForm({ ...form, about_slider_images: newImages });
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {/* New Images Preview */}
                            {fileState.about_gallery.map((file, idx) => (
                                <div key={`new-${idx}`} className="relative group aspect-video bg-dark-800 rounded-lg overflow-hidden border border-primary-500/50">
                                    <img src={URL.createObjectURL(file)} alt="New upload" className="w-full h-full object-cover opacity-70" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold bg-primary-600 px-2 py-1 rounded">NUEVA</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newFiles = fileState.about_gallery.filter((_, i) => i !== idx);
                                            setFileState(prev => ({ ...prev, about_gallery: newFiles }));
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Upload Area */}
                        <div className="border-2 border-dashed border-dark-700 rounded-xl p-8 text-center hover:border-primary-500 transition-colors">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                id="gallery-upload"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setFileState(prev => ({
                                            ...prev,
                                            about_gallery: [...prev.about_gallery, ...Array.from(e.target.files || [])]
                                        }));
                                    }
                                }}
                            />
                            <label htmlFor="gallery-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Click para agregar fotos</p>
                                    <p className="text-xs text-dark-400">Puedes seleccionar varias a la vez</p>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Tab: Payments */}
                {activeTab === 'payments' && (
                    <div className="space-y-8">
                        <div className="bg-dark-900 p-6 rounded-xl border border-dark-800">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CreditCard className="w-6 h-6 text-primary-500" /> Stripe
                                </h2>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.stripe_enabled}
                                        onChange={(e) => setForm({ ...form, stripe_enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    <span className="ms-3 text-sm font-medium text-dark-300">
                                        {form.stripe_enabled ? 'Activado' : 'Desactivado'}
                                    </span>
                                </label>
                            </div>

                            <div className={`space-y-4 ${!form.stripe_enabled && 'opacity-50 pointer-events-none'}`}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Public Key</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        placeholder="pk_test_..."
                                        value={form.stripe_public_key}
                                        onChange={(e) => setForm({ ...form, stripe_public_key: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Secret Key</label>
                                    <input
                                        type="password"
                                        className="input w-full"
                                        placeholder="sk_test_..."
                                        value={form.stripe_secret_key}
                                        onChange={(e) => setForm({ ...form, stripe_secret_key: e.target.value })}
                                    />
                                    <p className="text-xs text-yellow-600">Esta clave es secreta y nunca se enviará al frontend.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark-900 p-6 rounded-xl border border-dark-800">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-blue-500 font-bold italic">PayPal</span>
                                </h2>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.paypal_enabled}
                                        onChange={(e) => setForm({ ...form, paypal_enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    <span className="ms-3 text-sm font-medium text-dark-300">
                                        {form.paypal_enabled ? 'Activado' : 'Desactivado'}
                                    </span>
                                </label>
                            </div>

                            <div className={`space-y-4 ${!form.paypal_enabled && 'opacity-50 pointer-events-none'}`}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Client ID</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={form.paypal_client_id}
                                        onChange={(e) => setForm({ ...form, paypal_client_id: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Secret Key</label>
                                    <input
                                        type="password"
                                        className="input w-full"
                                        value={form.paypal_secret_key}
                                        onChange={(e) => setForm({ ...form, paypal_secret_key: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Season Pass */}
                {activeTab === 'season-pass' && (
                    <div className="bg-dark-900 p-6 rounded-xl border border-dark-800 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Save className="w-6 h-6 text-primary-500" /> Pase de Temporada
                            </h2>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.season_pass_enabled}
                                    onChange={(e) => setForm({ ...form, season_pass_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                <span className="ms-3 text-sm font-medium text-dark-300">
                                    {form.season_pass_enabled ? 'Activado' : 'Desactivado'}
                                </span>
                            </label>
                        </div>

                        <div className={`space-y-4 ${!form.season_pass_enabled && 'opacity-50 pointer-events-none'}`}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Título del Pase</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={form.season_pass_title}
                                        onChange={(e) => setForm({ ...form, season_pass_title: e.target.value })}
                                        placeholder="Pase de Temporada"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-dark-300">Precio del Pase ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input w-full"
                                        value={form.season_pass_price}
                                        onChange={(e) => setForm({ ...form, season_pass_price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-dark-300">Descripción</label>
                                <textarea
                                    className="input w-full h-24"
                                    value={form.season_pass_description}
                                    onChange={(e) => setForm({ ...form, season_pass_description: e.target.value })}
                                    placeholder="Obtén acceso a todos los eventos..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-dark-300">Texto del Botón</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={form.season_pass_button_text}
                                    onChange={(e) => setForm({ ...form, season_pass_button_text: e.target.value })}
                                    placeholder="Comprar Pase"
                                />
                            </div>
                        </div>
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
