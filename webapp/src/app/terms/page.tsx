import React from 'react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-dark-950 pt-32 pb-12 px-4 sm:px-6 lg:px-8 text-dark-200">
            <div className="max-w-3xl mx-auto bg-dark-900 shadow-xl rounded-lg p-8 border border-dark-800">
                <h1 className="text-3xl font-display font-bold text-white mb-6">Términos de Servicio</h1>

                <div className="prose prose-invert max-w-none text-sm md:text-base">
                    <p className="mb-4">
                        Bienvenido a PPV Streaming. Al utilizar nuestra plataforma, usted acepta los presentes Términos de Servicio, los cuales se rigen por la legislación de la <strong>República del Ecuador</strong>, incluyendo la <strong>Ley Orgánica de Defensa del Consumidor (LODC)</strong> y la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong>.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">1. Objeto y Aceptación</h2>
                    <p className="mb-4">
                        PPV Streaming proporciona un servicio de acceso a transmisiones de eventos deportivos y de entretenimiento bajo el modelo de "Pago por Evento". El uso de la plataforma constituye la aceptación tácita de estos términos. Nos reservamos el derecho de actualizar este documento en cumplimiento con normativas vigentes, notificando cambios relevantes a través de los medios registrados.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">2. Derechos del Consumidor (LODC)</h2>
                    <p className="mb-2">
                        En cumplimiento con la LODC, garantizamos:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-2">
                        <li><strong>Información Precisa:</strong> Detalles claros sobre precios (incluyendo impuestos), horarios y requisitos técnicos para la visualización.</li>
                        <li><strong>Protección contra Publicidad Engañosa:</strong> Las características del evento y la calidad de la señal comunicadas serán respetadas bajo condiciones normales de red.</li>
                        <li><strong>Seguridad en las Transacciones:</strong> Implementamos protocolos de seguridad para proteger sus datos financieros conforme a los estándares de la industria.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">3. Capacidad para Contratar</h2>
                    <p className="mb-4">
                        Nuestros servicios están dirigidos a personas con capacidad legal para contratar. Los menores de edad deberán utilizar la plataforma bajo la supervisión de un padre o tutor legal.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">4. Uso de la Cuenta y Seguridad</h2>
                    <p className="mb-4">
                        Usted es el único responsable de la seguridad de su cuenta y contraseña. El acceso adquirido es personal. Queda prohibida la reventa, retransmisión masiva o cualquier uso comercial no autorizado del contenido, lo cual podrá ser sancionado con la suspensión definitiva de la cuenta sin perjuicio de acciones legales adicionales.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">5. Protección de Datos (LOPDP)</h2>
                    <p className="mb-4">
                        El tratamiento de sus datos personales se realiza conforme a nuestra <strong>Política de Privacidad</strong>. Garantizamos el ejercicio de sus derechos de Acceso, Rectificación, Eliminación y Oposición (Derechos ARCO) tal como lo establece la LOPDP en Ecuador.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">6. Propiedad Intelectual</h2>
                    <p className="mb-4">
                        Todo el material visual, auditivo y logotipos son propiedad exclusiva de PPV Streaming o sus licenciantes. El uso indebido será procesado bajo la Ley de Propiedad Intelectual del Ecuador.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">7. Jurisdicción y Competencia</h2>
                    <p className="mb-4">
                        Cualquier controversia que no pueda ser resuelta de mutuo acuerdo será sometida a los jueces competentes según la normativa procesal civil ecuatoriana y bajo las leyes de la República del Ecuador.
                    </p>

                    <p className="mt-8 text-sm text-dark-400">
                        Última actualización: {new Date().toLocaleDateString('es-EC')}
                    </p>
                </div>
            </div>
        </div>
    );
}
