'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, Clock, Users, Filter, Download, RefreshCw, Ticket, Search } from 'lucide-react';
import { adminAPI, handleAPIError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Purchase {
    id: string;
    payment_status: string;
    payment_method: string;
    amount: number;
    final_amount: number;
    discount_amount: number;
    currency: string;
    coupon_code: string | null;
    seat_number: number | null;
    purchased_at: string;
    payment_intent_id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    event_title: string;
    event_id: string | null;
    purchase_type: string;
}

interface EventSummary {
    id: string;
    title: string;
    sold: number;
    pending: number;
    revenue: number;
    currency: string;
    status: string;
}

const STATUS_COLORS: Record<string, string> = {
    completed: 'bg-green-500/15 text-green-400 border-green-500/20',
    pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    failed:    'bg-red-500/15 text-red-400 border-red-500/20',
    refunded:  'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

const METHOD_LABELS: Record<string, string> = {
    stripe: '💳 Tarjeta',
    paypal: '🅿️ PayPal',
    free:   '🆓 Gratis',
};

export default function VentasPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [paypalStatuses, setPaypalStatuses] = useState<Record<string, { status: string; grossAmount?: string; payerEmail?: string }>>({});
    const [filterEvent, setFilterEvent] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMethod, setFilterMethod] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [purRes, sumRes] = await Promise.all([
                adminAPI.getPurchases(),
                adminAPI.getEventsSalesSummary(),
            ]);
            setPurchases(purRes.data.data || []);
            setEvents(sumRes.data.data || []);
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getPurchases({
                eventId: filterEvent || undefined,
                status: filterStatus || undefined,
                paymentMethod: filterMethod || undefined,
            });
            setPurchases(res.data.data || []);
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        applyFilters();
    }, [filterEvent, filterStatus, filterMethod]);

    const completed = purchases.filter(p => p.payment_status === 'completed');
    const pending   = purchases.filter(p => p.payment_status === 'pending');
    const totalRev  = completed.reduce((s, p) => s + parseFloat(String(p.final_amount)), 0);
    const uniqueBuyers = new Set(completed.map(p => p.user_id)).size;

    const handleCheckPayPal = async (p: Purchase) => {
        setActionId(p.id);
        try {
            const res = await adminAPI.checkPayPalStatus(p.id);
            const data = res.data.data;
            setPaypalStatuses(prev => ({ ...prev, [p.id]: data }));

            const statusMsg: Record<string, string> = {
                COMPLETED:            '✅ PAGADO y capturado en PayPal',
                APPROVED:             '⚠️ El cliente SÍ aprobó el pago pero NO fue capturado — usa 🔄 para capturarlo',
                CREATED:              '❌ Nunca pagó — solo abrió el modal y lo cerró',
                VOIDED:               '❌ Orden anulada por PayPal',
                SAVED:                '⏳ Guardado pero sin pago',
                EXPIRED_OR_NOT_FOUND: '❌ Orden expirada o no existe en PayPal (usuario no pagó o es muy antigua)',
            };
            toast(statusMsg[data.status] || `Estado PayPal: ${data.status}`, {
                duration: 8000,
                icon: data.status === 'APPROVED' ? '⚠️' : data.status === 'COMPLETED' ? '✅' : '❌',
            });
        } catch (error) {
            toast.error('No se pudo consultar PayPal: ' + handleAPIError(error));
        } finally {
            setActionId(null);
        }
    };

    const handleRetry = async (p: Purchase) => {
        if (!confirm(`¿Reintentar captura de PayPal para ${p.user_name}?\n\nSolo funciona si el usuario SÍ pagó en PayPal. Si no pagó, fallará.`)) return;
        setActionId(p.id);
        try {
            await adminAPI.retryCapture(p.id);
            toast.success(`✅ Captura exitosa — ${p.user_name} ahora tiene acceso`);
            applyFilters();
        } catch (error: any) {
            const msg = error.response?.data?.message || handleAPIError(error);
            if (msg.includes('UNPROCESSABLE') || msg.includes('already been captured') || msg.includes('ORDER_NOT_APPROVED')) {
                toast.error('❌ El usuario NO pagó en PayPal (orden no aprobada o expirada). Usa "Dar Acceso" si quieres dárselo manualmente.');
            } else {
                toast.error(`Error: ${msg}`);
            }
        } finally {
            setActionId(null);
        }
    };

    const handleGrantByPurchase = async (p: Purchase) => {
        if (!confirm(`¿Dar acceso manualmente a ${p.user_name} para "${p.event_title}"?`)) return;
        setActionId(p.id);
        try {
            await adminAPI.grantAccessByPurchase(p.id);
            toast.success(`✅ Acceso otorgado a ${p.user_name}`);
            applyFilters();
        } catch (error) {
            toast.error(handleAPIError(error));
        } finally {
            setActionId(null);
        }
    };

    const exportCSV = () => {
        const header = 'Fecha,Usuario,Email,Evento,Monto,Descuento,Final,Método,Estado,ID Pago';
        const rows = purchases.map(p => [
            new Date(p.purchased_at).toLocaleString('es-EC'),
            `"${p.user_name}"`,
            p.user_email,
            `"${p.event_title}"`,
            p.amount,
            p.discount_amount,
            p.final_amount,
            p.payment_method,
            p.payment_status,
            p.payment_intent_id,
        ].join(','));
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ventas-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Ventas</h1>
                    <p className="text-gray-400">Historial completo de compras</p>
                </div>
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-xl border border-dark-600 transition-colors text-sm"
                >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-400">Ventas completadas</p>
                        <ShoppingCart className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{completed.length}</p>
                </div>
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-400">Ingresos totales</p>
                        <DollarSign className="w-5 h-5 text-primary-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">${totalRev.toFixed(2)}</p>
                </div>
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-400">Compradores únicos</p>
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{uniqueBuyers}</p>
                </div>
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-400">Pendientes</p>
                        <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">{pending.length}</p>
                    {pending.length > 0 && <p className="text-xs text-gray-500 mt-0.5">Usar botón 🎟️ para activar</p>}
                </div>
            </div>

            {/* Per-event summary */}
            <div className="card p-5">
                <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">Resumen por evento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {events.filter(e => e.sold > 0 || e.pending > 0).map(ev => (
                        <button
                            key={ev.id}
                            onClick={() => setFilterEvent(filterEvent === ev.id ? '' : ev.id)}
                            className={`text-left p-3 rounded-lg border transition-all ${
                                filterEvent === ev.id
                                    ? 'border-primary-500 bg-primary-500/10'
                                    : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                            }`}
                        >
                            <p className="text-white font-semibold text-sm truncate">{ev.title}</p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-green-400 font-bold">{ev.sold} vendidos</span>
                                <span className="text-gray-400 text-sm">${Number(ev.revenue).toFixed(2)}</span>
                                {ev.pending > 0 && <span className="text-yellow-400 text-xs">{ev.pending} pend.</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <Filter className="w-4 h-4 text-gray-500 shrink-0" />
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="input py-2 text-sm flex-1 min-w-[140px]"
                    >
                        <option value="">Todos los estados</option>
                        <option value="completed">Completado</option>
                        <option value="pending">Pendiente</option>
                        <option value="failed">Fallido</option>
                        <option value="refunded">Reembolsado</option>
                    </select>
                    <select
                        value={filterMethod}
                        onChange={e => setFilterMethod(e.target.value)}
                        className="input py-2 text-sm flex-1 min-w-[140px]"
                    >
                        <option value="">Todos los métodos</option>
                        <option value="stripe">Tarjeta (Stripe)</option>
                        <option value="paypal">PayPal</option>
                    </select>
                    {(filterEvent || filterStatus || filterMethod) && (
                        <button
                            onClick={() => { setFilterEvent(''); setFilterStatus(''); setFilterMethod(''); }}
                            className="text-sm text-primary-400 hover:text-primary-300 px-2"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Purchases Table */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="spinner w-10 h-10" />
                </div>
            ) : purchases.length === 0 ? (
                <div className="card p-12 text-center text-gray-500">No hay compras con estos filtros.</div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-dark-800">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Fecha</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Usuario</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Evento</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Monto</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Método</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Estado</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Cupón</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-800">
                                {purchases.map(p => (
                                    <tr key={p.id} className="hover:bg-dark-800/40 transition-colors">
                                        <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                                            {formatDate(p.purchased_at, 'dd/MM/yy HH:mm')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-white font-medium">{p.user_name}</p>
                                            <p className="text-gray-500 text-xs">{p.user_email}</p>
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 max-w-[200px] truncate">
                                            {p.event_title}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-white font-semibold">${Number(p.final_amount).toFixed(2)}</p>
                                            {p.discount_amount > 0 && (
                                                <p className="text-xs text-green-400">-${Number(p.discount_amount).toFixed(2)}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300">
                                            {METHOD_LABELS[p.payment_method] || p.payment_method}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[p.payment_status] || ''}`}>
                                                {p.payment_status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">
                                            {p.coupon_code || '—'}
                                        </td>
                                        <td className="py-3 px-4">
                                            {p.payment_status === 'pending' && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        {p.payment_method === 'paypal' && (
                                                            <button
                                                                onClick={() => handleCheckPayPal(p)}
                                                                disabled={actionId === p.id}
                                                                title="Verificar si pagó en PayPal"
                                                                className="p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors disabled:opacity-40"
                                                            >
                                                                <Search className={`w-3.5 h-3.5 ${actionId === p.id ? 'animate-pulse' : ''}`} />
                                                            </button>
                                                        )}
                                                        {p.payment_method === 'paypal' && (() => {
                                                            const knownStatus = paypalStatuses[p.id]?.status;
                                                            const canRetry = !knownStatus || knownStatus === 'APPROVED';
                                                            return (
                                                                <button
                                                                    onClick={() => canRetry ? handleRetry(p) : toast.error('Orden expirada — el cliente no pagó. Usa 🎟️ si quieres dar acceso manualmente.')}
                                                                    disabled={actionId === p.id}
                                                                    title={canRetry ? 'Reintentar captura PayPal' : 'Orden expirada — no se puede capturar'}
                                                                    className={`p-1.5 rounded transition-colors disabled:opacity-40 ${canRetry ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-dark-700 text-gray-600 cursor-not-allowed'}`}
                                                                >
                                                                    <RefreshCw className={`w-3.5 h-3.5 ${actionId === p.id ? 'animate-spin' : ''}`} />
                                                                </button>
                                                            );
                                                        })()}
                                                        {p.event_id && (
                                                            <button
                                                                onClick={() => handleGrantByPurchase(p)}
                                                                disabled={actionId === p.id}
                                                                title="Dar acceso manualmente"
                                                                className="p-1.5 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors disabled:opacity-40"
                                                            >
                                                                <Ticket className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {paypalStatuses[p.id] && (
                                                        <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                                            paypalStatuses[p.id].status === 'APPROVED' ? 'text-yellow-400 bg-yellow-500/10' :
                                                            paypalStatuses[p.id].status === 'CREATED' || paypalStatuses[p.id].status === 'EXPIRED_OR_NOT_FOUND' ? 'text-red-400 bg-red-500/10' :
                                                            paypalStatuses[p.id].status === 'COMPLETED' ? 'text-green-400 bg-green-500/10' :
                                                            'text-gray-400 bg-dark-700'
                                                        }`}>
                                                            {paypalStatuses[p.id].status === 'EXPIRED_OR_NOT_FOUND' ? 'EXPIRADA' : paypalStatuses[p.id].status}
                                                            {paypalStatuses[p.id].grossAmount && ` · $${paypalStatuses[p.id].grossAmount}`}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 bg-dark-800/50 text-xs text-gray-500">
                        {purchases.length} registro{purchases.length !== 1 ? 's' : ''}
                        {completed.length > 0 && ` · ${completed.length} completadas · $${totalRev.toFixed(2)} USD`}
                    </div>
                </div>
            )}
        </div>
    );
}
