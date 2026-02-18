import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { settingsService } from '../services';
import HomeScreen from '../screens/HomeScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WatchScreen from '../screens/WatchScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
    const { isAuthenticated, loadAuth } = useAuthStore();
    const { setSettings } = useSettingsStore();
    const [loading, setLoading] = React.useState(true);

    const initializeApp = async () => {
        try {
            // Load both auth and settings in parallel
            await Promise.all([
                loadAuth(),
                (async () => {
                    const data = await settingsService.get();
                    if (data.success) {
                        setSettings(data.data);
                    }
                })()
            ]);
        } catch (error) {
            console.error('Error initializing app:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        initializeApp();
    }, []);

    if (loading) return null;

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#0f172a' }
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="Watch" component={WatchScreen} />
            {!isAuthenticated && (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}
