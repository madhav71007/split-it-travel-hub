import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';
import { useTrip } from '@/components/TripContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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
  const { activeTrip, activeTripId, members } = useTrip();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showManagePassengers, setShowManagePassengers] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [form, setForm] = useState({ vehicle_name: '', driver_name: '', capacity: '4', emoji: '🚗' });

  // Check if Supabase is configured
  const isSupabaseConfigured = () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    return (
      url.length > 0 &&
      url.startsWith('https://') &&
      key.length > 0 &&
      key !== 'YOUR_COPIED_PUBLISHABLE_ANON_KEY'
    );
  };

  useEffect(() => {
    if (activeTripId) {
      fetchVehicles();
    }
  }, [activeTripId]);

  const fetchVehicles = async () => {
    if (!activeTripId) return;

    if (!isSupabaseConfigured()) {
      try {
        const stored = await AsyncStorage.getItem(`local_convoy_${activeTripId}`);
        setVehicles(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.warn('Error reading local convoy:', e);
      }
      return;
    }

    const { data } = await supabase
      .from('convoy_vehicles')
      .select('*')
      .eq('trip_id', activeTripId)
      .order('created_at', { ascending: true });
    if (data) setVehicles(data);
  };

  const addVehicle = async () => {
    if (!activeTripId) return;
    if (!form.vehicle_name.trim()) return Alert.alert('Error', 'Please enter a vehicle name');

    const newVehicle = {
      id: `vh_${Date.now()}`,
      trip_id: activeTripId,
      vehicle_name: form.vehicle_name,
      driver_name: form.driver_name,
      capacity: parseInt(form.capacity) || 4,
      passengers: [],
      emoji: form.emoji || '🚗',
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('convoy_vehicles').insert([{
        trip_id: activeTripId,
        vehicle_name: form.vehicle_name,
        driver_name: form.driver_name,
        capacity: parseInt(form.capacity) || 4,
        passengers: [],
        emoji: form.emoji || '🚗',
      }]);
      if (!error) {
        setShowAdd(false);
        setForm({ vehicle_name: '', driver_name: '', capacity: '4', emoji: '🚗' });
        fetchVehicles();
      } else {
        Alert.alert('Save failed', error.message);
      }
    } else {
      const updated = [...vehicles, newVehicle];
      setVehicles(updated);
      await AsyncStorage.setItem(`local_convoy_${activeTripId}`, JSON.stringify(updated));
      setShowAdd(false);
      setForm({ vehicle_name: '', driver_name: '', capacity: '4', emoji: '🚗' });
    }
  };

  const togglePassenger = async (vehicle: Vehicle, passengerName: string) => {
    if (!activeTripId) return;
    
    let updatedPassengers = [...(vehicle.passengers || [])];
    if (updatedPassengers.includes(passengerName)) {
      updatedPassengers = updatedPassengers.filter((p) => p !== passengerName);
    } else {
      if (updatedPassengers.length >= vehicle.capacity) {
        return Alert.alert('Vehicle Full', 'This vehicle has reached its seating capacity.');
      }
      updatedPassengers.push(passengerName);
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('convoy_vehicles')
        .update({ passengers: updatedPassengers })
        .eq('id', vehicle.id);
      if (!error) {
        fetchVehicles();
        // Update selected vehicle in modal
        setSelectedVehicle({ ...vehicle, passengers: updatedPassengers });
      } else {
        Alert.alert('Error updating passengers', error.message);
      }
    } else {
      const updated = vehicles.map((v) =>
        v.id === vehicle.id ? { ...v, passengers: updatedPassengers } : v
      );
      setVehicles(updated);
      await AsyncStorage.setItem(`local_convoy_${activeTripId}`, JSON.stringify(updated));
      // Update selected vehicle in modal
      setSelectedVehicle({ ...vehicle, passengers: updatedPassengers });
    }
  };

  const VEHICLE_EMOJIS = ['🚗', '🚙', '🚌', '🏎️', '🚐', '🛻', '🚕'];

  if (!activeTripId) {
    return (
      <View style={{ flex: 1, backgroundColor: t.canvasBg }}>
        <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="car-outline" size={60} color={t.textMuted} />
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', marginTop: 16 }}>
            No Active Trip
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            Please select or create an active trip on the Dashboard to view and manage convoy vehicles.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>🚗 Convoy</Text>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={{ backgroundColor: t.btnPrimary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.btnPrimaryText, fontWeight: '700' }}>+ Add Vehicle</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: t.primary, fontSize: 14, fontWeight: '700', marginBottom: 20 }}>
          {activeTrip?.title}
        </Text>

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
                        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>👤 Driver: {vehicle.driver_name}</Text>
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

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600' }}>Passengers:</Text>
                    <Text style={{ color: t.text, fontSize: 13, marginTop: 2 }}>
                      {vehicle.passengers?.length > 0 ? vehicle.passengers.join(' · ') : 'No passengers assigned'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedVehicle(vehicle);
                      setShowManagePassengers(true);
                    }}
                    style={{
                      backgroundColor: t.btnOutline,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: t.border,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: t.btnOutlineText, fontSize: 12, fontWeight: '700' }}>Assign</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Vehicle Modal */}
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

      {/* Manage Passengers Modal */}
      <Modal visible={showManagePassengers} animationType="slide" presentationStyle="pageSheet">
        {selectedVehicle && (
          <View style={{ flex: 1, backgroundColor: t.gradientFrom, padding: 24 }}>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>
              👥 Assign Passengers
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 14, marginBottom: 20 }}>
              Vehicle: {selectedVehicle.vehicle_name} ({selectedVehicle.passengers?.length || 0}/{selectedVehicle.capacity} seats filled)
            </Text>

            <ScrollView style={{ flex: 1, marginBottom: 20 }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                Trip Members
              </Text>
              {members.map((member) => {
                const isSelected = selectedVehicle.passengers?.includes(member.name);
                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => togglePassenger(selectedVehicle, member.name)}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: isSelected ? t.accent : t.panelBg,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? t.primary : t.border,
                      padding: 14,
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>
                      {member.name}
                    </Text>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? t.primary : t.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setShowManagePassengers(false);
                setSelectedVehicle(null);
              }}
              style={{
                backgroundColor: t.btnPrimary,
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: t.btnPrimaryText, fontWeight: '800', fontSize: 15 }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
