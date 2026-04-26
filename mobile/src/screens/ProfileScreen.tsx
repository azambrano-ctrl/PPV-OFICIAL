import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    TextInput
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
    Camera
} from 'lucide-react-native';
import { authService } from '../services';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { getImageUrl } from '../config/constants';

export default function ProfileScreen({ navigation }: any) {
    const { user, logout } = useAuthStore();
    const [purchases, setPurchases] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isChangingPass, setIsChangingPass] = React.useState(false);
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const fetchData = async () => {
        try {
            const response = await authService.getPurchases();
            if (response.success) {
                setPurchases(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que deseas salir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    onPress: async () => {
                        await logout();
                        navigation.navigate('Home');
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "Por favor completa todos los campos");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Las contraseñas no coinciden");
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert("Error", "La nueva contraseña debe tener al menos 8 caracteres");
            return;
        }

        try {
            const res = await authService.changePassword(currentPassword, newPassword);
            if (res.success) {
                Alert.alert("Éxito", "Contraseña actualizada correctamente");
                setIsChangingPass(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Error al cambiar la contraseña");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ef4444" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Perfil</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Info */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarInner}>
                            <User color="#fff" size={48} />
                        </View>
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <Camera color="#fff" size={16} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.full_name}</Text>
                    <View style={styles.emailRow}>
                        <Mail color="#94a3b8" size={14} />
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: user?.role === 'admin' ? '#ef4444' : '#334155' }]}>
                        <Shield color="#fff" size={12} />
                        <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Section: Purchases */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ShoppingBag color="#ef4444" size={20} />
                        <Text style={styles.sectionTitle}>Mis Eventos Adquiridos</Text>
                    </View>

                    {purchases.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Aún no has adquirido ningún evento.</Text>
                            <TouchableOpacity
                                style={styles.browseBtn}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.browseBtnText}>Explorar Eventos</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        purchases.map((purchase: any) => (
                            <TouchableOpacity
                                key={purchase.id}
                                style={styles.purchaseItem}
                                onPress={() => navigation.navigate('EventDetail', { eventId: purchase.event_id })}
                            >
                                <View style={styles.purchaseInfo}>
                                    <Text style={styles.purchaseTitle}>{purchase.event_title}</Text>
                                    <Text style={styles.purchaseDate}>
                                        Comprado el {new Date(purchase.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.purchaseAction}>
                                    <Text style={styles.priceText}>${purchase.final_amount}</Text>
                                    <ChevronRight color="#94a3b8" size={20} />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Section: Account Settings */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Lock color="#ef4444" size={20} />
                        <Text style={styles.sectionTitle}>Configuración de Cuenta</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setIsChangingPass(!isChangingPass)}
                    >
                        <Text style={styles.menuItemText}>Cambiar Contraseña</Text>
                        <ChevronRight color="#94a3b8" size={20} />
                    </TouchableOpacity>

                    {isChangingPass && (
                        <View style={styles.passForm}>
                            <TextInput
                                style={styles.input}
                                placeholder="Contraseña Actual"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Nueva Contraseña"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmar Nueva Contraseña"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleChangePassword}
                            >
                                <Text style={styles.saveBtnText}>Actualizar Contraseña</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.menuItem, styles.logoutItem]}
                        onPress={handleLogout}
                    >
                        <LogOut color="#ef4444" size={20} />
                        <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    profileCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#334155',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ef4444',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#1e293b',
    },
    userName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    userEmail: {
        color: '#94a3b8',
        fontSize: 14,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    purchaseItem: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    purchaseInfo: {
        flex: 1,
    },
    purchaseTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    purchaseDate: {
        color: '#64748b',
        fontSize: 12,
    },
    purchaseAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priceText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#475569',
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 16,
    },
    browseBtn: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    browseBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    menuItem: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    menuItemText: {
        color: '#fff',
        fontSize: 16,
    },
    logoutItem: {
        marginTop: 12,
        justifyContent: 'flex-start',
        gap: 12,
    },
    passForm: {
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    input: {
        backgroundColor: '#1e293b',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    saveBtn: {
        backgroundColor: '#ef4444',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
