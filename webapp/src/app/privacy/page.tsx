import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-dark-950 py-12 px-4 sm:px-6 lg:px-8 text-dark-200">
            <div className="max-w-3xl mx-auto bg-dark-900 shadow-xl rounded-lg p-8 border border-dark-800">
                <h1 className="text-3xl font-display font-bold text-white mb-6">Política de Privacidad</h1>

                <div className="prose prose-invert max-w-none">
                    <p className="mb-4">
                        Bienvenido a PPV Streaming. Nos tomamos muy en serio la privacidad de sus datos personales.
                        Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos su información,
                        en cumplimiento con la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> de la República del Ecuador.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">1. Responsable del Tratamiento</h2>
                    <p className="mb-4">
                        PPV Streaming (en adelante "la Plataforma") es el responsable del tratamiento de los datos personales
                        que usted nos proporciona. Para cualquier consulta, puede contactarnos a través de nuestros canales oficiales.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">2. Datos que Recopilamos</h2>
                    <ul className="list-disc list-inside mb-4 space-y-2">
                        <li><strong>Datos de Identificación:</strong> Nombre, correo electrónico, imagen de perfil (a través de Facebook/Google Login).</li>
                        <li><strong>Datos de Transacción:</strong> Historial de compras de eventos (no almacenamos números completos de tarjetas de crédito).</li>
                        <li><strong>Datos Técnicos:</strong> Dirección IP, tipo de navegador y registros de acceso para seguridad.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">3. Finalidad del Tratamiento</h2>
                    <p className="mb-4">
                        Sus datos serán utilizados exclusivamente para:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-2">
                        <li>Permitir el acceso y autenticación en la plataforma.</li>
                        <li>Procesar los pagos de los eventos PPV (Pay-Per-View).</li>
                        <li>Enviar notificaciones relacionadas con los eventos adquiridos.</li>
                        <li>Mejorar la seguridad y prevenir fraudes.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">4. Derechos del Titular (LOPDP)</h2>
                    <p className="mb-4">
                        De acuerdo con la ley ecuatoriana, usted tiene derecho a: Acceso, Rectificación, Eliminación,
                        Oposición y Portabilidad de sus datos. Para ejercer estos derechos, contáctenos mediante el formulario de soporte.
                    </p>

                    <h2 className="text-xl font-bold text-white mt-6 mb-3">5. Eliminación de Datos (Facebook/Google)</h2>
                    <p className="mb-4">
                        Si utilizó Facebook o Google para iniciar sesión y desea eliminar los datos asociados a su cuenta,
                        puede solicitar la eliminación completa de su perfil desde la configuración de usuario de nuestra plataforma
                        o contactando a soporte para la eliminación manual inmediata.
                    </p>

                    <p className="mt-8 text-sm text-dark-400">
                        Última actualización: {new Date().toLocaleDateString('es-EC')}
                    </p>
                </div>
            </div>
        </div>
    );
}
