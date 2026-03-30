'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { fightersAPI } from '@/lib/api';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function FighterDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        nickname: '',
        date_of_birth: '',
        country: '',
        city: '',
        team_association: '',
        base_style: '',
        stance: 'Ortodoxo',
        height_cm: '',
        weight_kg: '',
        reach_cm: '',
        wins: 0,
        losses: 0,
        draws: 0,
        kos: 0,
        submissions: 0,
        social_instagram: '',
        social_twitter: '',
        profile_image_url: '',
        is_amateur: false,
        titles: ''
    });

    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        // Auto-fill names from user account if new
        if (user && user.full_name) {
            const parts = user.full_name.split(' ');
            setFormData(prev => ({
                ...prev,
                first_name: parts[0] || '',
                last_name: parts.slice(1).join(' ') || ''
            }));
        }

        loadFighterProfile();
    }, [isAuthenticated, user]);

    const loadFighterProfile = async () => {
        try {
            const res = await fightersAPI.getMe();
            if (res.data.success && res.data.data) {
                setHasProfile(true);
                setStatus(res.data.data.status);
                // Safe mapping of numeric fields back to string/number for inputs
                const f = res.data.data;
                setFormData({
                    first_name: f.first_name || '',
                    last_name: f.last_name || '',
                    nickname: f.nickname || '',
                    date_of_birth: f.date_of_birth ? f.date_of_birth.split('T')[0] : '',
                    country: f.country || '',
                    city: f.city || '',
                    team_association: f.team_association || '',
                    base_style: f.base_style || '',
                    stance: f.stance || 'Ortodoxo',
                    height_cm: f.height_cm ? String(f.height_cm) : '',
                    weight_kg: f.weight_kg ? String(f.weight_kg) : '',
                    reach_cm: f.reach_cm ? String(f.reach_cm) : '',
                    wins: f.wins || 0,
                    losses: f.losses || 0,
                    draws: f.draws || 0,
                    kos: f.kos || 0,
                    submissions: f.submissions || 0,
                    social_instagram: f.social_instagram || '',
                    social_twitter: f.social_twitter || '',
                    profile_image_url: f.profile_image_url || '',
                    is_amateur: f.is_amateur || false,
                    titles: f.titles || ''
                });
            }
        } catch (error: any) {
            if (error.response?.status !== 404) {
                toast.error('Error al cargar perfil de peleador');
            }
            // 404 just means they don't have one yet, which is fine
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Convert string numbers to actual numbers/floats
            const payload = {
                ...formData,
                height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
                weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
                reach_cm: formData.reach_cm ? parseFloat(formData.reach_cm) : null,
                wins: parseInt(String(formData.wins)) || 0,
                losses: parseInt(String(formData.losses)) || 0,
                draws: parseInt(String(formData.draws)) || 0,
                kos: parseInt(String(formData.kos)) || 0,
                submissions: parseInt(String(formData.submissions)) || 0,
            };

            let submitData: any = payload;

            if (profileImageFile) {
                const form = new FormData();
                Object.keys(payload).forEach(key => {
                    if (payload[key as keyof typeof payload] !== null && payload[key as keyof typeof payload] !== undefined) {
                        form.append(key, String(payload[key as keyof typeof payload]));
                    }
                });
                form.append('profile_image_url', profileImageFile);
                submitData = form;
            }

            if (hasProfile) {
                await fightersAPI.updateMe(submitData);
                toast.success('Perfil actualizado correctamente');
            } else {
                await fightersAPI.claim(submitData);
                toast.success('Perfil creado. Esperando aprobación del administrador.');
                setHasProfile(true);
                setStatus('pending');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar el perfil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-950">
                <div className="spinner w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-dark-950">
            <div className="flex-1 py-12 pt-32">
                <div className="container-custom max-w-4xl">

                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/profile" className="p-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition">
                            <ArrowLeft className="w-5 h-5 text-dark-300" />
                        </Link>
                        <div>
                            <h1 className="font-display text-4xl font-bold">
                                Perfil de <span className="gradient-text">Peleador</span>
                            </h1>
                            <p className="text-dark-400">
                                {hasProfile ? 'Actualiza tus estadísticas y récord oficial' : 'Crea tu tarjeta oficial para aparecer en la plataforma'}
                            </p>
                        </div>
                    </div>

                    {status === 'pending' && (
                        <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            <div>
                                <h3 className="text-yellow-500 font-bold mb-1">Perfil en Revisión</h3>
                                <p className="text-sm text-yellow-500/80">
                                    Tu perfil ha sido enviado y está esperando la aprobación de un administrador de Arena Fight Pass. Una vez aprobado, aparecerás en el Directorio de Peleadores público.
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'approved' && (
                        <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                            <div>
                                <h3 className="text-green-500 font-bold">Perfil Aprobado y Activo</h3>
                                <p className="text-sm text-green-500/80">Tu tarjeta de peleador ya es visible para los fans en la plataforma.</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Foto de Perfil */}
                        <div className="card p-6 flex items-center gap-6">
                            <div className="w-32 h-40 rounded-lg bg-dark-800 border border-dark-700 overflow-hidden flex-shrink-0 relative">
                                {(profileImageFile || formData.profile_image_url) ? (
                                    <img
                                        src={profileImageFile ? URL.createObjectURL(profileImageFile) : formData.profile_image_url}
                                        alt="Profile view"
                                        className="w-full h-full object-contain object-bottom"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-center text-dark-400 p-2">
                                        Sin Foto
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2 font-display">Foto de Perfil</h3>
                                <p className="text-sm text-dark-400 mb-4">Sube una foto tuya de **medio cuerpo** (desde la cintura hacia arriba), preferiblemente con fondo transparente (formato PNG). Se usará para tu tarjeta oficial de peleador.</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setProfileImageFile(e.target.files[0]);
                                        }
                                    }}
                                    className="text-sm text-dark-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-dark-700 file:text-white hover:file:bg-dark-600 transition-colors cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Datos Personales */}
                        <div className="card p-6">
                            <h3 className="text-xl font-bold mb-4 font-display">Identidad Personal</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Nombre *</label>
                                    <input required type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="input w-full" placeholder="Ej. Jon" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Apellidos *</label>
                                    <input required type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="input w-full" placeholder="Ej. Jones" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Apodo (Nickname)</label>
                                    <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className="input w-full" placeholder="Ej. Bones" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Fecha de Nacimiento</label>
                                    <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="input w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Gimnasio o Academia</label>
                                    <input type="text" name="team_association" value={formData.team_association} onChange={handleChange} className="input w-full" placeholder="Ej. Jackson Wink MMA" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">País</label>
                                    <input type="text" name="country" value={formData.country} onChange={handleChange} className="input w-full" placeholder="Ej. Ecuador" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Ciudad</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="input w-full" placeholder="Ej. Guayaquil" />
                                </div>
                            </div>
                        </div>

                        {/* Atributos Físicos */}
                        <div className="card p-6">
                            <h3 className="text-xl font-bold mb-4 font-display">Físico y Estilo</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Altura (cm)</label>
                                    <input type="number" step="0.1" name="height_cm" value={formData.height_cm} onChange={handleChange} className="input w-full" placeholder="Ej. 193" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Peso Actual (kg)</label>
                                    <input type="number" step="0.1" name="weight_kg" value={formData.weight_kg} onChange={handleChange} className="input w-full" placeholder="Ej. 93.0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Alcance (cm)</label>
                                    <input type="number" step="0.1" name="reach_cm" value={formData.reach_cm} onChange={handleChange} className="input w-full" placeholder="Ej. 215" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Guardia (Stance)</label>
                                    <select name="stance" value={formData.stance} onChange={handleChange} className="input w-full">
                                        <option value="Ortodoxo">Ortodoxo (Diestro)</option>
                                        <option value="Zurdo">Zurdo</option>
                                        <option value="Ambidiestro">Ambidiestro</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Estilo Base de Combate</label>
                                    <input type="text" name="base_style" value={formData.base_style} onChange={handleChange} className="input w-full" placeholder="Ej. Wrestling, Muay Thai, BJJ" />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-dark-300 mb-2">Títulos Obtenidos</label>
                                    <textarea name="titles" value={formData.titles} onChange={handleChange} className="input w-full" placeholder="Ej. Campeón Nacional Peso Ligero" rows={2} />
                                </div>
                            </div>
                        </div>

                        {/* Récord Oficial */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold font-display">Récord de Combate</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${formData.is_amateur ? 'text-gray-400' : 'text-primary-500'}`}>Profesional</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name="is_amateur" checked={formData.is_amateur} onChange={handleChange} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-primary-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                                    </label>
                                    <span className={`text-sm font-bold ${formData.is_amateur ? 'text-primary-500' : 'text-gray-400'}`}>Amateur</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="p-4 bg-dark-800 rounded-lg text-center border border-green-500/20">
                                    <label className="block text-sm font-bold text-green-500 mb-2">Victorias (W)</label>
                                    <input type="number" name="wins" min="0" value={formData.wins} onChange={handleChange} className="input w-full text-center text-xl font-bold" />
                                </div>
                                <div className="p-4 bg-dark-800 rounded-lg text-center border border-red-500/20">
                                    <label className="block text-sm font-bold text-red-500 mb-2">Derrotas (L)</label>
                                    <input type="number" name="losses" min="0" value={formData.losses} onChange={handleChange} className="input w-full text-center text-xl font-bold" />
                                </div>
                                <div className="p-4 bg-dark-800 rounded-lg text-center border border-gray-500/20">
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Empates (D)</label>
                                    <input type="number" name="draws" min="0" value={formData.draws} onChange={handleChange} className="input w-full text-center text-xl font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-dark-900 p-4 rounded-lg">
                                <div>
                                    <label className="block text-xs font-medium text-dark-300 mb-1">Victorias por K.O.</label>
                                    <input type="number" name="kos" min="0" value={formData.kos} onChange={handleChange} className="input w-full py-1 h-9" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-dark-300 mb-1">Victorias por Sumisión</label>
                                    <input type="number" name="submissions" min="0" value={formData.submissions} onChange={handleChange} className="input w-full py-1 h-9" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                {saving ? <div className="spinner w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {hasProfile ? 'Guardar Cambios' : 'Enviar Perfil para Aprobación'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
            <Footer />
        </div>
    );
}
