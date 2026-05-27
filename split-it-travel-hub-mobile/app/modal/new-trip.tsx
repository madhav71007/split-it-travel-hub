import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';

function generateInviteCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function NewTripModal() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    destination: '',
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.destination.trim()) {
      return Alert.alert('Missing fields', 'Title and Destination are required.');
    }
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const invite_code = generateInviteCode();
    const { error } = await supabase.from('trips').insert([{
      title: form.title.trim(),
      destination: form.destination.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      invite_code,
      owner_id: userData.user?.id,
      is_active: true,
    }]);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('🎉 Trip Created!', `Invite code: ${invite_code}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const fields = [
    { key: 'title', label: 'Trip Title *', placeholder: 'e.g. Summer in Bali' },
    { key: 'destination', label: 'Destination *', placeholder: 'e.g. Bali, Indonesia' },
    { key: 'start_date', label: 'Start Date', placeholder: 'YYYY-MM-DD' },
    { key: 'end_date', label: 'End Date', placeholder: 'YYYY-MM-DD' },
  ];

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

        {fields.map(({ key, label, placeholder }) => (
          <View key={key} style={{ marginBottom: 18 }}>
            <Text style={{ color: t.label, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
              {label}
            </Text>
            <TextInput
              value={(form as any)[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              placeholder={placeholder}
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
        ))}

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
    </View>
  );
}
