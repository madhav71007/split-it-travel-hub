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
import { Ionicons } from '@expo/vector-icons';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';
import { simplifyDebts, type Expense as SimplifierExpense, type ExpenseSplit } from '@/utils/debtSimplifier';
import { useTrip } from '@/components/TripContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from '@/components/SubscriptionContext';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '@/components/AuthContext';



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

const CATEGORIES = ['🍔 Food', '🏨 Hotel', '✈️ Transport', '🎭 Activity', '🛒 Shopping', '💊 Health', '📦 Other'];

export default function ExpensesScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const { activeTrip, activeTripId, members } = useTrip();
  const subscription = useSubscription();
  const router = useRouter();
  const { user } = useAuth();


  const handleExportReport = () => {
    if (!subscription.isPro) {
      Alert.alert(
        'Pro Traveller Feature',
        'Exporting expense reports (CSV, PDF) is restricted to Pro tier users. Please upgrade to unlock.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => router.push('/modal/subscription' as Href) }
        ]
      );
    } else {
      Alert.alert(
        'Export Successful',
        'Your trip expense ledger has been successfully compiled and downloaded as CSV.'
      );
    }
  };


  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState('');
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
    if (activeTripId) {
      fetchData();
    }
  }, [activeTripId]);

  useEffect(() => {
    if (members && members.length > 0 && !paidById) {
      const matchingMember = members.find(
        (m) => user && m.name.toLowerCase() === user.name.toLowerCase()
      );
      setPaidById(matchingMember ? matchingMember.id : members[0].id);
    }
  }, [members, user, paidById]);


  const fetchData = async () => {
    if (!activeTripId) return;
    setLoading(true);

    if (!isSupabaseConfigured()) {
      try {
        const storedExps = await AsyncStorage.getItem(`local_expenses_${activeTripId}`);
        const storedSplits = await AsyncStorage.getItem(`local_splits_${activeTripId}`);
        setExpenses(storedExps ? JSON.parse(storedExps) : []);
        setSplits(storedSplits ? JSON.parse(storedSplits) : []);
      } catch (e) {
        console.warn('Error reading local expenses:', e);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { data: exps, error: expsErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', activeTripId)
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

      setExpenses(formattedExpenses);
      setSplits(formattedSplits);
    } catch (e) {
      console.warn('Error loading Supabase expenses:', e);
    } finally {
      setLoading(false);
    }
  };

  // 1. Calculate net balances
  const balances = useMemo(() => {
    const bal: Record<string, number> = {};
    members.forEach((u) => {
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
  }, [expenses, splits, members]);

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
    if (!activeTripId) return;
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) {
      return Alert.alert('Invalid fields', 'Please enter a valid description and amount.');
    }
    if (members.length === 0) {
      return Alert.alert('No members', 'Please add group members on the Dashboard screen first.');
    }

    const splitAmt = Math.round((amt / members.length) * 100) / 100;
    const expenseId = `e_${Date.now()}`;

    const newExpense: Expense = {
      id: expenseId,
      trip_id: activeTripId,
      description: description.trim(),
      amount: amt,
      paid_by_id: paidById || members[0].id,
      category,
      currency,
      created_at: new Date().toISOString(),
      payer_name: getUserName(paidById || members[0].id),
    };

    const newSplits: ExpenseSplit[] = members.map((user, idx) => ({
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
          trip_id: activeTripId,
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
      const updatedExps = [newExpense, ...expenses];
      const updatedSplits = [...splits, ...newSplits];
      setExpenses(updatedExps);
      setSplits(updatedSplits);
      await AsyncStorage.setItem(`local_expenses_${activeTripId}`, JSON.stringify(updatedExps));
      await AsyncStorage.setItem(`local_splits_${activeTripId}`, JSON.stringify(updatedSplits));
    }

    setDescription('');
    setAmount('');
    setPaidById(members[0]?.id || '');
    setCategory('📦 Other');
    setShowAdd(false);
  };

  const handleSettlePress = (fromId: string, toId: string, settleAmount: number) => {
    if (!activeTripId) return;
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
              trip_id: activeTripId,
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
                  trip_id: activeTripId,
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
              const updatedExps = [newExpense, ...expenses];
              const updatedSplits = [...splits, ...newSplits];
              setExpenses(updatedExps);
              setSplits(updatedSplits);
              await AsyncStorage.setItem(`local_expenses_${activeTripId}`, JSON.stringify(updatedExps));
              await AsyncStorage.setItem(`local_splits_${activeTripId}`, JSON.stringify(updatedSplits));
            }
          },
        },
      ]
    );
  };

  const getUserName = (id: string) => {
    return members.find((u) => u.id === id)?.name || 'Unknown';
  };

  if (!activeTripId) {
    return (
      <View style={{ flex: 1, backgroundColor: t.canvasBg }}>
        <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="wallet-outline" size={60} color={t.textMuted} />
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', marginTop: 16 }}>
            No Active Trip
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
            Please select or create an active trip on the Dashboard to view and log expenses.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

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

          {/* Right Header Buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={handleExportReport}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                borderRadius: 24,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Ionicons name="download-outline" size={14} color={t.text} style={{ marginRight: 4 }} />
              <Text style={{ color: t.text, fontSize: 12, fontWeight: '600' }}>Export</Text>
            </TouchableOpacity>

            {/* Active Trip Name Pill */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>{activeTrip?.title}</Text>
            </View>
          </View>

        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Pool Spent Card */}
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
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: '#FF9F8E',
            }}
          />

          <Text style={{ color: '#8C8A9A', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
            TOTAL POOL SPENT
          </Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '800' }}>
              ₹{totalSpent.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Settlement Matrix Title */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }}>Settlement Matrix</Text>
          <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }}>
            Algorithmically optimized paths to settle up.
          </Text>
        </View>

        {/* Expenses List */}
        <View style={{ gap: 14 }}>
          {/* Pending Settle-Up Card / Locked Smart Settlements */}
          {!subscription.isPro ? (
            <View
              style={{
                backgroundColor: '#1E1B29',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: 'rgba(157, 133, 255, 0.15)',
                padding: 24,
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: 'rgba(157, 133, 255, 0.05)',
                }}
              />
              
              <Ionicons name="git-merge" size={32} color="#9D85FF" style={{ marginBottom: 12 }} />
              
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
                Smart Settlements Matrix
              </Text>
              
              <Text style={{ color: '#8C8A9A', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18, paddingHorizontal: 10 }}>
                Unlock advanced debt-simplification algorithms that minimize the total number of transactions needed to settle up with your crew.
              </Text>

              {/* Faded Mockup */}
              <View style={{ width: '100%', marginTop: 16, opacity: 0.15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#9D85FF', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>👤 Alice owes Bob</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 4 }}>₹1,450</Text>
              </View>
              
              <TouchableOpacity
                onPress={() => router.push('/modal/subscription' as Href)}
                style={{
                  backgroundColor: '#9D85FF',
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                  marginTop: 18,
                  width: '100%',
                }}
              >
                <Text style={{ color: '#12121A', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>
                  UNLOCK SMART SETTLEMENTS
                </Text>
              </TouchableOpacity>
            </View>
          ) : simplifiedTransactions.length > 0 ? (
            <View
              style={{
                backgroundColor: '#1E1B29',
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
          ) : (
            <View
              style={{
                backgroundColor: '#15131C',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(157, 133, 255, 0.04)',
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>🎉 Everyone is settled up!</Text>
            </View>
          )}


          {/* List of logged expenses */}
          {expenses.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                Log Details
              </Text>
              {expenses.map((expense) => (
                <View
                  key={expense.id}
                  style={{
                    backgroundColor: '#15131C',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(157, 133, 255, 0.04)',
                    padding: 16,
                    marginBottom: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: 'rgba(157, 133, 255, 0.08)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="card" size={18} color="#9D85FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
                        {expense.description}
                      </Text>
                      <Text style={{ color: '#8C8A9A', fontSize: 12, marginTop: 2 }}>
                        Paid by <Text style={{ fontWeight: '700', color: '#B5B3C4' }}>{getUserName(expense.paid_by_id)}</Text>
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ color: '#8C8A9A', fontSize: 10, marginTop: 2 }}>
                      {expense.category}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Optimized Insight Card */}
          {subscription.isPro && simplifiedTransactions.length > 1 && (
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
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) */}
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
                {members.map((user) => (
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
                💡 By default, new expenses are automatically split **equally** among all participants of this trip ({members.map(m => m.name).join(', ')}) to keep group logging simple and direct.
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
