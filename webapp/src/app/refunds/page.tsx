import React from 'react';

export default function RefundsPage() {
    return (
        <div className="min-h-screen bg-dark-950 py-12 px-4 sm:px-6 lg:px-8 text-dark-200">
            <div className="max-w-3xl mx-auto bg-dark-900 shadow-xl rounded-lg p-8 border border-dark-800">
                <h1 className="text-3xl font-display font-bold text-white mb-6">Política de Reembolsos</h1>

                <div className="prose prose-invert max-w-none text-sm md:text-base">
                    <p className="mb-4">
                        En PPV Streaming, valoramos su satisfacción y operamos bajo estricto cumplimiento de la <strong>Ley Orgánica de Defensa del Consumidor (LODC)</strong> de la República del Ecuador.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">1. Naturaleza del Servicio Digital</h2>
                    <p className="mb-4">
                        Nuestros servicios consisten en el suministro de contenido digital en tiempo real (streaming). Según el Art. 45 de la LODC y normativas internacionales de consumo digital, una vez que el servicio ha comenzado con el consentimiento del consumidor, el derecho de retracto puede verse limitado. No obstante, garantizamos la reversión de pago en casos específicos.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">2. Casos de Reversión de Pago y Reembolso</h2>
                    <p className="mb-2">
                        Usted tiene derecho a solicitar la devolución de su dinero en los siguientes supuestos:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-2">
                        <li><strong>Doble Cobro o Error en la Transacción:</strong> Cobros indebidos por fallas en la pasarela de pagos.</li>
                        <li><strong>No Prestación del Servicio:</strong> Si por fallas técnicas imputables exclusivamente a PPV Streaming, el evento no puede ser visualizado y no se ofrece una solución alternativa (como reemisión o grabación).</li>
                        <li><strong>Derecho de Retracto:</strong> Si la compra fue realizada por error y usted solicita la cancelación <strong>antes de que el evento inicie</strong>. Una vez iniciada la transmisión, el servicio se considera prestado.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">3. Garantía de Calidad</h2>
                    <p className="mb-4">
                        Si la calidad de la señal es deficiente por causas de origen (producción del evento), evaluaremos la entrega de compensaciones o reembolsos parciales conforme a lo estipulado en la LODC sobre servicios deficientes. Esto no aplica a fallas en la conexión de internet del usuario o dispositivos incompatibles.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">4. Procedimiento de Reclamo</h2>
                    <p className="mb-4">
                        Para ejercer sus derechos, debe enviar una solicitud al correo oficial de soporte en un plazo no mayor a <strong>48 horas</strong> hábiles tras el incidente. Deberá adjuntar el comprobante de pago y, de ser posible, evidencia de la falla técnica constatada.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">5. Plazos de Devolución</h2>
                    <p className="mb-4">
                        Una vez aprobado el reembolso, el proceso de acreditación dependerá de los tiempos de su entidad bancaria (usualmente entre 5 a 15 días laborables). PPV Streaming emitirá el comprobante de reversión de forma inmediata.
                    </p>

                    <p className="mt-8 text-sm text-dark-400">
                        Última actualización: {new Date().toLocaleDateString('es-EC')}
                    </p>
                </div>
            </div>
        </div>
    );
}
