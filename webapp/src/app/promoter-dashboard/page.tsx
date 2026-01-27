'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Upload, X, Trash2, Plus, Globe, Settings, Image as ImageIcon } from 'lucide-react';
import { promotersAPI, handleAPIError } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';


export default function PromoterDashboard() {
    const router = useRouter();
    const { user, isPromoter, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
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
    }, [isAuthenticated, isPromoter, user]);

    const loadPromoter = async () => {
        try {
            const response = await promotersAPI.getById(user!.promoter_id!);
            const promoter = response.data.data;

            setFormData({
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
        <div className="min-h-screen bg-dark-950 flex flex-col pt-20">
            <div className="flex flex-1 overflow-hidden">
                <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                    {/* Dashboard Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-dark-900 rounded-2xl border-4 border-dark-800 overflow-hidden shadow-2xl relative">
                                {logoPreview ? (
                                    <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-primary-500 font-bold text-3xl italic uppercase">
                                        {formData.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Panel de Promotora</h1>
                                <p className="text-gray-400">Gestiona la identidad y contenido de <span className="text-primary-500 font-semibold">{formData.name}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/promoter/${user?.promoter_id}`}
                                target="_blank"
                                className="bg-dark-800 hover:bg-dark-700 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all border border-dark-700"
                            >
                                <Globe className="w-5 h-5" />
                                Ver Perfil Público
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Info & Social */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Basic Info */}
                            <section className="bg-dark-900 p-6 rounded-3xl border border-dark-800 space-y-6">
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <Settings className="w-5 h-5 text-primary-500" />
                                    <h3>Información Básica</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre Comercial</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Descripción / Biografía</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all min-h-[150px] resize-none"
                                            placeholder="Cuéntale a tu audiencia quiénes son..."
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Social Media */}
                            <section className="bg-dark-900 p-6 rounded-3xl border border-dark-800 space-y-6">
                                <div className="flex items-center gap-2 text-white font-bold">
                                    <Globe className="w-5 h-5 text-blue-500" />
                                    <h3>Redes Sociales</h3>
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

                        {/* Right Column: Visual Assets */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Banner & Logo assets */}
                            <section className="bg-dark-900 p-8 rounded-3xl border border-dark-800 space-y-8">
                                <div className="flex items-center gap-2 text-white font-bold mb-4">
                                    <ImageIcon className="w-5 h-5 text-purple-500" />
                                    <h3>Activos Visuales</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Logo Asset */}
                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Logotipo Oficial</label>
                                        <div className="aspect-square bg-dark-800 rounded-3xl overflow-hidden border-2 border-dashed border-dark-700 flex items-center justify-center relative group">
                                            {logoPreview ? (
                                                <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" />
                                            ) : (
                                                <Upload className="w-10 h-10 text-gray-600" />
                                            )}
                                            <label className="absolute inset-0 bg-primary-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                                                <Upload className="w-8 h-8 text-white mb-2" />
                                                <span className="text-white text-xs font-black uppercase italic">Cambiar Logo</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Banner Asset */}
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Imagen de Portada</label>
                                        <div className="h-[200px] w-full bg-dark-800 rounded-3xl overflow-hidden border-2 border-dashed border-dark-700 relative group">
                                            {bannerPreview ? (
                                                <img src={bannerPreview} className="w-full h-full object-cover" alt="Banner" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center flex-col text-gray-600">
                                                    <ImageIcon className="w-12 h-12 mb-2" />
                                                    <span className="text-sm font-bold">Sin portada</span>
                                                </div>
                                            )}
                                            <label className="absolute inset-0 bg-primary-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                                                <Upload className="w-8 h-8 text-white mb-2" />
                                                <span className="text-white text-xs font-black uppercase italic">Subir Nueva Portada</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Gallery Section */}
                            <section className="bg-dark-900 p-8 rounded-3xl border border-dark-800 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white font-bold">
                                        <Plus className="w-5 h-5 text-green-500" />
                                        <h3>Galería de Fotos</h3>
                                    </div>
                                    <label className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase italic cursor-pointer transition-all flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Agregar Fotos
                                        <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'gallery')} />
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {/* Existing Images */}
                                    {formData.gallery.map((img, index) => (
                                        <div key={`existing-${index}`} className="aspect-square bg-dark-800 rounded-2xl overflow-hidden relative group border border-dark-700 shadow-lg">
                                            <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`Gallery ${index}`} />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(img)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-xl"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* New Previews */}
                                    {galleryPreviews.map((preview, index) => (
                                        <div key={`new-${index}`} className="aspect-square bg-dark-800 rounded-2xl overflow-hidden relative group ring-2 ring-primary-500 shadow-xl shadow-primary-500/10">
                                            <img src={preview} className="w-full h-full object-cover" alt={`New ${index}`} />
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary-600 text-[9px] font-black text-white rounded-md uppercase italic tracking-tighter">Subiendo</div>
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {formData.gallery.length === 0 && galleryPreviews.length === 0 && (
                                        <div className="col-span-full py-16 text-center border-4 border-dashed border-dark-800 rounded-3xl">
                                            <ImageIcon className="w-12 h-12 text-dark-700 mx-auto mb-4" />
                                            <p className="text-gray-600 font-bold uppercase italic text-sm tracking-widest">Tu galería está vacía</p>
                                            <p className="text-gray-700 text-xs mt-2">Sube fotos de tus eventos y luchadores</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Submit Button */}
                            <div className="sticky bottom-8 z-10 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-5 rounded-full font-black uppercase italic italic transform hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary-600/30 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Sincronizando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-6 h-6" />
                                            <span>Guardar Cambios</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
