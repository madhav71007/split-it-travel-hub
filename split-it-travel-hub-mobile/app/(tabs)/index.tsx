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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';
import { useTrip, type Trip } from '@/components/TripContext';
import { useSubscription } from '@/components/SubscriptionContext';
import { useAuth } from '@/components/AuthContext';
import { PRO_FEATURES, PRO_PLAN, PRO_LIMITS } from '@/constants/subscription';
import { Ionicons } from '@expo/vector-icons';
import CalendarPickerModal from '@/components/CalendarPickerModal';


const SUBSCRIPTION_ROUTE = '/modal/subscription' as Href;

const PHASE_LABELS: Record<string, string> = {
  morning: 'Good day',
  evening: 'Good evening',
};

const PHASE_BADGES: Record<string, string> = {
  morning: 'Light command view',
  evening: 'Night command view',
};

function DashboardMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 10,
        minHeight: 68,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: tone, fontSize: 18, fontWeight: '900' }}>{value}</Text>
      <Text
        style={{
          color: '#8C8A9A',
          fontSize: 10,
          fontWeight: '900',
          letterSpacing: 0.6,
          marginTop: 4,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { phase, setManualPhase, isManual } = useSkyTheme();
  const t = THEME[phase];
  const router = useRouter();
  const {
    trips,
    activeTrip,
    activeTripId,
    members,
    loading,
    selectTrip,
    joinTrip,
    addMember,
    removeMember,
  } = useTrip();
  const subscription = useSubscription();
  const { user, signOut, isOfflineMode } = useAuth();

  const [inviteInput, setInviteInput] = useState('');
  const [joinNameInput, setJoinNameInput] = useState('');
  const [newMemberInput, setNewMemberInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (user && !joinNameInput) {
      setJoinNameInput(user.name);
    }
  }, [user]);


  const handleShare = async () => {
    if (!activeTrip) return;
    const link = `https://wa.me/?text=Join%20our%20trip%20${encodeURIComponent(activeTrip.title)}!%20Use%20invite%20code%3A%20${activeTrip.invite_code}%20on%20Split-It%20Travel%20Hub.`;
    await Share.share({ message: link, title: 'Join my trip on Split-It!' });
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    Alert.alert(
      'End Trip',
      `Are you sure you want to end "${activeTrip.title}"? This will lock editing in the web portal and mark it as completed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            if (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== 'YOUR_COPIED_PUBLISHABLE_ANON_KEY') {
              await supabase
                .from('trips')
                .update({ is_active: false })
                .eq('id', activeTrip.id);
            } else {
              // Local update
              const localTrips = await AsyncStorage.getItem('local_trips');
              if (localTrips) {
                const parsed: Trip[] = JSON.parse(localTrips);
                const updated = parsed.map((tr) =>
                  tr.id === activeTrip.id ? { ...tr, is_active: false } : tr
                );
                await AsyncStorage.setItem('local_trips', JSON.stringify(updated));
              }
            }
            Alert.alert('Trip Ended', 'The trip is now marked as Completed.');
            // Reload trips
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleUpdateDates = async (start: string, end: string) => {
    if (!activeTrip) return;
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('trips')
          .update({ start_date: start, end_date: end })
          .eq('id', activeTrip.id);
        if (error) {
          Alert.alert('Error', 'Failed to update dates: ' + error.message);
        } else {
          await refreshTrips();
        }
      } else {
        const localTrips = await AsyncStorage.getItem('local_trips');
        if (localTrips) {
          const parsed: Trip[] = JSON.parse(localTrips);
          const updated = parsed.map((tr) =>
            tr.id === activeTrip.id ? { ...tr, start_date: start, end_date: end } : tr
          );
          await AsyncStorage.setItem('local_trips', JSON.stringify(updated));
          await refreshTrips();
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthsShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} (${daysShort[date.getDay()]})`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleJoin = async () => {
    if (!inviteInput.trim()) {
      return Alert.alert('Error', 'Please enter an invite code.');
    }
    if (!joinNameInput.trim()) {
      return Alert.alert('Error', 'Please enter your name to join the trip.');
    }
    
    // Enforce free active trip limit
    if (!subscription.isPro && trips.length >= PRO_LIMITS.freeTrips) {
      return Alert.alert(
        'Upgrade to Pro',
        `The Free plan is limited to ${PRO_LIMITS.freeTrips} active trip. Upgrade to Pro Traveller to join or create unlimited trips.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push(SUBSCRIPTION_ROUTE) }
        ]
      );
    }

    setJoining(true);
    const joined = await joinTrip(inviteInput.trim(), joinNameInput.trim());
    setJoining(false);
    if (joined) {
      Alert.alert('Success 🎉', `Joined trip "${joined.title}"!`);
      setInviteInput('');
      setJoinNameInput('');
    }
  };

  const handleAddMember = async () => {
    const trimmed = newMemberInput.trim();
    if (!trimmed) return;
    if (members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      return Alert.alert('Duplicate', 'This member already exists.');
    }
    
    // Enforce free member limit
    if (!subscription.isPro && members.length >= PRO_LIMITS.freeMembers) {
      return Alert.alert(
        'Upgrade to Pro',
        `The Free plan is limited to ${PRO_LIMITS.freeMembers} members per trip. Upgrade to Pro Traveller to add unlimited crew members.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push(SUBSCRIPTION_ROUTE) }
        ]
      );
    }

    await addMember(trimmed);
    setNewMemberInput('');
  };

  // Trip categorization
  const today = new Date().toISOString().split('T')[0];
  const ongoingTrips = trips.filter(
    (trip) =>
      trip.is_active &&
      (!trip.start_date || !trip.end_date || (trip.start_date <= today && trip.end_date >= today))
  );
  const upcomingTrips = trips.filter(
    (trip) => trip.is_active && trip.start_date && trip.start_date > today
  );
  const completedTrips = trips.filter(
    (trip) => !trip.is_active || (trip.end_date && trip.end_date < today)
  );
  const readinessScore = activeTrip
    ? Math.min(
        98,
        56 + members.length * 6 + (activeTrip.start_date ? 10 : 0) + (subscription.isPro ? 8 : 0)
      )
    : 0;
  const proStatus = subscription.isPro
    ? subscription.daysLeftInTrial > 0
      ? `Pro trial: ${subscription.daysLeftInTrial} days left`
      : 'Pro Traveller active'
    : 'Free plan';
  const accountStatus = user ? (isOfflineMode ? 'Local Account' : 'Cloud Account') : 'Not Signed In';


  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, width: '100%' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium command header */}
        <View
          style={{
            backgroundColor: t.panelBg,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: t.border,
            padding: 18,
            marginBottom: 14,
            width: '100%',
          }}
        >
          <View style={{ gap: 14 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: t.textMuted,
                  fontSize: 11,
                  fontWeight: '900',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Split-It Travel Hub
              </Text>
              <Text style={{ color: t.text, fontSize: 27, fontWeight: '900', marginTop: 4 }}>
                {PHASE_LABELS[phase]}, {user?.name || 'trip lead'}.
              </Text>
              <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
                {PHASE_BADGES[phase]} · {accountStatus}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => router.push(SUBSCRIPTION_ROUTE)}
                accessibilityRole="button"
                accessibilityLabel="Open Pro Traveller subscription"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: subscription.isPro ? t.accent : t.panelBgAlt,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: subscription.isPro ? t.primary : t.border,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <Ionicons name="diamond" size={15} color={subscription.isPro ? t.primary : t.textMuted} />
                <Text style={{ color: subscription.isPro ? t.primary : t.text, fontSize: 12, fontWeight: '900' }}>
                  {subscription.isPro ? 'PRO' : 'UPGRADE'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (window.confirm('Are you sure you want to sign out?')) {
                      signOut();
                    }
                  } else {
                    Alert.alert(
                      'Sign Out',
                      'Are you sure you want to sign out?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Sign Out', style: 'destructive', onPress: signOut }
                      ]
                    );
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: t.panelBgAlt,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: t.border,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <Ionicons name="log-out-outline" size={15} color={t.textMuted} />
                <Text style={{ color: t.text, fontSize: 12, fontWeight: '900' }}>
                  SIGN OUT
                </Text>
              </TouchableOpacity>
            </View>

          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <DashboardMetric label="Readiness" value={activeTrip ? `${readinessScore}%` : '--'} tone={t.primary} />
            <DashboardMetric label="Members" value={`${members.length}`} tone={t.secondary} />
            <DashboardMetric label="Plan" value={subscription.isPro ? 'Pro' : 'Free'} tone={t.tertiary} />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push(SUBSCRIPTION_ROUTE)}
          accessibilityRole="button"
          accessibilityLabel="Open Pro Traveller subscription"
          style={{
            backgroundColor: subscription.isPro ? t.panelBgAlt : t.panelBg,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: subscription.isPro ? t.primary : t.border,
            padding: 14,
            marginBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: t.accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="sparkles" size={18} color={t.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '900' }}>
              {proStatus}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 }}>
              {subscription.isPro
                ? 'Live convoy, exports, offline vault, and smart settlement tools are unlocked.'
                : `${PRO_PLAN.name} unlocks convoy command, exports, offline vault, and report workflows.`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
        </TouchableOpacity>

        <View style={{ gap: 10, marginBottom: 16 }}>
          {PRO_FEATURES.slice(0, 3).map((feature) => (
            <View
              key={feature.key}
              style={{
                backgroundColor: t.panelBg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.border,
                padding: 12,
                minHeight: 66,
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: t.panelBgAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name={feature.icon} size={17} color={t.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '900' }} numberOfLines={1}>
                  {feature.title}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: 11, lineHeight: 15, marginTop: 3 }} numberOfLines={1}>
                  {subscription.unlockedFeatures.includes(feature.key) ? 'Unlocked' : 'Pro only'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Theme Override Pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['morning', 'evening'] as const).map((p) => (
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
                {p === 'morning' ? 'Light Mode' : 'Dark Mode'}
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
          <ActivityIndicator color={t.primary} style={{ marginVertical: 40 }} />
        ) : activeTrip ? (
          <View
            style={{
              backgroundColor: t.panelBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: t.border,
              padding: 20,
              marginBottom: 16,
              width: '100%',
            }}
          >
            <View style={{ gap: 8 }}>
              <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                Selected Active Trip
              </Text>
              <View
                style={{
                  backgroundColor: activeTrip.is_active ? t.accent : 'rgba(100,100,100,0.2)',
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: t.text, fontSize: 11, fontWeight: '700' }}>
                  {activeTrip.is_active ? '● LIVE' : '✕ ENDED'}
                </Text>
              </View>
              {/* Premium Host Badge Placeholder */}
              <View
                style={{
                  backgroundColor: 'rgba(255, 193, 7, 0.2)',
                  borderColor: 'rgba(255, 193, 7, 0.5)',
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  marginLeft: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="star" size={10} color="#FFC107" style={{ marginRight: 4 }} />
                <Text style={{ color: '#FFC107', fontSize: 10, fontWeight: '800' }}>
                  PREMIUM
                </Text>
              </View>
            </View>
            <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', marginTop: 8 }}>
              {activeTrip.title}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 4 }}>
              {activeTrip.destination}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
              <Text style={{ color: t.textMuted, fontSize: 13, fontWeight: '600' }}>
                📅 {formatDisplayDate(activeTrip.start_date) || 'TBD'} to {formatDisplayDate(activeTrip.end_date) || 'TBD'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(true)}
                style={{
                  backgroundColor: t.panelBgAlt,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <Text style={{ color: t.primary, fontSize: 11, fontWeight: '800' }}>Change Dates</Text>
              </TouchableOpacity>
            </View>

            {/* Invite code */}
            <View
              style={{
                backgroundColor: t.panelBgAlt,
                borderRadius: 12,
                padding: 12,
                marginTop: 14,
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
                  Share
                </Text>
              </TouchableOpacity>

              {activeTrip.is_active && (
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
                    End
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Group Members Section */}
            <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: t.border }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                Group Members
              </Text>
              
              {/* Member List */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {members.map((member) => (
                  <View
                    key={member.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: t.panelBgAlt,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: t.border,
                      paddingLeft: 8,
                      paddingRight: 10,
                      paddingVertical: 5,
                      gap: 6,
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.primary }} />
                    <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>
                      {member.name}
                    </Text>
                    {member.name !== 'You' && (
                      <TouchableOpacity onPress={() => removeMember(member.id)}>
                        <Ionicons name="close-circle" size={14} color="#F87171" style={{ marginLeft: 2 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* Add Member Form */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={newMemberInput}
                  onChangeText={setNewMemberInput}
                  placeholder="Add member name..."
                  placeholderTextColor={t.textMuted}
                  style={{
                    flex: 1,
                    backgroundColor: t.inputBg,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: t.inputBorder,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: t.inputText,
                    fontSize: 14,
                  }}
                  onSubmitEditing={handleAddMember}
                />
                <TouchableOpacity
                  onPress={handleAddMember}
                  style={{
                    backgroundColor: t.btnOutline,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: t.border,
                    paddingHorizontal: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: t.btnOutlineText, fontWeight: '700', fontSize: 14 }}>Add</Text>
                </TouchableOpacity>
              </View>
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
              No Active Trip Selected
            </Text>
            <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: 4 }}>
              Select a trip below or create/join a new one.
            </Text>
          </View>
        )}

        {/* Join Trip Form */}
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
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', marginBottom: 12 }}>
            🔑 Join Trip via Shared Code
          </Text>

          <View style={{ marginBottom: 12 }}>
            <TextInput
              value={inviteInput}
              onChangeText={setInviteInput}
              placeholder="Enter 8-digit invite code (e.g. LONA2026)"
              placeholderTextColor={t.textMuted}
              autoCapitalize="characters"
              style={{
                backgroundColor: t.inputBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.inputBorder,
                padding: 12,
                color: t.inputText,
                fontSize: 15,
              }}
            />
          </View>

          <View style={{ marginBottom: 14 }}>
            <TextInput
              value={joinNameInput}
              onChangeText={setJoinNameInput}
              placeholder="Your Name (e.g. Madhav)"
              placeholderTextColor={t.textMuted}
              style={{
                backgroundColor: t.inputBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.inputBorder,
                padding: 12,
                color: t.inputText,
                fontSize: 15,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleJoin}
            disabled={joining}
            style={{
              backgroundColor: t.btnPrimary,
              borderRadius: 12,
              padding: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: t.border,
              opacity: joining ? 0.6 : 1,
            }}
          >
            <Text style={{ color: t.btnPrimaryText, fontWeight: '700', fontSize: 15 }}>
              {joining ? 'Joining Trip...' : 'Join Group Trip 🚀'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create New Trip Button */}
        <TouchableOpacity
          onPress={() => router.push('/modal/new-trip')}
          style={{
            backgroundColor: t.btnOutline,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: t.primary,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: t.btnOutlineText, fontWeight: '800', fontSize: 16 }}>
            + Create New Trip
          </Text>
        </TouchableOpacity>

        {/* Categorized Trips Dashboard */}
        <View style={{ gap: 20 }}>
          {/* Ongoing Trips */}
          <View>
            <Text style={{ color: t.primary, fontSize: 14, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              🟢 Ongoing Trips ({ongoingTrips.length})
            </Text>
            {ongoingTrips.length === 0 ? (
              <View style={{ padding: 14, backgroundColor: t.panelBg, borderRadius: 12, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.textMuted, fontSize: 13, fontStyle: 'italic' }}>No ongoing trips</Text>
              </View>
            ) : (
              ongoingTrips.map((trip) => renderTripCard(trip))
            )}
          </View>

          {/* Upcoming Trips */}
          <View>
            <Text style={{ color: t.secondary, fontSize: 14, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              📅 Upcoming Trips ({upcomingTrips.length})
            </Text>
            {upcomingTrips.length === 0 ? (
              <View style={{ padding: 14, backgroundColor: t.panelBg, borderRadius: 12, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.textMuted, fontSize: 13, fontStyle: 'italic' }}>No upcoming trips scheduled</Text>
              </View>
            ) : (
              upcomingTrips.map((trip) => renderTripCard(trip))
            )}
          </View>

          {/* Completed Trips / Memories */}
          <View>
            <Text style={{ color: t.textMuted, fontSize: 14, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              📸 Completed / Memories ({completedTrips.length})
            </Text>
            {completedTrips.length === 0 ? (
              <View style={{ padding: 14, backgroundColor: t.panelBg, borderRadius: 12, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.textMuted, fontSize: 13, fontStyle: 'italic' }}>No completed trips</Text>
              </View>
            ) : (
              completedTrips.map((trip) => renderTripCard(trip))
            )}
          </View>
        </View>
      </ScrollView>

      {activeTrip && (
        <CalendarPickerModal
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          startDate={activeTrip.start_date}
          endDate={activeTrip.end_date}
          onSelectRange={(start, end) => {
            handleUpdateDates(start, end);
            setShowCalendar(false);
          }}
        />
      )}
    </SafeAreaView>
  );

  function renderTripCard(trip: Trip) {
    const isActiveSelection = activeTripId === trip.id;
    return (
      <TouchableOpacity
        key={trip.id}
        onPress={() => selectTrip(trip.id)}
        style={{
          backgroundColor: t.panelBg,
          borderRadius: 14,
          borderWidth: isActiveSelection ? 2 : 1,
          borderColor: isActiveSelection ? t.primary : t.border,
          padding: 16,
          marginBottom: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          shadowColor: isActiveSelection ? t.primary : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isActiveSelection ? 0.2 : 0,
          shadowRadius: 4,
          elevation: isActiveSelection ? 3 : 0,
        }}
      >
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isActiveSelection && (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.primary }} />
            )}
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>
              {trip.title}
            </Text>
          </View>
          <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>
            📍 {trip.destination}
          </Text>
          {trip.start_date && (
            <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 4 }}>
              {trip.start_date} → {trip.end_date}
            </Text>
          )}
        </View>
        
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View
            style={{
              backgroundColor: trip.is_active ? t.accent : 'rgba(100,100,100,0.15)',
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: t.text, fontSize: 10, fontWeight: '600' }}>
              {trip.is_active ? 'Active' : 'Completed'}
            </Text>
          </View>
          <Text style={{ color: t.textMuted, fontSize: 10, fontFamily: 'monospace' }}>
            Code: {trip.invite_code}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}
