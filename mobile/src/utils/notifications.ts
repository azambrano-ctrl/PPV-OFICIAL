// Push notifications are handled via FCM (Firebase Cloud Messaging) in React Native CLI.
// To enable them, add: @react-native-firebase/app + @react-native-firebase/messaging
// and follow the native setup: https://rnfirebase.io/messaging/usage
//
// For now this module exports no-op stubs so the codebase compiles without Expo.

export async function registerForPushNotificationsAsync(): Promise<string | null> {
    // TODO: replace with @react-native-firebase/messaging
    // const messaging = require('@react-native-firebase/messaging').default;
    // const token = await messaging().getToken();
    // return token;
    return null;
}

export async function sendPushTokenToServer(_token: string | null): Promise<void> {
    // TODO: call authService.updatePushToken(_token) once FCM is configured
}
