import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Modal,
  FlatList, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';

const { width: SCREEN_W } = Dimensions.get('window');
const ITEM_W = (SCREEN_W - 48 - 8) / 3;

interface Memory {
  id: string;
  image_url: string;
  caption: string;
  uploaded_by: string;
  created_at: string;
}

export default function MemoriesScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Memory | null>(null);

  useEffect(() => { fetchMemories(); }, []);

  const fetchMemories = async () => {
    const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false });
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
    setLoading(true);
    try {
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
        image_url: urlData.publicUrl,
        caption: '',
        uploaded_by: 'You',
      }]);
      if (!error) fetchMemories();
    } catch (e) {
      Alert.alert('Upload failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', marginBottom: 16 }}>📸 Memories</Text>

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
