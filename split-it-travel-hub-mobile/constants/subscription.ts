import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type ProFeatureKey =
  | 'live_convoy'
  | 'smart_settlements'
  | 'offline_vault'
  | 'export_reports'
  | 'group_decisions'
  | 'memory_archive';

export type ProFeature = {
  key: ProFeatureKey;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const PRO_PLAN = {
  name: 'Pro Traveller',
  monthlyPrice: 'USD 5.99/mo',
  yearlyPrice: 'USD 49.99/yr',
  trialDays: 14,
  audience: 'Built for serious group travellers, trip leads, and frequent planners.',
};

export const PRO_FEATURES: ProFeature[] = [
  {
    key: 'live_convoy',
    title: 'Live convoy command',
    description: 'Coordinate cars, drivers, passenger capacity, and arrival readiness.',
    icon: 'navigate',
  },
  {
    key: 'smart_settlements',
    title: 'Smart settlements',
    description: 'Reduce group debts into the fewest fair payments after every trip.',
    icon: 'wallet',
  },
  {
    key: 'offline_vault',
    title: 'Offline trip vault',
    description: 'Keep critical plans, codes, members, and expenses accessible on bad networks.',
    icon: 'lock-closed',
  },
  {
    key: 'export_reports',
    title: 'Exportable reports',
    description: 'Create polished trip summaries for payments, memories, and audit trails.',
    icon: 'document-text',
  },
  {
    key: 'group_decisions',
    title: 'Priority decisions',
    description: 'Run polls for routes, stays, activities, and deadlines with clear outcomes.',
    icon: 'checkbox',
  },
  {
    key: 'memory_archive',
    title: 'Trip memory archive',
    description: 'Preserve the final itinerary, photos, expenses, and settlement history.',
    icon: 'images',
  },
];

export const PRO_LIMITS = {
  freeTrips: 1,
  freeMembers: 5,
  freeExports: 0,
};
