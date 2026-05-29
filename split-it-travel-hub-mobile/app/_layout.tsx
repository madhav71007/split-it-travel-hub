import 'react-native-url-polyfill/auto';
import '../global.css';
import { Stack, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SkyThemeProvider, useSkyTheme } from '@/components/SkyThemeProvider';
import { TripProvider } from '@/components/TripContext';
import { SubscriptionProvider } from '@/components/SubscriptionContext';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { THEME } from '@/constants/theme';

function RootLayoutNav() {
  const { phase } = useSkyTheme();
  const isDark = phase === 'evening';
  const t = THEME[phase];
  const { user, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.canvasBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  const inAuthGroup = segments[0] === 'login';

  if (!user && !inAuthGroup) {
    return <Redirect href="/login" />;
  }

  if (user && inAuthGroup) {
    return <Redirect href="/" />;
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
