
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Target, AlertTriangle, CheckCircle2, Clock, Banknote, Users, Briefcase, Quote, Sparkles, Loader2, ListChecks } from 'lucide-react';
import { UserRole } from '../types';
import { getDailyMotivation } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface DashboardProps {
  role: UserRole;
}

const data = [
  { name: 'Week 1', tasks: 12, completed: 8, cost: 450 },
  { name: 'Week 2', tasks: 18, completed: 14, cost: 320 },
  { name: 'Week 3', tasks: 15, completed: 12, cost: 580 },
  { name: 'Week 4', tasks: 22, completed: 19, cost: 410 },
];

const performanceData = [
  { name: 'Mon', score: 85 },
  { name: 'Tue', score: 92 },
  { name: 'Wed', score: 88 },
  { name: 'Thu', score: 95 },
  { name: 'Fri', score: 90 },
];

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const isAdmin = role === 'CEO' || role === 'Project Manager';
  const isFinancial = role === 'CEO' || role === 'Accountant';
  const [motivation, setMotivation] = useState<string | null>(null);
  const [isMotivationLoading, setIsMotivationLoading] = useState(true);
  const [dailySop, setDailySop] = useState<string | null>(null);

  useEffect(() => {
    fetchMotivation();
    fetchUserSop();
  }, []);

  const fetchMotivation = async () => {
    setIsMotivationLoading(true);
    const quote = await getDailyMotivation();
    setMotivation(quote || "Precision in strategy is the path to excellence.");
    setIsMotivationLoading(false);
  };

  const fetchUserSop = async () => {
    const saved = localStorage.getItem('gmyt_session');
    if (saved) {
      const user = JSON.parse(saved);
      // Fetch latest user data to get updated SOP
      const users = await storageService.getUsers();
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser?.dailySop) {
        setDailySop(currentUser.dailySop);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Motivation Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:text-amber-500 transition-all duration-700">
            <Quote size={120} />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/5 shrink-0">
                {isMotivationLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Strategic Insight</h4>
                {isMotivationLoading ? (
                  <div className="h-6 w-3/4 bg-zinc-800 animate-pulse rounded-lg mx-auto md:mx-0"></div>
                ) : (
                  <p className="text-lg font-bold text-white tracking-tight leading-relaxed italic">
                      "{motivation}"
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Daily SOP Card - Only shows if SOP is defined */}
        {dailySop && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ListChecks size={120} />
            </div>
            <div className="relative z-10 space-y-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><ListChecks size={20} /></div>
                  <h4 className="text-[12px] font-black text-blue-500 uppercase tracking-[0.3em]">Daily Standing Orders (SOP)</h4>
               </div>
               <div className="bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800/50 max-h-32 overflow-y-auto no-scrollbar">
                  <p className="text-sm text-zinc-300 font-medium whitespace-pre-wrap leading-relaxed">{dailySop}</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isFinancial && (
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-zinc-800 rounded-xl group-hover:scale-110 transition-transform"><Banknote className="text-emerald-500" /></div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">+12%</span>
            </div>
            <h4 className="text-zinc-400 text-sm">Monthly Budget</h4>
            <p className="text-2xl font-bold mt-1">₦4.2M</p>
          </div>
        )}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-800 rounded-xl group-hover:scale-110 transition-transform"><Target className="text-amber-500" /></div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">88%</span>
          </div>
          <h4 className="text-zinc-400 text-sm">{role === 'Staff' ? 'Your Progress' : 'Task Completion'}</h4>
          <p className="text-2xl font-bold mt-1">42 Tasks</p>
        </div>
        {isAdmin && (
           <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-zinc-800 rounded-xl group-hover:scale-110 transition-transform"><Users className="text-blue-500" /></div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">12 Active</span>
            </div>
            <h4 className="text-zinc-400 text-sm">Staff Count</h4>
            <p className="text-2xl font-bold mt-1">16 Members</p>
          </div>
        )}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-800 rounded-xl group-hover:scale-110 transition-transform"><AlertTriangle className="text-rose-500" /></div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-rose-500/10 text-rose-500">Critical</span>
          </div>
          <h4 className="text-zinc-400 text-sm">Pending Risks</h4>
          <p className="text-2xl font-bold mt-1">3 High</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Analytics */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-zinc-100">
            {role === 'Accountant' ? 'Operational Costs (₦k)' : 'Task Progression'} 
            <span className="text-xs font-normal text-zinc-500">(Weekly Trends)</span>
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value) => [`₦${value}k`, 'Value']}
                />
                {role === 'Accountant' ? (
                  <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                ) : (
                  <>
                    <Bar dataKey="tasks" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Line */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
          <h3 className="text-lg font-bold mb-6 text-zinc-100">System Efficiency</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#f59e0b" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Role-Based Tables */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-8 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-100">
            {role === 'Staff' ? 'Your Recent Assignments' : 'Urgent Notifications'}
          </h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase">
            <tr>
              <th className="px-8 py-3 font-semibold">Status</th>
              <th className="px-8 py-3 font-semibold">Subject</th>
              <th className="px-8 py-3 font-semibold">Context</th>
              <th className="px-8 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {[
              { s: 'Pending', d: 'Document Sign-off Required', c: 'Group CEO', a: 'Review' },
              { s: 'Alert', d: 'Low Stock: Sewing Needle X12', c: 'Mrs Esther', a: 'Order' },
              { s: 'Info', d: 'Payroll Draft Ready', c: 'System Accountant', a: 'Approve' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-8 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${row.s === 'Alert' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'}`}>
                    {row.s}
                  </span>
                </td>
                <td className="px-8 py-4 text-sm text-zinc-200">{row.d}</td>
                <td className="px-8 py-4 text-sm text-zinc-400">{row.c}</td>
                <td className="px-8 py-4 text-right">
                   <button className="text-amber-500 text-xs font-bold hover:underline">{row.a}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
