import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
    return (
        <div className="bg-dark-950 min-h-screen pt-24 pb-12">
            <div className="container-custom max-w-4xl">
                <h1 className="text-4xl font-display font-bold mb-8 gradient-text">Términos de Servicio</h1>

                <div className="prose prose-invert max-w-none space-y-6 text-dark-300">
                    <section>
                        <h2 className="text-2xl font-semibold text-white">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar Arena Fight Pass, aceptas cumplir con los presentes términos y condiciones. Si no estás de acuerdo con alguna parte, te pedimos que no utilices nuestra plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">2. Acceso a Contenido (PPV)</h2>
                        <p>
                            El acceso a los eventos en vivo está sujeto al pago correspondiente. La compra de un evento otorga una licencia limitada, no transferible, para visualizar dicho contenido en un solo dispositivo de forma simultánea.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">3. Propiedad Intelectual y Derechos de Autor</h2>
                        <p>
                            Todo el contenido disponible en Arena Fight Pass, incluyendo pero no limitado a transmisiones en vivo,
                            repeticiones, logotipos, gráficos, textos y software, está protegido por leyes de propiedad intelectual
                            y derechos de autor nacionales e internacionales.
                        </p>
                        <p className="mt-2">
                            Los derechos sobre el contenido de los eventos pertenecen a sus respectivos promotores y organizadores.
                            Arena Fight Pass actúa como plataforma de distribución autorizada.
                        </p>
                        <p className="mt-2 text-primary-500 font-semibold">
                            Cualquier uso no autorizado del contenido constituye una violación de derechos de autor y puede dar lugar a acciones legales civiles y penales.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">4. Restricciones de Uso</h2>
                        <p>
                            Está estrictamente prohibido:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Retransmitir, grabar, capturar pantalla o distribuir el contenido de la plataforma sin autorización expresa por escrito.</li>
                            <li>Utilizar herramientas de screen recording, grabación de pantalla, o cualquier método de captura de contenido.</li>
                            <li>Compartir, revender o transferir credenciales de acceso o enlaces de streaming con terceros.</li>
                            <li>Intentar eludir las medidas de protección de contenido (DRM, marca de agua, restricción de sesión).</li>
                            <li>Hackear, descompilar, realizar ingeniería inversa o interrumpir el servicio de streaming.</li>
                            <li>Usar el contenido con fines comerciales no autorizados (publicidad, re-venta, compilaciones, etc.).</li>
                        </ul>
                        <p className="mt-4 text-red-400 font-semibold">
                            La violación de estas reglas resultará en el bloqueo inmediato de la cuenta sin derecho a reembolso,
                            y podrá dar lugar a acciones legales por daños y perjuicios.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">5. Marca de Agua Digital y Monitoreo</h2>
                        <p>
                            Todo el contenido transmitido incluye una marca de agua digital invisible vinculada a tu cuenta de usuario.
                            Esta tecnología nos permite identificar la fuente de cualquier redistribución no autorizada.
                            Al usar la plataforma, consientes al uso de esta tecnología de protección.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">6. Política DMCA</h2>
                        <p>
                            Arena Fight Pass cumple con la Ley de Derechos de Autor del Milenio Digital (DMCA). Si crees que algún
                            contenido en nuestra plataforma infringe tus derechos de autor, por favor consulta nuestra{' '}
                            <Link href="/dmca" className="text-primary-500 hover:text-primary-400 transition-colors font-semibold">
                                Política DMCA completa
                            </Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">7. Responsabilidad de Promotores</h2>
                        <p>
                            Los promotores y organizadores de eventos que utilizan la plataforma garantizan que poseen todos los
                            derechos necesarios sobre el contenido que transmiten, incluyendo derechos de imagen de los participantes,
                            música, marcas comerciales y cualquier otro material. Los promotores se comprometen a indemnizar a
                            Arena Fight Pass ante cualquier reclamación de terceros por infracción de derechos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">8. Política de Reembolsos</h2>
                        <p>
                            Debido a la naturaleza digital del contenido en vivo, las ventas de eventos PPV son finales. Solo se considerarán reembolsos en caso de fallos técnicos demostrables por parte de nuestra infraestructura que impidan la visualización total del evento.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">9. Calidad del Servicio</h2>
                        <p>
                            La calidad de la imagen depende de tu conexión a internet. Recomendamos una velocidad mínima de 10 Mbps para una experiencia óptima en Full HD.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">10. Limitación de Responsabilidad</h2>
                        <p>
                            Arena Fight Pass no será responsable por daños indirectos, incidentales, especiales o consecuentes que
                            resulten del uso o la imposibilidad de usar la plataforma. Nuestra responsabilidad máxima se limitará
                            al monto pagado por el usuario en los últimos 12 meses.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">11. Ley Aplicable</h2>
                        <p>
                            Estos términos se rigen por las leyes de la República del Ecuador. Cualquier disputa será sometida a
                            la jurisdicción de los tribunales competentes de la ciudad de Guayaquil, Ecuador.
                        </p>
                    </section>

                    <section className="pt-8 border-t border-dark-800">
                        <p className="text-sm italic">
                            Última actualización: 3 de marzo de 2026.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
