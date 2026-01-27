'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowRight, CheckCircle, Mail, Lock, Building2, Info } from 'lucide-react';
import { promotersAPI, handleAPIError } from '@/lib/api';
import Navbar from '@/components/ui/Navbar';
import toast from 'react-hot-toast';

export default function PromoterRegisterPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await promotersAPI.register(formData);
            setSubmitted(true);
            toast.success('Solicitud enviada correctamente');
        } catch (error) {
            console.error('Error in registration:', error);
            const message = handleAPIError(error);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
                        <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500/50 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">¡Solicitud Enviada!</h1>
                        <p className="text-gray-400 text-lg">
                            Hemos recibido tu solicitud para unirte como promotora oficial. Nuestro equipo revisará los detalles y te contactará por correo electrónico una vez que tu cuenta sea aprobada.
                        </p>
                        <div className="pt-6">
                            <Link
                                href="/"
                                className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase italic hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
                            >
                                Volver al Inicio
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col">
            <Navbar />

            <main className="flex-1 py-16 px-4">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Branding / Info Left Side */}
                    <div className="space-y-8">
                        <div>
                            <span className="bg-primary-600/20 text-primary-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest italic mb-4 inline-block border border-primary-500/30">
                                Programa de Promotoras
                            </span>
                            <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-[0.9]">
                                Lleva tus <span className="text-primary-500">Eventos</span> al Siguiente Nivel
                            </h1>
                        </div>

                        <p className="text-xl text-gray-400 leading-relaxed">
                            Únete a la plataforma líder de PPV para deportes de contacto. Gestiona tu propia marca, llega a miles de fans y monetiza tus peleas con tecnología de vanguardia.
                        </p>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-dark-800 rounded-2xl flex-shrink-0 flex items-center justify-center border border-dark-700">
                                    <Shield className="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg uppercase italic tracking-tight">Perfil Premium</h3>
                                    <p className="text-gray-500">Muestra tu logo, banners y galería de fotos profesional a toda la comunidad.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-dark-800 rounded-2xl flex-shrink-0 flex items-center justify-center border border-dark-700">
                                    <Building2 className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg uppercase italic tracking-tight">Dashboard de Gestión</h3>
                                    <p className="text-gray-500">Panel de control intuitivo para actualizar tu identidad comercial en tiempo real.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark-900/50 border border-dark-800 p-6 rounded-3xl flex gap-4">
                            <Info className="w-6 h-6 text-gray-400 flex-shrink-0" />
                            <p className="text-sm text-gray-500 italic">
                                * Todas las solicitudes están sujetas a revisión manual. El administrador activará tu cuenta tras validar la información.
                            </p>
                        </div>
                    </div>

                    {/* Registration Form Right Side */}
                    <div className="bg-dark-900 border border-dark-800 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                        {/* Subtle Background Glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-600/10 blur-[100px] rounded-full group-hover:bg-primary-600/20 transition-all duration-700" />

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="space-y-2 mb-8 text-center uppercase">
                                <h2 className="text-2xl font-black text-white italic tracking-tighter">Solicitud de Registro</h2>
                                <p className="text-gray-500 text-sm font-bold tracking-widest">Completa los datos de tu organización</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 ml-4">Nombre de la Promotora</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-dark-950/50 border border-dark-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-gray-700"
                                            placeholder="Ej: Warriors Combat Championship"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 ml-4">Tu Correo Corporativo</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-dark-950/50 border border-dark-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-gray-700"
                                            placeholder="contacto@tuempresa.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 ml-4">Contraseña para Dashboard</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-dark-950/50 border border-dark-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-gray-700"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 ml-4">Breve Biografía / Experiencia</label>
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-dark-950/50 border border-dark-700 rounded-2xl px-4 py-4 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-gray-700 min-h-[120px] resize-none"
                                        placeholder="Cuéntanos sobre tu organización y los eventos que realizas..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-500 text-white py-5 rounded-2xl font-black uppercase italic tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-primary-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Enviar Solicitud</span>
                                        <ArrowRight className="w-6 h-6" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-600 uppercase tracking-widest font-bold pt-4">
                                ¿Ya tienes una cuenta? <Link href="/auth/login" className="text-primary-500 hover:text-primary-400 transition-colors">Inicia Sesión</Link>
                            </p>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
