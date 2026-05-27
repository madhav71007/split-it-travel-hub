import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  invite_code: string;
  is_active: boolean;
  owner_id: string;
}

const PHASE_LABELS: Record<string, string> = {
  morning: '🌅 Good Morning',
  afternoon: '☀️ Good Afternoon',
  evening: '🌇 Good Evening',
  night: '🌙 Good Night',
};

const PHASE_BADGES: Record<string, string> = {
  morning: '🌤 Dawn Horizon',
  afternoon: '🌿 Bright Canopy',
  evening: '🌅 Twilight Sky',
  night: '🌕 Pale Moon',
};

export default function DashboardScreen() {
  const { phase, setManualPhase, isManual, autoPhase } = useSkyTheme();
  const t = THEME[phase];
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setTrips(data);
      const active = data.find((t: Trip) => t.is_active);
      if (active) setActiveTrip(active);
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (!activeTrip) return;
    const link = `https://wa.me/?text=Join%20our%20trip%20${encodeURIComponent(activeTrip.title)}!%20Use%20invite%20code%3A%20${activeTrip.invite_code}%20on%20Split-It%20Travel%20Hub.`;
    await Share.share({ message: link, title: 'Join my trip on Split-It!' });
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    Alert.alert(
      'End Trip',
      `Are you sure you want to end "${activeTrip.title}"? This will lock all editing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('trips')
              .update({ is_active: false })
              .eq('id', activeTrip.id);
            fetchTrips();
          },
        },
      ]
    );
  };

  const phaseOptions: Array<'morning' | 'afternoon' | 'evening' | 'night'> = [
    'morning', 'afternoon', 'evening', 'night',
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: t.panelBg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: t.border,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
            {PHASE_BADGES[phase]}
          </Text>
          <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', marginTop: 4 }}>
            {PHASE_LABELS[phase]}
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 4 }}>
            Split-It Travel Hub
          </Text>
        </View>

        {/* Theme Override Pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {phaseOptions.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setManualPhase(phase === p && isManual ? null : p)}
              style={{
                backgroundColor: phase === p ? t.accentDeep : t.panelBg,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: t.border,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: t.text, fontSize: 12, fontWeight: '600' }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          {isManual && (
            <TouchableOpacity
              onPress={() => setManualPhase(null)}
              style={{
                backgroundColor: t.panelBg,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: t.border,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: t.textMuted, fontSize: 12 }}>Auto ↺</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active Trip Card */}
        {loading ? (
          <ActivityIndicator color={t.text} style={{ marginVertical: 40 }} />
        ) : activeTrip ? (
          <View
            style={{
              backgroundColor: t.panelBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: t.border,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                Active Trip
              </Text>
              <View
                style={{
                  backgroundColor: t.accent,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: t.text, fontSize: 11, fontWeight: '700' }}>
                  {activeTrip.is_active ? '● LIVE' : '✕ ENDED'}
                </Text>
              </View>
            </View>
            <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', marginTop: 8 }}>
              {activeTrip.title}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 4 }}>
              📍 {activeTrip.destination}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>
              {activeTrip.start_date} → {activeTrip.end_date}
            </Text>

            {/* Invite code */}
            <View
              style={{
                backgroundColor: t.panelBgAlt,
                borderRadius: 12,
                padding: 12,
                marginTop: 12,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '600' }}>Invite Code</Text>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 4, marginTop: 2 }}>
                {activeTrip.invite_code}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  flex: 1,
                  backgroundColor: t.btnPrimary,
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <Text style={{ color: t.btnPrimaryText, fontWeight: '700', fontSize: 14 }}>
                  📤 Share on WhatsApp
                </Text>
              </TouchableOpacity>

              {userId === activeTrip.owner_id && activeTrip.is_active && (
                <TouchableOpacity
                  onPress={handleEndTrip}
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.30)',
                    paddingHorizontal: 16,
                  }}
                >
                  <Text style={{ color: '#F87171', fontWeight: '700', fontSize: 14 }}>
                    ✕ End
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: t.panelBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: t.border,
              padding: 24,
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 8 }}>✈️</Text>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
              No Active Trip
            </Text>
            <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: 4 }}>
              Create your first trip to get started
            </Text>
          </View>
        )}

        {/* Create New Trip Button */}
        <TouchableOpacity
          onPress={() => router.push('/modal/new-trip')}
          style={{
            backgroundColor: t.btnPrimary,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: t.border,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: t.btnPrimaryText, fontWeight: '700', fontSize: 16 }}>
            + Create New Trip
          </Text>
        </TouchableOpacity>

        {/* All Trips List */}
        {trips.length > 1 && (
          <View>
            <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              All Trips
            </Text>
            {trips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                onPress={() => setActiveTrip(trip)}
                style={{
                  backgroundColor: t.panelBg,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{trip.title}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 12 }}>{trip.destination}</Text>
                </View>
                <View
                  style={{
                    backgroundColor: trip.is_active ? t.accent : 'rgba(100,100,100,0.2)',
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ color: t.text, fontSize: 11, fontWeight: '600' }}>
                    {trip.is_active ? 'Active' : 'Ended'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
