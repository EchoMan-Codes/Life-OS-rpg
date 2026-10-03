import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  TrendingDown,
  ShoppingBag,
  Coffee,
  Heart,
  BookOpen,
  Car,
  MoreHorizontal,
} from 'lucide-react';
import { useExpenses, useFinanceSummary, useCreateExpense } from '@/features/finance/hooks';

const CATEGORY_ICONS = {
  food: Coffee,
  shopping: ShoppingBag,
  health: Heart,
  study: BookOpen,
  transport: Car,
  other: MoreHorizontal,
};

export default function FinancePage() {
  const { data: summary } = useFinanceSummary();
  const { data: expenses = [] } = useExpenses();
  const createExpenseMutation = useCreateExpense();

  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount) return;
    await createExpenseMutation.mutateAsync({
      amount: parseFloat(amount),
      category,
      note,
    });
    setModalOpen(false);
    setAmount('');
    setNote('');
  };

  const totalSpent = summary?.totalMonth || 0;

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-display text-white tracking-tight">
              Finance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              CONTROL TODAY • FREEDOM TOMORROW
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Smart budgeting, daily expenses, and wealth governance
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* ── Total Spent Card ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1A1208] via-[#100D06] to-[#0A071E] border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-amber-300/80">This Month</p>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight mt-1">
              ₹{totalSpent.toLocaleString()}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <TrendingDown size={14} />
            <span>Under Budget</span>
          </div>
        </div>

        {/* Monthly Breakdown Stats */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/10 text-center">
          <div className="p-2 rounded-2xl bg-white/[0.03]">
            <p className="text-[10px] font-mono uppercase text-slate-400">Transactions</p>
            <p className="text-sm font-bold text-white mt-0.5">{summary?.countMonth || 0}</p>
          </div>
          <div className="p-2 rounded-2xl bg-white/[0.03]">
            <p className="text-[10px] font-mono uppercase text-slate-400">Top Category</p>
            <p className="text-sm font-bold text-amber-300 mt-0.5 capitalize">
              {summary?.categories?.[0]?.category || 'None'}
            </p>
          </div>
          <div className="p-2 rounded-2xl bg-white/[0.03]">
            <p className="text-[10px] font-mono uppercase text-slate-400">Status</p>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">Healthy</p>
          </div>
        </div>
      </div>

      {/* ── Spending Categories ── */}
      {summary?.categories && summary.categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Spending by Category
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {summary.categories.map((cat) => (
              <div
                key={cat.category}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
              >
                <span className="text-xs font-bold text-white capitalize">{cat.category}</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ₹{cat.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Transactions ── */}
      <div className="space-y-3">
        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Recent Transactions
        </p>

        {expenses.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-slate-500 text-xs">
            No expenses logged yet. Tell Jeevan AI: <span className="text-amber-400 font-mono">&quot;I spent ₹450 today&quot;</span> or tap &apos;Add Expense&apos;!
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => {
              const Icon = CATEGORY_ICONS[exp.category] || CATEGORY_ICONS.other;
              return (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Icon size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{exp.note || exp.category}</p>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {exp.category} • {new Date(exp.spent_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-mono font-bold text-rose-400">
                    -₹{parseFloat(exp.amount).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Add Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#140F08] border border-amber-500/40 p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-display">Add Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="450"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1A140A] border border-white/10 text-white text-xs focus:border-amber-400 focus:outline-none"
                >
                  <option value="food">Food & Dining</option>
                  <option value="shopping">Shopping</option>
                  <option value="study">Study & Education</option>
                  <option value="health">Health & Fitness</option>
                  <option value="transport">Transport</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Dinner, Book, Groceries"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Record Expense
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
