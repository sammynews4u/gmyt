
import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, Calendar, Users, CheckCircle2, AlertCircle, Loader2, Filter } from 'lucide-react';
import { storageService } from '../services/storageService';
import { AttendanceRecord, UserAccount, UserRole } from '../types';

interface AttendanceProps {
  user: UserAccount;
}

const AttendanceRegister: React.FC<AttendanceProps> = ({ user }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isManagement = user.role === 'CEO' || user.role === 'Project Manager';

  useEffect(() => {
    loadAttendance();

    const handleSyncComplete = () => {
      loadAttendance();
    };
    window.addEventListener('gmyt-sync-complete', handleSyncComplete);
    return () => window.removeEventListener('gmyt-sync-complete', handleSyncComplete);
  }, []);

  const loadAttendance = async () => {
    setIsLoading(true);
    const data = await storageService.getAttendance();
    setRecords(data);
    setIsLoading(false);
  };

  const handleClockIn = async () => {
    setIsSyncing(true);
    const now = new Date();
    const record: AttendanceRecord = {
      id: `att-${user.id}-${now.toDateString()}`,
      userId: user.id,
      userName: user.name,
      date: now.toLocaleDateString(),
      clockIn: now.toLocaleTimeString(),
      clockOut: null,
      status: now.getHours() >= 9 && now.getMinutes() > 0 ? 'Late' : 'Present'
    };
    await storageService.saveAttendanceRecord(record);
    await loadAttendance();
    setIsSyncing(false);
  };

  const handleClockOut = async (record: AttendanceRecord) => {
    setIsSyncing(true);
    const now = new Date();
    const updatedRecord: AttendanceRecord = {
      ...record,
      clockOut: now.toLocaleTimeString()
    };
    await storageService.saveAttendanceRecord(updatedRecord);
    await loadAttendance();
    setIsSyncing(false);
  };

  const todayRecord = records.find(r => r.userId === user.id && r.date === new Date().toLocaleDateString());

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Individual Clock Controls */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock size={120} />
        </div>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black gold-text mb-2">Daily Presence Check</h2>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Please register your attendance for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. 
            Corporate policy requires clock-in before 9:00 AM.
          </p>

          <div className="flex flex-wrap gap-4">
            {!todayRecord ? (
              <button 
                onClick={handleClockIn}
                disabled={isSyncing}
                className="px-8 py-4 gold-gradient text-black font-black rounded-2xl flex items-center gap-3 shadow-xl shadow-amber-500/10 hover:scale-105 transition-all disabled:opacity-50"
              >
                <LogIn size={20} /> Clock In Now
              </button>
            ) : !todayRecord.clockOut ? (
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Session</p>
                    <p className="text-sm font-bold text-white">Clocked In at {todayRecord.clockIn}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleClockOut(todayRecord)}
                  disabled={isSyncing}
                  className="px-8 py-4 bg-rose-500 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-rose-600 transition-all disabled:opacity-50"
                >
                  <LogOut size={20} /> Clock Out
                </button>
              </div>
            ) : (
              <div className="px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="text-zinc-500" size={20} />
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Day Completed</p>
                  <p className="text-sm font-bold text-white">Signed Off at {todayRecord.clockOut}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register View */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">{isManagement ? 'Corporate Attendance Register' : 'Your Attendance History'}</h3>
            <p className="text-xs text-zinc-500">Live data synchronization active.</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-2.5 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
                <Filter size={18} />
             </button>
             <button className="px-4 py-2.5 bg-zinc-800 rounded-xl text-xs font-bold text-zinc-100">Export Report</button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
            <tr>
              <th className="px-8 py-4">Date</th>
              {isManagement && <th className="px-8 py-4">Staff Member</th>}
              <th className="px-8 py-4">Clock In</th>
              <th className="px-8 py-4">Clock Out</th>
              <th className="px-8 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {records
              .filter(r => isManagement ? true : r.userId === user.id)
              .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((r) => (
              <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors group">
                <td className="px-8 py-5 text-sm text-zinc-300 font-mono">{r.date}</td>
                {isManagement && (
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-white">{r.userName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{r.userId}</p>
                  </td>
                )}
                <td className="px-8 py-5 text-sm text-zinc-400">{r.clockIn}</td>
                <td className="px-8 py-5 text-sm text-zinc-400">{r.clockOut || '--:--'}</td>
                <td className="px-8 py-5 text-center">
                   <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${r.status === 'Present' ? 'border-emerald-500/20 text-emerald-500' : 'border-rose-500/20 text-rose-500'}`}>
                      {r.status.toUpperCase()}
                   </span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-zinc-600 italic">No attendance records found in the database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceRegister;
