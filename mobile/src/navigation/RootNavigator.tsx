import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import HomeScreen from '../screens/HomeScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import WatchScreen from '../screens/WatchScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
    const { isAuthenticated, loadAuth } = useAuthStore();
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadAuth().finally(() => setLoading(false));
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
                <Stack.Screen name="Login" component={LoginScreen} />
            )}
        </Stack.Navigator>
    );
}
