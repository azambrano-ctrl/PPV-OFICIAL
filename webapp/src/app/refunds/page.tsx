import React from 'react';

export default function RefundPolicy() {
    return (
        <div className="bg-dark-950 min-h-screen pt-24 pb-12">
            <div className="container-custom max-w-4xl">
                <h1 className="text-4xl font-display font-bold mb-8 gradient-text">Política de Reembolsos</h1>

                <div className="prose prose-invert max-w-none space-y-6 text-dark-300">
                    <section>
                        <h2 className="text-2xl font-semibold text-white">Condiciones de Reembolso</h2>
                        <p>
                            En Arena Fight Pass nos esforzamos por ofrecer la mejor calidad de streaming. Nuestra política de reembolsos es la siguiente:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Contenido Digital:</strong> Al ser un servicio de acceso inmediato a contenido digital en vivo, no se ofrecen reembolsos una vez que el evento ha comenzado, excepto por problemas técnicos mayores de nuestra plataforma.</li>
                            <li><strong>Problemas Técnicos:</strong> Si experimentas problemas técnicos persistentes (caída del servidor, error de señal de origen), puedes solicitar un reembolso o crédito para un futuro evento dentro de las 24 horas posteriores al mismo.</li>
                            <li><strong>Error de Compra:</strong> Si realizaste una compra por error y no has accedido al stream, contáctanos antes del inicio del evento para procesar una anulación.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white">Cómo solicitarlo</h2>
                        <p>
                            Envía un correo a soporte@arenafightpass.com con tu número de pedido y una breve descripción del problema. Nuestro equipo evaluará tu caso en un plazo de 48 horas.
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
