'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, X, Trash2, Plus, Globe } from 'lucide-react';
import { promotersAPI, handleAPIError } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function EditPromoterPage() {
    const router = useRouter();
    const { id } = useParams();
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
        loadPromoter();
    }, [id]);

    const loadPromoter = async () => {
        try {
            const response = await promotersAPI.getById(id as string);
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
            toast.error('Error al cargar la promotora');
            router.push('/admin/promoters');
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

            await promotersAPI.update(id as string, data);
            toast.success('Promotora actualizada exitosamente');
            router.push('/admin/promoters');
        } catch (error) {
            console.error('Error updating promoter:', error);
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setSaving(false);
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
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/promoters" className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Editar Promotora</h1>
                        <p className="text-gray-400">Actualiza la identidad y galería de {formData.name}</p>
                    </div>
                </div>
                <Link
                    href={`/promoter/${id}`}
                    target="_blank"
                    className="btn-secondary flex items-center gap-2"
                >
                    <Globe className="w-4 h-4" />
                    Ver Perfil Público
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Branding Section */}
                <div className="card p-6 space-y-6">
                    <h3 className="text-lg font-bold text-white border-b border-dark-800 pb-2">Identidad de Marca</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de la Promotora *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input min-h-[120px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Logotipo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 bg-dark-800 rounded-xl overflow-hidden border border-dark-700 flex items-center justify-center relative group">
                                        {logoPreview ? (
                                            <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-gray-600" />
                                        )}
                                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                            <Upload className="w-6 h-6 text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500">Haz clic en la imagen para cambiarla</p>
                                </div>
                            </div>

                            {/* Banner Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Banner de Perfil</label>
                                <div className="w-full h-32 bg-dark-800 rounded-xl overflow-hidden border border-dark-700 relative group">
                                    {bannerPreview ? (
                                        <img src={bannerPreview} className="w-full h-full object-cover" alt="Banner" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-gray-600" />
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                        <div className="flex items-center gap-2">
                                            <Upload className="w-6 h-6 text-white" />
                                            <span className="text-white font-medium">Cambiar Banner</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gallery Section */}
                <div className="card p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-dark-800 pb-2">
                        <h3 className="text-lg font-bold text-white">Galería de Fotos</h3>
                        <label className="btn-secondary btn-sm flex items-center gap-2 cursor-pointer">
                            <Plus className="w-4 h-4" />
                            Agregar Fotos
                            <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'gallery')} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {/* Existing Images */}
                        {formData.gallery.map((img, index) => (
                            <div key={`existing-${index}`} className="aspect-square bg-dark-800 rounded-xl overflow-hidden relative group">
                                <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`Gallery ${index}`} />
                                <button
                                    type="button"
                                    onClick={() => removeExistingImage(img)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {/* New Previews */}
                        {galleryPreviews.map((preview, index) => (
                            <div key={`new-${index}`} className="aspect-square bg-dark-800 rounded-xl overflow-hidden relative group ring-2 ring-primary-500">
                                <img src={preview} className="w-full h-full object-cover" alt={`New ${index}`} />
                                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary-600 text-[10px] font-bold text-white rounded uppercase">Nuevo</div>
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
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-dark-800 rounded-2xl">
                                <p className="text-gray-500">No hay fotos en la galería todavía.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Social Section */}
                <div className="card p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-dark-800 pb-2">Redes Sociales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(formData.social_links).map((key) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">{key}</label>
                                <input
                                    type="text"
                                    value={(formData.social_links as any)[key]}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        social_links: { ...formData.social_links, [key]: e.target.value }
                                    })}
                                    className="input"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn-secondary"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary"
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Guardando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-5 h-5" />
                                <span>Guardar Cambios</span>
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
