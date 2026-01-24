
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardList, Package, Banknote, Target, 
  Calendar, Menu, X, ChevronRight, UserCircle, Briefcase, 
  Settings, MessageSquareWarning, Users, Clock, LogOut,
  Contact, FolderLock, Database, Cloud, Watch, ShieldCheck, RefreshCw,
  UserPlus, MessageSquare
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
import Login from './components/Login';
import StaffManagement from './components/StaffManagement';
import HiringPortal from './components/HiringPortal';
import StrategicChat from './components/StrategicChat';
import { UserRole, UserAccount } from './types';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [meetingContext, setMeetingContext] = useState<{title: string, type: 'Meeting' | 'Interview'}>({title: '', type: 'Meeting'});
  const [systemStaff, setSystemStaff] = useState<UserAccount[]>([]);
  const [dbStatus, setDbStatus] = useState({ 
    status: 'Connecting', 
    latency: '0ms',
    engine: 'Initializing...',
    persistence: 'Local Transactional',
    lastSync: 'Never'
  });
  const [time, setTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

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
    loadSystemStaff();
    checkDbHealth();
  }, []);

  const checkDbHealth = async () => {
    setIsSyncing(true);
    await storageService.pullFromCloud();
    const status = await storageService.getDbStatus();
    setDbStatus(status);
    setTimeout(() => setIsSyncing(false), 800);
  };

  const loadSystemStaff = async () => {
    const users = await storageService.getUsers();
    setSystemStaff(users);
  };

  useEffect(() => {
    if (currentUser) {
       loadSystemStaff();
       checkDbHealth();
    }
  }, [activeTab]);

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
    { id: 'attendance', label: 'Attendance', icon: <Clock size={20} />, roles: ['CEO', 'Project Manager', 'Staff', 'Accountant'] },
    { id: 'chat', label: 'Strategic Comms', icon: <MessageSquare size={20} />, roles: ['CEO', 'Project Manager', 'Staff', 'Accountant'] },
    { id: 'staff-management', label: 'Staff Management', icon: <Contact size={20} />, roles: ['CEO'] },
    { id: 'hiring', label: 'Recruitment', icon: <UserPlus size={20} />, roles: ['CEO', 'Project Manager'] },
    { id: 'tasks', label: 'SMART Task Sheet', icon: <ClipboardList size={20} />, roles: ['CEO', 'Project Manager', 'Staff'] },
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
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {isMeetingActive && <VideoConference title={meetingContext.title} type={meetingContext.type} onClose={() => setIsMeetingActive(false)} />}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col z-50`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 gold-gradient rounded-lg flex items-center justify-center shrink-0"><span className="text-black font-bold text-xs">G</span></div>
          {isSidebarOpen && <h1 className="font-bold text-lg gold-text tracking-tight uppercase">GMYT Group</h1>}
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {filteredMenu.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-amber-500/10 text-amber-500 font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
              {item.icon}{isSidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-800 space-y-2">
          {isSidebarOpen && <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"><LogOut size={20} /><span className="text-xs font-bold uppercase">Sign Out</span></button>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h3 className="text-white font-semibold flex items-center gap-2">{menuItems.find(m => m.id === activeTab)?.label}</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{currentUser.name}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{currentUser.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full gold-gradient p-[1px]"><div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center"><img src={`https://picsum.photos/40/40?grayscale&v=${currentUser.id}`} alt="Avatar" className="w-full h-full rounded-full object-cover" /></div></div>
          </div>
        </header>
        <section className="flex-1 overflow-y-auto no-scrollbar p-8">{renderContent()}</section>
      </main>
    </div>
  );
};

export default App;
