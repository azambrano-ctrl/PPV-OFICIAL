'use client';

import { Mail, MessageSquare, Phone } from 'lucide-react';
import { useSettingsStore } from '@/lib/store';

export default function ContactPage() {
    const { settings } = useSettingsStore();

    const contactEmail = settings?.contact_email || 'soporte@arenafightpass.com';
    const contactWhatsapp = settings?.contact_whatsapp || '+593 99 999 9999';

    return (
        <div className="min-h-screen bg-dark-950 pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-bold mb-4 gradient-text">Contacto</h1>
                <p className="text-dark-400 mb-12">¿Tienes alguna duda o problema? Estamos aquí para ayudarte.</p>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="card p-8 flex flex-col items-center">
                        <Mail className="w-12 h-12 text-primary-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Email</h3>
                        <p className="text-dark-400">{contactEmail}</p>
                    </div>
                    <div className="card p-8 flex flex-col items-center">
                        <MessageSquare className="w-12 h-12 text-primary-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Chat en Vivo</h3>
                        <p className="text-dark-400">Disponible durante eventos en vivo.</p>
                    </div>
                    <div className="card p-8 flex flex-col items-center">
                        <Phone className="w-12 h-12 text-primary-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">WhatsApp</h3>
                        <p className="text-dark-400">{contactWhatsapp}</p>
                    </div>
                </div>

                <div className="mt-12 card p-8 max-w-2xl mx-auto text-left">
                    <h2 className="text-2xl font-bold mb-6">Envíanos un mensaje</h2>
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input type="text" className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input type="email" className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mensaje</label>
                            <textarea rows={4} className="w-full bg-dark-800 border border-dark-700 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"></textarea>
                        </div>
                        <button type="button" className="btn btn-primary w-full">Enviar Mensaje</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
