
import React, { useState, useEffect } from 'react';
import { Banknote, FileText, Send, CheckCircle, XCircle, Loader2, Plus, ShieldCheck, PieChart, Activity, Wallet } from 'lucide-react';
import { Expense, UserAccount } from '../types';
import { storageService } from '../services/storageService';

interface ExpenseSheetProps {
  user: UserAccount;
}

export default function ExpenseSheet({ user }: ExpenseSheetProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCEO = user.role === 'CEO';
  const isAccountant = user.role === 'Accountant';

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    accountName: '',
    problem: '',
    purpose: '',
    quantity: 1,
    amount: 0,
    status: 'Pending'
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    const data = await storageService.getExpenses();
    setExpenses(data);
    setIsLoading(false);
  };

  const handleTenderBudget = async () => {
    if (!newExpense.accountName || !newExpense.amount) {
      alert("Vendor and Amount are required.");
      return;
    }
    setIsSubmitting(true);
    const expenseToSave: Expense = {
      ...newExpense,
      id: `exp-${Date.now()}`,
      invoiceDate: new Date().toLocaleDateString(),
      status: 'Pending'
    } as Expense;

    await storageService.saveExpense(expenseToSave);
    await loadExpenses();
    setIsModalOpen(false);
    setIsSubmitting(false);
    setNewExpense({ accountName: '', problem: '', purpose: '', quantity: 1, amount: 0, status: 'Pending' });
  };

  const handleProcessExpense = async (id: string, status: Expense['status']) => {
    if (!isCEO) return;
    await storageService.updateExpenseStatus(id, status);
    await loadExpenses();
  };

  const totalBudget = 5000000;
  const totalSpent = expenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
  const pendingRequests = expenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div>
          <h2 className="text-2xl font-black gold-text uppercase tracking-tight">Financial Strategy Ledger</h2>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
             Corporate Treasury Node | Protocol GMYT-FIN-V1
             {isCEO && <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck size={14} /> CEO Disbursement Authority Active</span>}
          </p>
        </div>
        {(isAccountant || isCEO) && (
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 gold-gradient rounded-xl font-black text-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-amber-500/20">
            <Plus size={18} /> Tender New Budget
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl group">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
             <PieChart size={12} className="text-blue-500" /> Allocated Treasury
          </p>
          <p className="text-2xl font-black">₦{totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl border-l-4 border-l-emerald-500">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
             <Activity size={12} className="text-emerald-500" /> Disbursed (Paid)
          </p>
          <p className="text-2xl font-black text-emerald-500">₦{totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl border-l-4 border-l-amber-500">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
             <FileText size={12} className="text-amber-500" /> Tendered for Approval
          </p>
          <p className="text-2xl font-black text-amber-500">₦{pendingRequests.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
            <tr>
              <th className="px-8 py-4">Account Node</th>
              <th className="px-8 py-4">Strategic Purpose</th>
              <th className="px-8 py-4 text-right">Budget (₦)</th>
              <th className="px-8 py-4 text-center">Status</th>
              {(isCEO) && <th className="px-8 py-4 text-right">Control Authority</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-zinc-800/30 group transition-all">
                <td className="px-8 py-5">
                  <p className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors">{exp.accountName}</p>
                  <p className="text-[10px] text-zinc-600 uppercase font-mono font-bold tracking-tighter">{exp.invoiceDate}</p>
                </td>
                <td className="px-8 py-5">
                  <p className="text-xs text-zinc-300 font-medium">{exp.problem}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 italic">{exp.purpose}</p>
                </td>
                <td className="px-8 py-5 text-sm font-black text-right">₦{exp.amount.toLocaleString()}</td>
                <td className="px-8 py-5 text-center">
                   <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${exp.status === 'Paid' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : exp.status === 'Approved' ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' : 'border-amber-500/20 text-amber-500 bg-amber-500/5'}`}>
                      {exp.status.toUpperCase()}
                   </span>
                </td>
                {(isCEO) && (
                  <td className="px-8 py-5 text-right">
                    {exp.status === 'Pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleProcessExpense(exp.id, 'Approved')} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all" title="Approve Budget"><CheckCircle size={16}/></button>
                        <button onClick={() => handleProcessExpense(exp.id, 'Pending')} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all" title="Deny Approval"><XCircle size={16}/></button>
                      </div>
                    )}
                    {exp.status === 'Approved' && (
                      <button onClick={() => handleProcessExpense(exp.id, 'Paid')} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all">
                        <Wallet size={14} /> Disburse Funds
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr><td colSpan={isCEO ? 5 : 4} className="px-8 py-12 text-center text-zinc-600 italic">No financial ledger entries detected.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-500">
             <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl"><Banknote className="text-amber-500" /></div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Tender Strategic Budget</h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-500 hover:text-white transition-all hover:bg-zinc-800"><XCircle size={28}/></button>
             </div>
             <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Payee / Account Node</label>
                      <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-6 text-sm text-white focus:border-amber-500 outline-none shadow-inner font-bold" value={newExpense.accountName} onChange={e => setNewExpense({...newExpense, accountName: e.target.value})} placeholder="Vendor or Staff Name" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Total Requirement (₦)</label>
                      <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-6 text-sm text-white focus:border-emerald-500 outline-none shadow-inner font-black text-emerald-500" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Strategic Bottleneck (Problem)</label>
                   <textarea rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-6 text-sm text-white focus:border-amber-500 outline-none shadow-inner resize-none" value={newExpense.problem} onChange={e => setNewExpense({...newExpense, problem: e.target.value})} placeholder="What operational issue does this solve?" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Intended Strategic Purpose</label>
                   <textarea rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-6 text-sm text-white focus:border-amber-500 outline-none shadow-inner resize-none" value={newExpense.purpose} onChange={e => setNewExpense({...newExpense, purpose: e.target.value})} placeholder="Detailed utilization plan..." />
                </div>
                <button onClick={handleTenderBudget} disabled={isSubmitting} className="w-full py-5 gold-gradient text-black font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:shadow-xl transition-all disabled:opacity-50">
                   {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Send size={18}/> Commit to CEO for Review</>}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
