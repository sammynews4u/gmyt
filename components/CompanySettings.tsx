
import React, { useState, useEffect } from 'react';
import { Settings, Image as ImageIcon, Globe, MapPin, Phone, Mail, Save, UserPlus, Trash2, ShieldCheck, Loader2, Key, Download, Upload, Database, Settings2, Code, ChevronRight, Check, X, ShieldAlert, History, Cloud, CloudOff, RefreshCw, Zap, Briefcase, FileText } from 'lucide-react';
import { UserAccount, UserRole, PasswordChangeRequest } from '../types';
import { storageService } from '../services/storageService';
import { STORES } from '../services/db';

const DEPARTMENTS = [
  'EXECUTIVE',
  'ICT',
  'FACULTY - BUSINESS',
  'FACULTY - FASHION',
  'OPERATIONS',
  'ADMIN',
  'CREATIVES',
  'SECURITY',
  'ACCOUNTING',
  'STORE',
  'FACILITATOR'
];

interface SettingsProps {
  role: UserRole;
}

const CompanySettings: React.FC<SettingsProps> = ({ role }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [pwRequests, setPwRequests] = useState<PasswordChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [inspectedStore, setInspectedStore] = useState<string>('users');
  const [rawJson, setRawJson] = useState<string>('');
  
  const [newPassword, setNewPassword] = useState('');
  const [isRequestingPw, setIsRequestingPw] = useState(false);

  // Sync State
  const [syncKey, setSyncKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');

  const [newUser, setNewUser] = useState({
    name: '',
    role: 'Staff' as UserRole,
    position: '',
    department: 'OPERATIONS',
    username: '',
    password: 'password123',
    jobDescription: ''
  });

  const [company, setCompany] = useState({
    name: 'GMYT GROUP LTD',
    address: '12 Fashion Way, Victoria Island, Lagos',
    phone: '+234 800 123 4567',
    email: 'info@gmyt.group',
    website: 'www.gmyt.group'
  });

  useEffect(() => {
    const saved = localStorage.getItem('gmyt_session');
    if (saved) setCurrentUser(JSON.parse(saved));
    loadUsers();
    loadPwRequests();
    inspectDatabase();
    loadSyncStatus();
  }, [inspectedStore]);

  const loadSyncStatus = async () => {
    const key = await storageService.getSyncKey();
    if (key) setSyncKey(key);
    const status = await storageService.getDbStatus();
    setLastSync(status.lastSync);
  };

  const inspectDatabase = async () => {
    const dump = await storageService.exportDatabase();
    const parsed = JSON.parse(dump);
    setRawJson(JSON.stringify(parsed[inspectedStore] || [], null, 2));
  };

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await storageService.getUsers();
    setUsers(data);
    setIsLoading(false);
  };

  const loadPwRequests = async () => {
    const data = await storageService.getPasswordRequests();
    setPwRequests(data);
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.position) {
      alert("Name, Position, and Username are mandatory.");
      return;
    }
    setIsSaving(true);
    const account: UserAccount = {
      ...newUser,
      id: `u-${Date.now()}`
    } as UserAccount;
    await storageService.saveUser(account);
    await loadUsers();
    setNewUser({ name: '', role: 'Staff', position: '', department: 'OPERATIONS', username: '', password: 'password123', jobDescription: '' });
    setIsSaving(false);
  };

  const handleSubmitPwRequest = async () => {
    if (!newPassword || !currentUser) return;
    setIsRequestingPw(true);
    const request: PasswordChangeRequest = {
      id: `pwr-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      newPassword: newPassword,
      status: 'Pending',
      requestDate: new Date().toLocaleDateString()
    };
    await storageService.createPasswordRequest(request);
    await loadPwRequests();
    
    if (currentUser.role === 'CEO') {
      const updatedUser = { ...currentUser, password: newPassword };
      localStorage.setItem('gmyt_session', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      alert("Executive credentials updated immediately.");
    } else {
      alert("Password change request submitted to CEO for approval.");
    }
    
    setNewPassword('');
    setIsRequestingPw(false);
  };

  const handleProcessPwRequest = async (id: string, approved: boolean) => {
    await storageService.processPasswordRequest(id, approved);
    await loadPwRequests();
    await loadUsers();
  };

  const handleConnectSync = async () => {
    if (!syncKey.trim()) return;
    setIsSyncing(true);
    await storageService.setSyncKey(syncKey.trim());
    await loadSyncStatus();
    await loadUsers();
    setIsSyncing(false);
    alert("Strategic Sync Node Established. Pulling cloud state...");
  };

  const handleGenerateSyncKey = () => {
    const newKey = `GMYT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setSyncKey(newKey);
  };

  const handleExportDB = async () => {
    setIsExporting(true);
    const data = await storageService.exportDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gmyt-enterprise-db-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setIsExporting(false);
  };

  const handleImportDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await storageService.importDatabase(content);
      if (success) {
        alert("IndexedDB synchronized successfully. Reloading system...");
        window.location.reload();
      } else {
        alert("Import failed. Invalid database schema detected.");
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteUser = async (id: string) => {
    if (id === 'u-ceo') return alert("Cannot delete original CEO account.");
    if (confirm("Permanently remove this user's access?")) {
      await storageService.deleteUser(id);
      await loadUsers();
    }
  };

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  const myRequests = pwRequests.filter(r => r.userId === currentUser?.id);
  const pendingApprovals = pwRequests.filter(r => r.status === 'Pending' && r.userId !== currentUser?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Strategic Sync Hub (Multi-Device) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Cloud className="text-blue-500" />
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">Strategic Cloud Sync Hub</h2>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-8 relative">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <RefreshCw size={120} className="animate-spin-slow" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
              <div className="space-y-6">
                 <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Multi-Device Provisioning</h3>
                    <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Protocol: Vercel Cloud Mirror v1.2</p>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Enterprise Sync Key</label>
                       <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="GMYT-XXXX-XXXX"
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none text-white font-mono"
                            value={syncKey}
                            onChange={e => setSyncKey(e.target.value)}
                          />
                          <button 
                            onClick={handleGenerateSyncKey}
                            className="p-3 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
                            title="Generate Key"
                          >
                             <Zap size={18} />
                          </button>
                       </div>
                    </div>
                    <button 
                      onClick={handleConnectSync}
                      disabled={isSyncing || !syncKey}
                      className="w-full py-4 gold-gradient text-black font-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all disabled:opacity-50"
                    >
                       {isSyncing ? <Loader2 className="animate-spin" size={14} /> : <><RefreshCw size={14} /> Establish Sync Link</>}
                    </button>
                 </div>
              </div>

              <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center text-center space-y-4">
                 <div className="flex items-center justify-center gap-3">
                    {syncKey ? <Cloud className="text-emerald-500" size={32} /> : <CloudOff className="text-zinc-700" size={32} />}
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Node Status</p>
                    <p className={`text-lg font-bold mt-1 ${syncKey ? 'text-emerald-500' : 'text-zinc-600'}`}>
                       {syncKey ? 'ACTIVE HUB' : 'LOCAL ONLY'}
                    </p>
                 </div>
                 <div className="pt-4 border-t border-zinc-800/50">
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Last Remote Mirror</p>
                    <p className="text-xs text-zinc-400 font-mono mt-1">{lastSync}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Database Maintenance Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Database className="text-amber-500" />
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">Database Node Control</h2>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-8">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">IndexedDB Enterprise Pool</h3>
                 <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Persistence Engine: Local Transactional V3</p>
              </div>
              <div className="flex gap-4">
                 <button 
                   onClick={handleExportDB}
                   disabled={isExporting}
                   className="px-6 py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-800 transition-all border border-zinc-800"
                 >
                   <Download size={16} /> Data Export
                 </button>
                 <label className="px-6 py-3 gold-gradient text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all cursor-pointer">
                   <Upload size={16} /> Data Restore
                   <input type="file" className="hidden" accept=".json" onChange={handleImportDB} />
                 </label>
              </div>
           </div>

           {/* Raw Data Inspector */}
           <div className="space-y-4">
              <div className="flex items-center gap-3 border-l-2 border-amber-500 pl-4">
                <Code className="text-amber-500" size={16} />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Document Inspector</h4>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[400px]">
                 <div className="lg:col-span-3 space-y-2 overflow-y-auto no-scrollbar">
                    {Object.keys(STORES).map(key => (
                      <button 
                        key={key}
                        onClick={() => setInspectedStore((STORES as any)[key])}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${inspectedStore === (STORES as any)[key] ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' : 'bg-zinc-950 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}`}
                      >
                        {key} <ChevronRight size={14} />
                      </button>
                    ))}
                 </div>
                 <div className="lg:col-span-9 bg-black border border-zinc-800 rounded-2xl p-6 overflow-y-auto font-mono text-[10px] text-emerald-500/80 no-scrollbar">
                    <pre className="whitespace-pre-wrap">{rawJson}</pre>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Access Control */}
      {role === 'CEO' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <ShieldCheck className="text-emerald-500" />
             <h2 className="text-xl font-bold text-white tracking-tight uppercase">Enterprise Access Pool</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <UserPlus size={16} /> Grant System Access
              </h3>
              <div className="space-y-4">
                <input placeholder="Full Name" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:border-amber-500 outline-none text-white font-bold" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:border-amber-500 outline-none text-white font-bold" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                    <option value="Staff">Staff</option>
                    <option value="Project Manager">Strategic Manager</option>
                    <option value="Accountant">Financial Officer</option>
                    <option value="CEO">Executive Lead</option>
                  </select>
                  <select className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:border-amber-500 outline-none text-white font-bold" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})}>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <input placeholder="Position (e.g. ICT Manager)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:border-amber-500 outline-none text-white font-bold" value={newUser.position} onChange={e => setNewUser({...newUser, position: e.target.value})} />
                <textarea 
                  placeholder="Master Job Description (Strategic Directive)" 
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:border-amber-500 outline-none text-white font-medium resize-none" 
                  value={newUser.jobDescription} 
                  onChange={e => setNewUser({...newUser, jobDescription: e.target.value})} 
                />
                <input placeholder="Auth Username" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:border-amber-500 outline-none text-white font-bold" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                <input type="password" placeholder="Key Phrase" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs focus:border-amber-500 outline-none text-white font-bold" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <button onClick={handleCreateUser} disabled={isSaving} className="w-full py-4 bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : 'Sync Identity Pool'}
              </button>
            </div>

            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-4">Node Identity</th>
                    <th className="px-8 py-4">Strategic Role</th>
                    <th className="px-8 py-4 text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-800/30 group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                              <ShieldCheck size={14} className={u.role === 'CEO' ? 'text-amber-500' : 'text-zinc-500'} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white">{u.name}</p>
                              <p className="text-[9px] text-zinc-500 font-mono italic">@{u.username}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'CEO' ? 'text-amber-500' : 'text-zinc-300'}`}>{u.position || u.role}</p>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter mt-0.5">{u.department || 'GLOBAL'}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                         {u.id !== 'u-ceo' && (
                           <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={16} />
                           </button>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySettings;
