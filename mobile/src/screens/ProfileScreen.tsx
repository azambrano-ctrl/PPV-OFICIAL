import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    User,
    Mail,
    Lock,
    ShoppingBag,
    LogOut,
    ChevronRight,
    ArrowLeft,
    Shield,
    Ticket,
    Eye,
    EyeOff,
} from 'lucide-react-native';
import { authService } from '../services';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen({ navigation }: any) {
    const { user, logout } = useAuthStore();
    const [purchases, setPurchases] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isChangingPass, setIsChangingPass] = React.useState(false);
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showCurrent, setShowCurrent] = React.useState(false);
    const [showNew, setShowNew] = React.useState(false);

    React.useEffect(() => {
        authService.getPurchases()
            .then(res => { if (res.success) setPurchases(res.data || []); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () =>
        Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Salir',
                style: 'destructive',
                onPress: async () => { await logout(); navigation.navigate('Home'); },
            },
        ]);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            return Alert.alert('Error', 'Completa todos los campos');
        }
        if (newPassword !== confirmPassword) {
            return Alert.alert('Error', 'Las contraseñas no coinciden');
        }
        if (newPassword.length < 8) {
            return Alert.alert('Error', 'Mínimo 8 caracteres');
        }
        try {
            const res = await authService.changePassword(currentPassword, newPassword);
            if (res.success) {
                Alert.alert('¡Listo!', 'Contraseña actualizada correctamente');
                setIsChangingPass(false);
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Error al cambiar contraseña');
        }
    };

    const isAdmin = user?.role === 'admin';

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ef4444" />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#080d14" />
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={22} />
                    </TouchableOpacity>
                    <Text style={styles.topTitle}>Mi Perfil</Text>
                    <View style={{ width: 38 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Avatar card */}
                <View style={styles.avatarCard}>
                    <View style={styles.avatarRing}>
                        <View style={styles.avatarInner}>
                            <User size={40} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.userName}>{user?.full_name}</Text>
                    <View style={styles.emailRow}>
                        <Mail size={13} color="#475569" />
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>
                    <View style={[styles.roleBadge, isAdmin && styles.roleBadgeAdmin]}>
                        <Shield size={11} color={isAdmin ? '#ef4444' : '#475569'} />
                        <Text style={[styles.roleText, isAdmin && styles.roleTextAdmin]}>
                            {user?.role?.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Purchases */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <ShoppingBag size={16} color="#ef4444" />
                        <Text style={styles.sectionTitle}>Mis Eventos</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{purchases.length}</Text>
                        </View>
                    </View>

                    {purchases.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ticket size={32} color="#1a2535" />
                            <Text style={styles.emptyTitle}>Sin eventos adquiridos</Text>
                            <TouchableOpacity
                                style={styles.exploreBtn}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.exploreBtnText}>Explorar Cartelera</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        purchases.map((p: any) => (
                            <TouchableOpacity
                                key={p.id}
                                style={styles.purchaseItem}
                                onPress={() => navigation.navigate('EventDetail', { eventId: p.event_id })}
                                activeOpacity={0.8}
                            >
                                <View style={styles.purchaseLeft}>
                                    <Text style={styles.purchaseTitle} numberOfLines={1}>{p.event_title}</Text>
                                    <Text style={styles.purchaseDate}>
                                        {new Date(p.created_at).toLocaleDateString('es', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                    </Text>
                                </View>
                                <View style={styles.purchaseRight}>
                                    <Text style={styles.purchaseAmount}>${p.final_amount}</Text>
                                    <ChevronRight size={16} color="#334155" />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Account settings */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Lock size={16} color="#ef4444" />
                        <Text style={styles.sectionTitle}>Cuenta</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => setIsChangingPass(!isChangingPass)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.menuLabel}>Cambiar Contraseña</Text>
                        <ChevronRight size={18} color="#334155" />
                    </TouchableOpacity>

                    {isChangingPass && (
                        <View style={styles.passForm}>
                            {[
                                { label: 'Contraseña actual', value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggleShow: () => setShowCurrent(!showCurrent) },
                                { label: 'Nueva contraseña', value: newPassword, setter: setNewPassword, show: showNew, toggleShow: () => setShowNew(!showNew) },
                                { label: 'Confirmar contraseña', value: confirmPassword, setter: setConfirmPassword, show: false, toggleShow: undefined },
                            ].map(({ label, value, setter, show, toggleShow }) => (
                                <View key={label} style={styles.passField}>
                                    <Text style={styles.passLabel}>{label}</Text>
                                    <View style={styles.passInputRow}>
                                        <TextInput
                                            style={styles.passInput}
                                            value={value}
                                            onChangeText={setter}
                                            secureTextEntry={!show && toggleShow !== undefined ? true : !show}
                                            placeholderTextColor="#334155"
                                            placeholder="••••••••"
                                        />
                                        {toggleShow && (
                                            <TouchableOpacity onPress={toggleShow}>
                                                {show ? <EyeOff size={16} color="#475569" /> : <Eye size={16} color="#475569" />}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                                <Text style={styles.saveBtnText}>Actualizar Contraseña</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.8}>
                        <LogOut size={18} color="#ef4444" />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    safe: {
        backgroundColor: '#080d14',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#111c2a',
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#0d1520',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    topTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    avatarCard: {
        backgroundColor: '#0d1520',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    avatarRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        padding: 3,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 42,
        backgroundColor: '#111c2a',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    userName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 6,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    userEmail: {
        color: '#64748b',
        fontSize: 14,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#111c2a',
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    roleBadgeAdmin: {
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderColor: 'rgba(239,68,68,0.2)',
    },
    roleText: {
        color: '#475569',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    roleTextAdmin: {
        color: '#ef4444',
    },
    section: {
        marginBottom: 24,
    },
    sectionHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        flex: 1,
    },
    countBadge: {
        backgroundColor: '#111c2a',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    countText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '700',
    },
    emptyCard: {
        backgroundColor: '#0d1520',
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1a2535',
        borderStyle: 'dashed',
        gap: 12,
    },
    emptyTitle: {
        color: '#334155',
        fontSize: 15,
        fontWeight: '600',
    },
    exploreBtn: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    exploreBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    purchaseItem: {
        backgroundColor: '#0d1520',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    purchaseLeft: {
        flex: 1,
        marginRight: 12,
    },
    purchaseTitle: {
        color: '#e2e8f0',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    purchaseDate: {
        color: '#475569',
        fontSize: 12,
    },
    purchaseRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    purchaseAmount: {
        color: '#ef4444',
        fontWeight: '800',
        fontSize: 15,
    },
    menuRow: {
        backgroundColor: '#0d1520',
        borderRadius: 14,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    menuLabel: {
        color: '#e2e8f0',
        fontSize: 15,
        fontWeight: '600',
    },
    passForm: {
        backgroundColor: '#080d14',
        borderRadius: 14,
        padding: 18,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1a2535',
        gap: 14,
    },
    passField: {
        gap: 6,
    },
    passLabel: {
        color: '#475569',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    passInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0d1520',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    passInput: {
        flex: 1,
        color: '#e2e8f0',
        fontSize: 14,
    },
    saveBtn: {
        backgroundColor: '#ef4444',
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    logoutRow: {
        backgroundColor: 'rgba(239,68,68,0.06)',
        borderRadius: 14,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.15)',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '700',
    },
});
