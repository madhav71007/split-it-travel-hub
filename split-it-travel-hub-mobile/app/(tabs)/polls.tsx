import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSkyTheme } from '@/components/SkyThemeProvider';
import { THEME } from '@/constants/theme';
import { supabase } from '@/lib/supabaseClient';

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, string>;
  created_by: string;
  created_at: string;
}

export default function PollsScreen() {
  const { phase } = useSkyTheme();
  const t = THEME[phase];
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ''));
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    const { data } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
    if (data) setPolls(data);
  };

  const createPoll = async () => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return Alert.alert('Error', 'Need a question and at least 2 options');
    const { error } = await supabase.from('polls').insert([{ question, options: validOptions, votes: {}, created_by: userId }]);
    if (!error) { setShowAdd(false); setQuestion(''); setOptions(['', '']); fetchPolls(); }
  };

  const vote = async (poll: Poll, option: string) => {
    if (poll.votes[userId]) return Alert.alert('Already voted', 'You have already cast your vote.');
    const updatedVotes = { ...poll.votes, [userId]: option };
    await supabase.from('polls').update({ votes: updatedVotes }).eq('id', poll.id);
    fetchPolls();
  };

  const getVoteCount = (poll: Poll, option: string) =>
    Object.values(poll.votes).filter((v) => v === option).length;

  const totalVotes = (poll: Poll) => Object.values(poll.votes).length;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>🗳 Polls</Text>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={{ backgroundColor: t.btnPrimary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.btnPrimaryText, fontWeight: '700' }}>+ Poll</Text>
          </TouchableOpacity>
        </View>

        {polls.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48 }}>🗳️</Text>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', marginTop: 12 }}>No polls yet</Text>
            <Text style={{ color: t.textMuted, marginTop: 4 }}>Create a group decision poll</Text>
          </View>
        ) : (
          polls.map((poll) => {
            const total = totalVotes(poll);
            const myVote = poll.votes[userId];
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
