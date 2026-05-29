import 'react-native-url-polyfill/auto';
import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SkyThemeProvider, useSkyTheme } from '@/components/SkyThemeProvider';
import { TripProvider } from '@/components/TripContext';
import { SubscriptionProvider } from '@/components/SubscriptionContext';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/theme';
import { useEffect } from 'react';

function RootLayoutNav() {
  const { phase } = useSkyTheme();
  const isDark = phase === 'evening';
  const t = THEME[phase];
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.canvasBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  const inAuthGroup = segments[0] === 'login';

  // Prevent flashing protected screens before redirect completes
  if (!user && !inAuthGroup) {
    return (
      <View style={{ flex: 1, backgroundColor: t.canvasBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal/new-trip"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal/subscription"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SkyThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <TripProvider>
            <RootLayoutNav />
          </TripProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </SkyThemeProvider>
  );
}
