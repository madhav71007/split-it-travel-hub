import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { useTrip } from '@/components/TripContext';
import { useSubscription } from '@/components/SubscriptionContext';
import { PRO_LIMITS } from '@/constants/subscription';
import { Ionicons } from '@expo/vector-icons';
import CalendarPickerModal from '@/components/CalendarPickerModal';

export default function NewTripModal() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const router = useRouter();
  const { createTrip, trips } = useTrip();
  const subscription = useSubscription();

  const [form, setForm] = useState({
    title: '',
    destination: '',
    start_date: '',
    end_date: '',
  });
  const [membersList, setMembersList] = useState<string[]>(['You']);
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleAddMemberToList = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    if (membersList.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      return Alert.alert('Duplicate Member', 'A member with this name already exists.');
    }
    
    // Enforce free member limit
    if (!subscription.isPro && membersList.length >= PRO_LIMITS.freeMembers) {
      return Alert.alert(
        'Upgrade to Pro',
        `The Free plan is limited to ${PRO_LIMITS.freeMembers} members per trip. Upgrade to Pro Traveller for unlimited group members.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/modal/subscription' as Href) }
        ]
      );
    }

    setMembersList([...membersList, trimmed]);
    setNewMemberName('');
  };

  const handleRemoveMemberFromList = (index: number) => {
    setMembersList(membersList.filter((_, idx) => idx !== index));
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.destination.trim()) {
      return Alert.alert('Missing fields', 'Title and Destination are required.');
    }
    if (membersList.length === 0) {
      return Alert.alert('Missing members', 'Please add at least one member.');
    }

    // Enforce active trip limit
    if (!subscription.isPro && trips.length >= PRO_LIMITS.freeTrips) {
      return Alert.alert(
        'Upgrade to Pro',
        `The Free plan is limited to ${PRO_LIMITS.freeTrips} active trip. Upgrade to Pro Traveller for unlimited trips.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/modal/subscription' as Href) }
        ]
      );
    }

    setLoading(true);
    const trip = await createTrip(
      form.title.trim(),
      form.destination.trim(),
      form.start_date || '',
      form.end_date || '',
      membersList
    );
    setLoading(false);
    if (trip) {
      Alert.alert('🎉 Trip Created!', `Invite code: ${trip.invite_code}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.gradientFrom }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Handle bar */}
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginBottom: 24 }} />

        <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', marginBottom: 6 }}>
          ✈️ New Trip
        </Text>
        <Text style={{ color: t.textMuted, fontSize: 14, marginBottom: 28 }}>
          A unique invite code will be auto-generated so friends can join.
        </Text>

        {!subscription.isPro && trips.length >= PRO_LIMITS.freeTrips && (
          <View style={{ backgroundColor: 'rgba(244, 184, 96, 0.1)', borderWidth: 1, borderColor: t.secondary, borderRadius: 8, padding: 12, marginBottom: 18 }}>
            <Text style={{ color: t.secondary, fontSize: 12, fontWeight: '900' }}>
              ⚠️ ACTIVE TRIP LIMIT REACHED
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 4, lineHeight: 16 }}>
              You are currently using the Free Plan which allows up to {PRO_LIMITS.freeTrips} active trip. Upgrade to Pro to create unlimited trips.
            </Text>
          </View>
        )}

        {/* Trip Title */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: t.label, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Trip Title *
          </Text>
          <TextInput
            value={form.title}
            onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            placeholder="e.g. Summer in Bali"
            placeholderTextColor={t.textMuted}
            style={{
              backgroundColor: t.inputBg,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: t.inputBorder,
              padding: 14,
              color: t.inputText,
              fontSize: 16,
            }}
          />
        </View>

        {/* Destination */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: t.label, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Destination *
          </Text>
          <TextInput
            value={form.destination}
            onChangeText={(v) => setForm((f) => ({ ...f, destination: v }))}
            placeholder="e.g. Bali, Indonesia"
            placeholderTextColor={t.textMuted}
            style={{
              backgroundColor: t.inputBg,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: t.inputBorder,
              padding: 14,
              color: t.inputText,
              fontSize: 16,
            }}
          />
        </View>

        {/* Start Date & End Date Row */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: t.label, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Travel Dates
          </Text>
          <TouchableOpacity
            onPress={() => setShowCalendar(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: t.inputBg,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: t.inputBorder,
              padding: 14,
              gap: 12,
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={t.textMuted} />
            <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '600' }}>START</Text>
                <Text style={{ color: form.start_date ? t.inputText : t.textMuted, fontSize: 15, fontWeight: '700', marginTop: 2 }}>
                  {form.start_date || 'YYYY-MM-DD'}
                </Text>
              </View>
              <View style={{ width: 1, height: 24, backgroundColor: t.border, marginHorizontal: 8 }} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '600' }}>END</Text>
                <Text style={{ color: form.end_date ? t.inputText : t.textMuted, fontSize: 15, fontWeight: '700', marginTop: 2 }}>
                  {form.end_date || 'YYYY-MM-DD'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Dynamic Members Section */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: t.label, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Group Members *
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TextInput
              value={newMemberName}
              onChangeText={setNewMemberName}
              placeholder="Add member name..."
              placeholderTextColor={t.textMuted}
              style={{
                flex: 1,
                backgroundColor: t.inputBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: t.inputBorder,
                padding: 14,
                color: t.inputText,
                fontSize: 16,
              }}
              onSubmitEditing={handleAddMemberToList}
            />
            <TouchableOpacity
              onPress={handleAddMemberToList}
              style={{
                backgroundColor: t.btnPrimary,
                borderRadius: 14,
                paddingHorizontal: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: t.btnPrimaryText, fontWeight: '800', fontSize: 20 }}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Members list pills */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {membersList.map((m, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: t.panelBg,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: t.border,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  gap: 6,
                }}
              >
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{m}</Text>
                <TouchableOpacity onPress={() => handleRemoveMemberFromList(idx)}>
                  <Text style={{ color: t.secondary, fontWeight: '700', fontSize: 14, marginLeft: 2 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Invite code preview */}
        <View style={{ backgroundColor: t.panelBg, borderRadius: 14, borderWidth: 1, borderColor: t.border, padding: 16, marginBottom: 28 }}>
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600' }}>Auto-generated Invite Code</Text>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 6, marginTop: 4 }}>
            ••••••••
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>
            Revealed when the trip is created
          </Text>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flex: 1, backgroundColor: t.panelBg, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: t.border }}
          >
            <Text style={{ color: t.textMuted, fontWeight: '700', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading}
            style={{ flex: 2, backgroundColor: t.btnPrimary, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: t.border, opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ color: t.btnPrimaryText, fontWeight: '800', fontSize: 16 }}>
              {loading ? 'Creating...' : 'Create Trip 🚀'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <CalendarPickerModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        startDate={form.start_date}
        endDate={form.end_date}
        onSelectRange={(start, end) => setForm((f) => ({ ...f, start_date: start, end_date: end }))}
      />
    </View>
  );
}
