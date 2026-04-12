import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, ChevronRight, User, Zap, Radio } from 'lucide-react-native';
import { eventService } from '../services';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { getImageUrl } from '../config/constants';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    live:     { bg: 'rgba(239,68,68,0.15)',   text: '#ef4444', dot: '#ef4444' },
    upcoming: { bg: 'rgba(234,179,8,0.12)',   text: '#f59e0b', dot: '#f59e0b' },
    finished: { bg: 'rgba(100,116,139,0.15)', text: '#64748b', dot: '#64748b' },
};

export default function HomeScreen({ navigation }: any) {
    const { isAuthenticated, logout } = useAuthStore();
    const { settings } = useSettingsStore();
    const [events, setEvents] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);

    const loadEvents = async () => {
        try {
            const data = await eventService.getAll();
            setEvents(data.data || []);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => { loadEvents(); }, []);

    const onRefresh = () => { setRefreshing(true); loadEvents(); };

    const logoSource = settings.site_logo
        ? { uri: getImageUrl(settings.site_logo) }
        : require('../../assets/images/logo.png');

    const renderEvent = ({ item, index }: { item: any; index: number }) => {
        const status = (item.status || 'upcoming').toLowerCase();
        const colors = STATUS_COLORS[status] || STATUS_COLORS.upcoming;
        const isFeatured = item.is_featured;
        const isFree = parseFloat(item.price) === 0;

        return (
            <TouchableOpacity
                style={[styles.card, index === 0 && styles.cardFirst]}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                activeOpacity={0.9}
            >
                {/* Thumbnail */}
                <View style={styles.imgWrapper}>
                    <Image
                        source={{ uri: getImageUrl(item.thumbnail_url) || 'https://via.placeholder.com/800x400/0f172a/ef4444' }}
                        style={styles.thumbnail}
                    />
                    <View style={styles.imgOverlay} />

                    {/* Status pill */}
                    <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
                        {status === 'live' && <Radio size={10} color={colors.dot} />}
                        <Text style={[styles.statusText, { color: colors.text }]}>
                            {status === 'live' ? 'EN VIVO' : status === 'upcoming' ? 'PRÓXIMO' : 'FINALIZADO'}
                        </Text>
                    </View>

                    {isFeatured && (
                        <View style={styles.featuredTag}>
                            <Zap size={10} color="#f59e0b" />
                            <Text style={styles.featuredText}>DESTACADO</Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Calendar size={12} color="#475569" />
                            <Text style={styles.metaText}>
                                {new Date(item.event_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                        <View style={styles.metaDot} />
                        <View style={styles.metaItem}>
                            <Clock size={12} color="#475569" />
                            <Text style={styles.metaText}>
                                {new Date(item.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <Text style={[styles.priceTag, isFree && styles.priceTagFree]}>
                            {isFree ? 'GRATIS' : `$${parseFloat(item.price).toFixed(2)} ${item.currency}`}
                        </Text>
                        <View style={styles.arrowBtn}>
                            <ChevronRight size={16} color="#ef4444" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#080d14" />
            <SafeAreaView style={styles.safe} edges={['top']}>
                {/* Header */}
                <View style={styles.topBar}>
                    <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                    <TouchableOpacity
                        style={[styles.avatarBtn, isAuthenticated && styles.avatarBtnActive]}
                        onPress={() =>
                            isAuthenticated
                                ? navigation.navigate('Profile')
                                : navigation.navigate('Login')
                        }
                    >
                        <User size={18} color={isAuthenticated ? '#ef4444' : '#94a3b8'} />
                    </TouchableOpacity>
                </View>

                {/* Section heading */}
                <View style={styles.sectionHead}>
                    <Text style={styles.sectionLabel}>EVENTOS</Text>
                    <Text style={styles.sectionTitle}>Cartelera</Text>
                </View>
            </SafeAreaView>

            {loading ? (
                <ActivityIndicator size="large" color="#ef4444" style={styles.loader} />
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderEvent}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#ef4444"
                            colors={['#ef4444']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Radio size={48} color="#1e293b" />
                            <Text style={styles.emptyTitle}>Sin eventos disponibles</Text>
                            <Text style={styles.emptySubtitle}>Vuelve pronto para ver próximas peleas</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#080d14',
    },
    safe: {
        backgroundColor: '#080d14',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#111c2a',
    },
    logo: {
        width: 130,
        height: 44,
    },
    avatarBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#111c2a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1e2d3d',
    },
    avatarBtnActive: {
        borderColor: 'rgba(239,68,68,0.4)',
        backgroundColor: 'rgba(239,68,68,0.08)',
    },
    sectionHead: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
    },
    sectionLabel: {
        fontSize: 10,
        color: '#ef4444',
        fontWeight: '800',
        letterSpacing: 3,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    loader: {
        flex: 1,
    },
    list: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: '#0d1520',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    cardFirst: {
        borderColor: 'rgba(239,68,68,0.25)',
    },
    imgWrapper: {
        height: 190,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    imgOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8,13,20,0.25)',
    },
    statusPill: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    featuredTag: {
        position: 'absolute',
        top: 12,
        right: 12,
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
        fontSize: 9,
        color: '#f59e0b',
        fontWeight: '800',
        letterSpacing: 1,
    },
    cardBody: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#e2e8f0',
        marginBottom: 10,
        lineHeight: 23,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#334155',
    },
    metaText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceTag: {
        fontSize: 20,
        fontWeight: '900',
        color: '#ef4444',
        letterSpacing: -0.5,
    },
    priceTagFree: {
        color: '#10b981',
    },
    arrowBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(239,68,68,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    empty: {
        marginTop: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: '#334155',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#1e293b',
        fontSize: 14,
        textAlign: 'center',
    },
});
