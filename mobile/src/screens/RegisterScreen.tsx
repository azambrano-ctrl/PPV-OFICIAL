import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react-native';
import { authService } from '../services';
import { useSettingsStore } from '../store/settingsStore';

export default function RegisterScreen({ navigation }: any) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fullName, setFullName] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const { settings } = useSettingsStore();

    const handleRegister = async () => {
        if (!email || !password || !fullName) {
            setError('Por favor completa los campos obligatorios');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await authService.register({
                email,
                password,
                full_name: fullName,
                phone
            });

            if (data.success) {
                Alert.alert('Éxito', 'Cuenta creada correctamente. Ya puedes iniciar sesión.', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                setError(data.message || 'Error al registrarse');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

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
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <ArrowLeft color="#fff" size={24} />
                        </TouchableOpacity>

                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.mainTitle}>NUEVA</Text>
                                <Text style={styles.octTitle}>CUENTA</Text>
                                <View style={styles.titleUnderline} />
                                <Text style={styles.welcomeText}>ÚNETE A {settings.site_name?.toUpperCase() || 'ARENA'}</Text>
                            </View>

                            <View style={styles.card}>
                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <View style={styles.inputWrapper}>
                                    <User size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="NOMBRE COMPLETO"
                                        placeholderTextColor="#64748b"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>

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
                                    <Phone size={20} color="#94a3b8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="TELÉFONO (OPCIONAL)"
                                        placeholderTextColor="#64748b"
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
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
                                        secureTextEntry
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.loginBtn, loading && styles.disabledBtn]}
                                    onPress={handleRegister}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={styles.loginBtnText}>REGISTRARSE</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.footer}>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.footerText}>
                                        ¿YA TIENES UNA CUENTA? <Text style={styles.registerLink}>INICIA SESIÓN</Text>
                                    </Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    container: {
        flex: 1,
    },
    backBtn: {
        padding: 16,
        position: 'absolute',
        top: 20,
        left: 0,
        zIndex: 10,
    },
    scrollContent: {
        padding: 24,
        alignItems: 'center',
        paddingTop: 80,
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
});
