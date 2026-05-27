export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  paidById: string;
  createdAt: string;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
}

export interface Transaction {
  from: string;  // Debtor User ID
  to: string;    // Creditor User ID
  amount: number; // Settling amount
}

/**
 * Debt-Simplification Engine using a greedy flow-minimization algorithm.
 * Calculates net balances and returns the absolute minimum transactions to settle all debts.
 */
export function simplifyDebts(expenses: Expense[], splits: ExpenseSplit[]): Transaction[] {
  const balances: Record<string, number> = {};

  // 1. Calculate net balances
  // Add amount paid by the payer
  for (const expense of expenses) {
    const paidBy = expense.paidById;
    balances[paidBy] = (balances[paidBy] || 0) + Number(expense.amount);
  }

  // Subtract amount owed by each split participant
  for (const split of splits) {
    const participant = split.userId;
    balances[participant] = (balances[participant] || 0) - Number(split.amount);
  }

  // 2. Classify users as debtors or creditors (ignoring micro-balances < $0.01)
  const debtors: { userId: string; balance: number }[] = [];
  const creditors: { userId: string; balance: number }[] = [];

  for (const [userId, balance] of Object.entries(balances)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded < -0.01) {
      debtors.push({ userId, balance: rounded });
    } else if (rounded > 0.01) {
      creditors.push({ userId, balance: rounded });
    }
  }

  // Sort debtors descending (most negative first)
  // Sort creditors descending (most positive first)
  debtors.sort((a, b) => a.balance - b.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const transactions: Transaction[] = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  // 3. Match debtors and creditors greedily
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const oweAmount = -debtor.balance;
    const creditAmount = creditor.balance;
    
    // Settle the smaller of the two balances
    const settleAmount = Math.round(Math.min(oweAmount, creditAmount) * 100) / 100;

    if (settleAmount > 0) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: settleAmount,
      });
    }

    debtor.balance += settleAmount;
    creditor.balance -= settleAmount;

    // Advance pointers if balances are fully settled
    if (Math.abs(debtor.balance) < 0.01) {
      i++;
    }
    if (Math.abs(creditor.balance) < 0.01) {
      j++;
    }
  }

  return transactions;
}
