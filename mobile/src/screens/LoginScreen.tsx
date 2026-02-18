import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, LogIn } from 'lucide-react-native';
import { authService } from '../services';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const setAuth = useAuthStore(state => state.setAuth);

    const handleLogin = async () => {
        if (!email || !password) return;

        setLoading(true);
        setError('');

        try {
            const data = await authService.login(email, password);
            if (data.success) {
                await setAuth(data.data.user, data.data.accessToken);
                // Navigation will be handled by the layout/root navigator based on auth state
            } else {
                setError(data.message || 'Error al iniciar sesión');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>ARENA</Text>
                    <Text style={styles.subLogoText}>FIGHT PASS</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.title}>¡Bienvenido!</Text>
                    <Text style={styles.subtitle}>Inicia sesión para ver tus peleas</Text>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.inputContainer}>
                        <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#64748b"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            placeholderTextColor="#64748b"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginBtn, loading && styles.disabledBtn]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.loginBtnText}>Entrar</Text>
                                <LogIn size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tienes cuenta?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerText}>Regístrate ahora</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#ef4444',
        letterSpacing: 4,
    },
    subLogoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 8,
        marginTop: -10,
    },
    form: {
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 32,
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 16,
        fontSize: 14,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
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
        fontSize: 16,
    },
    loginBtn: {
        backgroundColor: '#ef4444',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 32,
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    registerText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
