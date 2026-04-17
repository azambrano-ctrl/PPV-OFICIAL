import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { settingsService } from '../src/services';
import { registerForPushNotificationsAsync, sendPushTokenToServer } from '../src/utils/notifications';
import { Colors } from '../src/theme/colors';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const { loadAuth, isAuthenticated } = useAuthStore();
  const { setSettings } = useSettingsStore();

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          loadAuth(),
          settingsService.get().then((res: any) => {
            if (res.success && res.data) {
              setSettings(res.data);
            }
          }).catch(() => {}),
        ]);
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        setAppReady(true);
        SplashScreen.hideAsync();
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const setupPush = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) await sendPushTokenToServer(token);
    };
    setupPush();

    const sub1 = Notifications.addNotificationReceivedListener(() => {});
    const sub2 = Notifications.addNotificationResponseReceivedListener(() => {});
    return () => { sub1.remove(); sub2.remove(); };
  }, [isAuthenticated]);

  if (!appReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor={Colors.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="watch/[id]" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth/login" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/forgot-password" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
