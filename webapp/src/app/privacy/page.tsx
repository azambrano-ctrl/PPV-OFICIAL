import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="bg-dark-950 min-h-screen pt-24 pb-12">
            <div className="container-custom max-w-4xl">
                <h1 className="text-4xl font-display font-bold mb-8 gradient-text">Política de Privacidad</h1>

                <div className="prose prose-invert max-w-none space-y-6 text-dark-300">
                    <section>
                        <h2 className="text-2xl font-semibold text-white">1. Información que recopilamos</h2>
                        <p>
                            En Arena Fight Pass, recopilamos información necesaria para brindarte el mejor servicio de streaming. Esto incluye:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Información de registro (nombre, correo electrónico).</li>
                            <li>Datos de pago (procesados de forma segura a través de Stripe y PayPal).</li>
                            <li>Información técnica (dirección IP, tipo de dispositivo) para optimizar la calidad del streaming.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">2. Uso de la información</h2>
                        <p>
                            Utilizamos tu información para:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Gestionar tu acceso a los eventos en vivo.</li>
                            <li>Procesar tus compras y suscripciones.</li>
                            <li>Enviarte notificaciones sobre próximos eventos si así lo autorizas.</li>
                            <li>Prevenir el fraude y asegurar la integridad de nuestra plataforma.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">3. Protección de datos</h2>
                        <p>
                            Implementamos medidas de seguridad robustas para proteger tus datos personales. No vendemos ni compartimos tu información con terceros con fines comerciales. Tus datos de pago están cifrados y se manejan cumpliendo con los estándares PCI-DSS.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">4. Tus derechos</h2>
                        <p>
                            Tienes derecho a acceder, rectificar o eliminar tus datos personales en cualquier momento a través de la configuración de tu cuenta o contactando a nuestro equipo de soporte.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">5. Cookies</h2>
                        <p>
                            Utilizamos cookies para mantener tu sesión activa y recordar tus preferencias de visualización. Puedes gestionar las cookies desde la configuración de tu navegador.
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
