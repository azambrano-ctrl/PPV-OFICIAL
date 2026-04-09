'use client';

import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, Calendar, Percent, DollarSign, Users, AlertCircle } from 'lucide-react';
import { paymentsAPI, eventsAPI, handleAPIError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    event_id: string | null;
    event_title: string | null;
    max_uses: number | null;
    current_uses: number;
    valid_until: string | null;
    min_amount: number;
    is_active: boolean;
    created_at: string;
}

interface Event {
    id: string;
    title: string;
    status: string;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        code: '',
        discountType: 'percentage' as 'percentage' | 'fixed',
        discountValue: '',
        eventId: '',
        maxUses: '',
        validUntil: '',
        minAmount: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [couponsRes, eventsRes] = await Promise.all([
                paymentsAPI.getCoupons(),
                eventsAPI.getAll(),
            ]);
            setCoupons(couponsRes.data.data);
            setEvents(eventsRes.data.data || []);
        } catch (err) {
            toast.error('Error al cargar cupones');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code || !form.discountValue) {
            toast.error('Código y valor son obligatorios');
            return;
        }
        setSaving(true);
        try {
            await paymentsAPI.createCoupon({
                code: form.code.toUpperCase(),
                discountType: form.discountType,
                discountValue: parseFloat(form.discountValue),
                eventId: form.eventId || undefined,
                maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
                validUntil: form.validUntil || undefined,
                minAmount: form.minAmount ? parseFloat(form.minAmount) : undefined,
            });
            toast.success('Cupón creado');
            setForm({ code: '', discountType: 'percentage', discountValue: '', eventId: '', maxUses: '', validUntil: '', minAmount: '' });
            setShowForm(false);
            loadData();
        } catch (err) {
            toast.error(handleAPIError(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (coupon: Coupon) => {
        if (!confirm(`¿Desactivar el cupón "${coupon.code}"?`)) return;
        try {
            await paymentsAPI.deleteCoupon(coupon.id);
            toast.success('Cupón desactivado');
            loadData();
        } catch (err) {
            toast.error(handleAPIError(err));
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setForm(f => ({ ...f, code }));
    };

    if (loading) return <div className="flex items-center justify-center h-96"><div className="spinner w-12 h-12" /></div>;

    const activeCoupons = coupons.filter(c => c.is_active);
    const totalUses = activeCoupons.reduce((sum, c) => sum + c.current_uses, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Cupones de Descuento</h1>
                    <p className="text-gray-400">Crea códigos de descuento para eventos específicos o generales</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Crear cupón
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-5">
                    <p className="text-sm text-gray-400 mb-1">Cupones activos</p>
                    <p className="text-3xl font-bold text-white">{activeCoupons.length}</p>
                </div>
                <div className="card p-5">
                    <p className="text-sm text-gray-400 mb-1">Total de usos</p>
                    <p className="text-3xl font-bold text-green-400">{totalUses}</p>
                </div>
                <div className="card p-5">
                    <p className="text-sm text-gray-400 mb-1">Específicos de evento</p>
                    <p className="text-3xl font-bold text-blue-400">{activeCoupons.filter(c => c.event_id).length}</p>
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="card p-6">
                    <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary-500" /> Nuevo cupón
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        {/* Código */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm text-gray-400 mb-1">Código <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                    placeholder="Ej: FIGHT20"
                                    className="input w-full font-mono tracking-widest uppercase"
                                    required
                                />
                            </div>
                            <div className="flex items-end">
                                <button type="button" onClick={generateCode}
                                    className="px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-gray-300 text-sm rounded-xl transition-colors whitespace-nowrap">
                                    Generar código
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tipo y valor */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tipo de descuento <span className="text-red-400">*</span></label>
                                <div className="flex gap-2">
                                    <button type="button"
                                        onClick={() => setForm(f => ({ ...f, discountType: 'percentage' }))}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.discountType === 'percentage' ? 'bg-primary-600 border-primary-500 text-white' : 'bg-dark-800 border-dark-600 text-gray-400'}`}>
                                        <Percent className="w-4 h-4" /> Porcentaje
                                    </button>
                                    <button type="button"
                                        onClick={() => setForm(f => ({ ...f, discountType: 'fixed' }))}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.discountType === 'fixed' ? 'bg-primary-600 border-primary-500 text-white' : 'bg-dark-800 border-dark-600 text-gray-400'}`}>
                                        <DollarSign className="w-4 h-4" /> Monto fijo
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Valor {form.discountType === 'percentage' ? '(%)' : '(USD)'} <span className="text-red-400">*</span>
                                </label>
                                <input type="number" min="0" max={form.discountType === 'percentage' ? '100' : undefined} step="0.01"
                                    value={form.discountValue}
                                    onChange={(e) => setForm(f => ({ ...f, discountValue: e.target.value }))}
                                    placeholder={form.discountType === 'percentage' ? 'Ej: 20' : 'Ej: 5.00'}
                                    className="input w-full" required />
                            </div>
                        </div>

                        {/* Evento específico */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Evento específico <span className="text-gray-500">(opcional — dejar vacío para que aplique a cualquier evento)</span></label>
                            <select value={form.eventId} onChange={(e) => setForm(f => ({ ...f, eventId: e.target.value }))} className="input w-full">
                                <option value="">— Cualquier evento —</option>
                                {events.filter(e => e.status !== 'finished' && e.status !== 'cancelled').map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    <Users className="inline w-3.5 h-3.5 mr-1" />Máx. usos
                                </label>
                                <input type="number" min="1" value={form.maxUses}
                                    onChange={(e) => setForm(f => ({ ...f, maxUses: e.target.value }))}
                                    placeholder="Ilimitado" className="input w-full" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    <Calendar className="inline w-3.5 h-3.5 mr-1" />Válido hasta
                                </label>
                                <input type="datetime-local" value={form.validUntil}
                                    onChange={(e) => setForm(f => ({ ...f, validUntil: e.target.value }))}
                                    className="input w-full" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Monto mínimo (USD)</label>
                                <input type="number" min="0" step="0.01" value={form.minAmount}
                                    onChange={(e) => setForm(f => ({ ...f, minAmount: e.target.value }))}
                                    placeholder="0.00" className="input w-full" />
                            </div>
                        </div>

                        {form.discountType === 'percentage' && form.discountValue && (
                            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    Con este cupón, un evento de <strong>$10.00</strong> quedaría en <strong>${(10 - 10 * parseFloat(form.discountValue || '0') / 100).toFixed(2)}</strong>
                                </span>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving}
                                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white font-bold rounded-xl transition-colors">
                                {saving ? 'Guardando...' : 'Crear cupón'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-6 py-2.5 bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold rounded-xl transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            {coupons.length === 0 ? (
                <div className="card p-12 text-center">
                    <Tag className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Sin cupones aún</h3>
                    <p className="text-gray-500">Crea tu primer cupón para empezar a ofrecer descuentos.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-800">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Código</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Descuento</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Evento</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Usos</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Vence</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Estado</th>
                                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-800">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-dark-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="font-mono font-black text-white tracking-widest bg-dark-700 px-3 py-1 rounded-lg">
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-bold text-yellow-400">
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}%`
                                                    : `$${Number(coupon.discount_value).toFixed(2)}`}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-300">
                                            {coupon.event_title
                                                ? <span className="bg-blue-500/15 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs">{coupon.event_title}</span>
                                                : <span className="text-gray-500 text-xs">Cualquier evento</span>}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-300">
                                            {coupon.current_uses}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-300">
                                            {coupon.valid_until ? formatDate(coupon.valid_until, 'PP') : '—'}
                                        </td>
                                        <td className="py-4 px-6">
                                            {coupon.is_active
                                                ? <span className="bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-xs font-bold">Activo</span>
                                                : <span className="bg-gray-500/15 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-full text-xs font-bold">Inactivo</span>}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {coupon.is_active && (
                                                <button onClick={() => handleDelete(coupon)}
                                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Desactivar">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
