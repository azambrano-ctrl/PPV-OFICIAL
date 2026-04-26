'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { promotersAPI } from '@/lib/api';
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
    const [loading, setLoading] = useState(true);
    const today = new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

    useEffect(() => {
        promotersAPI.getById(promoterId)
            .then(r => setPromoter(r.data.data))
            .finally(() => setLoading(false));
    }, [promoterId]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-white"><div className="text-gray-500">Cargando contrato...</div></div>;
    }

    if (!promoter) {
        return <div className="flex items-center justify-center h-screen bg-white"><div className="text-gray-500">Promotora no encontrada.</div></div>;
    }

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .contract-page { box-shadow: none !important; margin: 0 !important; padding: 40px !important; }
                }
                body { background: #f3f4f6; }
            `}</style>

            {/* Print Button */}
            <div className="no-print fixed top-4 right-4 z-50">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                    <Printer className="w-5 h-5" />
                    Descargar PDF
                </button>
            </div>

            {/* Contract Document */}
            <div className="min-h-screen py-12 px-4">
                <div className="contract-page bg-white max-w-3xl mx-auto rounded-2xl shadow-2xl p-16 font-serif text-gray-900">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b-4 border-red-600 pb-8 mb-10">
                        <div className="flex items-center gap-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icon-512x512.png" alt="Arena Fight Pass" className="w-16 h-16 object-contain" />
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Arena Fight Pass</h2>
                                <p className="text-xs text-gray-500 uppercase tracking-widest">Plataforma de Streaming de Combates</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Fecha</p>
                            <p className="text-sm font-bold text-gray-800">{today}</p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">
                            Contrato de Servicios
                        </h1>
                        <h2 className="text-lg font-bold text-red-600 uppercase tracking-widest">
                            Difusión y Transmisión en Plataforma Digital
                        </h2>
                    </div>

                    {/* Parties */}
                    <section className="mb-10">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-l-4 border-red-600 pl-3 mb-4">Partes Contratantes</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">La Plataforma</p>
                                <p className="font-black text-gray-900 text-lg">Arena Fight Pass</p>
                                <p className="text-xs text-gray-500 mt-1">Plataforma digital de streaming de combates</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">La Promotora</p>
                                <p className="font-black text-gray-900 text-lg">{promoter.name}</p>
                                {promoter.phone && <p className="text-xs text-gray-500 mt-1">Tel: {promoter.phone}</p>}
                                {promoter.city && <p className="text-xs text-gray-500">Ciudad: {promoter.city}</p>}
                            </div>
                        </div>
                    </section>

                    {/* Clauses */}
                    <section className="space-y-8 mb-12">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-l-4 border-red-600 pl-3">Cláusulas del Contrato</h3>

                        <Clause number="1" title="Objeto del Contrato">
                            La PLATAFORMA otorga a la PROMOTORA acceso a sus servicios de difusión, transmisión y comercialización de eventos de artes marciales mixtas y deportes de combate a través de su plataforma digital <strong>Arena Fight Pass</strong>. La PROMOTORA podrá publicar eventos, gestionar entradas y acceder a herramientas de análisis de ventas.
                        </Clause>

                        <Clause number="2" title="Tarifa por Evento (Fee de Publicación)">
                            Por cada evento publicado y difundido a través de la PLATAFORMA, la PROMOTORA se compromete a pagar una tarifa fija de <strong>CUARENTA DÓLARES AMERICANOS (USD $40.00)</strong>, independientemente de los resultados de ventas. Esta tarifa cubre los costos de infraestructura, alojamiento y soporte técnico del evento en la plataforma.
                        </Clause>

                        <Clause number="3" title="Comisión sobre Ganancias Totales">
                            La PLATAFORMA retendrá el <strong>VEINTICINCO POR CIENTO (25%)</strong> de las ganancias brutas totales generadas por la venta de acceso a cada evento. El restante <strong>SETENTA Y CINCO POR CIENTO (75%)</strong> será transferido a la PROMOTORA conforme a los plazos y métodos de pago acordados. Las ganancias brutas se calcularán sobre el total recaudado antes de impuestos.
                        </Clause>

                        <Clause number="4" title="Derechos de Autor y Copyright">
                            La PLATAFORMA <strong>NO asume ninguna responsabilidad</strong> respecto al contenido, imágenes, audio, video, música, marcas registradas o cualquier otro material audiovisual o intelectual que la PROMOTORA utilice en sus eventos y publicaciones. La PROMOTORA declara ser la única y exclusiva responsable de obtener los permisos, licencias y autorizaciones necesarios de los titulares de derechos de autor correspondientes. Cualquier reclamación legal derivada de infracciones de propiedad intelectual será asumida íntegramente por la PROMOTORA, quien mantendrá indemne a la PLATAFORMA frente a terceros.
                        </Clause>

                        <Clause number="5" title="Forma y Plazos de Pago">
                            Los pagos se procesarán a través de los métodos habilitados por la PLATAFORMA (transferencia bancaria, PayPal u otros). La liquidación del porcentaje de ganancias se realizará dentro de los <strong>15 días hábiles</strong> siguientes al cierre del evento. La tarifa fija por publicación deberá ser abonada previo a la activación del evento en la plataforma.
                        </Clause>

                        <Clause number="6" title="Obligaciones de la Promotora">
                            La PROMOTORA se compromete a: (a) proveer información veraz y actualizada sobre sus eventos; (b) cumplir con la normativa local vigente para la realización de eventos deportivos; (c) no publicar contenido ilegal, ofensivo o que vulnere derechos de terceros; (d) notificar a la PLATAFORMA con al menos <strong>72 horas de anticipación</strong> cualquier cancelación o modificación de evento.
                        </Clause>

                        <Clause number="7" title="Vigencia y Terminación">
                            El presente contrato tendrá vigencia <strong>indefinida</strong> desde la fecha de su firma. Cualquiera de las partes podrá darlo por terminado con un preaviso mínimo de <strong>30 días calendario</strong>, sin que ello genere penalidad alguna, siempre que no existan obligaciones pendientes de cumplimiento.
                        </Clause>

                        <Clause number="8" title="Limitación de Responsabilidad">
                            La PLATAFORMA no será responsable por fallas técnicas de terceros (proveedores de internet, servicios de streaming externos), ni por pérdidas indirectas derivadas de la transmisión de eventos. La responsabilidad máxima de la PLATAFORMA se limita al monto del fee cobrado por el evento en cuestión.
                        </Clause>

                        <Clause number="9" title="Ley Aplicable y Jurisdicción">
                            El presente contrato se rige por las leyes de la <strong>República del Ecuador</strong>. Para la resolución de controversias, las partes acuerdan someterse a la jurisdicción de los tribunales competentes de la ciudad de <strong>Quito, Ecuador</strong>, renunciando expresamente a cualquier otro fuero que pudiere corresponderles.
                        </Clause>
                    </section>

                    {/* Acceptance */}
                    <div className="bg-gray-50 rounded-2xl p-6 mb-12 border border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            Al acceder y utilizar los servicios de la PLATAFORMA, la PROMOTORA declara haber leído, comprendido y aceptado en su totalidad los términos y condiciones establecidos en el presente contrato.
                        </p>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-16 mt-8">
                        <div className="text-center">
                            <div className="border-t-2 border-gray-900 pt-4">
                                <p className="font-black text-sm uppercase tracking-wider text-gray-900">Arena Fight Pass</p>
                                <p className="text-xs text-gray-500 mt-1">Representante Legal de la Plataforma</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t-2 border-gray-900 pt-4">
                                <p className="font-black text-sm uppercase tracking-wider text-gray-900">{promoter.name}</p>
                                <p className="text-xs text-gray-500 mt-1">Representante de la Promotora</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-6 border-t border-gray-200 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Arena Fight Pass · Plataforma de Streaming de Combates · arenaFightPass.com</p>
                        <p className="text-[10px] text-gray-400 mt-1">Documento generado el {today} · ID Promotora: {promoter.id}</p>
                    </div>
                </div>
            </div>
        </>
    );
}

function Clause({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                <span className="text-red-600">Art. {number}.</span> {title}
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">{children}</p>
        </div>
    );
}
