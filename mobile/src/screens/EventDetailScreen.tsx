import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, DollarSign, Play, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { eventService } from '../services';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import PaymentModal from '../components/PaymentModal';

export default function EventDetailScreen({ route, navigation }: any) {
    const { eventId } = route.params;
    const { isAuthenticated, user } = useAuthStore();
    const [event, setEvent] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [hasAccess, setHasAccess] = React.useState(false);
    const [showPaymentModal, setShowPaymentModal] = React.useState(false);

    const loadEventData = async () => {
        try {
            const [eventData, accessData] = await Promise.all([
                eventService.getById(eventId),
                isAuthenticated ? eventService.checkAccess(eventId) : { data: { hasAccess: false } }
            ]);
            setEvent(eventData.data || null);
            setHasAccess(accessData.data.hasAccess);
        } catch (error) {
            console.error('Error loading event detail:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadEventData();
    }, [eventId, isAuthenticated]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ef4444" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Evento no encontrado</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} bounces={false}>
            <View style={styles.hero}>
                <Image
                    source={{ uri: event.banner_url || event.thumbnail_url || 'https://via.placeholder.com/800x400' }}
                    style={styles.banner}
                />
                <View style={styles.overlay} />
                <TouchableOpacity
                    style={styles.backIcon}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.badgeRow}>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{event.status.toUpperCase()}</Text>
                    </View>
                    {event.is_featured && (
                        <View style={styles.featuredBadge}>
                            <Text style={styles.featuredText}>DESTACADO</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.title}>{event.title}</Text>

                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Calendar size={18} color="#94a3b8" />
                        <Text style={styles.infoText}>{new Date(event.event_date).toLocaleDateString([], { dateStyle: 'long' })}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Clock size={18} color="#94a3b8" />
                        <Text style={styles.infoText}>{new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                </View>

                <View style={styles.descriptionBox}>
                    <Text style={styles.sectionTitle}>Sobre la pelea</Text>
                    <Text style={styles.description}>{event.description || 'No hay descripción disponible para este evento.'}</Text>
                </View>

    const handleFreeAccess = async () => {
                    setLoading(true);
                try {
                    await eventService.getById(eventId); // Just to be sure
                await api.post('/payments/create', {
                    eventId: event.id,
                purchaseType: 'event',
                paymentMethod: 'paypal', // Backend handles amount 0 automatically
            });
                await loadEventData();
        } catch (error) {
                    console.error('Error getting free access:', error);
        } finally {
                    setLoading(false);
        }
    };

                const isFree = parseFloat(event.price) === 0;

                return (
                <ScrollView style={styles.container} bounces={false}>
                    {/* ... rest of existing code ... */}
                    {/* Find the action card part */}
                    <View style={styles.actionCard}>
                        {hasAccess ? (
                            <View style={styles.accessContainer}>
                                <View style={styles.successRow}>
                                    <CheckCircle size={20} color="#22c55e" />
                                    <Text style={styles.successText}>Tienes acceso a este evento</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.watchBtn}
                                    onPress={() => navigation.navigate('Watch', { eventId: event.id })}
                                >
                                    <Play size={20} color="#fff" />
                                    <Text style={styles.watchBtnText}>Ver Ahora</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.purchaseContainer}>
                                <Text style={styles.priceLabel}>{isFree ? 'Evento Gratuito' : 'Acceso Total'}</Text>
                                <Text style={styles.priceValue}>
                                    {isFree ? 'LO TENEMOS' : `$${event.price} ${event.currency}`}
                                </Text>
                                <TouchableOpacity
                                    style={styles.buyBtn}
                                    onPress={() => {
                                        if (isAuthenticated) {
                                            if (isFree) {
                                                handleFreeAccess();
                                            } else {
                                                setShowPaymentModal(true);
                                            }
                                        } else {
                                            navigation.navigate('Login');
                                        }
                                    }}
                                >
                                    <Text style={styles.buyBtnText}>{isFree ? 'Obtener Acceso Gratis' : 'Comprar Pase'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
            </View>

            <PaymentModal
                visible={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                event={event}
                onSuccess={() => loadEventData()}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 20,
    },
    backBtn: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    hero: {
        height: 250,
        position: 'relative',
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
    },
    backIcon: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        marginTop: -30,
        backgroundColor: '#0f172a',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    statusBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    featuredBadge: {
        backgroundColor: 'rgba(234, 179, 8, 0.2)',
        borderColor: 'rgba(234, 179, 8, 0.5)',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    featuredText: {
        color: '#eab308',
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 24,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    descriptionBox: {
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        color: '#94a3b8',
        lineHeight: 22,
        fontSize: 15,
    },
    actionCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#334155',
    },
    accessContainer: {
        alignItems: 'center',
    },
    successRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    successText: {
        color: '#22c55e',
        fontWeight: 'bold',
        fontSize: 16,
    },
    watchBtn: {
        backgroundColor: '#ef4444',
        width: '100%',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    watchBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    purchaseContainer: {
        alignItems: 'center',
    },
    priceLabel: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 4,
    },
    priceValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    buyBtn: {
        backgroundColor: '#ef4444',
        width: '100%',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
