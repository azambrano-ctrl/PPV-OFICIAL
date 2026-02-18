import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { X, CreditCard, ShieldCheck } from 'lucide-react-native';
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
                const result = await WebBrowser.openAuthSessionAsync(
                    response.data.data.approvalUrl,
                    'arenafightpass://' // Redirect scheme
                );

                if (result.type === 'success') {
                    // El usuario volvió a la app. 
                    // El backend probablemente ya capturó el pago vía Webhook 
                    // o podemos forzar una verificación aquí.
                    await verifyPurchase();
                } else if (result.type === 'cancel') {
                    Alert.alert('Pago Cancelado', 'No se ha completado el pago.');
                }
            } else {
                throw new Error('No se pudo generar la orden de PayPal');
            }
        } catch (error: any) {
            console.error('PayPal Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    const verifyPurchase = async () => {
        try {
            const response = await api.get(`/events/${event.id}/access`);
            if (response.data.data.hasAccess) {
                Alert.alert('¡Éxito!', 'Tu pago ha sido procesado correctamente.');
                onSuccess();
                onClose();
            } else {
                // Posiblemente el webhook aún no se ha procesado.
                Alert.alert('Verificando...', 'Estamos confirmando tu pago. Por favor, espera un momento.');
                setTimeout(verifyPurchase, 3000);
            }
        } catch (error) {
            console.error('Verify error:', error);
        }
    };

    if (!event) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Finalizar Compra</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X color="#94a3b8" size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryLabel}>Estás comprando:</Text>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total a pagar:</Text>
                            <Text style={styles.priceValue}>${event.price} {event.currency}</Text>
                        </View>
                    </View>

                    <View style={styles.paymentSection}>
                        <Text style={styles.sectionTitle}>Método de Pago</Text>
                        <TouchableOpacity
                            style={styles.paypalBtn}
                            onPress={handlePayPalPayment}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <View style={styles.paypalIconBox}>
                                        <CreditCard color="#fff" size={20} />
                                    </View>
                                    <Text style={styles.paypalBtnText}>Pagar con PayPal / Tarjeta</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <ShieldCheck color="#22c55e" size={16} />
                        <Text style={styles.footerText}>Pago 100% Seguro y Encriptado</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 4,
    },
    summaryBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    summaryLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    eventTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    totalLabel: {
        color: '#fff',
        fontSize: 14,
    },
    priceValue: {
        color: '#ef4444',
        fontSize: 22,
        fontWeight: 'bold',
    },
    paymentSection: {
        flex: 1,
    },
    sectionTitle: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    paypalBtn: {
        backgroundColor: '#0070ba',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    paypalIconBox: {
        width: 32,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paypalBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
    },
    footerText: {
        color: '#22c55e',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
