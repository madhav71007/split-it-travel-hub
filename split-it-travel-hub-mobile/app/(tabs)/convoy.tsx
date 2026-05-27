import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';

interface Vehicle {
  id: string;
  trip_id: string;
  vehicle_name: string;
  driver_name: string;
  capacity: number;
  passengers: string[];
  emoji: string;
}

export default function ConvoyScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ vehicle_name: '', driver_name: '', capacity: '4', emoji: '🚗' });

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    const { data } = await supabase.from('convoy_vehicles').select('*').order('created_at', { ascending: true });
    if (data) setVehicles(data);
  };

  const addVehicle = async () => {
    if (!form.vehicle_name.trim()) return Alert.alert('Error', 'Please enter a vehicle name');
    const { error } = await supabase.from('convoy_vehicles').insert([{
      vehicle_name: form.vehicle_name,
      driver_name: form.driver_name,
      capacity: parseInt(form.capacity) || 4,
      passengers: [],
      emoji: form.emoji || '🚗',
    }]);
    if (!error) { setShowAdd(false); setForm({ vehicle_name: '', driver_name: '', capacity: '4', emoji: '🚗' }); fetchVehicles(); }
  };

  const VEHICLE_EMOJIS = ['🚗', '🚙', '🚌', '🏎️', '🚐', '🛻', '🚕'];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>🚗 Convoy</Text>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={{ backgroundColor: t.btnPrimary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.btnPrimaryText, fontWeight: '700' }}>+ Add Vehicle</Text>
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48 }}>🚗</Text>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', marginTop: 12 }}>No vehicles yet</Text>
            <Text style={{ color: t.textMuted, marginTop: 4 }}>Add vehicles to organize your convoy</Text>
          </View>
        ) : (
          vehicles.map((vehicle) => {
            const filled = vehicle.passengers?.length ?? 0;
            const pct = Math.min(filled / vehicle.capacity, 1);
            return (
              <View key={vehicle.id} style={{ backgroundColor: t.panelBg, borderRadius: 18, borderWidth: 1, borderColor: t.border, padding: 18, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 32 }}>{vehicle.emoji}</Text>
                    <View>
                      <Text style={{ color: t.text, fontWeight: '800', fontSize: 17 }}>{vehicle.vehicle_name}</Text>
                      {vehicle.driver_name ? (
                        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>👤 {vehicle.driver_name}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 22 }}>{filled}/{vehicle.capacity}</Text>
                    <Text style={{ color: t.textMuted, fontSize: 11 }}>seats</Text>
                  </View>
                </View>
                {/* Seat fill bar */}
                <View style={{ marginTop: 14, height: 8, backgroundColor: t.panelBgAlt, borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: t.accentDeep, borderRadius: 4 }} />
                </View>
                {vehicle.passengers?.length > 0 && (
                  <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 8 }}>
                    {vehicle.passengers.join(' · ')}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: t.gradientFrom, padding: 24 }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', marginBottom: 20 }}>Add Vehicle</Text>

          {/* Emoji picker */}
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Vehicle Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {VEHICLE_EMOJIS.map((e) => (
              <TouchableOpacity key={e} onPress={() => setForm((f) => ({ ...f, emoji: e }))}
                style={{ backgroundColor: form.emoji === e ? t.accentDeep : t.panelBg, borderRadius: 14, padding: 10, marginRight: 8, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {[
            { key: 'vehicle_name', placeholder: 'e.g. Blue SUV *', label: 'Vehicle Name' },
            { key: 'driver_name', placeholder: "Driver's name", label: 'Driver' },
            { key: 'capacity', placeholder: '4', label: 'Capacity (seats)', keyboard: 'number-pad' },
          ].map(({ key, placeholder, label, keyboard }) => (
            <View key={key} style={{ marginBottom: 14 }}>
              <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>{label}</Text>
              <TextInput value={(form as any)[key]} onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))} placeholder={placeholder} placeholderTextColor={t.textMuted} keyboardType={(keyboard as any) ?? 'default'} style={{ backgroundColor: t.inputBg, borderRadius: 12, borderWidth: 1, borderColor: t.inputBorder, padding: 12, color: t.inputText, fontSize: 15 }} />
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, backgroundColor: t.panelBg, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
              <Text style={{ color: t.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addVehicle} style={{ flex: 1, backgroundColor: t.btnPrimary, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
              <Text style={{ color: t.btnPrimaryText, fontWeight: '700' }}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
