import { Tabs } from 'expo-router';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { THEME } from '@/constants/theme';

export default function TabsLayout() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.panelBg,
          borderTopColor: t.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 10,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.22,
          shadowRadius: 10,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '900',
          fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
          letterSpacing: 0,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'PLAN',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'SPLIT',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="convoy"
        options={{
          title: 'CARS',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'car' : 'car-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="polls"
        options={{
          title: 'VOTE',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: 'MEDIA',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'images' : 'images-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
