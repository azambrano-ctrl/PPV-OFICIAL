import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Alert,
} from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { X, CreditCard, ShieldCheck, Lock, Zap } from 'lucide-react-native';
import api from '../services/api';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    event: any;
    onSuccess: () => void;
}

export default function PaymentModal({ visible, onClose, event, onSuccess }: PaymentModalProps) {
    const [loading, setLoading] = React.useState(false);

    const handlePayPalPayment = async () => {
        if (!event) return;

        setLoading(true);
        try {
            const response = await api.post('/payments/create', {
                eventId: event.id,
                purchaseType: 'event',
                paymentMethod: 'paypal',
            });

            if (response.data.success && response.data.data.approvalUrl) {
                const approvalUrl: string = response.data.data.approvalUrl;

                if (await InAppBrowser.isAvailable()) {
                    const result: any = await InAppBrowser.openAuth(
                        approvalUrl,
                        'arenafightpass://',
                        {
                            showTitle: false,
                            enableUrlBarHiding: true,
                            enableDefaultShare: false,
                            forceCloseOnRedirection: true,
                        }
                    );
                    if (result?.type === 'success') {
                        await verifyPurchase();
                    } else if (result?.type === 'cancel') {
                        Alert.alert('Pago Cancelado', 'No se ha completado el pago.');
                    }
                } else {
                    Alert.alert('Error', 'No se pudo abrir el navegador para completar el pago.');
                }
            } else {
                throw new Error('No se pudo generar la orden de pago');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    const verifyPurchase = async () => {
        try {
            const response = await api.get(`/events/${event.id}/access`);
            if (response.data.data.hasAccess) {
                Alert.alert('¡Pago Exitoso!', 'Tu acceso ha sido activado correctamente.');
                onSuccess();
                onClose();
            } else {
                setTimeout(verifyPurchase, 3000);
            }
        } catch {
            /* silent */
        }
    };

    if (!event) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    {/* Handle bar */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerLabel}>RESUMEN DE COMPRA</Text>
                            <Text style={styles.headerTitle}>Finalizar Pago</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X color="#64748b" size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Event summary */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryTop}>
                            <View style={styles.eventBadge}>
                                <Zap size={12} color="#ef4444" />
                                <Text style={styles.eventBadgeText}>ACCESO COMPLETO</Text>
                            </View>
                            <Text style={styles.eventName}>{event.title}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>
                                ${parseFloat(event.price).toFixed(2)}{' '}
                                <Text style={styles.currency}>{event.currency}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Payment methods */}
                    <Text style={styles.payLabel}>MÉTODO DE PAGO</Text>

                    <TouchableOpacity
                        style={[styles.payBtn, loading && styles.payBtnDisabled]}
                        onPress={handlePayPalPayment}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <CreditCard color="#fff" size={20} />
                                <Text style={styles.payBtnText}>Pagar con PayPal / Tarjeta</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Security badge */}
                    <View style={styles.securityRow}>
                        <Lock size={13} color="#475569" />
                        <ShieldCheck size={13} color="#475569" />
                        <Text style={styles.securityText}>Pago 256-bit SSL · Datos encriptados</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#0d1520',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderColor: '#1e2d3d',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#1e2d3d',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    headerLabel: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1a2535',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryCard: {
        backgroundColor: '#111c2a',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1e2d3d',
        marginBottom: 28,
        overflow: 'hidden',
    },
    summaryTop: {
        padding: 18,
    },
    eventBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(239,68,68,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    eventBadgeText: {
        fontSize: 10,
        color: '#ef4444',
        fontWeight: '800',
        letterSpacing: 1,
    },
    eventName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#e2e8f0',
        lineHeight: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#1e2d3d',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
    },
    totalLabel: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    totalAmount: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
    },
    currency: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    payLabel: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 12,
    },
    payBtn: {
        backgroundColor: '#ef4444',
        height: 58,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    payBtnDisabled: {
        opacity: 0.6,
    },
    payBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    securityRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    securityText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '500',
    },
});
