'use client';

import { useState } from 'react';
import { Send, Users, AlertCircle, Shield, User as UserIcon, Mail, Eye, EyeOff } from 'lucide-react';
import { adminAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@/lib/store';

interface EmailFields {
    title: string;
    body: string;
    buttonText: string;
    buttonUrl: string;
    couponCode: string;
    footerNote: string;
}

const TEMPLATES: { name: string; emoji: string; subject: string; fields: EmailFields }[] = [
    {
        name: 'Nuevo Evento',
        emoji: '🔥',
        subject: '🔥 ¡NUEVO EVENTO CONFIRMADO! No te pierdas la pelea del año',
        fields: {
            title: '¡LA ESPERA TERMINÓ!',
            body: 'Prepárate para la noche más explosiva del año. Los mejores peleadores entran a la jaula y tú puedes vivirlo en primera fila desde cualquier dispositivo.\n\n📅 Fecha: [Fecha del evento]\n⏰ Hora: [Hora exacta]',
            buttonText: 'COMPRAR TICKET AHORA',
            buttonUrl: 'https://arenafightpass.com/events',
            couponCode: '',
            footerNote: '',
        }
    },
    {
        name: 'Estamos en Vivo',
        emoji: '🔴',
        subject: '🔴 ¡ESTAMOS EN VIVO! Entra ahora a la transmisión',
        fields: {
            title: '◉ ¡LAS PELEAS COMENZARON!',
            body: 'Las peleas estelares están en curso ahora mismo.\n\nSi ya tienes tu ticket, entra a tu cuenta ahora. Si aún no lo tienes, ¡todavía puedes comprar el pase y no perderte ni un solo nocaut!',
            buttonText: 'VER TRANSMISIÓN EN VIVO',
            buttonUrl: 'https://arenafightpass.com/events',
            couponCode: '',
            footerNote: '',
        }
    },
    {
        name: 'Código Descuento',
        emoji: '🎁',
        subject: '🎁 Tienes un descuento exclusivo para tu próximo PPV',
        fields: {
            title: '¡Un regalo para los verdaderos fans!',
            body: 'Queremos agradecerte por ser parte de la comunidad. Usa este código especial para obtener un descuento en el próximo evento.',
            buttonText: 'CANJEAR DESCUENTO',
            buttonUrl: 'https://arenafightpass.com/events',
            couponCode: 'FIGHT20',
            footerNote: '*Válido para los primeros 50 tickets o hasta el [FECHA LÍMITE].',
        }
    },
    {
        name: 'Noticias / Update',
        emoji: '🚀',
        subject: '🚀 Novedades en Arena Fight Pass que te van a encantar',
        fields: {
            title: '¡Seguimos mejorando para ti!',
            body: 'Hola, hemos estado trabajando para traerte la mejor experiencia de streaming de combate.\n\n✅ Transmisiones más rápidas y estables\n✅ Nuevos eventos disponibles\n✅ Mejor experiencia en móvil',
            buttonText: 'EXPLORAR LA PLATAFORMA',
            buttonUrl: 'https://arenafightpass.com',
            couponCode: '',
            footerNote: '',
        }
    },
];

function buildHtml(fields: EmailFields, logoUrl: string | null | undefined, brandName: string): string {
    const logoBlock = logoUrl
        ? `<div style="text-align:center;margin-bottom:24px;"><img src="${logoUrl}" alt="${brandName}" style="max-height:55px;max-width:200px;object-fit:contain;" /></div>`
        : '';

    const couponBlock = fields.couponCode
        ? `<div style="background:#111;color:#ef4444;font-size:26px;font-weight:900;letter-spacing:4px;padding:16px;margin:28px auto;max-width:240px;border-radius:8px;text-align:center;border:1px dashed #ef4444;">${fields.couponCode}</div>`
        : '';

    const buttonBlock = fields.buttonText && fields.buttonUrl
        ? `<div style="text-align:center;margin:32px 0;">
            <a href="${fields.buttonUrl}" style="display:inline-block;background-color:#ef4444;color:#fff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:900;font-size:15px;text-transform:uppercase;letter-spacing:1px;">${fields.buttonText}</a>
           </div>`
        : '';

    const footerNote = fields.footerNote
        ? `<p style="font-size:12px;color:#444;text-align:center;margin-top:24px;">${fields.footerNote}</p>`
        : '';

    const bodyHtml = fields.body
        .split('\n')
        .map(line => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 12px 0;">${line}</p>`)
        .join('');

    return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border:1px solid #222;border-radius:14px;overflow:hidden;">
  <div style="background:#ef4444;padding:28px;text-align:center;">
    ${logoBlock}
    <h1 style="margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#fff;">${fields.title}</h1>
  </div>
  <div style="padding:36px 32px;color:#ccc;font-size:16px;line-height:1.7;">
    ${bodyHtml}
    ${couponBlock}
    ${buttonBlock}
    ${footerNote}
  </div>
  <div style="padding:18px;text-align:center;background:#000;border-top:1px solid #111;">
    <p style="margin:0;color:#333;font-size:12px;">&copy; ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.</p>
  </div>
</div>`.trim();
}

export default function AdminMarketingPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recipientType, setRecipientType] = useState('all');
    const [specificEmail, setSpecificEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [fields, setFields] = useState<EmailFields>({
        title: '',
        body: '',
        buttonText: '',
        buttonUrl: '',
        couponCode: '',
        footerNote: '',
    });

    const { settings } = useSettingsStore();
    const brandName = settings?.site_name || 'Arena Fight Pass';

    const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
        setSubject(tpl.subject);
        setFields(tpl.fields);
        setShowPreview(false);
        toast.success(`Plantilla "${tpl.name}" aplicada`);
    };

    const previewHtml = buildHtml(fields, settings?.site_logo, brandName);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim() || !fields.title.trim() || !fields.body.trim()) {
            toast.error('El asunto, título y mensaje son obligatorios');
            return;
        }

        if (recipientType === 'specific' && (!specificEmail.trim() || !specificEmail.includes('@'))) {
            toast.error('Ingresa un correo electrónico válido');
            return;
        }

        const target = recipientType === 'specific'
            ? specificEmail
            : recipientType === 'all' ? 'TODOS los usuarios' : `usuarios con rol: ${recipientType}`;

        if (!confirm(`¿Enviar este correo a ${target}?`)) return;

        setIsSubmitting(true);
        try {
            await adminAPI.sendMassEmail({
                subject,
                body: previewHtml,
                role: recipientType,
                specificEmail: recipientType === 'specific' ? specificEmail : undefined,
            });
            toast.success('¡Correos enviados correctamente!');
            setSubject('');
            setFields({ title: '', body: '', buttonText: '', buttonUrl: '', couponCode: '', footerNote: '' });
        } catch (error) {
            toast.error(handleAPIError(error) || 'Error al enviar los correos');
        } finally {
            setIsSubmitting(false);
        }
    };

    const f = (key: keyof EmailFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFields(prev => ({ ...prev, [key]: e.target.value }));

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Email Marketing</h1>
                <p className="text-gray-400">Envía correos a los usuarios de la plataforma</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-300">
                    Elige una plantilla o redacta tu mensaje. El logo y diseño se aplican automáticamente — no necesitas saber HTML.
                </p>
            </div>

            {/* Plantillas */}
            <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Plantillas rápidas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TEMPLATES.map((tpl) => (
                        <button
                            key={tpl.name}
                            onClick={() => applyTemplate(tpl)}
                            className="flex flex-col items-center gap-2 p-4 bg-dark-800 hover:bg-dark-700 border border-dark-600 hover:border-primary-500/50 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all"
                        >
                            <span className="text-2xl">{tpl.emoji}</span>
                            <span>{tpl.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Destinatarios */}
                <div className="card p-6">
                    <h2 className="text-base font-semibold text-white mb-4">Destinatarios</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { value: 'all', label: 'Todos', icon: Users, color: 'primary' },
                            { value: 'promoter', label: 'Promotoras', icon: Shield, color: 'purple' },
                            { value: 'user', label: 'Usuarios', icon: UserIcon, color: 'green' },
                            { value: 'specific', label: 'Correo específico', icon: Mail, color: 'orange' },
                        ].map(({ value, label, icon: Icon, color }) => (
                            <label key={value}
                                className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${recipientType === value ? `border-${color}-500 bg-${color}-500/10 text-white` : 'border-dark-700 bg-dark-800 text-gray-400 hover:border-dark-600'}`}>
                                <input type="radio" name="recipientType" value={value}
                                    checked={recipientType === value}
                                    onChange={(e) => setRecipientType(e.target.value)}
                                    className="sr-only" />
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm font-medium">{label}</span>
                            </label>
                        ))}
                    </div>
                    {recipientType === 'specific' && (
                        <input type="email" value={specificEmail}
                            onChange={(e) => setSpecificEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            className="input w-full mt-4 max-w-sm" />
                    )}
                </div>

                {/* Redactar */}
                <div className="card p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-white">Redactar mensaje</h2>
                        <button type="button" onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
                        </button>
                    </div>

                    {/* Asunto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Asunto del correo <span className="text-red-400">*</span></label>
                        <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)}
                            placeholder="Ej: ¡Nuevo evento disponible esta noche!"
                            className="input w-full" />
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Título del correo <span className="text-red-400">*</span></label>
                        <input type="text" required value={fields.title} onChange={f('title')}
                            placeholder="Ej: ¡LA PELEA DEL AÑO!"
                            className="input w-full" />
                        <p className="text-xs text-gray-500 mt-1">Aparece en la cabecera roja en mayúsculas.</p>
                    </div>

                    {/* Mensaje */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Mensaje <span className="text-red-400">*</span></label>
                        <textarea required value={fields.body} onChange={f('body')}
                            placeholder="Escribe el cuerpo del correo aquí. Puedes usar emojis y saltos de línea."
                            className="input w-full min-h-[140px] resize-y" />
                    </div>

                    {/* Botón CTA (opcional) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Texto del botón <span className="text-gray-500">(opcional)</span></label>
                            <input type="text" value={fields.buttonText} onChange={f('buttonText')}
                                placeholder="Ej: COMPRAR TICKET" className="input w-full text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">URL del botón</label>
                            <input type="url" value={fields.buttonUrl} onChange={f('buttonUrl')}
                                placeholder="https://arenafightpass.com/events"
                                className="input w-full text-sm" />
                        </div>
                    </div>

                    {/* Código descuento (opcional) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Código de descuento <span className="text-gray-500">(opcional)</span></label>
                            <input type="text" value={fields.couponCode} onChange={f('couponCode')}
                                placeholder="Ej: FIGHT20"
                                className="input w-full font-mono tracking-widest text-yellow-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nota al pie</label>
                            <input type="text" value={fields.footerNote} onChange={f('footerNote')}
                                placeholder="Ej: Válido hasta el 30/04"
                                className="input w-full text-sm" />
                        </div>
                    </div>

                    {/* Vista previa */}
                    {showPreview && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vista previa del correo</p>
                            <div className="rounded-xl overflow-hidden border border-dark-700 bg-white"
                                dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={isSubmitting || !subject.trim() || !fields.title.trim() || !fields.body.trim()}
                        className="btn btn-primary px-8 flex items-center gap-2 min-w-[200px] justify-center">
                        {isSubmitting ? (
                            <><div className="spinner w-5 h-5 border-2 border-white/20 border-t-white" /> Enviando...</>
                        ) : (
                            <><Send className="w-5 h-5" /> Enviar correo masivo</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
