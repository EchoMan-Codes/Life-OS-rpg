import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  TrendingDown,
  TrendingUp,
  ShoppingBag,
  Coffee,
  Heart,
  BookOpen,
  Car,
  MoreHorizontal,
  PieChart,
  ShieldAlert,
  Target,
  Sparkles,
  Calendar,
  AlertCircle,
  CreditCard,
  Percent,
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

const CATEGORY_BUDGETS = [
  { category: 'food', label: 'Food & Dining', budget: 8000, spent: 4200, color: 'from-amber-500 to-orange-500' },
  { category: 'study', label: 'Books & Courses', budget: 4000, spent: 1850, color: 'from-indigo-500 to-blue-500' },
  { category: 'transport', label: 'Transit & Fuel', budget: 3000, spent: 1400, color: 'from-cyan-500 to-teal-500' },
  { category: 'shopping', label: 'Gear & Tech', budget: 5000, spent: 4800, color: 'from-purple-500 to-pink-500', alert: true },
  { category: 'health', label: 'Fitness & Health', budget: 3000, spent: 900, color: 'from-emerald-500 to-green-500' },
];

const SAVINGS_GOALS = [
  { name: 'Emergency Runway', target: 50000, current: 35000, color: 'from-emerald-500 to-teal-500' },
  { name: 'Developer Workstation', target: 80000, current: 48000, color: 'from-indigo-500 to-purple-500' },
];

export default function FinancePage() {
  const { data: summary } = useFinanceSummary();
  const { data: expenses = [] } = useExpenses();
  const createExpenseMutation = useCreateExpense();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'expenses' | 'budgets' | 'analytics'
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

  const totalSpent = summary?.totalMonth || expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const monthlyBudget = 25000;
  const remaining = Math.max(0, monthlyBudget - totalSpent);
  const percentUsed = Math.min(100, Math.round((totalSpent / monthlyBudget) * 100));

  return (
    <div className="min-h-screen pt-20 pb-28 md:pb-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Financial Vault
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              WEALTH GOVERNANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Safe to spend: <span className="text-emerald-400 font-bold">₹{remaining.toLocaleString()}</span> • Monthly Cap: <span className="text-white font-bold">₹{monthlyBudget.toLocaleString()}</span>
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

      {/* ── Finance Sub-Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Vault Overview', icon: Wallet },
          { id: 'expenses', label: 'Transactions', icon: CreditCard },
          { id: 'budgets', label: 'Budgets & Limits', icon: Target },
          { id: 'analytics', label: 'Audits & Insights', icon: PieChart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Vault Balance Hero */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C1408] via-[#100D05] to-[#060412] border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-amber-300">
                  Total Spent This Month
                </span>
                <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight mt-1">
                  ₹{totalSpent.toLocaleString()}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {percentUsed}% of your ₹{monthlyBudget.toLocaleString()} threshold consumed.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Available Buffer</span>
                  <p className="text-xl font-black text-emerald-400 font-display">₹{remaining.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                  <ArrowDownLeft size={20} />
                </div>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentUsed > 85 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Daily Burn Rate</span>
              <p className="text-xl font-black text-white font-display">₹{Math.round(totalSpent / 28)}</p>
              <p className="text-[10px] text-slate-400">Within optimal range</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Savings Rate</span>
              <p className="text-xl font-black text-emerald-400 font-display">42%</p>
              <p className="text-[10px] text-slate-400">Income to savings</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Active Subscriptions</span>
              <p className="text-xl font-black text-indigo-400 font-display">4 Services</p>
              <p className="text-[10px] text-slate-400">₹1,199 / month</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Financial Health</span>
              <p className="text-xl font-black text-amber-400 font-display">86 / 100</p>
              <p className="text-[10px] text-slate-400">Disciplined status</p>
            </div>
          </div>

          {/* Savings Goals Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold font-display text-white">Savings Targets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAVINGS_GOALS.map((goal) => {
                const prog = Math.round((goal.current / goal.target) * 100);
                return (
                  <div
                    key={goal.name}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{goal.name}</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{prog}%</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      ₹{goal.current.toLocaleString()} / ₹{goal.target.toLocaleString()}
                    </p>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${goal.color}`}
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSACTIONS & LOGS ── */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-display text-white">Transaction History</h2>
            <span className="text-xs font-mono text-slate-400">{expenses.length} records</span>
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map((item) => {
                const Icon = CATEGORY_ICONS[item.category] || MoreHorizontal;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white capitalize">
                          {item.note || item.category}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.category} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-rose-400">
                      -₹{parseFloat(item.amount).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-xs text-slate-400">No transactions recorded this month.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: BUDGETS & LIMITS ── */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORY_BUDGETS.map((cat) => {
              const used = Math.round((cat.spent / cat.budget) * 100);
              return (
                <div
                  key={cat.category}
                  className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white font-display">{cat.label}</span>
                    <span className={`text-xs font-mono font-bold ${used > 90 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {used}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    ₹{cat.spent.toLocaleString()} / ₹{cat.budget.toLocaleString()} limit
                  </p>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${used > 90 ? 'bg-rose-500' : `bg-gradient-to-r ${cat.color}`}`}
                      style={{ width: `${Math.min(100, used)}%` }}
                    />
                  </div>
                  {cat.alert && (
                    <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-medium pt-1">
                      <AlertCircle size={12} />
                      <span>Warning: 96% of category limit reached</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: AUDITS & INSIGHTS ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C1408] to-[#0A071E] border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles size={18} />
              <h3 className="text-sm font-bold text-white font-display">AI Financial Spending Audit</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your overall food spending represents 45% of total discretionary outflows this month. Diverting 15% to your Workstation savings goal will allow you to acquire your hardware 18 days ahead of schedule.
            </p>
          </div>
        </div>
      )}

      {/* ── Quick Add Expense Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#1C1408] border border-amber-500/30 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white font-display">Add Expense</h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-base font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  >
                    <option value="food">Food & Dining</option>
                    <option value="study">Books & Study</option>
                    <option value="transport">Transit & Fuel</option>
                    <option value="shopping">Shopping & Gear</option>
                    <option value="health">Fitness & Health</option>
                    <option value="other">Other Outflow</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. DBMS Textbook, Groceries"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
                  >
                    Record Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
