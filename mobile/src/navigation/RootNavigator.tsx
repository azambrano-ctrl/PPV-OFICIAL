import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { settingsService } from '../services';
import HomeScreen from '../screens/HomeScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WatchScreen from '../screens/WatchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { registerForPushNotificationsAsync, sendPushTokenToServer } from '../utils/notifications';

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

    // Handle Push Notifications registration when authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            registerForPushNotificationsAsync().then(token => {
                if (token) {
                    sendPushTokenToServer(token);
                }
            });
        }

        // Add listeners for notifications
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log('Notification response received:', data);

            // Handle navigation based on notification data
            // Example: if (data.link) { navigate to link }
        });

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, [isAuthenticated]);

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
            {isAuthenticated ? (
                <Stack.Screen name="Profile" component={ProfileScreen} />
            ) : (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}
