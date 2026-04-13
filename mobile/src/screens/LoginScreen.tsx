import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { authService } from '../services';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { getImageUrl } from '../config/constants';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const setAuth = useAuthStore(state => state.setAuth);
    const { settings } = useSettingsStore();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Completa todos los campos');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await authService.login(email, password);
            if (data.success) {
                await setAuth(data.data.user, data.data.accessToken);
            } else {
                setError(data.message || 'Error al iniciar sesión');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const logoSource = settings.site_logo
        ? { uri: getImageUrl(settings.site_logo) }
        : require('../../assets/images/logo.png');

    return (
        <ImageBackground
            source={require('../../assets/images/login_bg.png')}
            style={styles.bg}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.overlay} />

            <SafeAreaView style={styles.safe}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scroll}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Logo */}
                        <Image source={logoSource} style={styles.logo} resizeMode="contain" />

                        {/* Headline */}
                        <View style={styles.headline}>
                            <Text style={styles.headlineSub}>
                                {settings.site_name?.toUpperCase() || 'ARENA FIGHT PASS'}
                            </Text>
                            <Text style={styles.headlineMain}>INGRESA AL{'\n'}OCTÁGONO</Text>
                            <View style={styles.redLine} />
                        </View>

                        {/* Form card */}
                        <View style={styles.card}>
                            {error ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Email */}
                            <View style={styles.fieldLabel}>
                                <Text style={styles.labelText}>CORREO ELECTRÓNICO</Text>
                            </View>
                            <View style={styles.inputRow}>
                                <Mail size={18} color="#475569" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="tu@correo.com"
                                    placeholderTextColor="#334155"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Password */}
                            <View style={[styles.fieldLabel, { marginTop: 16 }]}>
                                <Text style={styles.labelText}>CONTRASEÑA</Text>
                                <TouchableOpacity>
                                    <Text style={styles.forgotLink}>¿OLVIDASTE?</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.inputRow}>
                                <Lock size={18} color="#475569" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#334155"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeBtn}
                                >
                                    {showPassword
                                        ? <EyeOff size={18} color="#475569" />
                                        : <Eye size={18} color="#475569" />
                                    }
                                </TouchableOpacity>
                            </View>

                            {/* CTA */}
                            <TouchableOpacity
                                style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.loginBtnText}>INGRESAR</Text>
                                        <ArrowRight size={18} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.footerText}>
                                    ¿No tienes cuenta?{' '}
                                    <Text style={styles.footerLink}>Regístrate</Text>
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.dividerRow}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerLabel}>o</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity style={styles.promoterBtn}>
                                <Text style={styles.promoterText}>ACCESO PROMOTORAS</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8,13,20,0.82)',
    },
    safe: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
        alignItems: 'center',
    },
    logo: {
        width: 160,
        height: 64,
        marginBottom: 32,
    },
    headline: {
        alignItems: 'center',
        marginBottom: 32,
        width: '100%',
    },
    headlineSub: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '700',
        letterSpacing: 4,
        marginBottom: 8,
    },
    headlineMain: {
        fontSize: 38,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 42,
        letterSpacing: -0.5,
    },
    redLine: {
        width: 50,
        height: 3,
        backgroundColor: '#ef4444',
        borderRadius: 2,
        marginTop: 14,
    },
    card: {
        width: '100%',
        backgroundColor: 'rgba(13,21,32,0.9)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1a2535',
        marginBottom: 28,
    },
    errorBox: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 18,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    fieldLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelText: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    forgotLink: {
        fontSize: 10,
        color: '#ef4444',
        fontWeight: '700',
        letterSpacing: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#080d14',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 52,
        borderWidth: 1,
        borderColor: '#1a2535',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#e2e8f0',
        fontSize: 15,
        fontWeight: '500',
    },
    eyeBtn: {
        padding: 4,
    },
    loginBtn: {
        backgroundColor: '#ef4444',
        height: 54,
        borderRadius: 13,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 24,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 2,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
    },
    footerText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500',
    },
    footerLink: {
        color: '#fff',
        fontWeight: '700',
    },
    dividerRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#1a2535',
    },
    dividerLabel: {
        color: '#334155',
        fontSize: 13,
        fontWeight: '600',
    },
    promoterBtn: {
        width: '100%',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1a2535',
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoterText: {
        color: '#475569',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
    },
});
