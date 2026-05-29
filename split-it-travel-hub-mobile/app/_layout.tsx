import 'react-native-url-polyfill/auto';
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SkyThemeProvider, useSkyTheme } from '@/components/SkyThemeProvider';
import { TripProvider } from '@/components/TripContext';
import { SubscriptionProvider } from '@/components/SubscriptionContext';

function RootLayoutNav() {
  const { phase } = useSkyTheme();
  const isDark = phase === 'evening';

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
      <SubscriptionProvider>
        <TripProvider>
          <RootLayoutNav />
        </TripProvider>
      </SubscriptionProvider>
    </SkyThemeProvider>
  );
}
