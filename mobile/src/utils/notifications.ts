import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { authService } from '../services';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'web') {
        return null;
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        // Get Expo Push Token
        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
            if (!projectId) {
                console.warn('EAS Project ID not found. Ensure you have an app.json with a valid project id.');
            }

            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;
            console.log('Push Token obtained:', token);
        } catch (e) {
            console.error('Error getting push token:', e);
            return null;
        }
    } else {
        console.log('Must use physical device for Push Notifications');
        return null;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

export async function sendPushTokenToServer(token: string | null) {
    try {
        await authService.updatePushToken(token);
        console.log('Push token sent to server');
    } catch (error) {
        console.error('Error sending push token to server:', error);
    }
}
