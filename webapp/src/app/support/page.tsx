'use client';

import { HelpCircle, Shield, CreditCard, Play } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
    const topics = [
        { title: "Pagos y Reembolsos", icon: <CreditCard />, description: "Problemas con PayPal, tarjetas o cupones." },
        { title: "Streaming y Calidad", icon: <Play />, description: "Cómo mejorar el buffering y calidad de video." },
        { title: "Mi Cuenta", icon: <Shield />, description: "Recuperar contraseña y gestionar perfil." },
        { title: "General", icon: <HelpCircle />, description: "Información básica sobre la plataforma." }
    ];

    return (
        <div className="min-h-screen bg-dark-950 pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 gradient-text text-center">Soporte Técnico</h1>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {topics.map((t, i) => (
                        <div key={i} className="card p-6 hover:border-primary-500/50 transition-colors cursor-pointer text-center">
                            <div className="w-12 h-12 bg-primary-500/10 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                {t.icon}
                            </div>
                            <h3 className="font-bold mb-1">{t.title}</h3>
                            <p className="text-sm text-dark-400">{t.description}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">¿Necesitas ayuda personalizada?</h2>
                    <p className="text-dark-400 mb-6">Estamos disponibles para asistirte de inmediato.</p>
                    <div className="flex justify-center gap-4">
                        <Link href="/contact" className="btn btn-primary px-8">Enviar Ticket</Link>
                        <Link href="/faq" className="btn btn-secondary px-8">Ver FAQs</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
