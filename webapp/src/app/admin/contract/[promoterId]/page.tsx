'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { promotersAPI, settingsAPI } from '@/lib/api';
import { Printer } from 'lucide-react';

interface Promoter {
    id: string;
    name: string;
    slug: string;
    description?: string;
    phone?: string;
    city?: string;
    created_at: string;
}

export default function PromoterContractPage() {
    const params = useParams();
    const promoterId = params.promoterId as string;
    const [promoter, setPromoter] = useState<Promoter | null>(null);
    const [logoUrl, setLogoUrl] = useState<string>('/la-jaula-logo.svg');
    const [siteName, setSiteName] = useState<string>('Arena Fight Pass');
    const [loading, setLoading] = useState(true);
    const today = new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

    useEffect(() => {
        Promise.all([
            promotersAPI.getById(promoterId),
            settingsAPI.get(),
        ]).then(([promoterRes, settingsRes]) => {
            setPromoter(promoterRes.data.data);
            const s = settingsRes.data.data;
            if (s?.site_logo) setLogoUrl(s.site_logo);
            if (s?.site_name) setSiteName(s.site_name);
        }).finally(() => setLoading(false));
    }, [promoterId]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-white"><p className="text-gray-400">Cargando contrato...</p></div>;
    }
    if (!promoter) {
        return <div className="flex items-center justify-center h-screen bg-white"><p className="text-gray-400">Promotora no encontrada.</p></div>;
    }

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; }
                    .contract-page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; padding: 36px 48px !important; max-width: 100% !important; }
                    .page-break { page-break-before: always; }
                }
                body { background: #f3f4f6; margin: 0; font-family: Georgia, 'Times New Roman', serif; }
            `}</style>

            {/* Floating print button */}
            <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-3">
                <span className="text-xs text-gray-500 bg-white px-3 py-2 rounded-lg shadow">Archivo → Guardar como PDF</span>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                    <Printer className="w-5 h-5" />
                    Descargar PDF
                </button>
            </div>

            <div className="min-h-screen py-12 px-4">
                <div className="contract-page bg-white max-w-3xl mx-auto rounded-2xl shadow-2xl p-16 text-gray-900" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>

                    {/* Header with real logo */}
                    <div className="flex items-center justify-between border-b-4 border-red-600 pb-8 mb-10">
                        <div className="flex items-center gap-5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={logoUrl}
                                alt={siteName}
                                className="h-16 w-auto object-contain"
                                onError={(e) => { e.currentTarget.src = '/la-jaula-logo.svg'; }}
                            />
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{siteName}</h2>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">Plataforma de Streaming de Combates</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Fecha de emisión</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">{today}</p>
                            <p className="text-[10px] text-gray-400 mt-1">ID: {promoter.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Contrato de Servicios</h1>
                        <h2 className="text-base font-bold text-red-600 uppercase tracking-widest">Difusión y Transmisión en Plataforma Digital</h2>
                        <div className="w-16 h-1 bg-red-600 mx-auto mt-4 rounded-full" />
                    </div>

                    {/* Parties */}
                    <section className="mb-10">
                        <SectionTitle>Partes Contratantes</SectionTitle>
                        <div className="grid grid-cols-2 gap-5 mt-4">
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-2">La Plataforma</p>
                                <p className="font-black text-gray-900 text-base">{siteName}</p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">Plataforma digital de streaming de combates y artes marciales mixtas</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-2">La Promotora</p>
                                <p className="font-black text-gray-900 text-base">{promoter.name}</p>
                                {promoter.phone && <p className="text-xs text-gray-500 mt-1">Teléfono: {promoter.phone}</p>}
                                {promoter.city && <p className="text-xs text-gray-500">Ciudad: {promoter.city}</p>}
                            </div>
                        </div>
                    </section>

                    {/* Clauses */}
                    <section className="space-y-7 mb-12">
                        <SectionTitle>Cláusulas del Contrato</SectionTitle>

                        <Clause number="1" title="Objeto del Contrato">
                            La PLATAFORMA otorga a la PROMOTORA acceso a sus servicios de difusión, transmisión en vivo y comercialización de eventos de artes marciales mixtas y deportes de combate a través de <strong>{siteName}</strong>. La PROMOTORA podrá publicar eventos, gestionar la venta de accesos y consultar herramientas de análisis de ventas en tiempo real.
                        </Clause>

                        <Clause number="2" title="Tarifa Fija por Evento (Fee de Publicación)">
                            Por cada evento publicado y activado en la PLATAFORMA, la PROMOTORA pagará una tarifa fija de <strong>CUARENTA DÓLARES AMERICANOS (USD $40.00)</strong>, sin importar los resultados de ventas. Esta tarifa cubre los costos de infraestructura, hosting, transmisión y soporte técnico asignados al evento.
                        </Clause>

                        <Clause number="3" title="Comisión sobre Ganancias Totales">
                            La PLATAFORMA retendrá el <strong>VEINTICINCO POR CIENTO (25%)</strong> de las ganancias brutas generadas por la venta de acceso a cada evento. El <strong>SETENTA Y CINCO POR CIENTO (75%)</strong> restante será transferido a la PROMOTORA en los plazos establecidos en el Art. 5. El cálculo se realiza sobre el total recaudado antes de impuestos y después de descontar las comisiones de la pasarela de pago detalladas en el Art. 4.
                        </Clause>

                        <Clause number="4" title="Comisiones de Pasarela de Pago (PayPal)">
                            Los pagos de los usuarios se procesan a través de <strong>PayPal</strong>. Las siguientes comisiones son cobradas directamente por PayPal y están fuera del control de la PLATAFORMA:{'\n\n'}
                            <div className="mt-3 space-y-2">
                                <FeeRow label="Comisión por transacción recibida (tarjeta / PayPal)" value="3.49% + $0.49 USD por transacción" />
                                <FeeRow label="Cargo por pago internacional (tarjeta fuera del país)" value="+1.50% adicional" />
                                <FeeRow label="Retiro / transferencia de fondos a cuenta bancaria" value="$0.00 (sin cargo para transferencias estándar)" />
                                <FeeRow label="Retiro express (mismo día)" value="1.75% del monto (máx. $25.00 USD)" />
                            </div>
                            <p className="mt-3 text-xs text-gray-500 italic">Nota: Las tarifas de PayPal están sujetas a cambios sin previo aviso por parte del proveedor. Consultar las tarifas vigentes en paypal.com/ec.</p>
                        </Clause>

                        <Clause number="5" title="Forma y Plazos de Pago">
                            La tarifa fija (Art. 2) deberá abonarse previo a la activación del evento en la plataforma. La liquidación del porcentaje de ganancias (Art. 3) se realizará dentro de los <strong>15 días hábiles</strong> siguientes al cierre del evento, mediante transferencia PayPal o el método acordado entre las partes, ya descontadas las comisiones del Art. 4.
                        </Clause>

                        <Clause number="6" title="Derechos de Autor y Copyright">
                            La PLATAFORMA <strong>NO asume ninguna responsabilidad</strong> por contenido, imágenes, audio, video, música, marcas o cualquier material audiovisual utilizado por la PROMOTORA en sus eventos y publicaciones. La PROMOTORA declara ser la única responsable de obtener permisos y licencias de los titulares de derechos de autor. Cualquier reclamación legal por infracción de propiedad intelectual será asumida íntegramente por la PROMOTORA, quien mantendrá indemne a la PLATAFORMA frente a terceros y cubrirá los costos legales derivados.
                        </Clause>

                        <Clause number="7" title="Obligaciones de la Promotora">
                            La PROMOTORA se compromete a: (a) proveer información veraz sobre sus eventos; (b) cumplir la normativa local vigente para eventos deportivos; (c) no publicar contenido ilegal, ofensivo o que vulnere derechos de terceros; (d) notificar con al menos <strong>72 horas de anticipación</strong> cualquier cancelación o modificación de evento ya publicado.
                        </Clause>

                        <Clause number="8" title="Vigencia y Terminación">
                            El presente contrato tiene vigencia <strong>indefinida</strong> desde la fecha de su firma. Cualquiera de las partes podrá terminarlo con <strong>30 días calendario</strong> de preaviso escrito, sin penalidad, siempre que no existan obligaciones pendientes.
                        </Clause>

                        <Clause number="9" title="Limitación de Responsabilidad">
                            La PLATAFORMA no será responsable por fallas técnicas de terceros (proveedores de internet, servicios de streaming) ni por pérdidas indirectas. La responsabilidad máxima de la PLATAFORMA se limita al monto del fee de publicación cobrado por el evento específico en disputa.
                        </Clause>

                        <Clause number="10" title="Ley Aplicable y Jurisdicción">
                            El presente contrato se rige por las leyes de la <strong>República del Ecuador</strong>. Las partes acuerdan someterse a la jurisdicción de los tribunales competentes de <strong>Quito, Ecuador</strong>, renunciando a cualquier otro fuero.
                        </Clause>
                    </section>

                    {/* Acceptance box */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-12">
                        <p className="text-xs text-gray-500 text-center leading-relaxed">
                            Al acceder y utilizar los servicios de la PLATAFORMA, la PROMOTORA declara haber leído, comprendido y aceptado en su totalidad los términos establecidos en el presente contrato.
                        </p>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-20">
                        <div className="text-center">
                            <div className="h-14 border-b-2 border-gray-900 mb-3" />
                            <p className="font-black text-sm uppercase tracking-wide">{siteName}</p>
                            <p className="text-xs text-gray-500 mt-1">Representante Legal</p>
                        </div>
                        <div className="text-center">
                            <div className="h-14 border-b-2 border-gray-900 mb-3" />
                            <p className="font-black text-sm uppercase tracking-wide">{promoter.name}</p>
                            <p className="text-xs text-gray-500 mt-1">Representante de la Promotora</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-14 pt-5 border-t border-gray-200 text-center space-y-1">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest">{siteName} · Plataforma de Streaming de Combates</p>
                        <p className="text-[9px] text-gray-400">Documento generado el {today} · ID Promotora: {promoter.id}</p>
                    </div>
                </div>
            </div>
        </>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 border-l-4 border-red-600 pl-3">
            {children}
        </h3>
    );
}

function Clause({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className="text-sm font-black uppercase tracking-wide text-gray-900 mb-2">
                <span className="text-red-600">Art. {number}.</span> {title}
            </h4>
            <div className="text-sm text-gray-700 leading-relaxed text-justify">{children}</div>
        </div>
    );
}

function FeeRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 bg-white border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-600">{label}</span>
            <span className="text-xs font-black text-gray-900 whitespace-nowrap">{value}</span>
        </div>
    );
}
