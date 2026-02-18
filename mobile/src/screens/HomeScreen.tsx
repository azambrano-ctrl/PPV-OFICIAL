import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, DollarSign, ChevronRight } from 'lucide-react-native';
import { eventService } from '../services';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen({ navigation }: any) {
    const [events, setEvents] = React.useState([]);
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

    React.useEffect(() => {
        loadEvents();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadEvents();
    };

    const renderEvent = ({ item }: any) => (
        <TouchableOpacity
            style={styles.eventCard}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        >
            <Image
                source={{ uri: item.thumbnail_url || 'https://via.placeholder.com/400x200' }}
                style={styles.thumbnail}
            />
            <View className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded">
                <Text className="text-white text-xs font-bold uppercase">{item.status}</Text>
            </View>
            <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Calendar size={14} color="#94a3b8" />
                        <Text style={styles.detailText}>{new Date(item.event_date).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Clock size={14} color="#94a3b8" />
                        <Text style={styles.detailText}>{new Date(item.event_date).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.priceText}>
                        {parseFloat(item.price) === 0 ? 'PASE LIBRE' : `$${item.price} ${item.currency}`}
                    </Text>
                    <ChevronRight size={20} color="#ef4444" />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>ARENA FIGHT PASS</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#ef4444" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderEvent}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No hay eventos disponibles actualmente</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // dark-950
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 1,
        fontFamily: 'System', // Adjust once fonts are loaded
    },
    listContent: {
        padding: 16,
    },
    eventCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
    },
    thumbnailContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    statusBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    eventInfo: {
        padding: 16,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    priceText: {
        fontSize: 18,
        color: '#ef4444',
        fontWeight: 'bold',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
    }
});
