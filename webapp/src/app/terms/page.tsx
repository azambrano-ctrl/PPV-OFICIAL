import React from 'react';

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
                        <h2 className="text-2xl font-semibold text-white">3. Restricciones de Uso</h2>
                        <p>
                            Está estrictamente prohibido:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Retransmitir, grabar o distribuir el contenido de la plataforma sin autorización.</li>
                            <li>Intentar hackear o interrumpir el servicio de streaming.</li>
                            <li>Compartir credenciales de acceso con terceros.</li>
                        </ul>
                        <p className="mt-2 text-primary-500 font-semibold">
                            La violación de estas reglas resultará en el bloqueo inmediato de la cuenta sin derecho a reembolso.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">4. Política de Reembolsos</h2>
                        <p>
                            Debido a la naturaleza digital del contenido en vivo, las ventas de eventos PPV son finales. Solo se considerarán reembolsos en caso de fallos técnicos demostrables por parte de nuestra infraestructura que impidan la visualización total del evento.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">5. Calidad del Servicio</h2>
                        <p>
                            La calidad de la imagen depende de tu conexión a internet. Recomendamos una velocidad mínima de 10 Mbps para una experiencia óptima en Full HD.
                        </p>
                    </section>

                    <section className="pt-8 border-t border-dark-800">
                        <p className="text-sm italic">
                            Última actualización: 26 de enero de 2026.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
