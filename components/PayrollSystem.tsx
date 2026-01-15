
import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, Download, Search, CheckCircle, FileText, Printer, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Paycheck, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface PayrollProps {
  role: UserRole;
}

const MOCK_STAFF_LIST = [
  { id: 's1', name: 'Fatai Mojeed', salary: 250000, dept: 'Operations' },
  { id: 's2', name: 'Mrs Esther', salary: 180000, dept: 'Inventory' },
  { id: 's3', name: 'Amiso Joy', salary: 150000, dept: 'Admin' },
  { id: 's4', name: 'John Doe', salary: 210000, dept: 'Faculty' },
  { id: 's5', name: 'Jane Smith', salary: 195000, dept: 'Marketing' },
];

const PayrollSystem: React.FC<PayrollProps> = ({ role }) => {
  const [payrolls, setPayrolls] = useState<Paycheck[]>([]);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadPayroll();
  }, []);

  const loadPayroll = async () => {
    setIsLoading(true);
    const data = await storageService.getPayroll();
    setPayrolls(data);
    setIsLoading(false);
  };

  const handleInitiatePayroll = async () => {
    setIsInitiating(true);
    setShowConfirmModal(false);

    const today = new Date().toISOString().split('T')[0];
    const newPaychecks: Paycheck[] = MOCK_STAFF_LIST.map(staff => {
      const allowance = Math.floor(staff.salary * 0.1);
      const deduction = Math.floor(staff.salary * 0.02);
      return {
        id: `p-${staff.id}-${Date.now()}`,
        staffName: staff.name,
        baseSalary: staff.salary,
        allowances: allowance,
        deductions: deduction,
        netPay: staff.salary + allowance - deduction,
        status: 'Generated',
        date: today,
      };
    });

    await storageService.savePayroll(newPaychecks);
    await loadPayroll();
    setIsInitiating(false);
  };

  const handleMarkPaid = async (id: string) => {
    await storageService.updatePaycheckStatus(id, 'Paid');
    await loadPayroll();
  };

  const totalPayout = payrolls.reduce((sum, p) => sum + p.netPay, 0);
  const pendingCount = payrolls.filter(p => p.status === 'Generated').length;

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold gold-text">Payroll Management</h2>
          <p className="text-sm text-zinc-500">Persistent ledger of all staff disbursements.</p>
        </div>
        {role === 'CEO' && (
          <button 
            disabled={isInitiating}
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-3 gold-gradient rounded-2xl font-black text-black flex items-center gap-3 disabled:opacity-50"
          >
            <Sparkles size={20} />
            Initiate Monthly Payroll
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Liability</p>
          <p className="text-3xl font-black">₦{totalPayout.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Disbursed (Paid)</p>
          <p className="text-3xl font-black text-emerald-500">
            ₦{payrolls.filter(p => p.status === 'Paid').reduce((s,p) => s + p.netPay, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Pending Staff</p>
          <p className="text-3xl font-black text-amber-500">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
            <tr>
              <th className="px-8 py-4">Employee</th>
              <th className="px-8 py-4">Net Amount</th>
              <th className="px-8 py-4 text-center">Status</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {payrolls.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-800/30">
                <td className="px-8 py-5">
                  <p className="text-sm font-bold text-white">{p.staffName}</p>
                  <p className="text-[10px] text-zinc-600">{p.date}</p>
                </td>
                <td className="px-8 py-5 text-sm font-black">₦{p.netPay.toLocaleString()}</td>
                <td className="px-8 py-5 text-center">
                   <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${p.status === 'Paid' ? 'border-emerald-500/20 text-emerald-500' : 'border-amber-500/20 text-amber-500'}`}>
                      {p.status.toUpperCase()}
                   </span>
                </td>
                <td className="px-8 py-5 text-right">
                   {p.status === 'Generated' && (role === 'Accountant' || role === 'CEO') && (
                     <button onClick={() => handleMarkPaid(p.id)} className="p-2 bg-emerald-500 text-black rounded-lg">
                        <CheckCircle size={18} />
                     </button>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
            <AlertCircle size={48} className="text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold">Initiate Payroll?</h2>
            <p className="text-sm text-zinc-500">This will generate slips for all active staff members.</p>
            <div className="flex gap-4">
              <button onClick={handleInitiatePayroll} className="flex-1 py-3 gold-gradient rounded-xl font-bold text-black">Yes, Initiate</button>
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollSystem;
