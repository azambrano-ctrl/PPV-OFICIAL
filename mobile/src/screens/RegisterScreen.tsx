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
    Alert,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, Phone, ArrowLeft, ArrowRight } from 'lucide-react-native';
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
            setError('Nombre, correo y contraseña son obligatorios');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await authService.register({ email, password, full_name: fullName, phone });
            if (data.success) {
                Alert.alert('¡Cuenta creada!', 'Ya puedes iniciar sesión.', [
                    { text: 'Ingresar', onPress: () => navigation.navigate('Login') },
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
            style={styles.bg}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.overlay} />

            <SafeAreaView style={styles.safe}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft color="#fff" size={22} />
                </TouchableOpacity>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scroll}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Headline */}
                        <View style={styles.headline}>
                            <Text style={styles.headlineSub}>
                                ÚNETE · {settings.site_name?.toUpperCase() || 'ARENA FIGHT PASS'}
                            </Text>
                            <Text style={styles.headlineMain}>NUEVA{'\n'}CUENTA</Text>
                            <View style={styles.redLine} />
                        </View>

                        {/* Form */}
                        <View style={styles.card}>
                            {error ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {[
                                { label: 'NOMBRE COMPLETO', icon: User, value: fullName, setter: setFullName, placeholder: 'Tu nombre', type: undefined, secure: false },
                                { label: 'CORREO ELECTRÓNICO', icon: Mail, value: email, setter: setEmail, placeholder: 'tu@correo.com', type: 'email-address' as any, secure: false },
                                { label: 'TELÉFONO (OPCIONAL)', icon: Phone, value: phone, setter: setPhone, placeholder: '+52 000 000 0000', type: 'phone-pad' as any, secure: false },
                                { label: 'CONTRASEÑA', icon: Lock, value: password, setter: setPassword, placeholder: '••••••••', type: undefined, secure: true },
                            ].map(({ label, icon: Icon, value, setter, placeholder, type, secure }) => (
                                <View key={label} style={styles.fieldGroup}>
                                    <Text style={styles.labelText}>{label}</Text>
                                    <View style={styles.inputRow}>
                                        <Icon size={18} color="#475569" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder={placeholder}
                                            placeholderTextColor="#334155"
                                            value={value}
                                            onChangeText={setter}
                                            autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                                            keyboardType={type}
                                            secureTextEntry={secure}
                                        />
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity
                                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.submitText}>CREAR CUENTA</Text>
                                        <ArrowRight size={18} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.footerText}>
                                ¿Ya tienes cuenta?{' '}
                                <Text style={styles.footerLink}>Inicia sesión</Text>
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8,13,20,0.85)',
    },
    safe: { flex: 1 },
    backBtn: {
        padding: 16,
        paddingTop: 20,
    },
    scroll: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    headline: {
        alignItems: 'center',
        marginBottom: 28,
        width: '100%',
    },
    headlineSub: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 8,
    },
    headlineMain: {
        fontSize: 40,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 44,
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
    fieldGroup: {
        marginBottom: 14,
    },
    labelText: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 8,
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
    submitBtn: {
        backgroundColor: '#ef4444',
        height: 54,
        borderRadius: 13,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    submitText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 2,
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
});
