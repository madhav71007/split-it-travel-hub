import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';
import { useTrip } from '@/components/TripContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/components/SubscriptionContext';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '@/components/AuthContext';

interface Poll {
  id: string;
  trip_id: string;
  question: string;
  options: string[];
  votes: Record<string, string>;
  created_by: string;
  created_at: string;
}

export default function PollsScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const { activeTrip, activeTripId } = useTrip();
  const subscription = useSubscription();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || 'You';

  const [polls, setPolls] = useState<Poll[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

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
      fetchPolls();
    }
  }, [activeTripId]);

  const fetchPolls = async () => {
    if (!activeTripId) return;

    if (!isSupabaseConfigured()) {
      try {
        const stored = await AsyncStorage.getItem(`local_polls_${activeTripId}`);
        setPolls(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.warn('Error reading local polls:', e);
      }
      return;
    }

    const { data } = await supabase
      .from('polls')
      .select('*')
      .eq('trip_id', activeTripId)
      .order('created_at', { ascending: false });
    if (data) setPolls(data);
  };

  const createPoll = async () => {
    if (!activeTripId) return;
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return Alert.alert('Error', 'Need a question and at least 2 options');

    const newPoll: Poll = {
      id: `pl_${Date.now()}`,
      trip_id: activeTripId,
      question,
      options: validOptions,
      votes: {},
      created_by: userId || 'You',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('polls').insert([{
        trip_id: activeTripId,
        question,
        options: validOptions,
        votes: {},
        created_by: userId,
      }]);
      if (!error) {
        setShowAdd(false);
        setQuestion('');
        setOptions(['', '']);
        fetchPolls();
      } else {
        Alert.alert('Save failed', error.message);
      }
    } else {
      const updated = [newPoll, ...polls];
      setPolls(updated);
      await AsyncStorage.setItem(`local_polls_${activeTripId}`, JSON.stringify(updated));
      setShowAdd(false);
      setQuestion('');
      setOptions(['', '']);
    }
  };

  const vote = async (poll: Poll, option: string) => {
    if (!activeTripId) return;
    const currentUserId = userId || 'You';
    if (poll.votes[currentUserId]) return Alert.alert('Already voted', 'You have already cast your vote.');
    const updatedVotes = { ...poll.votes, [currentUserId]: option };

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('polls').update({ votes: updatedVotes }).eq('id', poll.id);
      if (!error) {
        fetchPolls();
      } else {
        Alert.alert('Vote failed', error.message);
      }
    } else {
      const updated = polls.map((p) =>
        p.id === poll.id ? { ...p, votes: updatedVotes } : p
      );
      setPolls(updated);
      await AsyncStorage.setItem(`local_polls_${activeTripId}`, JSON.stringify(updated));
    }
  };

  const getVoteCount = (poll: Poll, option: string) => {
    return Object.values(poll.votes || {}).filter((v) => v === option).length;
  };

  const totalVotes = (poll: Poll) => {
    return Object.values(poll.votes || {}).length;
  };

  if (!activeTripId) {
    return (
      <View style={{ flex: 1, backgroundColor: t.canvasBg }}>
        <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="checkbox-outline" size={60} color={t.textMuted} />
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', marginTop: 16 }}>
            No Active Trip
          </Text>
          <Text style={{ color: t.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            Please select or create an active trip on the Dashboard to view and participate in polls.
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
            <Ionicons name="checkbox" size={40} color={t.primary} />
          </View>

          {/* Heading with Diamond */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="diamond" size={14} color={t.secondary} />
            <Text style={{ color: t.text, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
              Priority Decisions
            </Text>
          </View>

          {/* Value Prop */}
          <Text style={{ color: t.textMuted, fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 20, paddingHorizontal: 16 }}>
            Democratize your route planning, dining choices, and activity budgets with interactive real-time crew voting.
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
              opacity: 0.35,
            }}
          >
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>
              📍 Next Dinner Spot?
            </Text>
            
            <View style={{ marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: t.border, padding: 10, backgroundColor: t.panelBgAlt, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '70%', backgroundColor: t.accent, opacity: 0.3 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>🏆 Beachside Seafood Grill ✓</Text>
                <Text style={{ color: t.textMuted, fontSize: 12 }}>70%</Text>
              </View>
            </View>

            <View style={{ borderRadius: 10, borderWidth: 1, borderColor: t.border, padding: 10, backgroundColor: t.panelBgAlt, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', backgroundColor: t.accent, opacity: 0.3 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '500' }}>Downtown Pizzeria</Text>
                <Text style={{ color: t.textMuted, fontSize: 12 }}>30%</Text>
              </View>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={() => router.push('/modal/subscription' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Unlock Group Decisions"
            style={{
              backgroundColor: t.btnPrimary,
              borderRadius: 10,
              paddingVertical: 14,
              paddingHorizontal: 28,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: t.btnPrimaryText, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }}>
              Unlock Group Decisions
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>🗳 Polls</Text>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={{ backgroundColor: t.btnPrimary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.btnPrimaryText, fontWeight: '700' }}>+ Poll</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: t.primary, fontSize: 14, fontWeight: '700', marginBottom: 20 }}>
          {activeTrip?.title}
        </Text>

        {polls.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48 }}>🗳️</Text>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', marginTop: 12 }}>No polls yet</Text>
            <Text style={{ color: t.textMuted, marginTop: 4 }}>Create a group decision poll</Text>
          </View>
        ) : (
          polls.map((poll) => {
            const total = totalVotes(poll);
            const myVote = poll.votes[userId || 'You'];
            return (
              <View key={poll.id} style={{ backgroundColor: t.panelBg, borderRadius: 18, borderWidth: 1, borderColor: t.border, padding: 18, marginBottom: 14 }}>
                <Text style={{ color: t.text, fontWeight: '800', fontSize: 17, marginBottom: 14 }}>
                  {poll.question}
                </Text>
                {poll.options.map((option) => {
                  const count = getVoteCount(poll, option);
                  const pct = total > 0 ? count / total : 0;
                  const isMyVote = myVote === option;
                  const isWinner = total > 0 && count === Math.max(...poll.options.map((o) => getVoteCount(poll, o)));
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => vote(poll, option)}
                      style={{
                        marginBottom: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isMyVote ? t.accentDeep : t.border,
                        overflow: 'hidden',
                        backgroundColor: t.panelBgAlt,
                      }}
                    >
                      {/* Progress fill */}
                      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, backgroundColor: isMyVote ? t.accentDeep : t.accent, opacity: 0.4 }} />
                      <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: t.text, fontWeight: isMyVote ? '700' : '500', fontSize: 14 }}>
                          {isWinner && total > 0 ? '🏆 ' : ''}{option}{isMyVote ? ' ✓' : ''}
                        </Text>
                        <Text style={{ color: t.textMuted, fontSize: 13, fontWeight: '600' }}>
                          {count} ({Math.round(pct * 100)}%)
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'right', marginTop: 4 }}>
                  {total} vote{total !== 1 ? 's' : ''} cast
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: t.gradientFrom, padding: 24 }}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', marginBottom: 20 }}>Create Poll</Text>
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Question</Text>
          <TextInput value={question} onChangeText={setQuestion} placeholder="What should we decide?" placeholderTextColor={t.textMuted} style={{ backgroundColor: t.inputBg, borderRadius: 12, borderWidth: 1, borderColor: t.inputBorder, padding: 12, color: t.inputText, fontSize: 15, marginBottom: 16 }} />
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Options</Text>
          {options.map((opt, i) => (
            <TextInput key={i} value={opt} onChangeText={(v) => { const o = [...options]; o[i] = v; setOptions(o); }} placeholder={`Option ${i + 1}`} placeholderTextColor={t.textMuted} style={{ backgroundColor: t.inputBg, borderRadius: 12, borderWidth: 1, borderColor: t.inputBorder, padding: 12, color: t.inputText, fontSize: 15, marginBottom: 10 }} />
          ))}
          <TouchableOpacity onPress={() => setOptions([...options, ''])} style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: t.textMuted, fontWeight: '600' }}>+ Add option</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, backgroundColor: t.panelBg, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
              <Text style={{ color: t.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={createPoll} style={{ flex: 1, backgroundColor: t.btnPrimary, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
              <Text style={{ color: t.btnPrimaryText, fontWeight: '700' }}>Create Poll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
