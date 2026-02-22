'use client';

import { useState } from 'react';
import { Send, Users, AlertCircle, CheckCircle2, Shield, User as UserIcon } from 'lucide-react';
import { adminAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminMarketingPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recipientType, setRecipientType] = useState('all');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim() || !body.trim()) {
            toast.error('El asunto y el mensaje son obligatorios');
            return;
        }

        const confirmMessage = recipientType === 'all'
            ? '¿Estás seguro de enviar este correo a TODOS los usuarios registrados?'
            : `¿Estás seguro de enviar este correo a los usuarios con rol: ${recipientType}?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Convierte los saltos de línea en <br> para HTML
            const formattedBody = body.replace(/\n/g, '<br>');

            // Envuelve el mensaje en una plantilla HTML básica
            const htmlMessage = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    ${formattedBody}
                </div>
            `;

            const response = await adminAPI.sendMassEmail({
                subject,
                body: htmlMessage,
                role: recipientType
            });

            toast.success(response.data.message || 'Proceso de envío iniciado');
            setSubject('');
            setBody('');
        } catch (error) {
            const message = handleAPIError(error);
            toast.error(message || 'Error al enviar los correos');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Email Marketing & Anuncios</h1>
                <p className="text-gray-400">Envía correos masivos a los usuarios de la plataforma</p>
            </div>

            {/* Warning / Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-blue-400 font-medium mb-1">Información sobre el envío</h3>
                    <p className="text-sm text-blue-300">
                        Los correos se envían en segundo plano para no bloquear el panel. Dependiendo de la cantidad de usuarios, el proceso puede tardar unos minutos en completarse a través del servicio SMTP.
                    </p>
                </div>
            </div>

            {/* Email Composer Form */}
            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Redactar Mensaje</h2>

                    {/* Recipient Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Destinatarios
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className={\`flex items-center p-3 border rounded-lg cursor-pointer transition-colors \${recipientType === 'all' ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'}\`}>
                            <input
                                type="radio"
                                name="recipientType"
                                value="all"
                                checked={recipientType === 'all'}
                                onChange={(e) => setRecipientType(e.target.value)}
                                className="sr-only"
                            />
                            <Users className={\`w-5 h-5 mr-3 \${recipientType === 'all' ? 'text-primary-500' : 'text-gray-500'}\`} />
                            <div>
                                <div className={\`font-medium \${recipientType === 'all' ? 'text-white' : 'text-gray-300'}\`}>Todos los Usuarios</div>
                        </div>
                    </label>

                    <label className={\`flex items-center p-3 border rounded-lg cursor-pointer transition-colors \${recipientType === 'promoter' ? 'border-purple-500 bg-purple-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'}\`}>
                    <input
                        type="radio"
                        name="recipientType"
                        value="promoter"
                        checked={recipientType === 'promoter'}
                        onChange={(e) => setRecipientType(e.target.value)}
                        className="sr-only"
                    />
                    <Shield className={\`w-5 h-5 mr-3 \${recipientType === 'promoter' ? 'text-purple-500' : 'text-gray-500'}\`} />
                    <div>
                        <div className={\`font-medium \${recipientType === 'promoter' ? 'text-white' : 'text-gray-300'}\`}>Promotoras</div>
                </div>
            </label>

            <label className={\`flex items-center p-3 border rounded-lg cursor-pointer transition-colors \${recipientType === 'user' ? 'border-green-500 bg-green-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'}\`}>
            <input
                type="radio"
                name="recipientType"
                value="user"
                checked={recipientType === 'user'}
                onChange={(e) => setRecipientType(e.target.value)}
                className="sr-only"
            />
            <UserIcon className={\`w-5 h-5 mr-3 \${recipientType === 'user' ? 'text-green-500' : 'text-gray-500'}\`} />
            <div>
                <div className={\`font-medium \${recipientType === 'user' ? 'text-white' : 'text-gray-300'}\`}>Usuarios Normales</div>
        </div>
                            </label >
                        </div >
                    </div >

        <div className="space-y-4">
            {/* Subject */}
            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">
                    Asunto del Correo
                </label>
                <input
                    id="subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ej: ¡Nuevo Evento de PPV Oficial Disponible!"
                    className="input w-full"
                />
            </div>

            {/* Body Textarea */}
            <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-300 mb-1">
                    Mensaje (Cuerpo del correo)
                </label>
                <textarea
                    id="body"
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="input w-full min-h-[300px] resize-y"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Nota: Los saltos de línea se respetarán en el correo final.
                </p>
            </div>
        </div>
                </div >

        <div className="flex justify-end pt-4 border-t border-dark-800">
            <button
                type="submit"
                disabled={isSubmitting || !subject.trim() || !body.trim()}
                className="btn btn-primary px-8 flex items-center justify-center min-w-[200px]"
            >
                {isSubmitting ? (
                    <>
                        <div className="spinner w-5 h-5 mr-3 border-2 border-white/20 border-t-white" />
                        Enviando Correos...
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5 mr-2" />
                        Enviar Mensaje Masivo
                    </>
                )}
            </button>
        </div>
            </form >
        </div >
    );
}
