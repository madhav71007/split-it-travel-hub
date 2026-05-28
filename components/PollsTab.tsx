import React, { useState, useEffect } from "react";
import { Check, Vote, Plus, Clock, RefreshCw } from "lucide-react";
import { getPolls, saveVote, savePoll, isSupabaseConfigured } from "../lib/dataService";
import { supabase } from "../lib/supabaseClient";
import { ThemePhase } from "../hooks/useTimeTheme";

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<number, number>; // Maps option index to vote count
  userVotedIndex?: number;       // Tracks if user has already voted on this poll
  expiresAt: string;
}

const getThemeStyles = (phase: ThemePhase) => {
  switch (phase) {
    case "morning":
      return {
        card: "bg-white/70 backdrop-blur-md border border-emerald-100/50 shadow-sm text-emerald-950",
        cardTitle: "text-emerald-800 font-bold uppercase tracking-wider text-xs",
        btnActive: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200/50",
        btnActiveDisabled: "bg-emerald-100 text-emerald-400 cursor-not-allowed opacity-50",
        pollBtn: "border-emerald-100/60 hover:border-emerald-200 bg-white/40",
        pollProgress: "bg-emerald-100/40",
        badge: "text-emerald-700 bg-emerald-50 border border-emerald-100/50",
        input: "bg-white/60 border border-emerald-200 focus:border-emerald-400 text-emerald-950 placeholder-emerald-800/40 focus:outline-none",
        textMuted: "text-emerald-800/80",
        textPrimary: "text-emerald-955",
        formCancelBtn: "bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200",
        votedIcon: "bg-emerald-600 text-white",
        formBg: "bg-white/80 border border-emerald-100/50 shadow-md shadow-emerald-100/10",
      };
    case "afternoon":
      return {
        card: "bg-white border border-slate-200 shadow-sm text-slate-900",
        cardTitle: "text-slate-500 font-bold uppercase tracking-wider text-xs",
        btnActive: "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-200/50",
        btnActiveDisabled: "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50",
        pollBtn: "border-slate-200/85 hover:border-slate-300 bg-slate-50/45",
        pollProgress: "bg-sky-100/70",
        badge: "text-slate-650 bg-slate-100 border border-slate-200/40",
        input: "bg-slate-50 border border-slate-200 focus:border-sky-400 text-slate-900 placeholder-slate-400 focus:outline-none",
        textMuted: "text-slate-500",
        textPrimary: "text-slate-900",
        formCancelBtn: "bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200",
        votedIcon: "bg-sky-500 text-white",
        formBg: "bg-white border border-slate-200 shadow-md shadow-slate-150",
      };
    case "evening":
      return {
        card: "bg-slate-950/60 backdrop-blur border border-orange-500/20 shadow-lg text-amber-100",
        cardTitle: "text-orange-400/80 font-bold uppercase tracking-wider text-xs",
        btnActive: "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-950/50",
        btnActiveDisabled: "bg-slate-800 text-orange-900/60 cursor-not-allowed opacity-50",
        pollBtn: "border border-orange-500/10 hover:border-orange-500/30 bg-slate-950/30",
        pollProgress: "bg-orange-950/30 border-r border-orange-900/10",
        badge: "text-orange-400 bg-orange-950/30 border border-orange-900/30",
        input: "bg-slate-900/60 border border-orange-900/40 focus:border-orange-500/60 text-amber-100 placeholder-amber-200/30 focus:outline-none",
        textMuted: "text-amber-200/60",
        textPrimary: "text-amber-50",
        formCancelBtn: "bg-slate-900 hover:bg-slate-855 text-amber-300/80 border border-orange-900/40",
        votedIcon: "bg-orange-500 text-slate-950",
        formBg: "bg-slate-950 border border-orange-500/30 shadow-md shadow-orange-950/30",
      };
    default: // night
      return {
        card: "bg-slate-950 border border-slate-900 shadow-md text-slate-100",
        cardTitle: "text-slate-400 font-bold uppercase tracking-wider text-xs",
        btnActive: "bg-white text-slate-950 hover:bg-slate-200 shadow-md shadow-white/5",
        btnActiveDisabled: "bg-slate-900 text-slate-600 cursor-not-allowed opacity-50",
        pollBtn: "border border-slate-900 hover:border-slate-800 bg-slate-955",
        pollProgress: "bg-slate-900",
        badge: "text-slate-400 bg-slate-900 border border-slate-850",
        input: "bg-slate-900 border border-slate-800 focus:border-slate-700 text-white placeholder-slate-500 focus:outline-none",
        textMuted: "text-slate-400",
        textPrimary: "text-slate-100",
        formCancelBtn: "bg-slate-900 hover:bg-slate-855 text-slate-400 hover:text-white border border-slate-800",
        votedIcon: "bg-white text-slate-950",
        formBg: "bg-slate-950 border border-slate-900 shadow-md shadow-black/40",
      };
  }
};

export default function PollsTab({ 
  isActive = true, 
  themePhase = "night" 
}: { 
  isActive?: boolean; 
  themePhase?: ThemePhase 
}) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptionsStr, setNewOptionsStr] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const styles = getThemeStyles(themePhase);

  const loadPollsData = async () => {
    try {
      const data = await getPolls("t1");
      setPolls(data);
    } catch (err) {
      console.error("Error loading polls:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPollsData();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("polls-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "polls" },
          () => {
            loadPollsData();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "votes" },
          () => {
            loadPollsData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleVote = async (pollId: string, optionIndex: number) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) => {
        if (poll.id !== pollId) return poll;

        const currentVoteIndex = poll.userVotedIndex;
        const updatedVotes = { ...poll.votes };

        if (currentVoteIndex === optionIndex) return poll;

        if (currentVoteIndex !== undefined) {
          updatedVotes[currentVoteIndex] = Math.max(0, (updatedVotes[currentVoteIndex] || 0) - 1);
        }

        updatedVotes[optionIndex] = (updatedVotes[optionIndex] || 0) + 1;

        return {
          ...poll,
          votes: updatedVotes,
          userVotedIndex: optionIndex,
        };
      })
    );

    if (isSupabaseConfigured()) {
      const res = await saveVote(pollId, optionIndex);
      if (res.success) {
        loadPollsData();
      } else {
        alert("Failed to save vote to Supabase.");
      }
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newOptionsStr.trim()) return;

    const options = newOptionsStr
      .split(",")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (options.length < 2) {
      alert("Please provide at least 2 options, separated by commas.");
      return;
    }

    const defaultVotes: Record<number, number> = {};
    options.forEach((_, idx) => {
      defaultVotes[idx] = 0;
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const newPoll: any = {
      tripId: "t1",
      question: newQuestion,
      options,
      expiresAt,
    };

    if (isSupabaseConfigured()) {
      const res = await savePoll(newPoll);
      if (res.success) {
        loadPollsData();
      } else {
        alert("Failed to save poll to Supabase. Creating locally.");
        const mockNewPoll: Poll = {
          id: `p_${Date.now()}`,
          question: newQuestion,
          options,
          votes: defaultVotes,
          expiresAt,
        };
        setPolls((prev) => [mockNewPoll, ...prev]);
      }
    } else {
      const mockNewPoll: Poll = {
        id: `p_${Date.now()}`,
        question: newQuestion,
        options,
        votes: defaultVotes,
        expiresAt,
      };
      setPolls((prev) => [mockNewPoll, ...prev]);
    }

    setNewQuestion("");
    setNewOptionsStr("");
    setIsFormOpen(false);
  };

  if (loading) {
    return (
      <div className={`h-48 flex items-center justify-center ${styles.textMuted}`}>
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading decisions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Poll Banner */}
      <div className="flex justify-between items-center">
        <h3 className={`text-base font-semibold tracking-wide ${styles.textPrimary}`}>Group Decisions</h3>
        <button
          disabled={!isActive}
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`font-semibold text-xs py-2 px-4 rounded-lg flex items-center shadow-lg transition-all duration-300 ${
            !isActive ? styles.btnActiveDisabled : styles.btnActive
          }`}
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[3]" /> Create Poll
        </button>
      </div>

      {/* New Poll Form */}
      {isFormOpen && (
        <form
          onSubmit={handleCreatePoll}
          className={`rounded-xl p-5 space-y-4 border animate-in fade-in slide-in-from-top-4 duration-300 ${styles.formBg}`}
        >
          <h4 className={`text-sm font-semibold ${styles.textPrimary}`}>Create Group Poll</h4>
          <div className="space-y-3">
            <div>
              <label className={`block text-[10px] uppercase tracking-wider mb-1.5 ${styles.textMuted}`}>
                Question
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Do we go for the night trek?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className={`w-full rounded-lg py-2 px-3 text-xs ${styles.input}`}
              />
            </div>
            <div>
              <label className={`block text-[10px] uppercase tracking-wider mb-1.5 ${styles.textMuted}`}>
                Options (Separated by Commas)
              </label>
              <input
                type="text"
                required
                placeholder="Option 1, Option 2, Option 3"
                value={newOptionsStr}
                onChange={(e) => setNewOptionsStr(e.target.value)}
                className={`w-full rounded-lg py-2 px-3 text-xs ${styles.input}`}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className={`rounded-lg py-2 px-4 text-xs font-semibold border transition-colors duration-300 ${styles.formCancelBtn}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`rounded-lg py-2 px-4 text-xs font-semibold shadow transition-all duration-300 ${styles.btnActive}`}
            >
              Launch Poll
            </button>
          </div>
        </form>
      )}

      {/* Polls Listing */}
      <div className="space-y-6">
        {polls.length === 0 ? (
          <div className={`text-center py-10 text-xs border border-dashed rounded-xl ${styles.card}`}>
            No polls created yet.
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes = Object.values(poll.votes).reduce((sum, v) => sum + v, 0);

            return (
              <div
                key={poll.id}
                className={`rounded-xl p-5 space-y-4 hover:border-current/10 transition-all duration-300 ${styles.card}`}
              >
                {/* Question */}
                <div className="space-y-1">
                  <h4 className={`text-sm font-semibold leading-relaxed tracking-wide ${styles.textPrimary}`}>
                    {poll.question}
                  </h4>
                  <div className="flex items-center space-x-3 text-[10px]">
                    <span className={`flex items-center ${styles.textMuted}`}>
                      <Vote className="w-3.5 h-3.5 mr-1 opacity-80" />
                      {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                    </span>
                    <span className={`flex items-center ${styles.textMuted}`}>
                      <Clock className="w-3.5 h-3.5 mr-1 opacity-80" />
                      Expires soon
                    </span>
                  </div>
                </div>

                {/* Options list */}
                <div className="space-y-3">
                  {poll.options.map((option, idx) => {
                    const voteCount = poll.votes[idx] || 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const hasVoted = poll.userVotedIndex === idx;

                    return (
                      <button
                        key={idx}
                        disabled={!isActive}
                        onClick={() => isActive && handleVote(poll.id, idx)}
                        className={`w-full text-left relative overflow-hidden rounded-xl border p-3.5 flex items-center justify-between transition-all duration-300 ${
                          styles.pollBtn
                        } ${isActive ? "active:scale-[0.99] cursor-pointer" : "cursor-default"}`}
                      >
                        {/* Background progress indicator bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-l-xl ${styles.pollProgress}`}
                          style={{ width: `${percentage}%` }}
                        />

                        {/* Content overlays */}
                        <span className={`relative text-xs font-semibold flex items-center pr-4 ${
                          themePhase === "morning" || themePhase === "afternoon" ? "text-slate-800" : "text-slate-300"
                        }`}>
                          {hasVoted && (
                            <span className={`p-0.5 rounded-full mr-2 flex items-center justify-center ${styles.votedIcon}`}>
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                          {option}
                        </span>
                        <span className={`relative text-xs font-mono font-bold px-2 py-0.5 rounded ${styles.badge}`}>
                          {percentage}% ({voteCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
