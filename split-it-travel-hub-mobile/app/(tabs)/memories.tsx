import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Modal,
  Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';
import { useTrip } from '@/components/TripContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/components/SubscriptionContext';
import { useRouter, type Href } from 'expo-router';

const { width: SCREEN_W } = Dimensions.get('window');
const ITEM_W = (SCREEN_W - 48 - 8) / 3;

interface Memory {
  id: string;
  trip_id: string;
  image_url: string;
  caption: string;
  uploaded_by: string;
  created_at: string;
}

export default function MemoriesScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const { activeTrip, activeTripId } = useTrip();
  const subscription = useSubscription();
  const router = useRouter();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Memory | null>(null);

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
      fetchMemories();
    }
  }, [activeTripId]);

  const fetchMemories = async () => {
    if (!activeTripId) return;

    if (!isSupabaseConfigured()) {
      try {
        const stored = await AsyncStorage.getItem(`local_memories_${activeTripId}`);
        setMemories(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.warn('Error reading local memories:', e);
      }
      return;
    }

    const { data } = await supabase
      .from('memories')
      .select('*')
      .eq('trip_id', activeTripId)
      .order('created_at', { ascending: false });
    if (data) setMemories(data);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'We need photo access to upload trip memories.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    uploadMemory(asset);
  };

  const uploadMemory = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!activeTripId) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const ext = asset.uri.split('.').pop() ?? 'jpg';
        const fileName = `${Date.now()}.${ext}`;
        const formData = new FormData();
        formData.append('file', { uri: asset.uri, name: fileName, type: `image/${ext}` } as any);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('trip-memories')
          .upload(fileName, formData, { contentType: `image/${ext}` });
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('trip-memories').getPublicUrl(fileName);
        const { error } = await supabase.from('memories').insert([{
          trip_id: activeTripId,
          image_url: urlData.publicUrl,
          caption: '',
          uploaded_by: 'You',
        }]);
        if (!error) {
          fetchMemories();
        } else {
          throw error;
        }
      } else {
        // Local upload - store local file uri directly!
        const newMemory: Memory = {
          id: `mem_${Date.now()}`,
          trip_id: activeTripId,
          image_url: asset.uri,
          caption: '',
          uploaded_by: 'You',
          created_at: new Date().toISOString(),
        };
        const updated = [newMemory, ...memories];
        setMemories(updated);
        await AsyncStorage.setItem(`local_memories_${activeTripId}`, JSON.stringify(updated));
      }
    } catch (e) {
      Alert.alert('Upload failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!activeTripId) {
    return (
      <View style={{ flex: 1, backgroundColor: t.canvasBg }}>
        <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="images-outline" size={60} color={t.textMuted} />
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', marginTop: 16 }}>
            No Active Trip
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            Please select or create an active trip on the Dashboard to view and share memories.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!subscription.isPro) {
    return (
      <View style={{ flex: 1, backgroundColor: t.canvasBg }}>
        <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {/* Hexagon/Diamond Icon Container */}
          <View
            style={{
              width: 86,
              height: 86,
              borderRadius: 24,
              backgroundColor: t.panelBg,
              borderWidth: 1,
              borderColor: t.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="images" size={40} color={t.primary} />
          </View>

          {/* Heading with Diamond */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="diamond" size={14} color={t.secondary} />
            <Text style={{ color: t.text, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
              Trip Memory Archive
            </Text>
          </View>

          {/* Value Prop */}
          <Text style={{ color: t.textMuted, fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20, paddingHorizontal: 16 }}>
            Preserve and share group photos, travel files, and receipt scans, securely backed up in the cloud forever.
          </Text>

          {/* Card Mockup Preview (slightly faded/bordered) */}
          <View
            style={{
              width: '100%',
              backgroundColor: t.panelBg,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: t.border,
              padding: 16,
              marginVertical: 24,
              opacity: 0.3,
            }}
          >
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>
              📸 Recent Shared Media
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    width: ITEM_W,
                    height: ITEM_W,
                    borderRadius: 12,
                    backgroundColor: t.panelBgAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <Ionicons name="image-outline" size={24} color={t.textMuted} />
                </View>
              ))}
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={() => router.push('/modal/subscription' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Unlock Memory Archive"
            style={{
              backgroundColor: t.btnPrimary,
              borderRadius: 10,
              paddingVertical: 14,
              paddingHorizontal: 28,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: t.btnPrimaryText, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }}>
              Unlock Memory Archive
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', marginBottom: 2 }}>📸 Memories</Text>
        <Text style={{ color: t.primary, fontSize: 14, fontWeight: '700', marginBottom: 20 }}>
          {activeTrip?.title}
        </Text>

        {/* Upload Zone */}
        <TouchableOpacity
          onPress={pickImage}
          disabled={loading}
          style={{
            backgroundColor: t.panelBg,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: t.border,
            borderStyle: 'dashed',
            padding: 28,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          {loading ? (
            <ActivityIndicator color={t.text} />
          ) : (
            <>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>📷</Text>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>Tap to Upload Travel Media</Text>
              <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>
                JPEG · PNG · Up to 10MB
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Photo Grid */}
        {memories.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: t.textMuted, textAlign: 'center' }}>
              Your trip photos will appear here
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {memories.map((memory) => (
              <TouchableOpacity key={memory.id} onPress={() => setSelected(memory)}>
                <Image
                  source={{ uri: memory.image_url }}
                  style={{
                    width: ITEM_W,
                    height: ITEM_W,
                    borderRadius: 12,
                    backgroundColor: t.panelBgAlt,
                  }}
                  resizeMode="cover"
                />
                {memory.caption ? (
                  <Text numberOfLines={1} style={{ color: t.textMuted, fontSize: 11, marginTop: 3, width: ITEM_W }}>
                    {memory.caption}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Lightbox Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelected(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}
        >
          {selected && (
            <View style={{ width: '100%', alignItems: 'center', padding: 20 }}>
              <Image
                source={{ uri: selected.image_url }}
                style={{ width: SCREEN_W - 40, height: SCREEN_W - 40, borderRadius: 16 }}
                resizeMode="contain"
              />
              <View style={{ marginTop: 16, alignItems: 'center' }}>
                {selected.caption ? (
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                    {selected.caption}
                  </Text>
                ) : null}
                <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12, marginTop: 4 }}>
                  Uploaded by {selected.uploaded_by}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
                  {new Date(selected.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.40)', marginTop: 24, fontSize: 13 }}>
                Tap anywhere to close
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
