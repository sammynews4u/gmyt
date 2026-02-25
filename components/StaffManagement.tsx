
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Briefcase, 
  Banknote, ShieldCheck, 
  Loader2, X, Save, ClipboardList,
  Contact, 
  Settings2, FileText, Camera, Lock, Key, ListChecks
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserAccount, UserRole } from '../types';

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

interface StaffManagementProps {
  role: UserRole;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ role }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<UserAccount | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCEO = role === 'CEO';

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await storageService.getUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await loadUsers();
    };
    init();

    const handleSyncComplete = () => {
      loadUsers();
    };
    window.addEventListener('gmyt-sync-complete', handleSyncComplete);
    return () => window.removeEventListener('gmyt-sync-complete', handleSyncComplete);
  }, []);

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsSyncing(true);
    await storageService.saveUser(selectedStaff);
    await loadUsers();
    setIsEditModalOpen(false);
    setIsSyncing(false);
  };

  const handleFireStaff = async (id: string) => {
    if (id === 'u-ceo') return alert("ACCESS DENIED: Root CEO accounts cannot be terminated.");
    if (confirm("CRITICAL: Terminate employment and revoke all system access?")) {
      await storageService.deleteUser(id);
      await loadUsers();
      setSelectedStaff(null);
      setIsEditModalOpen(false);
    }
  };

  const handlePromote = (staff: UserAccount) => {
    if (!isCEO) return alert("ACCESS DENIED: Role elevation is a CEO-restricted action.");
    const roles: UserRole[] = ['Staff', 'Project Manager', 'Accountant', 'CEO'];
    const currentIndex = roles.indexOf(staff.role);
    if (currentIndex < roles.length - 1) {
      const nextRole = roles[currentIndex + 1];
      setSelectedStaff({ ...staff, role: nextRole });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedStaff) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedStaff({ ...selectedStaff, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    (u.department?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (u.position?.toLowerCase() || '').includes(search.toLowerCase())
  );

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-amber-500/10 rounded-3xl">
              <Contact className="text-amber-500" size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black gold-text uppercase tracking-tight">Staff Corporate Directory</h2>
              <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                 IDENTITY MANAGEMENT & JOB DESCRIPTION CONTROL
                 {isCEO && <span className="text-emerald-500 flex items-center gap-1.5"><ShieldCheck size={16} /> CEO PRIVILEGE ACTIVE</span>}
              </p>
           </div>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search directory..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 focus:border-amber-500 outline-none text-sm transition-all shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 hover:border-amber-500/40 transition-all group relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[80px] rounded-full -z-10 group-hover:bg-amber-500/10 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[1.75rem] gold-gradient p-[1.5px] shadow-2xl shadow-amber-500/10">
                  <div className="w-full h-full rounded-[1.75rem] bg-zinc-950 flex items-center justify-center overflow-hidden">
                    <img 
                      src={user.avatar || `https://picsum.photos/100/100?grayscale&v=${user.id}`} 
                      alt={user.name} 
                      className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-500 transition-colors tracking-tight">{user.name}</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-0.5">{user.role}</p>
                  <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mt-1">{user.department || 'GLOBAL OPS'}</p>
                </div>
              </div>
              {isCEO && (
                <button 
                  onClick={() => { setSelectedStaff(user); setIsEditModalOpen(true); }}
                  className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 hover:text-amber-500 hover:bg-zinc-700 transition-all shadow-lg"
                >
                  <Settings2 size={20} />
                </button>
              )}
            </div>

            <div className="bg-zinc-950/50 rounded-2xl p-4 mb-6 border border-zinc-800/50">
               <div className="flex items-center gap-2 mb-2">
                  <FileText size={10} className="text-amber-500" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Persistent Directive</span>
               </div>
               <p className="text-[11px] text-zinc-300 font-medium leading-relaxed italic line-clamp-3">
                  {user.jobDescription || "No master job description defined for this role yet."}
               </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-bold uppercase tracking-widest">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center text-amber-500 border border-zinc-800"><Briefcase size={14}/></div>
                {user.position || user.title || 'UNASSIGNED ROLE'}
              </div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-500 border border-zinc-800"><Banknote size={14}/></div>
                <div className="flex items-baseline gap-2">
                   <span className="text-white text-sm tracking-tight">₦{user.salary?.toLocaleString() || '0'}</span>
                   <span className="text-[9px] text-zinc-600">/ mo</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800/50">
              <button 
                onClick={() => { setSelectedStaff(user); setIsEditModalOpen(true); }}
                className="flex items-center justify-center gap-3 py-3.5 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-all"
              >
                <ClipboardList size={16} /> Task Board
              </button>
              <button 
                 onClick={() => { setSelectedStaff(user); setIsEditModalOpen(true); }}
                 className="flex items-center justify-center gap-3 py-3.5 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
              >
                <Settings2 size={16} /> Edit Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)}></div>
          <form onSubmit={handleUpdateStaff} className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-[4rem] p-12 max-h-[95vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in duration-500">
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-8">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                   <div className="w-32 h-32 rounded-[2.5rem] gold-gradient p-[2px] shadow-2xl shadow-amber-500/10">
                      <div className="w-full h-full rounded-[2.5rem] bg-zinc-950 flex items-center justify-center overflow-hidden relative">
                         <img 
                            src={selectedStaff.avatar || `https://picsum.photos/150/150?grayscale&v=${selectedStaff.id}`} 
                            alt={selectedStaff.name} 
                            className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" 
                         />
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-amber-500" size={32} />
                         </div>
                      </div>
                   </div>
                   <p className="text-[9px] font-black text-zinc-500 uppercase text-center mt-2">Click to Update Photo</p>
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight">{selectedStaff.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-black text-amber-500 tracking-[0.2em] uppercase">{selectedStaff.role}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedStaff.department || 'Core Operations'}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-[2rem] text-zinc-500 hover:text-white transition-all"><X size={32}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.4em] pb-3 border-b border-zinc-900">Professional Identity</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Official Position</label>
                    <input 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-sm focus:border-amber-500 outline-none font-bold text-white shadow-inner" 
                      value={selectedStaff.position || selectedStaff.title || ''} 
                      onChange={e => setSelectedStaff({...selectedStaff, position: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Management Cluster (Dept)</label>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-sm focus:border-amber-500 outline-none font-bold text-white shadow-inner"
                      value={selectedStaff.department || ''}
                      onChange={e => setSelectedStaff({...selectedStaff, department: e.target.value})}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Monthly Emolument (₦)</label>
                    <input 
                      type="number"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-sm focus:border-emerald-500 outline-none font-black text-emerald-500 shadow-inner" 
                      value={selectedStaff.salary || ''} 
                      onChange={e => setSelectedStaff({...selectedStaff, salary: Number(e.target.value)})}
                    />
                  </div>
                </div>

                {isCEO && (
                  <>
                    <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.4em] pb-3 border-b border-zinc-900 mt-8">System Credentials</h3>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Lock size={12}/> Access Username</label>
                          <input 
                             type="text"
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-sm focus:border-rose-500 outline-none font-bold text-white shadow-inner"
                             value={selectedStaff.username}
                             onChange={e => setSelectedStaff({...selectedStaff, username: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Key size={12}/> Access Password</label>
                          <input 
                             type="text"
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-sm focus:border-rose-500 outline-none font-bold text-white shadow-inner"
                             value={selectedStaff.password || ''}
                             onChange={e => setSelectedStaff({...selectedStaff, password: e.target.value})}
                             placeholder="Set new password..."
                          />
                       </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-8">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] pb-3 border-b border-zinc-900">Operational Directives</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <FileText size={12} /> Master Job Description
                    </label>
                    <textarea 
                      rows={6}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-xs focus:border-amber-500 outline-none font-medium text-white shadow-inner resize-none leading-relaxed" 
                      value={selectedStaff.jobDescription || ''} 
                      onChange={e => setSelectedStaff({...selectedStaff, jobDescription: e.target.value})}
                      placeholder="Specify the full corporate directive for this role..."
                    />
                    <p className="text-[9px] text-zinc-600 uppercase font-bold italic">Auto-populates weekly SMART task sheet.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <ListChecks size={12} /> Daily Standard Operating Procedure (SOP)
                    </label>
                    <textarea 
                      rows={8}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-xs focus:border-blue-500 outline-none font-medium text-white shadow-inner resize-none leading-relaxed" 
                      value={selectedStaff.dailySop || ''} 
                      onChange={e => setSelectedStaff({...selectedStaff, dailySop: e.target.value})}
                      placeholder="1. Clock in by 9:00 AM&#10;2. Check inventory levels&#10;3. Submit daily report..."
                    />
                    <p className="text-[9px] text-zinc-600 uppercase font-bold italic">Visible on staff dashboard as daily standing orders.</p>
                  </div>
                  
                  {isCEO && (
                    <div className="pt-4 flex flex-col gap-3">
                       <button 
                        type="button"
                        onClick={() => handlePromote(selectedStaff)}
                        className="w-full py-4 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                      >
                        Elevate Role Rank
                      </button>
                      <button 
                         type="button"
                         onClick={() => handleFireStaff(selectedStaff.id)}
                         className="w-full py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                      >
                        Terminate Employment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-16 pt-10 border-t border-zinc-900 flex flex-col md:flex-row gap-6">
               <button 
                 type="submit" 
                 disabled={isSyncing}
                 className="flex-1 py-6 gold-gradient text-black font-black rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50"
               >
                 {isSyncing ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} /> Sync Corporate Record</>}
               </button>
               <button 
                 type="button"
                 onClick={() => setIsEditModalOpen(false)}
                 className="px-16 py-6 bg-zinc-900 text-zinc-500 font-black rounded-[2.5rem] uppercase text-[10px] tracking-widest hover:text-white transition-all"
               >
                 Discard Changes
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
