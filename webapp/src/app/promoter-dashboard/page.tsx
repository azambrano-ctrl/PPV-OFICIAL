'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { promotersAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Save, Globe, Facebook, Instagram, Twitter, Image as ImageIcon,
    User, Trophy, Upload, Trash2, X, TrendingUp, LayoutDashboard,
    ExternalLink, ChevronRight, Zap
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import ImageUpload from '@/components/admin/ImageUpload';
import PromoterEvents from '@/components/promoter/PromoterEvents';
import PromoterAnalytics from '@/components/promoter/PromoterAnalytics';

type Tab = 'overview' | 'profile' | 'events' | 'analytics';

export default function PromoterDashboard() {
    const router = useRouter();
    const { user, isPromoter, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const [promoter, setPromoter] = useState<any>(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        social_links: { facebook: '', instagram: '', twitter: '', website: '' },
        gallery: [] as string[]
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
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
            const p = response.data.data;
            setPromoter(p);
            setFormData({
                id: p.id,
                name: p.name,
                description: p.description || '',
                social_links: p.social_links || { facebook: '', instagram: '', twitter: '', website: '' },
                gallery: p.gallery || []
            });
            setLogoPreview(getImageUrl(p.logo_url) || null);
            setBannerPreview(getImageUrl(p.banner_url) || null);
        } catch (error) {
            toast.error('Error al cargar tu perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setGalleryFiles(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setGalleryPreviews(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const handleSingleFile = (file: File, type: 'logo' | 'banner') => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'logo') { setLogoPreview(reader.result as string); setLogoFile(file); }
            else { setBannerPreview(reader.result as string); setBannerFile(file); }
        };
        reader.readAsDataURL(file);
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
            galleryFiles.forEach(f => data.append('gallery', f));
            if (imagesToRemove.length > 0) data.append('gallery_to_remove', JSON.stringify(imagesToRemove));

            await promotersAPI.update(user!.promoter_id!, data);
            toast.success('Perfil actualizado');
            setGalleryFiles([]); setGalleryPreviews([]); setImagesToRemove([]);
            loadPromoter();
        } catch (error) {
            toast.error(handleAPIError(error));
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

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Inicio', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'analytics', label: 'Analíticas', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'events', label: 'Eventos', icon: <Trophy className="w-4 h-4" /> },
        { id: 'profile', label: 'Mi Perfil', icon: <User className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-dark-950">
            {/* Hero Banner */}
            <div className="relative h-56 md:h-72 w-full overflow-hidden">
                {bannerPreview ? (
                    <img src={bannerPreview} className="w-full h-full object-cover" alt="banner" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-dark-900 via-primary-950/30 to-dark-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />

                {/* Promoter identity */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 flex items-end gap-5">
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-dark-950 overflow-hidden bg-dark-800 shadow-2xl">
                            {logoPreview
                                ? <img src={logoPreview} className="w-full h-full object-cover" alt="logo" />
                                : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-primary-500">{formData.name?.[0]}</div>
                            }
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-dark-950" />
                    </div>
                    <div className="pb-1">
                        <h1 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{formData.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-full">● Activa</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Promotora Verificada</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="sticky top-16 z-30 bg-dark-950/95 backdrop-blur-sm border-b border-dark-800">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-4 text-sm font-black uppercase italic tracking-tight whitespace-nowrap border-b-2 transition-all ${
                                    activeTab === tab.id
                                        ? 'border-primary-500 text-primary-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-6 py-10">
                {activeTab === 'overview' && (
                    <OverviewTab formData={formData} setActiveTab={setActiveTab} />
                )}
                {activeTab === 'analytics' && <PromoterAnalytics />}
                {activeTab === 'events' && <PromoterEvents promoterId={formData.id} />}
                {activeTab === 'profile' && (
                    <ProfileTab
                        formData={formData}
                        setFormData={setFormData}
                        logoPreview={logoPreview}
                        bannerPreview={bannerPreview}
                        galleryPreviews={galleryPreviews}
                        saving={saving}
                        handleSingleFile={handleSingleFile}
                        handleGalleryAdd={handleGalleryAdd}
                        removeExistingImage={(img: string) => {
                            setImagesToRemove(prev => [...prev, img]);
                            setFormData(prev => ({ ...prev, gallery: prev.gallery.filter(i => i !== img) }));
                        }}
                        removeNewImage={(i: number) => {
                            setGalleryFiles(prev => prev.filter((_, idx) => idx !== i));
                            setGalleryPreviews(prev => prev.filter((_, idx) => idx !== i));
                        }}
                        handleSubmit={handleSubmit}
                    />
                )}
            </div>
        </div>
    );
}

function OverviewTab({ formData, setActiveTab }: { formData: any; setActiveTab: (tab: Tab) => void }) {
    const quickActions = [
        { label: 'Ver Analíticas', desc: 'Ventas y ganancias', icon: <TrendingUp className="w-5 h-5" />, color: 'from-primary-600 to-primary-800', tab: 'analytics' as Tab },
        { label: 'Mis Eventos', desc: 'Gestionar eventos', icon: <Trophy className="w-5 h-5" />, color: 'from-purple-600 to-purple-900', tab: 'events' as Tab },
        { label: 'Editar Perfil', desc: 'Logo, banner, bio', icon: <User className="w-5 h-5" />, color: 'from-blue-600 to-blue-900', tab: 'profile' as Tab },
    ];

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Welcome */}
            <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">Bienvenida de nuevo</p>
                <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                    Panel de <span className="text-primary-500">Control</span>
                </h2>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map(action => (
                    <button
                        key={action.tab}
                        onClick={() => setActiveTab(action.tab)}
                        className={`group relative overflow-hidden bg-gradient-to-br ${action.color} p-6 rounded-3xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl`}
                    >
                        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            <div className="w-16 h-16">{action.icon}</div>
                        </div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 text-white">
                                {action.icon}
                            </div>
                            <h3 className="text-white font-black italic uppercase text-lg leading-tight">{action.label}</h3>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">{action.desc}</p>
                        </div>
                        <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
                    </button>
                ))}
            </div>

            {/* Tips */}
            <div className="bg-dark-900/50 border border-dark-800 rounded-3xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                    <h4 className="text-white font-black italic uppercase text-sm mb-1">Consejo Rápido</h4>
                    <p className="text-gray-400 text-sm">Completa tu perfil con logo, banner y descripción para atraer más audiencia a tus eventos. Un perfil completo genera más confianza.</p>
                </div>
            </div>
        </div>
    );
}

function ProfileTab({ formData, setFormData, logoPreview, bannerPreview, galleryPreviews, saving, handleSingleFile, handleGalleryAdd, removeExistingImage, removeNewImage, handleSubmit }: any) {
    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left */}
                <div className="space-y-6">
                    {/* Logo */}
                    <div className="bg-dark-900/50 border border-dark-800 rounded-3xl p-6 space-y-4">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logo de la Promotora</h3>
                        <div className="w-32 h-32 mx-auto">
                            <ImageUpload label="" aspect={1} onChange={(f: File) => handleSingleFile(f, 'logo')} value={logoPreview || undefined} compact={true} />
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="bg-dark-900/50 border border-dark-800 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary-500" />
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descripción</h3>
                        </div>
                        <textarea
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary-500 outline-none min-h-[140px] resize-none text-sm"
                            placeholder="Cuéntale tu historia al mundo..."
                        />
                    </div>

                    {/* Social */}
                    <div className="bg-dark-900/50 border border-dark-800 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Facebook className="w-4 h-4 text-blue-500" />
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Redes Sociales</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: 'facebook', icon: <Facebook className="w-4 h-4 text-blue-500" />, placeholder: 'facebook.com/...' },
                                { key: 'instagram', icon: <Instagram className="w-4 h-4 text-pink-500" />, placeholder: 'instagram.com/...' },
                                { key: 'twitter', icon: <Twitter className="w-4 h-4 text-sky-500" />, placeholder: 'twitter.com/...' },
                                { key: 'website', icon: <Globe className="w-4 h-4 text-green-500" />, placeholder: 'tuwebsite.com' },
                            ].map(({ key, icon, placeholder }) => (
                                <div key={key} className="flex items-center gap-3 bg-dark-800 border border-dark-700 rounded-xl px-3 py-2">
                                    {icon}
                                    <input
                                        type="text"
                                        value={(formData.social_links as any)[key]}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, social_links: { ...formData.social_links, [key]: e.target.value } })}
                                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                                        placeholder={placeholder}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Name */}
                    <div className="bg-dark-900/50 border border-dark-800 rounded-3xl p-6 space-y-3">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre de la Promotora</h3>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-transparent border-b-2 border-dark-700 text-4xl font-black text-white italic uppercase tracking-tighter focus:border-primary-500 outline-none placeholder:text-dark-700 transition-colors pb-2"
                            placeholder="TU MARCA"
                            required
                        />
                    </div>

                    {/* Banner */}
                    <div className="bg-dark-900/50 border border-dark-800 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-purple-500" />
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Imagen de Portada</h3>
                        </div>
                        <div className="h-52 w-full">
                            <ImageUpload label="" onChange={(f: File) => handleSingleFile(f, 'banner')} value={bannerPreview || undefined} />
                        </div>
                    </div>

                    {/* Gallery */}
                    <div className="bg-dark-900/50 border border-dark-800 rounded-3xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-green-500" />
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Galería</h3>
                            </div>
                            <label className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase italic cursor-pointer transition-all">
                                <Upload className="w-4 h-4" />
                                Añadir
                                <input type="file" className="hidden" multiple accept="image/*" onChange={handleGalleryAdd} />
                            </label>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            {formData.gallery.map((img: string, i: number) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group bg-dark-800 border border-dark-700">
                                    <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
                                    <button type="button" onClick={() => removeExistingImage(img)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Trash2 className="w-5 h-5 text-red-400" />
                                    </button>
                                </div>
                            ))}
                            {galleryPreviews.map((preview: string, i: number) => (
                                <div key={`new-${i}`} className="aspect-square rounded-2xl overflow-hidden relative group ring-2 ring-primary-500">
                                    <img src={preview} className="w-full h-full object-cover" alt="" />
                                    <button type="button" onClick={() => removeNewImage(i)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-full font-black uppercase italic transform hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-600/30 flex items-center gap-3 disabled:opacity-50"
                        >
                            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Guardando...</span></> : <><Save className="w-5 h-5" /><span>Guardar Cambios</span></>}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
