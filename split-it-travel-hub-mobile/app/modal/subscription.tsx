import React, { useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { useSubscription } from '@/components/SubscriptionContext';
import { PRO_FEATURES, PRO_LIMITS, PRO_PLAN } from '@/constants/subscription';
import { THEME } from '@/constants/theme';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const subscription = useSubscription();
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('yearly');

  const selectedPrice =
    selectedCycle === 'yearly' ? PRO_PLAN.yearlyPrice : PRO_PLAN.monthlyPrice;

  const handleStart = async () => {
    await subscription.activateProPreview(selectedCycle);
    Alert.alert(
      'Pro Traveller enabled',
      'The subscription experience is enabled in preview mode. Store billing products still need to be connected before App Store or Play Store release.'
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.canvasBg }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 22 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close subscription"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: t.panelBg,
              borderWidth: 1,
              borderColor: t.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={22} color={t.text} />
          </TouchableOpacity>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>
              SUBSCRIPTION
            </Text>
            <Text style={{ color: t.text, fontSize: 24, fontWeight: '900', marginTop: 2 }}>
              Pro Traveller
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: t.panelBg,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: t.border,
            padding: 20,
            marginBottom: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                backgroundColor: t.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="diamond" size={21} color={t.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 20, fontWeight: '900' }}>
                Serious trips need serious control.
              </Text>
              <Text style={{ color: t.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
                {PRO_PLAN.audience}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            {(['yearly', 'monthly'] as const).map((cycle) => {
              const selected = selectedCycle === cycle;
              return (
                <TouchableOpacity
                  key={cycle}
                  onPress={() => setSelectedCycle(cycle)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${cycle} subscription`}
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    padding: 14,
                    backgroundColor: selected ? t.btnPrimary : t.panelBgAlt,
                    borderWidth: 1,
                    borderColor: selected ? t.primary : t.border,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? t.btnPrimaryText : t.text,
                      fontSize: 13,
                      fontWeight: '900',
                    }}
                  >
                    {cycle === 'yearly' ? 'Yearly' : 'Monthly'}
                  </Text>
                  <Text
                    style={{
                      color: selected ? t.btnPrimaryText : t.textMuted,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {cycle === 'yearly' ? PRO_PLAN.yearlyPrice : PRO_PLAN.monthlyPrice}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Start Pro Traveller preview"
            style={{
              backgroundColor: t.btnPrimary,
              borderRadius: 8,
              paddingVertical: 15,
              alignItems: 'center',
              marginTop: 16,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="sparkles" size={18} color={t.btnPrimaryText} />
            <Text style={{ color: t.btnPrimaryText, fontSize: 15, fontWeight: '900' }}>
              Start {PRO_PLAN.trialDays}-day Pro preview
            </Text>
          </TouchableOpacity>

          <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 18, marginTop: 12 }}>
            Preview mode uses local app state only. Store billing through Apple and Google must be
            connected before charging real users.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: t.panelBg,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: t.border,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '900' }}>Current status</Text>
            <Text style={{ color: subscription.isPro ? t.primary : t.textMuted, fontWeight: '900' }}>
              {subscription.isPro ? 'PRO' : 'FREE'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Metric
              label="Plan"
              value={subscription.isPro ? selectedPrice : 'Free'}
              textColor={t.text}
              mutedColor={t.textMuted}
            />
            <Metric
              label="Trial"
              value={subscription.daysLeftInTrial > 0 ? `${subscription.daysLeftInTrial} days` : 'Inactive'}
              textColor={t.text}
              mutedColor={t.textMuted}
            />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {PRO_FEATURES.map((feature) => (
            <View
              key={feature.key}
              style={{
                backgroundColor: t.panelBg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t.border,
                padding: 15,
                flexDirection: 'row',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: t.panelBgAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name={feature.icon} size={18} color={t.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 15, fontWeight: '900' }}>
                  {feature.title}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 }}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: t.panelBgAlt,
            borderRadius: 8,
            padding: 14,
            marginTop: 14,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <Text style={{ color: t.text, fontSize: 14, fontWeight: '900', marginBottom: 6 }}>
            Free plan limits
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 12, lineHeight: 18 }}>
            Free travellers can manage {PRO_LIMITS.freeTrips} active trip with up to{' '}
            {PRO_LIMITS.freeMembers} members and no exports. Pro removes these limits for serious
            travel groups.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
  textColor,
  mutedColor,
}: {
  label: string;
  value: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 8,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        minHeight: Platform.OS === 'ios' ? 68 : 64,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: mutedColor, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: textColor, fontSize: 15, fontWeight: '900', marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}
