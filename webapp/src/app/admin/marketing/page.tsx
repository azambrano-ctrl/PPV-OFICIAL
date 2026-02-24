// Componente de Marketing para el Panel de Administrador
'use client';

import { useState } from 'react';
import { Send, Users, AlertCircle, CheckCircle2, Shield, User as UserIcon } from 'lucide-react';
import { adminAPI, handleAPIError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@/lib/store';

export default function AdminMarketingPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recipientType, setRecipientType] = useState('all');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const { settings } = useSettingsStore();

    const logoHtml = settings?.site_logo
        ? `<div style="text-align: center; margin-bottom: 25px;"><img src="${settings.site_logo}" alt="Logo" style="max-height: 60px; max-width: 200px; height: auto;" /></div>\n`
        : '';

    const templates = [
        {
            name: 'Anuncio Nuevo Evento',
            subject: '🔥 ¡NUEVO EVENTO CONFIRMADO! No te pierdas la pelea del año',
            body: `<div style="text-align: center; padding: 20px; background-color: #111; border-radius: 10px; border: 1px solid #333;">
    <h1 style="color: #ef4444; margin-bottom: 5px; text-transform: uppercase;">¡LA ESPERA TERMINÓ!</h1>
    <h2 style="color: #fff; margin-top: 0;">[NOMBRE DEL EVENTO V.S NOMBRE]</h2>
    
    <p style="color: #aaa; font-size: 16px; line-height: 1.6;">
        Prepárate para la noche más explosiva del año. Los mejores peleadores entran a la jaula y tú puedes vivirlo en primera fila desde cualquier dispositivo.
    </p>

    <div style="margin: 30px 0;">
        <p style="color: #fff; font-size: 18px; margin: 5px 0;">📅 <strong>Fecha:</strong> [Fecha del evento]</p>
        <p style="color: #fff; font-size: 18px; margin: 5px 0;">⏰ <strong>Hora:</strong> [Hora exacta]</p>
    </div>

    <a href="https://arenafightpass.com/events" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; text-transform: uppercase;">
        COMPRAR TICKET PPV AHORA
    </a>
</div>`
        },
        {
            name: 'Estamos en Vivo',
            subject: '🔴 ¡ESTAMOS EN VIVO! Entra ahora a la transmisión',
            body: `<div style="text-align: center; padding: 30px 20px;">
    <div style="display: inline-block; background-color: #ef4444; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 20px;">
        ◉ EN DIRECTO
    </div>
    
    <h2 style="color: #111; font-size: 24px;">Las peleas estelares están a punto de comenzar</h2>
    
    <p style="color: #444; font-size: 16px; margin-bottom: 30px;">
        Si ya tienes tu ticket, ingresa a tu cuenta ahora mismo. Si aún no lo tienes, ¡todavía estás a tiempo de comprar el pase y no perderte ni un solo nocaut!
    </p>

    <a href="https://arenafightpass.com/watch/[ID_DEL_EVENTO]" style="display: inline-block; background-color: #111; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        IR A LA TRANSMISIÓN
    </a>
</div>`
        },
        {
            name: 'Descuento / Pase',
            subject: '🎁 Tienes un 20% de descuento para tu próximo PPV',
            body: `<div style="border: 2px dashed #ef4444; padding: 30px; text-align: center; background-color: #fcfcfc; border-radius: 10px;">
    <h2 style="color: #111; margin-top: 0;">¡Un regalo para los verdaderos fans del combate!</h2>
    
    <p style="color: #333; font-size: 16px;">
        Queremos agradecerte por ser parte de la comunidad de Arena Fight Pass. Usa este código especial para obtener un <strong>20% de descuento</strong> en el próximo evento de la cartelera.
    </p>

    <div style="background-color: #111; color: #ef4444; font-size: 28px; font-weight: 900; letter-spacing: 3px; padding: 15px; margin: 25px auto; max-width: 250px; border-radius: 5px;">
        FIGHT20
    </div>

    <p style="color: #666; font-size: 12px;">*Válido únicamente para los primeros 50 tickets o hasta el [FECHA LÍMITE].</p>

    <br>
    <a href="https://arenafightpass.com/events" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        CANJEAR CÓDIGO AHORA
    </a>
</div>`
        },
        {
            name: 'Actualización App',
            subject: '🚀 ¡Nuevas funciones increíbles en Arena Fight Pass!',
            body: `<div style="padding: 20px;">
    <h2 style="color: #111;">¡Seguimos mejorando para ti!</h2>
    
    <p style="color: #444; font-size: 16px;">
        Hola, luchador. Hemos estado trabajando duro para traerte la mejor experiencia de streaming de deportes de combate en Latinoamérica.
    </p>
    
    <h3 style="color: #ef4444;">¿Qué hay de nuevo?</h3>
    <ul style="color: #444; font-size: 15px; line-height: 1.8;">
        <li>✅ <strong>Transmisiones más rápidas:</strong> Ahora con tecnología Cloudflare para cero interrupciones.</li>
        <li>✅ <strong>Eventos Gratuitos:</strong> Disfruta de la nueva sección "Re-prise" con combates legendarios sin costo.</li>
        <li>✅ <strong>Mejor reproductor:</strong> Cambia la calidad, pausa y retrocede con nuestro nuevo sistema.</li>
    </ul>

    <p style="color: #444; font-size: 16px; margin-top: 25px;">
        Entra ahora y descubre todas las novedades.
    </p>

    <a href="https://arenafightpass.com" style="display: inline-block; background-color: #111; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        EXPLORAR PLATAFORMA
    </a>
</div>`
        }
    ];

    const applyTemplate = (template: any) => {
        setSubject(template.subject);
        setBody(template.body);
        toast.success(`Plantilla "${template.name}" aplicada`);
    };

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
            // Only inject <br> tags if the user is sending plain text.
            const isHtml = /<[a-z][\s\S]*>/i.test(body);
            const formattedBody = isHtml ? body : body.replace(/\n/g, '<br>');

            // Automatically inject logo if not present
            const bodyHasLogo = body.includes('<img');
            const finalLogo = (!bodyHasLogo && settings?.site_logo) 
                ? `<div style="text-align: center; margin-bottom: 25px;"><img src="${settings.site_logo}" alt="Logo" style="max-height: 60px; max-width: 200px; height: auto;" /></div>\n`
                : '';

            const htmlMessage = `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #222; border-radius: 12px; padding: 30px;">
                    ${finalLogo}
                    <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                        ${formattedBody}
                    </div>
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
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Email Marketing & Anuncios</h1>
                <p className="text-gray-400">Envía correos masivos a los usuarios de la plataforma</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-blue-400 font-medium mb-1">Información sobre el envío</h3>
                    <p className="text-sm text-blue-300">
                        Los correos se envían en segundo plano para no bloquear el panel. Dependiendo de la cantidad de usuarios, el proceso puede tardar unos minutos en completarse a través del servicio SMTP.
                    </p>
                </div>
            </div>

            {/* Quick Templates */}
            <div>
                <h3 className="text-lg font-medium text-white mb-3">Plantillas Rápidas</h3>
                <div className="flex flex-wrap gap-2">
                    {templates.map((template, index) => (
                        <button
                            key={index}
                            onClick={() => applyTemplate(template)}
                            className="bg-dark-800 hover:bg-dark-700 border border-dark-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            {template.name}
                        </button>
                    ))}
                    <button
                        onClick={() => { setSubject(''); setBody(''); toast.success('Formulario limpiado'); }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors border border-red-500/20 ml-auto"
                    >
                        Limpiar Todo
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Redactar Mensaje</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Destinatarios
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${recipientType === 'all' ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'}`}>
                                <input
                                    type="radio"
                                    name="recipientType"
                                    value="all"
                                    checked={recipientType === 'all'}
                                    onChange={(e) => setRecipientType(e.target.value)}
                                    className="sr-only"
                                />
                                <Users className={`w-5 h-5 mr-3 ${recipientType === 'all' ? 'text-primary-500' : 'text-gray-500'}`} />
                                <div>
                                    <div className={`font-medium ${recipientType === 'all' ? 'text-white' : 'text-gray-300'}`}>Todos los Usuarios</div>
                                </div>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${recipientType === 'promoter' ? 'border-purple-500 bg-purple-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'}`}>
                                <input
                                    type="radio"
                                    name="recipientType"
                                    value="promoter"
                                    checked={recipientType === 'promoter'}
                                    onChange={(e) => setRecipientType(e.target.value)}
                                    className="sr-only"
                                />
                                <Shield className={`w-5 h-5 mr-3 ${recipientType === 'promoter' ? 'text-purple-500' : 'text-gray-500'}`} />
                                <div>
                                    <div className={`font-medium ${recipientType === 'promoter' ? 'text-white' : 'text-gray-300'}`}>Promotoras</div>
                                </div>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${recipientType === 'user' ? 'border-green-500 bg-green-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'}`}>
                                <input
                                    type="radio"
                                    name="recipientType"
                                    value="user"
                                    checked={recipientType === 'user'}
                                    onChange={(e) => setRecipientType(e.target.value)}
                                    className="sr-only"
                                />
                                <UserIcon className={`w-5 h-5 mr-3 ${recipientType === 'user' ? 'text-green-500' : 'text-gray-500'}`} />
                                <div>
                                    <div className={`font-medium ${recipientType === 'user' ? 'text-white' : 'text-gray-300'}`}>Usuarios Normales</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
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
                                Nota: Puedes escribir texto normal y se enviará con el logo de tu plataforma y tema oscuro automáticamente. Si pegas código HTML, se respetará tu diseño.
                            </p>
                        </div>
                    </div>
                </div>

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
            </form>
        </div>
    );
}
