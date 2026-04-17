import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, Clock, ChevronRight, Zap } from 'lucide-react-native';
import { eventService } from '../../src/services';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { getImageUrl } from '../../src/config/constants';
import { Colors, FontSize, BorderRadius, Spacing } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

const STATUS_COLORS: Record<string, { bg: string; dot: string; label: string }> = {
  live: { bg: 'rgba(239,68,68,0.15)', dot: '#ef4444', label: 'EN VIVO' },
  upcoming: { bg: 'rgba(249,115,22,0.15)', dot: '#f97316', label: 'PROXIMAMENTE' },
  replay: { bg: 'rgba(99,102,241,0.15)', dot: '#6366f1', label: 'REPETICION' },
  ended: { bg: 'rgba(100,116,139,0.15)', dot: '#64748b', label: 'FINALIZADO' },
};

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { settings } = useSettingsStore();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const data = await eventService.getAll();
      setEvents(data.data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const onRefresh = () => { setRefreshing(true); loadEvents(); };

  const logoSource = settings.site_logo
    ? { uri: getImageUrl(settings.site_logo) }
    : require('../../assets/images/logo.png');

  const getStatusInfo = (status: string) => STATUS_COLORS[status] || STATUS_COLORS.ended;

  const renderEvent = ({ item, index: idx }: { item: any; index: number }) => {
    const statusInfo = getStatusInfo(item.status);
    const isFree = parseFloat(item.price) === 0;
    const isLive = item.status === 'live';

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/event/${item.id}`)}
        activeOpacity={0.85}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: getImageUrl(item.thumbnail_url) || 'https://via.placeholder.com/400x200' }}
            style={styles.thumbnail}
          />
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.9)']}
            style={styles.thumbnailGradient}
          />

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.dot }]} />
            <Text style={[styles.statusText, { color: statusInfo.dot }]}>{statusInfo.label}</Text>
          </View>

          {/* Price Overlay */}
          <View style={styles.priceOverlay}>
            <Text style={styles.priceText}>
              {isFree ? 'GRATIS' : `$${item.price}`}
            </Text>
            {!isFree && <Text style={styles.currencyText}>{item.currency}</Text>}
          </View>
        </View>

        {/* Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {new Date(item.event_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Clock size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {new Date(item.event_date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, isLive && styles.ctaBtnLive]}
            onPress={() => router.push(`/event/${item.id}`)}
          >
            <LinearGradient
              colors={isLive ? ['#ef4444', '#dc2626'] : [Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {isLive && <Zap size={14} color="#fff" fill="#fff" />}
              <Text style={styles.ctaBtnText}>{isLive ? 'VER AHORA' : 'VER DETALLES'}</Text>
              <ChevronRight size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerRight}>
          <View style={styles.livePill}>
            <View style={styles.liveDotPulse} />
            <Text style={styles.liveCount}>{events.filter(e => e.status === 'live').length} EN VIVO</Text>
          </View>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Eventos</Text>
        <View style={styles.sectionLine} />
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Cargando eventos...</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Zap size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin eventos</Text>
              <Text style={styles.emptyText}>No hay eventos disponibles en este momento</Text>
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
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  logo: {
    width: 130,
    height: 50,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  liveDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveCount: {
    color: '#ef4444',
    fontSize: FontSize.tiny,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.title,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSize.tiny,
    fontWeight: '800',
    letterSpacing: 1,
  },
  priceOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  priceText: {
    color: Colors.primary,
    fontSize: FontSize.subtitle,
    fontWeight: '900',
  },
  currencyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.tiny,
    fontWeight: '600',
  },
  eventInfo: {
    padding: Spacing.lg,
  },
  eventTitle: {
    fontSize: FontSize.subtitle,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: Spacing.md,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
  },
  ctaBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  ctaBtnLive: {},
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    gap: Spacing.sm,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: FontSize.caption,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loaderText: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.subtitle,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    textAlign: 'center',
  },
});
