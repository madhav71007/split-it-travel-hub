import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRO_PLAN, type ProFeatureKey } from '@/constants/subscription';
import { useAuth } from './AuthContext';

type SubscriptionTier = 'free' | 'pro';
type BillingCycle = 'monthly' | 'yearly';
type SubscriptionStatus = 'free' | 'trial' | 'active';

type SubscriptionSnapshot = {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startedAt: string | null;
  trialEndsAt: string | null;
  unlockedFeatures: ProFeatureKey[];
};

type SubscriptionContextType = SubscriptionSnapshot & {
  isPro: boolean;
  daysLeftInTrial: number;
  activateProPreview: (cycle: BillingCycle) => Promise<void>;
  resetToFree: () => Promise<void>;
};

const STORAGE_KEY = 'split_it_subscription';

const ALL_FEATURES: ProFeatureKey[] = [
  'live_convoy',
  'smart_settlements',
  'offline_vault',
  'export_reports',
  'group_decisions',
  'memory_archive',
];

const defaultSnapshot: SubscriptionSnapshot = {
  tier: 'free',
  status: 'free',
  billingCycle: 'monthly',
  startedAt: null,
  trialEndsAt: null,
  unlockedFeatures: ['smart_settlements', 'group_decisions'],
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getDaysLeft(trialEndsAt: string | null) {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot>(defaultSnapshot);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted || !stored) return;
        const parsed = JSON.parse(stored) as SubscriptionSnapshot;
        setSnapshot({ ...defaultSnapshot, ...parsed });
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: SubscriptionSnapshot) => {
    setSnapshot(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const activateProPreview = useCallback(
    async (cycle: BillingCycle) => {
      const now = new Date();
      await persist({
        tier: 'pro',
        status: 'trial',
        billingCycle: cycle,
        startedAt: now.toISOString(),
        trialEndsAt: addDays(now, PRO_PLAN.trialDays).toISOString(),
        unlockedFeatures: ALL_FEATURES,
      });
    },
    [persist]
  );

  const resetToFree = useCallback(async () => {
    await persist(defaultSnapshot);
  }, [persist]);

  const value = useMemo<SubscriptionContextType>(() => {
    const daysLeftInTrial = getDaysLeft(snapshot.trialEndsAt);
    const isPro = Boolean(
      (snapshot.tier === 'pro' && (snapshot.status === 'active' || daysLeftInTrial > 0)) ||
      user?.isPremium
    );

    return {
      ...snapshot,
      tier: user?.isPremium ? 'pro' : snapshot.tier,
      status: user?.isPremium ? 'active' : snapshot.status,
      unlockedFeatures: user?.isPremium ? ALL_FEATURES : snapshot.unlockedFeatures,
      isPro,
      daysLeftInTrial,
      activateProPreview,
      resetToFree,
    };
  }, [activateProPreview, resetToFree, snapshot, user?.isPremium]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
