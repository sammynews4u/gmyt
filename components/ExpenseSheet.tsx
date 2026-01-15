
import React from 'react';
import { Banknote, FileText, PieChart, TrendingDown } from 'lucide-react';
import { Expense } from '../types';

const MOCK_EXPENSES: Expense[] = [
  { id: '1', invoiceDate: '2025-12-01', accountName: 'Store Supplies', problem: 'Missing inventory labels', purpose: 'Restock labeling materials', quantity: 500, amount: 25000, status: 'Paid' },
  { id: '2', invoiceDate: '2025-12-02', accountName: 'Logistics', problem: 'Urgent document delivery', purpose: 'Courier for CEO sign-off', quantity: 1, amount: 5000, status: 'Approved' },
];

const ExpenseSheet: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <p className="text-zinc-500 text-sm">Total Budget</p>
          <p className="text-2xl font-bold">₦1,200,000</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <p className="text-zinc-500 text-sm">Approved</p>
          <p className="text-2xl font-bold text-amber-500">₦450,000</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <p className="text-zinc-500 text-sm">Spent</p>
          <p className="text-2xl font-bold text-emerald-500">₦380,000</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <p className="text-zinc-500 text-sm">Remaining</p>
          <p className="text-2xl font-bold">₦750,000</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Banknote className="text-amber-500" />
            <h3 className="text-lg font-bold">Expense Log</h3>
          </div>
          <button className="px-4 py-2 bg-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors">
            Export Report
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase">
            <tr>
              <th className="px-8 py-4 font-semibold">Invoice Date</th>
              <th className="px-8 py-4 font-semibold">Account/Vendor</th>
              <th className="px-8 py-4 font-semibold">Problem/Purpose</th>
              <th className="px-8 py-4 font-semibold text-right">Amount (₦)</th>
              <th className="px-8 py-4 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {MOCK_EXPENSES.map((exp) => (
              <tr key={exp.id} className="hover:bg-zinc-800/30">
                <td className="px-8 py-4 text-sm text-zinc-400">{exp.invoiceDate}</td>
                <td className="px-8 py-4">
                  <p className="text-sm font-medium text-white">{exp.accountName}</p>
                </td>
                <td className="px-8 py-4">
                  <p className="text-sm text-zinc-300">{exp.problem}</p>
                  <p className="text-xs text-zinc-500 mt-1">{exp.purpose}</p>
                </td>
                <td className="px-8 py-4 text-sm font-bold text-white text-right">
                  ₦{exp.amount.toLocaleString()}
                </td>
                <td className="px-8 py-4 text-center">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${exp.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                    {exp.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseSheet;
