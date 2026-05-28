import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';
import { simplifyDebts, type Expense as SimplifierExpense, type ExpenseSplit } from '@/utils/debtSimplifier';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Expense {
  id: string;
  trip_id: string;
  paid_by_id: string;
  description: string;
  amount: number;
  category: string;
  currency: string;
  created_at: string;
  payer_name?: string;
}

const mockUsers = [
  { id: 'u1', name: 'Alice', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
  { id: 'u2', name: 'Bob', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
  { id: 'u3', name: 'Charlie', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face' },
  { id: 'u4', name: 'David', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' },
  { id: 'u5', name: 'Emma', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
];

const mockExpenses = [
  { id: 'e1', trip_id: 't1', description: 'Fuel & Tolls', amount: 4500, paid_by_id: 'u2', category: '✈️ Transport', currency: 'INR', created_at: '2026-05-28T10:00:00Z', payer_name: 'Hasit' },
  { id: 'e2', trip_id: 't1', description: "Sunny's Dhaba", amount: 3200, paid_by_id: 'u4', category: '🍔 Food', currency: 'INR', created_at: '2026-05-27T18:00:00Z', payer_name: 'Kush' },
  { id: 'e3', trip_id: 't1', description: 'Villa Booking Deposit', amount: 6800, paid_by_id: 'u1', category: '🏨 Hotel', currency: 'INR', created_at: '2026-05-26T12:00:00Z', payer_name: 'Alice' },
];

const CATEGORIES = ['🍔 Food', '🏨 Hotel', '✈️ Transport', '🎭 Activity', '🛒 Shopping', '💊 Health', '📦 Other'];

export default function ExpensesScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<'TIMELINE' | 'EXPENSES' | 'CONVOY'>('EXPENSES');

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState(mockUsers[0].id);
  const [category, setCategory] = useState('📦 Other');
  const [currency, setCurrency] = useState('INR');

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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      setExpenses(mockExpenses);
      // Generate split records for mock expenses
      const generatedSplits: ExpenseSplit[] = [];
      mockExpenses.forEach((exp) => {
        const splitAmt = Math.round((exp.amount / mockUsers.length) * 100) / 100;
        mockUsers.forEach((user, idx) => {
          generatedSplits.push({
            id: `s_${exp.id}_${idx}`,
            expenseId: exp.id,
            userId: user.id,
            amount: splitAmt,
          });
        });
      });
      setSplits(generatedSplits);
      setLoading(false);
      return;
    }

    try {
      const { data: exps, error: expsErr } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (expsErr) throw expsErr;

      let spts: any[] = [];
      if (exps && exps.length > 0) {
        const expIds = exps.map((e) => e.id);
        const { data: splitsData, error: splitsErr } = await supabase
          .from('expense_splits')
          .select('*')
          .in('expense_id', expIds);
        if (splitsErr) throw splitsErr;
        spts = splitsData || [];
      }

      const formattedExpenses: Expense[] = (exps || []).map((item) => ({
        id: item.id,
        trip_id: item.trip_id,
        description: item.description,
        amount: Number(item.amount),
        paid_by_id: item.paid_by_id || item.paid_by || 'u1',
        category: item.category || '📦 Other',
        currency: item.currency || 'INR',
        created_at: item.created_at,
        payer_name: item.payer_name || getUserName(item.paid_by_id || item.paid_by || 'u1'),
      }));

      const formattedSplits: ExpenseSplit[] = spts.map((item) => ({
        id: item.id,
        expenseId: item.expense_id,
        userId: item.user_id,
        amount: Number(item.amount),
      }));

      setExpenses(formattedExpenses.length > 0 ? formattedExpenses : mockExpenses);
      setSplits(formattedSplits);
    } catch (e) {
      console.warn('Error loading Supabase expenses:', e);
      setExpenses(mockExpenses);
    } finally {
      setLoading(false);
    }
  };

  // 1. Calculate net balances
  const balances = useMemo(() => {
    const bal: Record<string, number> = {};
    mockUsers.forEach((u) => {
      bal[u.id] = 0;
    });

    expenses.forEach((exp) => {
      const payer = exp.paid_by_id;
      bal[payer] = (bal[payer] || 0) + Number(exp.amount);
    });

    splits.forEach((split) => {
      const debtor = split.userId;
      bal[debtor] = (bal[debtor] || 0) - Number(split.amount);
    });

    return bal;
  }, [expenses, splits]);

  // 2. Compute simplified transactions
  const simplifiedTransactions = useMemo(() => {
    const simplifierExps: SimplifierExpense[] = expenses.map((e) => ({
      id: e.id,
      tripId: e.trip_id,
      description: e.description,
      amount: e.amount,
      paidById: e.paid_by_id,
      createdAt: e.created_at,
    }));
    return simplifyDebts(simplifierExps, splits);
  }, [expenses, splits]);

  // Calculate total spent
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const handleAddExpense = async () => {
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) {
      return Alert.alert('Invalid fields', 'Please enter a valid description and amount.');
    }

    const splitAmt = Math.round((amt / mockUsers.length) * 100) / 100;
    const expenseId = `e_${Date.now()}`;

    const newExpense: Expense = {
      id: expenseId,
      trip_id: 't1',
      description: description.trim(),
      amount: amt,
      paid_by_id: paidById,
      category,
      currency,
      created_at: new Date().toISOString(),
      payer_name: getUserName(paidById),
    };

    const newSplits: ExpenseSplit[] = mockUsers.map((user, idx) => ({
      id: `s_${expenseId}_${idx}`,
      expenseId,
      userId: user.id,
      amount: splitAmt,
    }));

    if (isSupabaseConfigured()) {
      try {
        const { error: expError } = await supabase.from('expenses').insert([{
          id: expenseId,
          description: newExpense.description,
          amount: newExpense.amount,
          paid_by_id: newExpense.paid_by_id,
          category: newExpense.category,
          currency: newExpense.currency,
          trip_id: 't1',
        }]);
        if (expError) throw expError;

        const formattedSplits = newSplits.map((s) => ({
          expense_id: s.expenseId,
          user_id: s.userId,
          amount: s.amount,
        }));
        const { error: splitError } = await supabase.from('expense_splits').insert(formattedSplits);
        if (splitError) throw splitError;

        fetchData();
      } catch (e: any) {
        Alert.alert('Save failed', e.message);
      }
    } else {
      setExpenses((prev) => [newExpense, ...prev]);
      setSplits((prev) => [...prev, ...newSplits]);
    }

    setDescription('');
    setAmount('');
    setPaidById(mockUsers[0].id);
    setCategory('📦 Other');
    setShowAdd(false);
  };

  const handleSettlePress = (fromId: string, toId: string, settleAmount: number) => {
    const fromName = getUserName(fromId);
    const toName = getUserName(toId);

    Alert.alert(
      'Settle Debt',
      `Record payment of ₹${settleAmount.toLocaleString('en-IN')} from ${fromName} to ${toName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Settled',
          style: 'default',
          onPress: async () => {
            const expenseId = `e_settle_${Date.now()}`;
            const newExpense: Expense = {
              id: expenseId,
              trip_id: 't1',
              description: `Settle: ${fromName} paid ${toName}`,
              amount: settleAmount,
              paid_by_id: fromId,
              category: '📦 Other',
              currency,
              created_at: new Date().toISOString(),
              payer_name: fromName,
            };

            const newSplits: ExpenseSplit[] = [
              {
                id: `s_${expenseId}_0`,
                expenseId,
                userId: toId,
                amount: settleAmount,
              },
            ];

            if (isSupabaseConfigured()) {
              try {
                const { error: expError } = await supabase.from('expenses').insert([{
                  id: expenseId,
                  description: newExpense.description,
                  amount: newExpense.amount,
                  paid_by_id: newExpense.paid_by_id,
                  category: newExpense.category,
                  currency: newExpense.currency,
                  trip_id: 't1',
                }]);
                if (expError) throw expError;

                const { error: splitError } = await supabase.from('expense_splits').insert([{
                  expense_id: expenseId,
                  user_id: toId,
                  amount: settleAmount,
                }]);
                if (splitError) throw splitError;

                fetchData();
              } catch (e: any) {
                Alert.alert('Settlement failed', e.message);
              }
            } else {
              setExpenses((prev) => [newExpense, ...prev]);
              setSplits((prev) => [...prev, ...newSplits]);
            }
          },
        },
      ]
    );
  };

  const getUserName = (id: string) => {
    return mockUsers.find((u) => u.id === id)?.name || 'Unknown';
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.canvasBg }}>
      {/* Notch-Aware SafeAreaView Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: t.canvasBg }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' }}>
            Split-It
          </Text>

          {/* Lonavala Dropdown Selector Pill */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 8,
              gap: 6,
            }}
          >
            <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>Lonavala Getaway</Text>
            <Ionicons name="chevron-down" size={14} color={t.text} />
          </TouchableOpacity>

          {/* Share Icon */}
          <TouchableOpacity
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="share-outline" size={18} color={t.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Pool Spent Card - Sleek dark layout with gradient accent on left */}
        <View
          style={{
            backgroundColor: '#15131C',
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(157, 133, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Left vertical gradient highlight simulator */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: '#FF9F8E', // Peach bar
            }}
          />

          <Text style={{ color: '#8C8A9A', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
            TOTAL POOL SPENT
          </Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '800' }}>
              ₹{totalSpent.toLocaleString('en-IN')}
            </Text>
            <Text style={{ color: '#FF9F8E', fontSize: 11, fontWeight: '600' }}>
              +12% from yesterday
            </Text>
          </View>

          {/* Progress Bar with gradient colors */}
          <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 20, overflow: 'hidden' }}>
            <View style={{ width: '65%', height: '100%', backgroundColor: '#FF9F8E', borderRadius: 2 }} />
          </View>
        </View>

        {/* Horizontal Segment Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 26 }}>
          {(['TIMELINE', 'EXPENSES', 'CONVOY'] as const).map((seg) => {
            const isActive = selectedSegment === seg;
            return (
              <TouchableOpacity
                key={seg}
                onPress={() => setSelectedSegment(seg)}
                style={{
                  flex: 1,
                  backgroundColor: isActive ? 'rgba(157,133,255,0.12)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isActive ? '#9D85FF' : 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: isActive ? '#9D85FF' : '#8C8A9A',
                    fontSize: 10,
                    fontWeight: '800',
                    letterSpacing: 0.5,
                  }}
                >
                  {seg}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Settlement Matrix Title */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }}>Settlement Matrix</Text>
          <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }}>
            Algorithmically optimized paths to settle up.
          </Text>
        </View>

        {/* Dynamic / Mock Card Listing matching screen mockup */}
        <View style={{ gap: 14 }}>
          {/* Card 1: Fuel & Tolls */}
          <View
            style={{
              backgroundColor: '#15131C',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(157, 133, 255, 0.04)',
              padding: 18,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {/* Gas Icon Container */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255, 159, 142, 0.08)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="car-sport" size={20} color="#FF9F8E" />
              </View>

              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>Fuel & Tolls</Text>
                <Text style={{ color: '#8C8A9A', fontSize: 13, marginTop: 2 }}>
                  <Text style={{ fontWeight: '700', color: '#B5B3C4' }}>Hasit</Text> paid ₹4,500
                </Text>

                {/* Avatar Stack Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: -6 }}>
                  {mockUsers.slice(0, 3).map((user, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: user.avatarUrl }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 1.5,
                        borderColor: '#15131C',
                      }}
                    />
                  ))}
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#262332',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: '#15131C',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>+2</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={{ color: '#8C8A9A', fontSize: 12, fontWeight: '600', alignSelf: 'flex-start' }}>Today</Text>
          </View>

          {/* Card 2: Pending Settle-Up Card with SETTLE NOW Primary button */}
          {simplifiedTransactions.length > 0 && (
            <View
              style={{
                backgroundColor: '#1E1B29', // Card Panel BG Alt
                borderRadius: 24,
                borderWidth: 1,
                borderColor: 'rgba(157, 133, 255, 0.1)',
                padding: 20,
              }}
            >
              <Text style={{ color: '#9D85FF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                PENDING SETTLE-UP
              </Text>
              
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 8 }}>
                {getUserName(simplifiedTransactions[0].from)} owes {getUserName(simplifiedTransactions[0].to)}
              </Text>

              <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 10 }}>
                ₹{simplifiedTransactions[0].amount.toLocaleString('en-IN')}
              </Text>

              {/* SETTLE NOW Primary Brand Button */}
              <TouchableOpacity
                onPress={() =>
                  handleSettlePress(
                    simplifiedTransactions[0].from,
                    simplifiedTransactions[0].to,
                    simplifiedTransactions[0].amount
                  )
                }
                style={{
                  backgroundColor: '#9D85FF',
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginTop: 16,
                  shadowColor: '#9D85FF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                }}
              >
                <Text style={{ color: '#12121A', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>
                  SETTLE NOW
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Card 3: Sunny's Dhaba Card */}
          <View
            style={{
              backgroundColor: '#15131C',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(157, 133, 255, 0.04)',
              padding: 18,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {/* Food Icon Container */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: 'rgba(74, 111, 165, 0.08)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="restaurant" size={20} color="#4A6FA5" />
              </View>

              <View style={{ flexShrink: 1 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>Sunny's Dhaba</Text>
                <Text style={{ color: '#8C8A9A', fontSize: 13, marginTop: 2 }}>
                  <Text style={{ fontWeight: '700', color: '#B5B3C4' }}>Kush</Text> paid ₹3,200
                </Text>

                {/* Subtitle Badge Pills */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: '#8C8A9A', fontSize: 9, fontWeight: '700' }}>DINNER</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: '#8C8A9A', fontSize: 9, fontWeight: '700' }}>SPLIT 6 WAYS</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={{ color: '#8C8A9A', fontSize: 12, fontWeight: '600', alignSelf: 'flex-start' }}>Yesterday</Text>
          </View>

          {/* Card 4: Optimized Insight Card with Outlined Button */}
          {simplifiedTransactions.length > 1 && (
            <View
              style={{
                backgroundColor: '#15131C',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: 'rgba(157, 133, 255, 0.06)',
                padding: 20,
              }}
            >
              <Text style={{ color: '#FF9F8E', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                OPTIMIZED INSIGHT
              </Text>
              
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 8, lineHeight: 20 }}>
                Pay {getUserName(simplifiedTransactions[1].to)} directly to clear {simplifiedTransactions.length} pending splits.
              </Text>

              <Text style={{ color: '#FF9F8E', fontSize: 34, fontWeight: '800', marginTop: 10 }}>
                ₹{simplifiedTransactions[1].amount.toLocaleString('en-IN')}
              </Text>

              {/* VIEW BREAKDOWN Outlined Button */}
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Optimization Breakdown',
                    `The greedy flow minimizer resolved all splits into ${simplifiedTransactions.length} transactions, reducing total transaction values by 42%.`
                  )
                }
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginTop: 16,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>
                  VIEW BREAKDOWN
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Card 5: Trip Efficiency with Bar Chart indicator */}
          <View
            style={{
              backgroundColor: '#15131C',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(157, 133, 255, 0.04)',
              padding: 20,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 17 }}>Trip Efficiency</Text>
            <Text style={{ color: '#8C8A9A', fontSize: 13, marginTop: 4 }}>
              98% of expenses auto-categorized
            </Text>

            {/* Small bar chart visual at bottom right */}
            <View style={{ position: 'absolute', bottom: 12, right: 18, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <View style={{ width: 4, height: 12, backgroundColor: 'rgba(157, 133, 255, 0.3)', borderRadius: 2 }} />
              <View style={{ width: 4, height: 22, backgroundColor: 'rgba(157, 133, 255, 0.6)', borderRadius: 2 }} />
              <View style={{ width: 4, height: 32, backgroundColor: '#9D85FF', borderRadius: 2 }} />
              <View style={{ width: 4, height: 16, backgroundColor: 'rgba(157, 133, 255, 0.8)', borderRadius: 2 }} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) + in Purple (#9D85FF) at bottom right */}
      <TouchableOpacity
        onPress={() => setShowAdd(true)}
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 106 : 86,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#9D85FF',
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#9D85FF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      >
        <Ionicons name="add" size={28} color="#12121A" />
      </TouchableOpacity>

      {/* Add Expense Modal with updated styling */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: t.gradientFrom, padding: 24 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>New Travel Expense</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close-circle" size={24} color={t.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* Description */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: t.label, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>Description *</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Fuel & Tolls, Dinner"
                placeholderTextColor={t.textMuted}
                style={{
                  backgroundColor: t.inputBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.inputBorder,
                  padding: 12,
                  color: t.inputText,
                  fontSize: 15,
                }}
              />
            </View>

            {/* Amount */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: t.label, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>Amount *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={currency}
                  onChangeText={setCurrency}
                  placeholder="INR"
                  placeholderTextColor={t.textMuted}
                  maxLength={3}
                  style={{
                    backgroundColor: t.inputBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: t.inputBorder,
                    padding: 12,
                    color: t.inputText,
                    fontSize: 15,
                    width: 70,
                    textAlign: 'center',
                    fontWeight: '700',
                  }}
                />
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={t.textMuted}
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    backgroundColor: t.inputBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: t.inputBorder,
                    padding: 12,
                    color: t.inputText,
                    fontSize: 15,
                  }}
                />
              </View>
            </View>

            {/* Paid By */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: t.label, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Paid By</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {mockUsers.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => setPaidById(user.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: paidById === user.id ? '#9D85FF' : t.panelBg,
                      borderColor: paidById === user.id ? '#9D85FF' : t.border,
                      borderWidth: 1,
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginRight: 8,
                      gap: 6,
                    }}
                  >
                    <Image source={{ uri: user.avatarUrl }} style={{ width: 18, height: 18, borderRadius: 9 }} />
                    <Text style={{ color: paidById === user.id ? '#12121A' : t.text, fontSize: 12, fontWeight: '700' }}>
                      {user.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Category Selector */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: t.label, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={{
                      backgroundColor: category === cat ? '#9D85FF' : t.panelBg,
                      borderColor: category === cat ? '#9D85FF' : t.border,
                      borderWidth: 1,
                      borderRadius: 18,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: category === cat ? '#12121A' : t.text, fontSize: 12, fontWeight: '700' }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Notice */}
            <View style={{ backgroundColor: t.panelBgAlt, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: t.border, marginBottom: 20 }}>
              <Text style={{ color: t.textMuted, fontSize: 11, lineHeight: 15 }}>
                💡 By default, new expenses are automatically split **equally** among all 5 participants of this trip (Alice, Bob, Charlie, David, Emma) to keep group logging simple and direct.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, paddingTop: 10 }}>
            <TouchableOpacity
              onPress={() => setShowAdd(false)}
              style={{
                flex: 1,
                backgroundColor: t.panelBg,
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <Text style={{ color: t.textMuted, fontWeight: '700', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddExpense}
              style={{
                flex: 1.5,
                backgroundColor: '#9D85FF',
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#12121A', fontWeight: '800', fontSize: 15 }}>Add to Group Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
