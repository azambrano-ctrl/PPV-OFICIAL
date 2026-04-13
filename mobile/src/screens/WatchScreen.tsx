import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import { ChevronLeft, Info, Maximize, Minimize } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { getImageUrl } from '../config/constants';

export default function WatchScreen({ route, navigation }: any) {
    const { eventId } = route.params;
    const [streamData, setStreamData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const videoRef = React.useRef<VideoRef>(null);

    const fetchStreamToken = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/streaming/${eventId}/token`);
            setStreamData(response.data.data);
        } catch (err: any) {
            console.error('Error fetching stream token:', err);
            setError(err.response?.data?.message || 'No tienes acceso a este video');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchStreamToken();
        Orientation.lockToPortrait();

        return () => {
            Orientation.unlockAllOrientations();
        };
    }, [eventId]);

    const toggleFullscreen = () => {
        if (isFullscreen) {
            Orientation.lockToPortrait();
        } else {
            Orientation.lockToLandscape();
        }
        setIsFullscreen(!isFullscreen);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={styles.loadingText}>Conectando con el stream...</Text>
            </View>
        );
    }

    if (error || !streamData) {
        return (
            <View style={styles.errorContainer}>
                <Info size={48} color="#ef4444" />
                <Text style={styles.errorTitle}>Error de Acceso</Text>
                <Text style={styles.errorText}>{error || 'Ocurrió un problema inesperado'}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const streamUri = streamData.streamUrl.startsWith('http')
        ? streamData.streamUrl
        : getImageUrl(streamData.streamUrl);

    return (
        <View style={styles.container}>
            <StatusBar hidden={isFullscreen} />

            {!isFullscreen && (
                <SafeAreaView edges={['top']} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
                        <ChevronLeft color="#fff" size={28} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>Streaming en Vivo</Text>
                </SafeAreaView>
            )}

            <View style={[styles.videoWrapper, isFullscreen && styles.videoWrapperFullscreen]}>
                <Video
                    ref={videoRef}
                    source={{
                        uri: streamUri || '',
                        headers: {
                            Authorization: `Bearer ${streamData.token}`,
                        },
                    }}
                    paused={false}
                    muted={false}
                    resizeMode="contain"
                    controls={true}
                    style={styles.video}
                    onError={(err) => console.error('Video Error:', err)}
                />

                <TouchableOpacity
                    style={[styles.fullscreenBtn, isFullscreen && styles.fullscreenBtnTop]}
                    onPress={toggleFullscreen}
                >
                    {isFullscreen ? (
                        <Minimize color="#fff" size={24} />
                    ) : (
                        <Maximize color="#fff" size={24} />
                    )}
                </TouchableOpacity>
            </View>

            {!isFullscreen && (
                <View style={styles.chatContainer}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatTitle}>CHAT DEL EVENTO</Text>
                    </View>
                    <View style={styles.chatPlaceholder}>
                        <Text style={styles.placeholderText}>El chat estará disponible pronto en la app</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#94a3b8',
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    errorText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    backBtn: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#0f172a',
    },
    backIcon: {
        marginRight: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    videoWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        position: 'relative',
    },
    videoWrapperFullscreen: {
        flex: 1,
        aspectRatio: undefined,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    fullscreenBtn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 8,
        zIndex: 10,
    },
    fullscreenBtnTop: {
        top: 20,
        bottom: undefined,
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    chatHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    chatTitle: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    chatPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placeholderText: {
        color: '#475569',
        fontSize: 14,
        textAlign: 'center',
    },
});
