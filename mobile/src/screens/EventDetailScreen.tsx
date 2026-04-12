import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, Play, ArrowLeft, CheckCircle, Radio, Zap, Lock } from 'lucide-react-native';
import { eventService } from '../services';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { getImageUrl } from '../config/constants';
import PaymentModal from '../components/PaymentModal';

export default function EventDetailScreen({ route, navigation }: any) {
    const { eventId } = route.params;
    const { isAuthenticated } = useAuthStore();
    const [event, setEvent] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [hasAccess, setHasAccess] = React.useState(false);
    const [showPaymentModal, setShowPaymentModal] = React.useState(false);

    const loadEventData = async () => {
        try {
            const [eventData, accessData] = await Promise.all([
                eventService.getById(eventId),
                isAuthenticated
                    ? eventService.checkAccess(eventId)
                    : Promise.resolve({ success: true, data: { hasAccess: false } }),
            ]);
            setEvent(eventData.data || null);
            setHasAccess(accessData.data?.hasAccess || false);
        } catch (error) {
            console.error('Error loading event detail:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { loadEventData(); }, [eventId, isAuthenticated]);

    const handleFreeAccess = async () => {
        setLoading(true);
        try {
            await api.post('/payments/create', {
                eventId: event.id,
                purchaseType: 'event',
                paymentMethod: 'paypal',
            });
            await loadEventData();
            Alert.alert('¡Acceso activado!', 'Ya tienes acceso gratuito a este evento.');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo obtener el acceso.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ef4444" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.center}>
                <Text style={styles.notFoundText}>Evento no encontrado</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isFree = parseFloat(event.price) === 0;
    const status = (event.status || 'upcoming').toLowerCase();
    const isLive = status === 'live';
    const bannerUri = getImageUrl(event.banner_url || event.thumbnail_url);

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView style={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Image
                        source={{ uri: bannerUri || 'https://via.placeholder.com/800x400/0f172a/ef4444' }}
                        style={styles.banner}
                    />
                    <View style={styles.heroOverlay} />

                    {/* Back button */}
                    <SafeAreaView style={styles.heroTop} edges={['top']}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroBack}>
                            <ArrowLeft color="#fff" size={22} />
                        </TouchableOpacity>
                        {isLive && (
                            <View style={styles.livePill}>
                                <Radio size={11} color="#fff" />
                                <Text style={styles.liveText}>EN VIVO</Text>
                            </View>
                        )}
                    </SafeAreaView>

                    {/* Hero content */}
                    <View style={styles.heroContent}>
                        <View style={styles.heroBadgeRow}>
                            {event.is_featured && (
                                <View style={styles.featuredBadge}>
                                    <Zap size={10} color="#f59e0b" />
                                    <Text style={styles.featuredText}>DESTACADO</Text>
                                </View>
                            )}
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{event.status?.toUpperCase()}</Text>
                            </View>
                        </View>
                        <Text style={styles.heroTitle}>{event.title}</Text>
                    </View>
                </View>

                {/* Body */}
                <View style={styles.body}>
                    {/* Date / Time chips */}
                    <View style={styles.chipRow}>
                        <View style={styles.chip}>
                            <Calendar size={14} color="#ef4444" />
                            <Text style={styles.chipText}>
                                {new Date(event.event_date).toLocaleDateString('es', {
                                    day: 'numeric', month: 'long', year: 'numeric',
                                })}
                            </Text>
                        </View>
                        <View style={styles.chip}>
                            <Clock size={14} color="#ef4444" />
                            <Text style={styles.chipText}>
                                {new Date(event.event_date).toLocaleTimeString([], {
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    {event.description ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>SOBRE EL EVENTO</Text>
                            <Text style={styles.description}>{event.description}</Text>
                        </View>
                    ) : null}

                    {/* Access card */}
                    <View style={styles.accessCard}>
                        {hasAccess ? (
                            <View style={styles.accessGranted}>
                                <View style={styles.accessGrantedRow}>
                                    <CheckCircle size={22} color="#10b981" />
                                    <View>
                                        <Text style={styles.accessGrantedTitle}>Acceso Activado</Text>
                                        <Text style={styles.accessGrantedSub}>Puedes ver este evento ahora</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.watchBtn}
                                    onPress={() => navigation.navigate('Watch', { eventId: event.id })}
                                    activeOpacity={0.85}
                                >
                                    <Play size={20} color="#fff" fill="#fff" />
                                    <Text style={styles.watchBtnText}>VER AHORA</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.accessPurchase}>
                                <View style={styles.priceRow}>
                                    <View>
                                        <Text style={styles.priceLabel}>
                                            {isFree ? 'Evento Gratuito' : 'Pase de Acceso'}
                                        </Text>
                                        <Text style={styles.priceValue}>
                                            {isFree ? 'GRATIS' : `$${parseFloat(event.price).toFixed(2)} ${event.currency}`}
                                        </Text>
                                    </View>
                                    {!isFree && (
                                        <View style={styles.lockIcon}>
                                            <Lock size={20} color="#475569" />
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={styles.buyBtn}
                                    onPress={() => {
                                        if (!isAuthenticated) {
                                            navigation.navigate('Login');
                                            return;
                                        }
                                        isFree ? handleFreeAccess() : setShowPaymentModal(true);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.buyBtnText}>
                                        {!isAuthenticated
                                            ? 'INICIAR SESIÓN'
                                            : isFree
                                            ? 'OBTENER ACCESO GRATIS'
                                            : 'COMPRAR PASE'}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.accessNote}>
                                    Acceso inmediato · Sin suscripción
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <PaymentModal
                visible={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                event={event}
                onSuccess={() => loadEventData()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#080d14',
    },
    center: {
        flex: 1,
        backgroundColor: '#080d14',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notFoundText: {
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
    scroll: {
        flex: 1,
    },
    hero: {
        height: 300,
        position: 'relative',
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8,13,20,0.6)',
    },
    heroTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    heroBack: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(8,13,20,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    livePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    liveText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    heroContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    heroBadgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245,158,11,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.3)',
    },
    featuredText: {
        color: '#f59e0b',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    statusBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    statusText: {
        color: '#94a3b8',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#fff',
        lineHeight: 30,
        letterSpacing: -0.3,
    },
    body: {
        padding: 20,
        backgroundColor: '#080d14',
    },
    chipRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: '#0d1520',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    chipText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 10,
    },
    description: {
        color: '#64748b',
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '400',
    },
    accessCard: {
        backgroundColor: '#0d1520',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1a2535',
        overflow: 'hidden',
        marginBottom: 20,
    },
    accessGranted: {
        padding: 20,
        gap: 20,
    },
    accessGrantedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    accessGrantedTitle: {
        color: '#10b981',
        fontSize: 16,
        fontWeight: '700',
    },
    accessGrantedSub: {
        color: '#475569',
        fontSize: 13,
        marginTop: 2,
    },
    watchBtn: {
        backgroundColor: '#ef4444',
        height: 56,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    watchBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 2,
    },
    accessPurchase: {
        padding: 20,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    priceLabel: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    priceValue: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    lockIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#111c2a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    buyBtn: {
        backgroundColor: '#ef4444',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 12,
    },
    buyBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    accessNote: {
        color: '#334155',
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
});
