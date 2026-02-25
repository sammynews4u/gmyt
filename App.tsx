
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardList, Package, Banknote, Target, 
  Calendar, Menu, X, Settings, MessageSquareWarning, Clock, LogOut,
  Contact, FolderLock, GraduationCap, Scissors, MessageSquare, UserPlus
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import InventorySystem from './components/InventorySystem';
import ExpenseSheet from './components/ExpenseSheet';
import PerformanceMetrics from './components/PerformanceMetrics';
import MeetingMinutes from './components/MeetingMinutes';
import LandingPage from './components/LandingPage';
import PayrollSystem from './components/PayrollSystem';
import OnboardingPortal from './components/OnboardingPortal';
import CommunicationCenter from './components/CommunicationCenter';
import CompanySettings from './components/CompanySettings';
import VideoConference from './components/VideoConference';
import AttendanceRegister from './components/AttendanceRegister';
import StrategicAcademy from './components/StrategicAcademy';
import Login from './components/Login';
import StaffManagement from './components/StaffManagement';
import HiringPortal from './components/HiringPortal';
import StrategicChat from './components/StrategicChat';
import { UserAccount } from './types';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [meetingContext, setMeetingContext] = useState<{title: string, type: 'Meeting' | 'Interview'}>({title: '', type: 'Meeting'});
  const [systemStaff, setSystemStaff] = useState<UserAccount[]>([]);
  const [time, setTime] = useState(new Date());
  
  const loadSystemStaff = async () => {
    const users = await storageService.getUsers();
    setSystemStaff(users);
  };

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('gmyt_session');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
      setShowLanding(false);
    }
    
    const initData = async () => {
      // Check for sync key and pull latest data on start
      const key = await storageService.getSyncKey();
      if (key) {
        await storageService.pullFromCloud();
      }
      await loadSystemStaff();
    };

    initData();

    // Listen for sync completion events from storage service
    const handleSyncComplete = () => {
      loadSystemStaff();
    };
    window.addEventListener('gmyt-sync-complete', handleSyncComplete);
    
    return () => window.removeEventListener('gmyt-sync-complete', handleSyncComplete);
  }, []);

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('gmyt_session', JSON.stringify(user));
    setShowLanding(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gmyt_session');
    setShowLanding(true);
  };

  const startMeeting = (title: string, type: 'Meeting' | 'Interview' = 'Meeting') => {
    setMeetingContext({ title, type });
    setIsMeetingActive(true);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['CEO', 'Project Manager', 'Staff', 'Accountant'] },
    { id: 'academy', label: 'Strategic Academy', icon: <GraduationCap size={20} />, roles: ['CEO', 'Project Manager', 'Staff', 'Accountant'] },
    { id: 'attendance', label: 'Attendance', icon: <Clock size={20} />, roles: ['CEO', 'Project Manager', 'Staff', 'Accountant'] },
    { id: 'chat', label: 'Strategic Comms', icon: <MessageSquare size={20} />, roles: ['CEO', 'Project Manager', 'Staff', 'Accountant'] },
    { id: 'staff-management', label: 'Staff Management', icon: <Contact size={20} />, roles: ['CEO'] },
    { id: 'hiring', label: 'Recruitment', icon: <UserPlus size={20} />, roles: ['CEO', 'Project Manager'] },
    { id: 'tasks', label: 'SMART Task Sheet', icon: <ClipboardList size={20} />, roles: ['CEO', 'Project Manager', 'Staff', 'Accountant'] },
    { id: 'onboarding', label: 'Staff Onboarding Docs', icon: <FolderLock size={20} />, roles: ['CEO', 'Project Manager'] },
    { id: 'inventory', label: 'Store Inventory', icon: <Package size={20} />, roles: ['CEO', 'Accountant'] },
    { id: 'expenses', label: 'Financial Sheet', icon: <Banknote size={20} />, roles: ['CEO', 'Accountant'] },
    { id: 'payroll', label: 'Payroll & Paychecks', icon: <Banknote size={20} />, roles: ['CEO', 'Accountant'] },
    { id: 'performance', label: 'KPI Performance', icon: <Target size={20} />, roles: ['CEO', 'Project Manager', 'Staff'] },
    { id: 'communication', label: 'Complaints & Feedback', icon: <MessageSquareWarning size={20} />, roles: ['CEO', 'Project Manager', 'Staff'] },
    { id: 'meetings', label: 'Meeting Minutes', icon: <Calendar size={20} />, roles: ['CEO', 'Project Manager', 'Staff'] },
    { id: 'settings', label: 'Company Profile', icon: <Settings size={20} />, roles: ['CEO'] },
  ];

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const currentRole = currentUser.role;
  const filteredMenu = menuItems.filter(item => item.roles.includes(currentRole));

  const renderContent = () => {
    const user = currentUser!;
    switch (activeTab) {
      case 'dashboard': return <Dashboard role={currentRole} />;
      case 'academy': return <StrategicAcademy role={currentRole} />;
      case 'attendance': return <AttendanceRegister user={user} />;
      case 'chat': return <StrategicChat user={user} staff={systemStaff} />;
      case 'staff-management': return <StaffManagement role={currentRole} />;
      case 'hiring': return <HiringPortal role={currentRole} onStartInterview={(name) => startMeeting(`Interview: ${name}`, 'Interview')} />;
      case 'tasks': return <TaskBoard user={user} staff={systemStaff} />;
      case 'onboarding': return <OnboardingPortal role={currentRole} staff={systemStaff} />;
      case 'inventory': return <InventorySystem user={user} />;
      case 'expenses': return <ExpenseSheet user={user} />;
      case 'payroll': return <PayrollSystem role={currentRole} />;
      case 'performance': return <PerformanceMetrics />;
      case 'communication': return <CommunicationCenter role={currentRole} />;
      case 'meetings': return <MeetingMinutes onStartMeeting={() => startMeeting('Weekly Strategic Review')} />;
      case 'settings': return <CompanySettings role={currentRole} />;
      default: return <Dashboard role={currentRole} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {isMeetingActive && <VideoConference title={meetingContext.title} type={meetingContext.type} onClose={() => setIsMeetingActive(false)} />}
      
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64 absolute md:relative' : 'w-20 hidden md:flex'} h-full bg-zinc-900/95 border-r border-zinc-800 transition-all duration-300 flex flex-col z-50 shadow-2xl backdrop-blur-md`}>
        <div className="p-6 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 gold-gradient rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
             <Scissors size={16} className="text-black rotate-[-45deg]" />
          </div>
          {isSidebarOpen && <h1 className="font-black text-lg gold-text tracking-tighter uppercase">GMYT Group</h1>}
        </div>
        
        {/* Navigation - Enhanced Scrollability */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar min-h-0">
          {filteredMenu.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${activeTab === item.id ? 'bg-zinc-800 text-amber-500 font-bold border border-zinc-700 shadow-inner' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
            >
              <div className={`transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</div>
              {isSidebarOpen && <span className="text-xs uppercase tracking-widest">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer Info & Clock */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 shrink-0">
          {isSidebarOpen && (
            <div className="mb-4 text-center">
               <div className="text-2xl font-black text-zinc-200 font-mono tracking-widest">
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </div>
               <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-[0.2em] mt-1">
                  {time.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
               </div>
            </div>
          )}
          
          <div className="space-y-2">
             {isSidebarOpen && <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"><LogOut size={18} /><span className="text-xs font-bold uppercase tracking-widest">Sign Out</span></button>}
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 hidden md:flex">{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full bg-zinc-950/80 backdrop-blur-sm">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <header className="h-20 border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-zinc-900/50 backdrop-blur-md shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-zinc-400 hover:text-white">
               <Menu size={24} />
            </button>
            <div>
               <h3 className="text-white font-black uppercase tracking-tight text-sm md:text-lg flex items-center gap-2">
                  {menuItems.find(m => m.id === activeTab)?.label}
               </h3>
               <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] hidden sm:block">GMYT Enterprise System v2.1</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{currentUser.name}</p>
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">{currentUser.role}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-[1rem] gold-gradient p-[2px] shadow-lg shadow-amber-500/10">
               <div className="w-full h-full rounded-[0.9rem] bg-zinc-900 flex items-center justify-center overflow-hidden">
                  <img 
                    src={currentUser.avatar || `https://picsum.photos/40/40?grayscale&v=${currentUser.id}`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
               </div>
            </div>
          </div>
        </header>
        <section className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 relative">
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default App;
    