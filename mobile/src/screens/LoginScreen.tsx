import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authService } from '../services';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { getImageUrl } from '../config/constants';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const setAuth = useAuthStore(state => state.setAuth);
    const { settings } = useSettingsStore();

    const handleSocialLogin = async (provider: string, token: any) => {
        setLoading(true);
        setError('');
        try {
            const res = await authService.socialLogin(provider, token);
            if (res.success) {
                await setAuth(res.data.user, res.data.accessToken);
            }
        } catch (err: any) {
            setError('Error al conectar con ' + provider);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) return;

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
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.container}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={logoSource}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>

                            <View style={styles.headerTextContainer}>
                                <Text style={styles.mainTitle}>INGRESA AL</Text>
                                <Text style={styles.octTitle}>OCTÁGONO</Text>
                                <View style={styles.titleUnderline} />
                                <Text style={styles.welcomeText}>{settings.site_name?.toUpperCase() || 'BIENVENIDO'}</Text>
                            </View>

                            <View style={styles.card}>
                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <View style={styles.inputWrapper}>
                                    <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="CORREO ELECTRÓNICO"
                                        placeholderTextColor="#64748b"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="CONTRASEÑA"
                                        placeholderTextColor="#64748b"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? (
                                            <EyeOff size={20} color="#94a3b8" />
                                        ) : (
                                            <Eye size={20} color="#94a3b8" />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.loginBtn, loading && styles.disabledBtn]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={styles.loginBtnText}>INGRESAR</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.forgotBtn}>
                                    <Text style={styles.forgotText}>¿OLVIDASTE TU CONTRASEÑA?</Text>
                                </TouchableOpacity>

                                <View style={styles.socialDivider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>ACCESO SOCIAL</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <View style={styles.socialRow}>
                                    {settings.google_client_id_android ? (
                                        <GoogleLoginButton
                                            settings={settings}
                                            onLogin={handleSocialLogin}
                                        />
                                    ) : (
                                        <View style={[styles.socialBtn, { opacity: 0.5 }]}>
                                            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
                                            <Text style={styles.socialBtnText}>GOOGLE</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity style={styles.socialBtn}>
                                        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png' }} style={styles.socialIcon} />
                                        <Text style={styles.socialBtnText}>FACEBOOK</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.footer}>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.footerText}>
                                        ¿NO TIENES UNA CUENTA? <Text style={styles.registerLink}>REGÍSTRATE</Text>
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.promoterBtn}>
                                    <Text style={styles.promoterBtnText}>REGÍSTRATE COMO PROMOTORA</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        alignItems: 'center',
        paddingTop: 40,
    },
    logoContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    logo: {
        width: 180,
        height: 80,
    },
    headerTextContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        fontStyle: 'italic',
        lineHeight: 32,
    },
    octTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        fontStyle: 'italic',
        lineHeight: 48,
        letterSpacing: 1,
    },
    titleUnderline: {
        width: 60,
        height: 3,
        backgroundColor: '#ef4444',
        marginVertical: 4,
    },
    welcomeText: {
        fontSize: 14,
        color: '#94a3b8',
        letterSpacing: 4,
        fontWeight: 'bold',
    },
    card: {
        width: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.5)',
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 16,
        fontSize: 14,
        textAlign: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#334155',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    loginBtn: {
        backgroundColor: '#fff',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    loginBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    forgotBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    forgotText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    socialDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
    },
    dividerText: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: 'bold',
        marginHorizontal: 10,
        letterSpacing: 2,
    },
    socialRow: {
        flexDirection: 'row',
        gap: 12,
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(51, 65, 85, 0.5)',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        gap: 8,
    },
    socialIcon: {
        width: 20,
        height: 20,
    },
    socialBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        width: '100%',
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    registerLink: {
        color: '#fff',
        fontWeight: '900',
    },
    promoterBtn: {
        marginTop: 24,
        width: '100%',
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoterBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
});

// Componente para manejar el Login de Google de forma segura
function GoogleLoginButton({ settings, onLogin }: { settings: any, onLogin: (provider: string, token: any) => void }) {
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: settings.google_client_id_android,
        iosClientId: settings.google_client_id_ios,
        webClientId: settings.google_client_id_web,
    });

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            onLogin('google', authentication?.accessToken);
        }
    }, [response]);

    return (
        <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => promptAsync()}
            disabled={!request}
        >
            <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                style={styles.socialIcon}
            />
            <Text style={styles.socialBtnText}>GOOGLE</Text>
        </TouchableOpacity>
    );
}
