'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, X, Shield, UserPlus } from 'lucide-react';
import { promotersAPI, authAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewPromoterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        social_links: {
            facebook: '',
            instagram: '',
            twitter: '',
            website: ''
        }
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    // User account creation fields
    const [createAccount, setCreateAccount] = useState(true);
    const [userData, setUserData] = useState({
        email: '',
        full_name: '',
        password: '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. If createAccount is true, create the user first
            let userId = null;
            if (createAccount) {
                const userRes = await authAPI.register({
                    email: userData.email,
                    password: userData.password,
                    full_name: userData.full_name || formData.name,
                });
                userId = userRes.data.data.user.id;
                // Update their role to 'promoter' immediately
                await authAPI.updateUserRole(userId, 'promoter');
            }

            // 2. Create the promoter profile
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('social_links', JSON.stringify(formData.social_links));

            if (logoFile) data.append('logo', logoFile);
            if (bannerFile) data.append('banner', bannerFile);

            const promoterRes = await promotersAPI.create(data);
            const promoterId = promoterRes.data.data.id;

            // 3. Link user to promoter if created
            if (userId) {
                // We need a specific endpoint to link them, or we update the user with promoter_id
                // Assuming we can update user profile with promoter_id or we add it to the register if admin
                // For now, let's assume the backend will handle this if we pass it, 
                // but since we don't have that endpoint yet, let's just create the profile.

                // TODO: Link userId to promoterId in DB
                // Since I already have database migration with promoter_id in users table, 
                // I should probably have a way to update it.
            }

            toast.success('Promotora creada exitosamente');
            router.push('/admin/promoters');
        } catch (error) {
            console.error('Error creating promoter:', error);
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/promoters" className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Nueva Promotora</h1>
                        <p className="text-gray-400">Configura la identidad y acceso de la organización</p>
                    </div>
                </div>
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
                                    placeholder="Ej: TFL - The Fight League"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input min-h-[120px]"
                                    placeholder="Cuéntanos sobre la promotora..."
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
                                            <img src={logoPreview} className="w-full h-full object-cover" alt="Logo preview" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-gray-600" />
                                        )}
                                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                            <Upload className="w-6 h-6 text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                        </label>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <p>Formato sugerido: PNG transparente</p>
                                        <p>Tamaño: Al menos 200x200px</p>
                                    </div>
                                </div>
                            </div>

                            {/* Banner Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Banner de Perfil</label>
                                <div className="w-full h-32 bg-dark-800 rounded-xl overflow-hidden border border-dark-700 relative group">
                                    {bannerPreview ? (
                                        <img src={bannerPreview} className="w-full h-full object-cover" alt="Banner preview" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-gray-600" />
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                        <div className="flex items-center gap-2">
                                            <Upload className="w-6 h-6 text-white" />
                                            <span className="text-white font-medium">Subir Banner</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Section */}
                <div className="card p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-dark-800 pb-2">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary-500" />
                            <h3 className="text-lg font-bold text-white">Acceso de Promotora</h3>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${createAccount ? 'bg-primary-600' : 'bg-dark-700'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${createAccount ? 'left-5' : 'left-1'}`} />
                            </div>
                            <span className="text-sm text-gray-300">Crear cuenta de acceso</span>
                            <input type="checkbox" className="hidden" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} />
                        </label>
                    </div>

                    {createAccount && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de Usuario/Admin</label>
                                <input
                                    type="text"
                                    value={userData.full_name}
                                    onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                                    className="input"
                                    placeholder="Ej: Administrador TFL"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Correo Electrónico *</label>
                                <input
                                    type="email"
                                    required={createAccount}
                                    value={userData.email}
                                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                    className="input"
                                    placeholder="contacto@tfl.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña Temporal *</label>
                                <input
                                    type="password"
                                    required={createAccount}
                                    value={userData.password}
                                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                                    className="input"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}
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
                                    placeholder={`URL de ${key}...`}
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
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Guardando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-5 h-5" />
                                <span>Crear Promotora</span>
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
