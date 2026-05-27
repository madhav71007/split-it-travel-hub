import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';

interface TimelineEvent {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  time: string;
  title: string;
  description: string;
  location: string;
  emoji: string;
}

export default function TimelineScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', time: '', emoji: '📍' });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('itinerary_events')
      .select('*')
      .order('day_number', { ascending: true })
      .order('time', { ascending: true });
    if (data) setEvents(data);
  };

  const addEvent = async () => {
    if (!form.title.trim()) return Alert.alert('Error', 'Please enter a title');
    const { error } = await supabase.from('itinerary_events').insert([{
      title: form.title,
      description: form.description,
      location: form.location,
      time: form.time,
      emoji: form.emoji || '📍',
      date: new Date().toISOString().split('T')[0],
      day_number: 1,
    }]);
    if (!error) { setShowAdd(false); setForm({ title: '', description: '', location: '', time: '', emoji: '📍' }); fetchEvents(); }
  };

  const grouped = events.reduce((acc, e) => {
    const key = `Day ${e.day_number} — ${e.date}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>🗓 Timeline</Text>
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={{ backgroundColor: t.btnPrimary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: t.border }}
          >
            <Text style={{ color: t.btnPrimaryText, fontWeight: '700' }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Timeline Groups */}
        {Object.entries(grouped).length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48 }}>🗓️</Text>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', marginTop: 12 }}>No events yet</Text>
            <Text style={{ color: t.textMuted, marginTop: 4 }}>Add your first itinerary event</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([dayLabel, dayEvents]) => (
            <View key={dayLabel} style={{ marginBottom: 24 }}>
              <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                {dayLabel}
              </Text>
              {dayEvents.map((event, idx) => (
                <View key={event.id} style={{ flexDirection: 'row', marginBottom: 12 }}>
                  {/* Dot + Line */}
                  <View style={{ width: 32, alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.accentDeep, marginTop: 4 }} />
                    {idx < dayEvents.length - 1 && (
                      <View style={{ width: 2, flex: 1, backgroundColor: t.border, marginTop: 4 }} />
                    )}
                  </View>
                  {/* Card */}
                  <View style={{ flex: 1, backgroundColor: t.panelBg, borderRadius: 14, borderWidth: 1, borderColor: t.border, padding: 14, marginLeft: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
                        {event.emoji} {event.title}
                      </Text>
                      {event.time ? <Text style={{ color: t.textMuted, fontSize: 12 }}>{event.time}</Text> : null}
                    </View>
                    {event.location ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 3 }}>📍 {event.location}</Text> : null}
                    {event.description ? <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 6 }}>{event.description}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: t.gradientFrom, padding: 24 }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', marginBottom: 20 }}>Add Event</Text>
          {[
            { key: 'title', placeholder: 'Event title *', label: 'Title' },
            { key: 'time', placeholder: 'e.g. 09:00', label: 'Time' },
            { key: 'location', placeholder: 'Location', label: 'Location' },
            { key: 'emoji', placeholder: '📍', label: 'Emoji' },
            { key: 'description', placeholder: 'Description...', label: 'Description' },
          ].map(({ key, placeholder, label }) => (
            <View key={key} style={{ marginBottom: 14 }}>
              <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>{label}</Text>
              <TextInput
                value={(form as any)[key]}
                onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                placeholder={placeholder}
                placeholderTextColor={t.textMuted}
                style={{ backgroundColor: t.inputBg, borderRadius: 12, borderWidth: 1, borderColor: t.inputBorder, padding: 12, color: t.inputText, fontSize: 15 }}
                multiline={key === 'description'}
              />
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, backgroundColor: t.panelBg, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
              <Text style={{ color: t.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addEvent} style={{ flex: 1, backgroundColor: t.btnPrimary, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
              <Text style={{ color: t.btnPrimaryText, fontWeight: '700' }}>Add Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
