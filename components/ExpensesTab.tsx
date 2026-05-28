import React, { useState, useEffect, useMemo } from "react";
import { Plus, Check, Trash2, RefreshCw } from "lucide-react";
import { simplifyDebts, User, Expense, ExpenseSplit } from "../utils/debtSimplifier";
import { getExpenses, getExpenseSplits, saveExpense, deleteExpense, mockUsers, isSupabaseConfigured } from "../lib/dataService";
import { supabase } from "../lib/supabaseClient";
import { ThemePhase } from "../hooks/useTimeTheme";

const getThemeStyles = (phase: ThemePhase) => {
  switch (phase) {
    case "morning":
      return {
        card: "bg-white/70 backdrop-blur-md border border-emerald-100/50 shadow-sm text-emerald-950",
        cardTitle: "text-emerald-800 font-bold uppercase tracking-wider text-xs",
        itemBorder: "border-emerald-100/50",
        balanceBadgeOwed: "text-emerald-700 bg-emerald-100/40",
        balanceBadgeOwes: "text-rose-700 bg-rose-100/40",
        balanceBadgeSettled: "text-emerald-800/45",
        btnActive: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200/50",
        btnActiveDisabled: "bg-emerald-100 text-emerald-400 cursor-not-allowed opacity-50",
        input: "bg-white/60 border border-emerald-200 focus:border-emerald-400 text-emerald-950 placeholder-emerald-800/40 focus:outline-none",
        formBg: "bg-white/80 border border-emerald-100",
        listCard: "bg-white/60 border border-emerald-100/50 hover:border-emerald-200 text-emerald-950",
        textMuted: "text-emerald-800/80",
        textPrimary: "text-emerald-950",
        pillActive: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        pillActiveLoading: "bg-emerald-50 text-emerald-600 border border-emerald-100",
        formCancelBtn: "bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "afternoon":
      return {
        card: "bg-white border border-slate-200 shadow-sm text-slate-900",
        cardTitle: "text-slate-500 font-bold uppercase tracking-wider text-xs",
        itemBorder: "border-slate-100",
        balanceBadgeOwed: "text-sky-700 bg-sky-50",
        balanceBadgeOwes: "text-rose-700 bg-rose-50",
        balanceBadgeSettled: "text-slate-400",
        btnActive: "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-200/50",
        btnActiveDisabled: "bg-slate-200 text-slate-400 cursor-not-allowed opacity-50",
        input: "bg-slate-50 border border-slate-200 focus:border-sky-400 text-slate-900 placeholder-slate-400 focus:outline-none",
        formBg: "bg-white border border-slate-200",
        listCard: "bg-white border border-slate-200 hover:border-slate-300 text-slate-900",
        textMuted: "text-slate-500",
        textPrimary: "text-slate-900",
        pillActive: "bg-sky-100 text-sky-700 border border-sky-200",
        pillActiveLoading: "bg-slate-50 text-slate-550 border border-slate-150",
        formCancelBtn: "bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200",
      };
    case "evening":
      return {
        card: "bg-slate-950/60 backdrop-blur border border-orange-500/20 shadow-lg text-amber-100",
        cardTitle: "text-orange-400/80 font-bold uppercase tracking-wider text-xs",
        itemBorder: "border-orange-500/10",
        balanceBadgeOwed: "text-orange-400 bg-orange-950/30 border border-orange-900/30",
        balanceBadgeOwes: "text-rose-400 bg-rose-950/30 border border-rose-900/30",
        balanceBadgeSettled: "text-amber-100/30",
        btnActive: "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-950/50",
        btnActiveDisabled: "bg-slate-800 text-orange-900/60 cursor-not-allowed opacity-50",
        input: "bg-slate-900/60 border border-orange-900/40 focus:border-orange-500/60 text-amber-100 placeholder-amber-200/30 focus:outline-none",
        formBg: "bg-slate-950/80 border border-orange-500/30",
        listCard: "bg-slate-950/60 border border-orange-500/10 hover:border-orange-500/30 text-amber-100",
        textMuted: "text-amber-200/60",
        textPrimary: "text-amber-50",
        pillActive: "bg-orange-950/50 text-orange-400 border border-orange-900",
        pillActiveLoading: "bg-orange-950/30 text-orange-500/80 border border-orange-950",
        formCancelBtn: "bg-slate-900 hover:bg-slate-855 text-amber-300/80 border-orange-900/40",
      };
    default: // night
      return {
        card: "bg-slate-950 border border-slate-900 shadow-md text-slate-100",
        cardTitle: "text-slate-400 font-bold uppercase tracking-wider text-xs",
        itemBorder: "border-slate-900/50",
        balanceBadgeOwed: "text-emerald-400 bg-emerald-950/20",
        balanceBadgeOwes: "text-rose-400 bg-rose-950/20",
        balanceBadgeSettled: "text-slate-500",
        btnActive: "bg-white text-slate-950 hover:bg-slate-200 shadow-md shadow-white/5",
        btnActiveDisabled: "bg-slate-900 text-slate-600 cursor-not-allowed opacity-50",
        input: "bg-slate-900 border border-slate-800 focus:border-slate-700 text-white placeholder-slate-500 focus:outline-none",
        formBg: "bg-slate-950 border border-slate-900",
        listCard: "bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-100",
        textMuted: "text-slate-400",
        textPrimary: "text-slate-100",
        pillActive: "bg-indigo-950/50 text-indigo-400 border border-indigo-900",
        pillActiveLoading: "bg-indigo-950/30 text-indigo-500/80 border border-indigo-950",
        formCancelBtn: "bg-slate-900 hover:bg-slate-855 text-slate-400 hover:text-white border-slate-800",
      };
  }
};

export default function ExpensesTab({ 
  isActive = true, 
  themePhase = "night" 
}: { 
  isActive?: boolean; 
  themePhase?: ThemePhase 
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [paidById, setPaidById] = useState(mockUsers[0].id);

  const styles = getThemeStyles(themePhase);

  // Load initial data and subscribe to Realtime changes
  const loadExpenseData = async () => {
    try {
      const exps = await getExpenses("t1");
      const spts = await getExpenseSplits("t1");
      setExpenses(exps);
      setSplits(spts);
    } catch (err) {
      console.error("Error loading expense data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenseData();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("expenses-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "expenses" },
          () => {
            loadExpenseData();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "expense_splits" },
          () => {
            loadExpenseData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // 1. Calculate net balances
  const balances = useMemo(() => {
    const bal: Record<string, number> = {};
    mockUsers.forEach((u) => {
      bal[u.id] = 0;
    });

    expenses.forEach((exp) => {
      bal[exp.paidById] = (bal[exp.paidById] || 0) + Number(exp.amount);
    });

    splits.forEach((split) => {
      bal[split.userId] = (bal[split.userId] || 0) - Number(split.amount);
    });

    return bal;
  }, [expenses, splits]);

  // 2. Compute simplified transactions
  const simplifiedTransactions = useMemo(() => {
    return simplifyDebts(expenses, splits);
  }, [expenses, splits]);

  // Handle adding a new expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!description || isNaN(amount) || amount <= 0) return;

    const splitAmount = Math.round((amount / mockUsers.length) * 100) / 100;
    const expenseId = `e_${Date.now()}`;

    const newExpense: Expense = {
      id: expenseId,
      tripId: "t1",
      description,
      amount,
      paidById,
      createdAt: new Date().toISOString(),
    };

    const newSplits: ExpenseSplit[] = mockUsers.map((user, idx) => ({
      id: `s_${expenseId}_${idx}`,
      expenseId,
      userId: user.id,
      amount: splitAmount,
    }));

    if (isSupabaseConfigured()) {
      const res = await saveExpense(newExpense, newSplits);
      if (res.success) {
        loadExpenseData();
      } else {
        alert("Failed to save to Supabase. Updating locally for preview.");
        setExpenses((prev) => [newExpense, ...prev]);
        setSplits((prev) => [...prev, ...newSplits]);
      }
    } else {
      setExpenses((prev) => [newExpense, ...prev]);
      setSplits((prev) => [...prev, ...newSplits]);
    }

    setDescription("");
    setAmountStr("");
    setIsFormOpen(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (isSupabaseConfigured()) {
      const res = await deleteExpense(id);
      if (res.success) {
        loadExpenseData();
      } else {
        alert("Failed to delete from Supabase. Updating locally.");
        setExpenses((prev) => prev.filter((exp) => exp.id !== id));
        setSplits((prev) => prev.filter((split) => split.expenseId !== id));
      }
    } else {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      setSplits((prev) => prev.filter((split) => split.expenseId !== id));
    }
  };

  const getUserName = (id: string) => {
    return mockUsers.find((u) => u.id === id)?.name || "Unknown";
  };

  const getUserAvatar = (id: string) => {
    return mockUsers.find((u) => u.id === id)?.avatarUrl || "";
  };

  if (loading) {
    return (
      <div className={`h-48 flex items-center justify-center ${styles.textMuted}`}>
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading expenses...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Balances Board */}
        <div className={`rounded-xl p-5 space-y-4 ${styles.card}`}>
          <h3 className={styles.cardTitle}>
            Net Balances
          </h3>
          <div className="space-y-3">
            {mockUsers.map((user) => {
              const bal = balances[user.id] || 0;
              const isOwed = bal > 0;
              return (
                <div key={user.id} className={`flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 ${styles.itemBorder}`}>
                  <div className="flex items-center space-x-3">
                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border bg-slate-900 border-slate-800/20" />
                    <span className={`text-sm font-semibold ${styles.textPrimary}`}>{user.name}</span>
                  </div>
                  <span
                    className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
                      bal === 0
                        ? styles.balanceBadgeSettled
                        : isOwed
                        ? styles.balanceBadgeOwed
                        : styles.balanceBadgeOwes
                    }`}
                  >
                    {bal === 0 ? "Settled" : `${isOwed ? "+" : ""}₹${bal.toFixed(2)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Debt Simplification Engine output */}
        <div className={`rounded-xl p-5 space-y-4 ${styles.card}`}>
          <div className="flex items-center justify-between">
            <h3 className={styles.cardTitle}>
              Settlement Plan
            </h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center ${
              isSupabaseConfigured() ? styles.pillActive : styles.pillActiveLoading
            }`}>
              <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" /> Engine Active
            </span>
          </div>

          {simplifiedTransactions.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center space-y-2 opacity-60">
              <Check className={`w-8 h-8 rounded-full p-1.5 border ${styles.pillActive}`} />
              <p className="text-xs">All debts simplified & settled!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
              {simplifiedTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 flex items-center justify-between transition-colors duration-300 border border-current/5 ${styles.card}`}
                >
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold opacity-90">{getUserName(tx.from)}</span>
                    <span className="opacity-60">pays</span>
                    <span className="font-bold opacity-90">{getUserName(tx.to)}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded border border-current/10 ${styles.card}`}>
                    ₹{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Action & Button */}
      <div className="flex justify-between items-center">
        <h3 className={`text-base font-semibold tracking-wide ${styles.textPrimary}`}>Expense Log</h3>
        <button
          disabled={!isActive}
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`font-semibold text-xs py-2 px-4 rounded-lg flex items-center shadow-lg transition-all duration-300 active:scale-95 ${
            !isActive ? styles.btnActiveDisabled : styles.btnActive
          }`}
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[3]" /> Add Expense
        </button>
      </div>

      {/* Interactive Expense Form */}
      {isFormOpen && (
        <form
          onSubmit={handleAddExpense}
          className={`rounded-xl p-5 space-y-4 border animate-in fade-in slide-in-from-top-4 duration-300 ${styles.formBg}`}
        >
          <h4 className={`text-sm font-semibold ${styles.textPrimary}`}>New Group Expense</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block text-[10px] uppercase tracking-wider mb-1.5 ${styles.textMuted}`}>
                Description
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Toll taxes, Snacks"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full rounded-lg py-2 px-3 text-xs ${styles.input}`}
              />
            </div>
            <div>
              <label className={`block text-[10px] uppercase tracking-wider mb-1.5 ${styles.textMuted}`}>
                Amount (INR)
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-2 text-xs font-mono opacity-60`}>₹</span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className={`w-full rounded-lg py-2 pl-7 pr-3 text-xs font-mono ${styles.input}`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-[10px] uppercase tracking-wider mb-1.5 ${styles.textMuted}`}>
                Paid By
              </label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className={`w-full rounded-lg py-2 px-3 text-xs ${styles.input}`}
              >
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
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
              Add & Split Equally
            </button>
          </div>
        </form>
      )}

      {/* Expense List Log */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className={`text-center py-10 text-xs border border-dashed rounded-xl ${styles.card}`}>
            No expenses logged yet.
          </div>
        ) : (
          expenses.map((exp) => {
            const payerName = getUserName(exp.paidById);
            const payerAvatar = getUserAvatar(exp.paidById);
            return (
              <div
                key={exp.id}
                className={`rounded-xl p-4 flex items-center justify-between transition-all duration-300 group ${styles.listCard}`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={payerAvatar}
                    alt={payerName}
                    className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800/10"
                  />
                  <div className="space-y-0.5">
                    <h4 className={`text-sm font-semibold tracking-wide ${styles.textPrimary}`}>
                      {exp.description}
                    </h4>
                    <p className={`text-[10px] ${styles.textMuted}`}>
                      Paid by <span className="font-semibold opacity-90">{payerName}</span> •{" "}
                      {new Date(exp.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className={`text-base font-mono font-bold ${styles.textPrimary}`}>
                      ₹{Number(exp.amount).toFixed(2)}
                    </span>
                    <p className={`text-[9px] font-mono ${styles.textMuted}`}>
                      ₹{(Number(exp.amount) / mockUsers.length).toFixed(2)} each
                    </p>
                  </div>
                  {isActive && (
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className={`p-1.5 rounded-lg border border-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                        themePhase === "morning" || themePhase === "afternoon" 
                          ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          : "text-slate-600 hover:text-rose-500 hover:bg-slate-900/50 hover:border-slate-800"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
