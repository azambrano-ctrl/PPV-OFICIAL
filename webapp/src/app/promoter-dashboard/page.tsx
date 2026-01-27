'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { promotersAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Calendar, Globe, Facebook, Instagram, Twitter, Image as ImageIcon, User, Trophy, Upload, Trash2, X } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import ImageUpload from '@/components/admin/ImageUpload';
import PromoterEvents from '@/components/promoter/PromoterEvents';

export default function PromoterDashboard() {
    const router = useRouter();
    const { user, isPromoter, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'events'>('profile');

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        social_links: {
            facebook: '',
            instagram: '',
            twitter: '',
            website: ''
        },
        gallery: [] as string[]
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (!isPromoter || !user?.promoter_id) {
            toast.error('No tienes permisos de promotora');
            router.push('/');
            return;
        }
        loadPromoter();
    }, [isAuthenticated, isPromoter, user, router]);

    const loadPromoter = async () => {
        try {
            const response = await promotersAPI.getById(user!.promoter_id!);
            const promoter = response.data.data;

            setFormData({
                id: promoter.id,
                name: promoter.name,
                description: promoter.description || '',
                social_links: promoter.social_links || { facebook: '', instagram: '', twitter: '', website: '' },
                gallery: promoter.gallery || []
            });

            setLogoPreview(getImageUrl(promoter.logo_url) || null);
            setBannerPreview(getImageUrl(promoter.banner_url) || null);

        } catch (error) {
            console.error('Error loading promoter:', error);
            toast.error('Error al cargar tu perfil de promotora');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner' | 'gallery') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (type === 'gallery') {
            const newFiles = Array.from(files);
            setGalleryFiles(prev => [...prev, ...newFiles]);

            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setGalleryPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        } else {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'logo') {
                    setLogoPreview(reader.result as string);
                    setLogoFile(file);
                } else {
                    setBannerPreview(reader.result as string);
                    setBannerFile(file);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeExistingImage = (img: string) => {
        setImagesToRemove(prev => [...prev, img]);
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter(i => i !== img)
        }));
    };

    const removeNewImage = (index: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('social_links', JSON.stringify(formData.social_links));

            if (logoFile) data.append('logo', logoFile);
            if (bannerFile) data.append('banner', bannerFile);

            galleryFiles.forEach(file => {
                data.append('gallery', file);
            });

            if (imagesToRemove.length > 0) {
                data.append('gallery_to_remove', JSON.stringify(imagesToRemove));
            }

            await promotersAPI.update(user!.promoter_id!, data);
            toast.success('Perfil actualizado exitosamente');
            setGalleryFiles([]);
            setGalleryPreviews([]);
            setImagesToRemove([]);
            loadPromoter();
        } catch (error) {
            console.error('Error updating profile:', error);
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950 pt-32 pb-20">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Navigation */}
                    <aside className="lg:w-80 space-y-8">
                        <div>
                            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">Panel de Control</h1>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Gestión de Promotora</p>
                        </div>

                        <nav className="space-y-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase italic tracking-tighter transition-all ${activeTab === 'profile' ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20' : 'text-gray-500 hover:text-white hover:bg-dark-900 border border-transparent'}`}
                            >
                                <User className="w-5 h-5" />
                                Mi Perfil
                            </button>
                            <button
                                onClick={() => setActiveTab('events')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase italic tracking-tighter transition-all ${activeTab === 'events' ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20' : 'text-gray-500 hover:text-white hover:bg-dark-900 border border-transparent'}`}
                            >
                                <Trophy className="w-5 h-5" />
                                Mis Eventos
                            </button>
                        </nav>

                        {/* Status Card */}
                        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estado de Cuenta</span>
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black italic uppercase text-lg leading-tight">Activo</h4>
                                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">Promotora Verificada</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1">
                        {activeTab === 'events' ? (
                            <PromoterEvents promoterId={formData.id} />
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-12">
                                {/* Header Info */}
                                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                                    <div className="w-40 h-40 group relative shrink-0">
                                        <ImageUpload
                                            label=""
                                            aspect={1}
                                            onChange={(file) => setLogoFile(file)}
                                            value={logoPreview || undefined}
                                        />
                                        <div className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2.5 rounded-xl shadow-xl border-4 border-dark-950 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Nombre de la Promotora</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-transparent border-b-2 border-dark-800 text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter focus:border-primary-600 outline-none placeholder:text-dark-800 transition-colors"
                                                placeholder="TU MARCA AQUÍ"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column: Bio & Social */}
                                    <div className="lg:col-span-1 space-y-8">
                                        <section className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 space-y-6">
                                            <div className="flex items-center gap-2 text-white font-bold">
                                                <Globe className="w-5 h-5 text-primary-500" />
                                                <h3 className="uppercase tracking-widest text-xs italic">Detalles Públicos</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Biografía / Descripción</label>
                                                    <textarea
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary-500 outline-none transition-all min-h-[160px] resize-none text-sm"
                                                        placeholder="Cuentales tu historia..."
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-dark-900/50 p-6 rounded-3xl border border-dark-800 space-y-6">
                                            <div className="flex items-center gap-2 text-white font-bold">
                                                <Facebook className="w-5 h-5 text-blue-500" />
                                                <h3 className="uppercase tracking-widest text-xs italic">Redes Sociales</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {Object.keys(formData.social_links).map((key) => (
                                                    <div key={key}>
                                                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">{key}</label>
                                                        <input
                                                            type="text"
                                                            value={(formData.social_links as any)[key]}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                social_links: { ...formData.social_links, [key]: e.target.value }
                                                            })}
                                                            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                                                            placeholder={`https://${key}.com/...`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right Column: Visuals & Gallery */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <section className="bg-dark-900/50 p-8 rounded-3xl border border-dark-800 space-y-8">
                                            <div className="flex items-center gap-2 text-white font-bold">
                                                <ImageIcon className="w-5 h-5 text-purple-500" />
                                                <h3 className="uppercase tracking-widest text-xs italic">Activos Visuales</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Imagen de Portada (Banner)</label>
                                                <div className="h-60 w-full group relative">
                                                    <ImageUpload
                                                        label=""
                                                        onChange={(file) => setBannerFile(file)}
                                                        value={bannerPreview || undefined}
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-dark-900/50 p-8 rounded-3xl border border-dark-800 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-white font-bold">
                                                    <Trophy className="w-5 h-5 text-green-500" />
                                                    <h3 className="uppercase tracking-widest text-xs italic">Galería de Eventos</h3>
                                                </div>
                                                <label className="bg-dark-800 hover:bg-dark-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase italic cursor-pointer transition-all flex items-center gap-2 border border-dark-700">
                                                    <Upload className="w-4 h-4" />
                                                    Añadir Fotos
                                                    <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'gallery')} />
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {formData.gallery.map((img, index) => (
                                                    <div key={`existing-${index}`} className="aspect-square bg-dark-800 rounded-2xl overflow-hidden relative group border border-dark-700">
                                                        <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`Gallery ${index}`} />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExistingImage(img)}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {galleryPreviews.map((preview, index) => (
                                                    <div key={`new-${index}`} className="aspect-square bg-dark-800 rounded-2xl overflow-hidden relative group ring-2 ring-primary-500">
                                                        <img src={preview} className="w-full h-full object-cover" alt={`New ${index}`} />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeNewImage(index)}
                                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <div className="flex justify-end pt-6">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="bg-primary-600 hover:bg-primary-500 text-white px-12 py-5 rounded-full font-black uppercase italic transform hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary-600/30 flex items-center gap-3 disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <>
                                                        <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                                        <span>Guardando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-6 h-6" />
                                                        <span>Sincronizar Panel</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
