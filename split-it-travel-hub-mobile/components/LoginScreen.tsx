import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { THEME } from '@/constants/theme';
import { useSkyTheme } from '@/components/SkyThemeProvider';

export default function LoginScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const { signIn, signUp, isOfflineMode } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      return alert('Please enter both email and password.');
    }
    if (isRegister && (!displayName.trim() || !username.trim())) {
      return alert('Please enter your display name and username.');
    }

    setLoading(true);
    try {
      if (isRegister) {
        await signUp(email, password, username, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (e) {
      // Errors are handled inside context Alert
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.canvasBg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Branding */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            {/* Hexagon/Diamond Logo */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: t.panelBg,
                borderWidth: 1,
                borderColor: t.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: t.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              }}
            >
              <Ionicons name="airplane" size={36} color={t.primary} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="diamond" size={12} color={t.secondary} />
              <Text
                style={{
                  color: t.text,
                  fontSize: 26,
                  fontWeight: '900',
                  letterSpacing: 0.5,
                  textAlign: 'center',
                }}
              >
                Split-It Travel Hub
              </Text>
            </View>

            <Text
              style={{
                color: t.textMuted,
                fontSize: 13,
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 18,
              }}
            >
              Organize trips, optimize split bills, and sync with your crew.
            </Text>

            {/* Offline Mode Indicator Badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isOfflineMode ? 'rgba(183, 121, 31, 0.1)' : 'rgba(15, 118, 110, 0.1)',
                borderWidth: 1,
                borderColor: isOfflineMode ? 'rgba(183, 121, 31, 0.2)' : 'rgba(15, 118, 110, 0.2)',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
                marginTop: 14,
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isOfflineMode ? t.secondary : t.primary,
                }}
              />
              <Text
                style={{
                  color: isOfflineMode ? t.secondary : t.primary,
                  fontSize: 11,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {isOfflineMode ? 'Local Simulator Mode' : 'Cloud Sync (Supabase)'}
              </Text>
            </View>
          </View>

          {/* Form Panel */}
          <View
            style={{
              backgroundColor: t.panelBg,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: t.border,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
            }}
          >
            {/* Segment Controller (Tabs) */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: t.canvasBg,
                borderRadius: 14,
                padding: 4,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsRegister(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderRadius: 10,
                  backgroundColor: !isRegister ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: !isRegister ? t.text : t.textMuted,
                    fontSize: 14,
                    fontWeight: !isRegister ? '800' : '600',
                  }}
                >
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsRegister(true)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderRadius: 10,
                  backgroundColor: isRegister ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: isRegister ? t.text : t.textMuted,
                    fontSize: 14,
                    fontWeight: isRegister ? '800' : '600',
                  }}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Registration fields */}
            {isRegister && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                  USERNAME
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: t.canvasBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: t.border,
                    paddingHorizontal: 12,
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="at-outline" size={18} color={t.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="alphanumericonly"
                    placeholderTextColor={t.textMuted}
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      color: t.text,
                      fontSize: 15,
                    }}
                  />
                </View>

                <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                  DISPLAY NAME
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: t.canvasBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: t.border,
                    paddingHorizontal: 12,
                  }}
                >
                  <Ionicons name="person-outline" size={18} color={t.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Jane Doe"
                    placeholderTextColor={t.textMuted}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      color: t.text,
                      fontSize: 15,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Email Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                EMAIL ADDRESS
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: t.canvasBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.border,
                  paddingHorizontal: 12,
                }}
              >
                <Ionicons name="mail-outline" size={18} color={t.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={t.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    color: t.text,
                    fontSize: 15,
                  }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                PASSWORD
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: t.canvasBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.border,
                  paddingHorizontal: 12,
                }}
              >
                <Ionicons name="lock-closed-outline" size={18} color={t.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={t.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    color: t.text,
                    fontSize: 15,
                  }}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: t.btnPrimary,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                shadowColor: t.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
              }}
            >
              {loading ? (
                <ActivityIndicator color={t.btnPrimaryText} />
              ) : (
                <Text style={{ color: t.btnPrimaryText, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>
                  {isRegister ? 'CREATE ACCOUNT' : 'LOG IN'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
