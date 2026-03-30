'use client';

import { Mail, Shield, AlertTriangle, FileText } from 'lucide-react';
import { useSettingsStore } from '@/lib/store';
import Link from 'next/link';

export default function DMCAPage() {
    const { settings } = useSettingsStore();
    const contactEmail = settings?.contact_email || 'soporte@arenafightpass.com';
    const siteName = settings?.site_name || 'Arena Fight Pass';

    return (
        <div className="bg-dark-950 min-h-screen pt-24 pb-12">
            <div className="container-custom max-w-4xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-display font-bold gradient-text">Política DMCA</h1>
                        <p className="text-dark-400 text-sm">Protección de Propiedad Intelectual y Derechos de Autor</p>
                    </div>
                </div>

                <div className="prose prose-invert max-w-none space-y-8 text-dark-300">

                    <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-white font-bold text-lg mb-2">Aviso Importante</h3>
                                <p className="text-dark-300">
                                    {siteName} respeta los derechos de propiedad intelectual de terceros y espera que sus usuarios hagan lo mismo.
                                    Respondemos a todas las notificaciones de presunta infracción de derechos de autor conforme a la Ley de Derechos de Autor
                                    del Milenio Digital (DMCA) y las leyes aplicables de propiedad intelectual de Ecuador.
                                </p>
                            </div>
                        </div>
                    </div>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">1. Notificación de Infracción</h2>
                        <p>
                            Si usted es titular de derechos de autor o un agente autorizado, y cree que algún contenido en nuestra
                            plataforma infringe sus derechos, puede enviarnos una notificación DMCA que contenga:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Identificación de la obra protegida por derechos de autor que se alega infringida.</li>
                            <li>Identificación del material infractor y su ubicación en la plataforma (URL o descripción).</li>
                            <li>Su nombre completo, dirección, número de teléfono y correo electrónico.</li>
                            <li>Una declaración de que usted cree de buena fe que el uso del material no está autorizado por el titular de los derechos de autor.</li>
                            <li>Una declaración bajo pena de perjurio de que la información proporcionada es exacta y que usted está autorizado para actuar en nombre del titular.</li>
                            <li>Su firma física o electrónica.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">2. Envío de Notificaciones</h2>
                        <p>
                            Las notificaciones de infracción deben enviarse a nuestro Agente Designado DMCA:
                        </p>
                        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 mt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Mail className="w-5 h-5 text-primary-500" />
                                <span className="font-semibold text-white">Agente Designado DMCA</span>
                            </div>
                            <p className="text-dark-300">
                                Email: <a href={`mailto:${contactEmail}?subject=Notificación DMCA`} className="text-primary-500 hover:text-primary-400 transition-colors">{contactEmail}</a>
                            </p>
                            <p className="text-dark-300 mt-1">
                                Asunto: <span className="text-white font-medium">"Notificación DMCA - [Descripción breve]"</span>
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">3. Contra-Notificación</h2>
                        <p>
                            Si usted cree que su contenido fue removido por error, puede enviar una contra-notificación que incluya:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Identificación del material removido y su ubicación original.</li>
                            <li>Una declaración bajo pena de perjurio de que el material fue removido por error o identificación incorrecta.</li>
                            <li>Su nombre, dirección y número de teléfono.</li>
                            <li>Consentimiento a la jurisdicción del tribunal federal del distrito donde reside.</li>
                            <li>Su firma física o electrónica.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">4. Política de Infractores Reincidentes</h2>
                        <p>
                            {siteName} se reserva el derecho de, bajo las circunstancias apropiadas:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li><strong className="text-white">Suspender o cancelar cuentas</strong> de usuarios que sean infractores reincidentes de derechos de autor.</li>
                            <li><strong className="text-white">Retener pagos</strong> y revocar acceso a eventos sin derecho a reembolso.</li>
                            <li><strong className="text-white">Reportar a las autoridades</strong> actividades que constituyan piratería o distribución ilegal de contenido.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">5. Contenido de Promotores</h2>
                        <p>
                            Los promotores y organizadores de eventos que suban contenido a {siteName} garantizan que poseen
                            todos los derechos necesarios sobre dicho contenido, incluyendo derechos de imagen, música, marcas y
                            cualquier otro material protegido. Los promotores son responsables de obtener todas las licencias y permisos necesarios.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">6. Protección del Contenido</h2>
                        <p>
                            Todo el contenido transmitido a través de {siteName} está protegido por tecnología de marca de agua digital
                            y sistemas de seguridad. Está estrictamente prohibido:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Grabar, capturar o realizar screenshots del contenido en vivo.</li>
                            <li>Re-transmitir o re-distribuir el contenido por cualquier medio.</li>
                            <li>Compartir enlaces de acceso o credenciales de la cuenta.</li>
                            <li>Utilizar herramientas de descarga o screen recording.</li>
                        </ul>
                        <p className="mt-4 text-red-400 font-semibold">
                            La violación de estas normas resultará en la cancelación inmediata de la cuenta, pérdida de acceso a todos
                            los eventos comprados, y posibles acciones legales.
                        </p>
                    </section>

                    <section className="pt-8 border-t border-dark-800">
                        <p className="text-sm italic">
                            Última actualización: 3 de marzo de 2026.
                        </p>
                        <div className="flex gap-4 mt-4">
                            <Link href="/terms" className="text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                Términos de Servicio
                            </Link>
                            <Link href="/privacy" className="text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors flex items-center gap-1">
                                <Shield className="w-4 h-4" />
                                Política de Privacidad
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
