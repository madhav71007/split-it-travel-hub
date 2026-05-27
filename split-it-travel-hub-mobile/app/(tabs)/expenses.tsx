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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';
import { simplifyDebts, type Expense as SimplifierExpense, type ExpenseSplit } from '@/utils/debtSimplifier';

interface Expense {
  id: string;
  trip_id: string;
  paid_by_id: string;
  description: string;
  amount: number;
  category: string;
  currency: string;
  created_at: string;
}

const mockUsers = [
  { id: 'u1', name: 'Alice', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alice' },
  { id: 'u2', name: 'Bob', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bob' },
  { id: 'u3', name: 'Charlie', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie' },
  { id: 'u4', name: 'David', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=David' },
  { id: 'u5', name: 'Emma', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Emma' },
];

const mockExpenses = [
  { id: 'e1', trip_id: 't1', description: 'Villa Booking Deposit', amount: 15000, paid_by_id: 'u1', category: '🏨 Hotel', currency: 'INR', created_at: '2026-05-27T10:00:00.000Z' },
  { id: 'e2', trip_id: 't1', description: 'Rental SUV Fuel', amount: 4500, paid_by_id: 'u2', category: '✈️ Transport', currency: 'INR', created_at: '2026-05-27T12:30:00.000Z' },
  { id: 'e3', trip_id: 't1', description: 'German Bakery Lunch', amount: 3500, paid_by_id: 'u3', category: '🍔 Food', currency: 'INR', created_at: '2026-05-27T14:15:00.000Z' },
  { id: 'e4', trip_id: 't1', description: 'BBQ supplies', amount: 2000, paid_by_id: 'u4', category: '🎭 Activity', currency: 'INR', created_at: '2026-05-27T18:00:00.000Z' },
];

const CATEGORIES = ['🍔 Food', '🏨 Hotel', '✈️ Transport', '🎭 Activity', '🛒 Shopping', '💊 Health', '📦 Other'];

export default function ExpensesScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState(mockUsers[0].id);
  const [category, setCategory] = useState('📦 Other');
  const [currency, setCurrency] = useState('INR');
  const [userId, setUserId] = useState('u1');

  // Check if Supabase keys are configured properly
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
    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setUserId(data.user.id);
      });
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      // Load mock data
      setExpenses(mockExpenses);
      
      // Generate split records for mock expenses (evenly split among all 5 mock users)
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
      // 1. Fetch expenses
      const { data: exps, error: expsErr } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (expsErr) throw expsErr;

      // 2. Fetch splits
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
      }));

      const formattedSplits: ExpenseSplit[] = spts.map((item) => ({
        id: item.id,
        expenseId: item.expense_id,
        userId: item.user_id,
        amount: Number(item.amount),
      }));

      setExpenses(formattedExpenses);
      setSplits(formattedSplits);
    } catch (e) {
      console.warn('Error loading Supabase expenses:', e);
      // Fallback
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

  // Total spent
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

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
      // Local fallback state
      setExpenses((prev) => [newExpense, ...prev]);
      setSplits((prev) => [...prev, ...newSplits]);
    }

    // Reset form
    setDescription('');
    setAmount('');
    setPaidById(mockUsers[0].id);
    setCategory('📦 Other');
    setShowAdd(false);
  };

  // Perform interactive settlement when a settlement plan card is tapped
  const handleSettlementPress = (fromId: string, toId: string, settleAmount: number) => {
    const fromName = getUserName(fromId);
    const toName = getUserName(toId);

    Alert.alert(
      'Settle Debt',
      `Record payment of ₹${settleAmount.toFixed(2)} from ${fromName} to ${toName}?`,
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
            };

            // This payment settle only affects the 'from' and 'to' users
            // Paid by 'fromId' (adds +settleAmount to fromId)
            // Split only to 'toId' (adds -settleAmount to toId)
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

  const getUserAvatar = (id: string) => {
    return mockUsers.find((u) => u.id === id)?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown';
  };

  const activeColor =
    phase === 'morning'
      ? '#059669'
      : phase === 'afternoon'
      ? '#0f766e'
      : phase === 'evening'
      ? '#ea580c'
      : '#818cf8';

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: Platform.OS === 'ios' ? 120 : 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Badge & Screen Title */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <View>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: t.ambientBg,
                borderColor: t.ambientBorder,
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 3,
                marginBottom: 4,
              }}
            >
              <Text style={{ color: t.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {phase === 'morning' ? '🌅 Morning Sun' : phase === 'afternoon' ? '🌿 Afternoon Canopy' : phase === 'evening' ? '🌇 Evening Twilight' : '🌙 Night Moon'}
              </Text>
            </View>
            <Text style={{ color: t.text, fontSize: 26, fontWeight: '800' }}>💸 Expenses</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={{
              backgroundColor: activeColor,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="white" style={{ marginRight: 6 }} />
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 100, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={activeColor} />
            <Text style={{ color: t.textMuted, marginTop: 12, fontSize: 14, fontWeight: '500' }}>Loading travel expenses...</Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
              {/* Total Spent */}
              <View
                style={{
                  flex: 1.1,
                  backgroundColor: t.panelBg,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: 16,
                }}
              >
                <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Spent</Text>
                <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', marginTop: 4 }}>
                  ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 2 }}>{expenses.length} logs recorded</Text>
              </View>

              {/* Engine Status */}
              <View
                style={{
                  flex: 0.9,
                  backgroundColor: t.panelBg,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: t.border,
                  padding: 16,
                  justifyContent: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                  <Text style={{ color: t.text, fontSize: 12, fontWeight: '700' }}>Greedy Engine</Text>
                </View>
                <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 4 }}>Active & minimizing transaction flows</Text>
              </View>
            </View>

            {/* Net Balances List */}
            <View
              style={{
                backgroundColor: t.panelBg,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: t.border,
                padding: 18,
                marginBottom: 18,
              }}
            >
              <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Net Balances
              </Text>
              <View style={{ gap: 10 }}>
                {mockUsers.map((user) => {
                  const bal = balances[user.id] || 0;
                  const isOwed = bal > 0;
                  return (
                    <View
                      key={user.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottomWidth: 1,
                        borderBottomColor: t.border,
                        paddingBottom: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Image
                          source={{ uri: user.avatarUrl }}
                          style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.05)' }}
                        />
                        <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{user.name}</Text>
                      </View>
                      <View
                        style={{
                          backgroundColor:
                            bal === 0
                              ? 'transparent'
                              : isOwed
                              ? 'rgba(16,185,129,0.1)'
                              : 'rgba(239,68,68,0.1)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: bal === 0 ? t.textMuted : isOwed ? '#10B981' : '#EF4444',
                            fontWeight: '700',
                            fontSize: 13,
                            fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                          }}
                        >
                          {bal === 0 ? 'Settled' : `${isOwed ? '+' : ''}₹${bal.toFixed(2)}`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Debt Settlement Plan List - Greedy Flow minimization */}
            <View
              style={{
                backgroundColor: t.panelBg,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: t.border,
                padding: 18,
                marginBottom: 18,
              }}
            >
              <Text style={{ color: t.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Suggested Settlement Plan (Greedy Flow Minimizer)
              </Text>

              {simplifiedTransactions.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                  <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>No outstanding balances!</Text>
                  <Text style={{ color: t.textMuted, fontSize: 11 }}>Everyone is fully squared up.</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {simplifiedTransactions.map((tx, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleSettlementPress(tx.from, tx.to, tx.amount)}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? t.panelBgAlt : t.panelBg,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: t.border,
                        padding: 12,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: t.text, fontWeight: '700', fontSize: 13 }}>{getUserName(tx.from)}</Text>
                        <Text style={{ color: t.textMuted, fontSize: 12 }}>pays</Text>
                        <Text style={{ color: t.text, fontWeight: '700', fontSize: 13 }}>{getUserName(tx.to)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={{
                            color: activeColor,
                            fontWeight: '800',
                            fontSize: 14,
                            fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                          }}
                        >
                          ₹{tx.amount.toFixed(2)}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={t.textMuted} />
                      </View>
                    </Pressable>
                  ))}
                  <Text style={{ color: t.textMuted, fontSize: 10, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
                    💡 Tap a row to record payment and settle the debt.
                  </Text>
                </View>
              )}
            </View>

            {/* Expense Log */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', marginBottom: 10 }}>Expense Log</Text>
              
              {expenses.length === 0 ? (
                <View style={{ backgroundColor: t.panelBg, borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
                  <Text style={{ fontSize: 32 }}>💸</Text>
                  <Text style={{ color: t.text, fontWeight: '600', marginTop: 8 }}>No expenses logged yet</Text>
                  <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'center', marginTop: 2 }}>
                    Click "+ Add Expense" at the top to record your first transaction.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {expenses.map((expense) => (
                    <View
                      key={expense.id}
                      style={{
                        backgroundColor: t.panelBg,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: t.border,
                        padding: 14,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                          {expense.description}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <Text style={{ color: t.textMuted, fontSize: 11 }}>{expense.category}</Text>
                          <Text style={{ color: t.textMuted, fontSize: 11 }}>•</Text>
                          <Text style={{ color: t.textMuted, fontSize: 11 }}>Paid by {getUserName(expense.paid_by_id)}</Text>
                        </View>
                      </View>
                      <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>
                        {expense.currency} {expense.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
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
                placeholder="e.g. SUV toll tax, highway snacks, villa booking"
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
                      backgroundColor: paidById === user.id ? activeColor : t.panelBg,
                      borderColor: paidById === user.id ? activeColor : t.border,
                      borderWidth: 1,
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginRight: 8,
                      gap: 6,
                    }}
                  >
                    <Image source={{ uri: user.avatarUrl }} style={{ width: 18, height: 18, borderRadius: 9 }} />
                    <Text style={{ color: paidById === user.id ? 'white' : t.text, fontSize: 12, fontWeight: '700' }}>
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
                      backgroundColor: category === cat ? activeColor : t.panelBg,
                      borderColor: category === cat ? activeColor : t.border,
                      borderWidth: 1,
                      borderRadius: 18,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: category === cat ? 'white' : t.text, fontSize: 12, fontWeight: '700' }}>{cat}</Text>
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
                backgroundColor: activeColor,
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>Add to Group Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
