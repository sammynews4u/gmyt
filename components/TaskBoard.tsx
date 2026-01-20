
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, CheckCircle, Trash2, X, Play, 
  MessageSquarePlus, Square, CheckSquare, 
  ArrowUp, ArrowDown, Loader2, AlertCircle, Layers,
  CalendarDays, UserCheck, FileText, Edit3, Save,
  ChevronDown, ChevronUp, Info, Activity, ShieldAlert,
  Target, Bookmark, Copy, Clock, AlertTriangle, ShieldCheck,
  ClipboardList, Settings2, Sparkles, Wand2, UserCircle,
  Hash, Zap, Cpu, ListChecks
} from 'lucide-react';
import { Task, TaskStatus, UserRole, UserAccount, TaskTemplate } from '../types';
import { storageService } from '../services/storageService';
import { generateTaskSchema } from '../services/geminiService';

interface TaskBoardProps {
  user: UserAccount;
  staff: UserAccount[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ user, staff }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'priority' | 'deadline' | 'sn'>('sn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const isCEO = user.role === 'CEO';
  const isManagement = isCEO || user.role === 'Project Manager';

  const TIME_BOUND_OPTIONS = [
    "30 Minutes", "1 Hour", "1.5 Hours", "2 Hours", "2.5 Hours", 
    "3 Hours", "3.5 Hours", "4 Hours", "4.5 Hours", "5 Hours", "5.5 Hours", "6 Hours"
  ];

  const initialTaskState: Partial<Task> = {
    role: '',
    tasksForToday: '1. \n2. \n3. ',
    responsibleParty: '',
    problem: { description: '', rootCauseAndConsequences: '', risk: '' },
    smart: { specific: '', measurable: '', attainable: '', relevance: '', timeBound: '1 Hour' },
    skrc: { status: 'Pending', isStarted: false, keyResult: '', reflection: '', challenges: '' },
    lineRemarks: '',
    deadline: new Date().toISOString().split('T')[0],
    priority: 3,
    comments: [],
    addedBy: user.role
  };

  const [newTask, setNewTask] = useState<Partial<Task>>(initialTaskState);

  useEffect(() => {
    loadTasks();
    loadTemplates();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    const data = await storageService.getTasks();
    setTasks(data);
    setIsLoading(false);
  };

  const loadTemplates = async () => {
    const data = await storageService.getTemplates();
    setTemplates(data);
  };

  const handleStaffSelect = (staffName: string) => {
    const member = staff.find(s => s.name === staffName);
    if (member) {
      setNewTask({
        ...newTask,
        responsibleParty: member.name,
        role: member.jobDescription || newTask.role || ''
      });
    } else {
      setNewTask({ ...newTask, responsibleParty: staffName });
    }
  };

  const handleAiGenerate = async () => {
    if (!newTask.role) return alert("Please specify the Job Description first so AI knows the context.");
    setIsAiGenerating(true);
    const suggestion = await generateTaskSchema(newTask.role, "Optimal performance and corporate excellence based on the specific job description provided.");
    if (suggestion) {
      setNewTask({
        ...newTask,
        problem: suggestion.problem,
        smart: {
          ...suggestion.smart,
          timeBound: newTask.smart?.timeBound || '1 Hour'
        },
        tasksForToday: "1. Conduct full diagnostic review\n2. Implement critical infrastructure patches\n3. Verify operational uptime for all nodes"
      });
    } else {
      alert("AI Generation failed. Please try again.");
    }
    setIsAiGenerating(false);
  };

  const handleCreateTask = async () => {
    if (!newTask.role?.trim() || !newTask.responsibleParty?.trim()) {
      alert("Required: Job Description and Responsible Party are mandatory.");
      return;
    }

    const taskToAdd: Task = {
      ...initialTaskState,
      ...newTask,
      id: Date.now().toString(),
      sn: tasks.length + 1,
      skrc: {
        ...initialTaskState.skrc!,
        ...newTask.skrc,
        status: (user.role === 'Staff' || user.role === 'Accountant') ? 'Awaiting Approval' : 'Pending',
      },
      comments: [],
      addedBy: user.role
    } as Task;

    await storageService.saveTask(taskToAdd);
    await loadTasks();
    setIsModalOpen(false);
    setNewTask(initialTaskState);
  };

  const handleStartTask = async (task: Task) => {
    setIsUpdatingTask(task.id);
    const updatedTask: Task = {
      ...task,
      skrc: { ...task.skrc, isStarted: true, status: 'Ongoing' }
    };
    await storageService.saveTask(updatedTask);
    const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
    setTasks(updatedTasks);
    setIsUpdatingTask(null);
  };

  const handleCompleteTask = async (task: Task) => {
    setIsUpdatingTask(task.id);
    const updatedTask: Task = {
      ...task,
      skrc: { ...task.skrc, status: 'Completed' }
    };
    await storageService.saveTask(updatedTask);
    const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
    setTasks(updatedTasks);
    setIsUpdatingTask(null);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Permanently delete this strategic entry?")) return;
    await storageService.deleteTask(id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTaskExpansion = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  const filteredTasks = tasks
    .filter(t => 
      t.role.toLowerCase().includes(search.toLowerCase()) || 
      t.responsibleParty.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comp = 0;
      if (sortField === 'priority') comp = (a.priority || 0) - (b.priority || 0);
      else if (sortField === 'deadline') comp = new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime();
      else if (sortField === 'sn') comp = a.sn - b.sn;
      return sortOrder === 'asc' ? comp : -comp;
    });

  const renderLargeTextBox = (title: string, content: string, color: string = "amber", icon?: React.ReactNode) => (
    <div className={`p-5 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-3 h-full shadow-inner`}>
       <div className="flex items-center gap-2 mb-1">
          {icon && <div className={`text-${color}-500`}>{icon}</div>}
          <span className={`text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]`}>{title}</span>
       </div>
       <div className="text-sm font-medium text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {content || <span className="text-zinc-800 italic">No entry provided...</span>}
       </div>
    </div>
  );

  return (
    <div className="space-y-6 relative pb-24">
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-amber-500/10 rounded-2xl">
              <ClipboardList className="text-amber-500" size={32} />
           </div>
           <div>
              <h2 className="text-2xl font-black gold-text uppercase tracking-tight">Strategic Task Board</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                 GMYT Framework: PRRR + SMART + SKRC | V5 Automation
                 {isCEO && <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck size={14} /> Full CEO Override</span>}
              </p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="Filter Strategic Hub..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 gold-gradient rounded-xl font-black text-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-amber-500/20">
            <Plus size={18} /> Deploy New Strategy
          </button>
        </div>
      </div>

      {/* Main Strategic Task Table */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-amber-500" size={40} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/50 rounded-[3rem] border border-zinc-800 text-zinc-500 italic flex flex-col items-center gap-4">
            <Target size={48} className="opacity-20" />
            <p>Strategic ledger currently unpopulated.</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
             <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
                   <tr>
                      <th className="px-8 py-6 w-16 text-center border-r border-zinc-800/50">SN</th>
                      <th className="px-8 py-6 w-1/5 border-r border-zinc-800/50">Master Job Description</th>
                      <th className="px-8 py-6 w-1/4 border-r border-zinc-800/50">TASKS FOR TODAY (Execution)</th>
                      <th className="px-8 py-6">STRATEGIC ANALYSIS TABLE</th>
                      <th className="px-8 py-6 w-20 text-right">Control</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                   {filteredTasks.map((task) => {
                      const staffMember = staff.find(s => s.name === task.responsibleParty);
                      const masterJD = staffMember?.jobDescription || task.role;
                      const isAssignedToMe = user.name === task.responsibleParty;
                      const canControl = isAssignedToMe || isManagement;

                      return (
                        <React.Fragment key={task.id}>
                           <tr 
                             className={`hover:bg-zinc-800/30 transition-all cursor-pointer group ${expandedTaskId === task.id ? 'bg-amber-500/5' : ''}`}
                             onClick={() => toggleTaskExpansion(task.id)}
                           >
                              <td className="px-8 py-6 text-center border-r border-zinc-800/50 align-top">
                                 <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center font-black text-amber-500 shadow-inner text-xs">{task.sn}</div>
                              </td>
                              <td className="px-8 py-6 border-r border-zinc-800/50 align-top">
                                 {renderLargeTextBox("Directive Anchor", masterJD, "amber", <ShieldCheck size={10} />)}
                                 <div className="mt-4 flex items-center gap-2 px-4">
                                    <div className="p-1 bg-amber-500/10 rounded-lg"><UserCircle size={12} className="text-amber-500" /></div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isAssignedToMe ? 'text-amber-500' : 'text-zinc-300'}`}>
                                       {task.responsibleParty} {isAssignedToMe && '(YOU)'}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 border-r border-zinc-800/50 align-top">
                                 {renderLargeTextBox("Daily Execution Node", task.tasksForToday, "blue", <ListChecks size={10} />)}
                                 {/* Inline Status Badge */}
                                 <div className="mt-3 flex gap-2">
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-full border ${task.skrc.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : task.skrc.status === 'Ongoing' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                                       {task.skrc.status.toUpperCase()}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 align-top">
                                 {/* Large Analysis Table Grid */}
                                 <div className="grid grid-cols-3 gap-3 h-full min-h-[160px]">
                                    {renderLargeTextBox("PRRR Analysis", task.problem.description, "amber", <AlertTriangle size={10} />)}
                                    {renderLargeTextBox("SMART Goal", task.smart.specific, "blue", <Target size={10} />)}
                                    {renderLargeTextBox("SKRC Result", task.skrc.keyResult || 'Awaiting Input...', "emerald", <CheckSquare size={10} />)}
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-right align-top pt-8">
                                 <div className="flex flex-col items-end gap-2">
                                    {expandedTaskId === task.id ? <ChevronUp size={20} className="text-amber-500" /> : <ChevronDown size={20} className="text-zinc-600" />}
                                 </div>
                              </td>
                           </tr>
                           {expandedTaskId === task.id && (
                             <tr>
                                <td colSpan={5} className="px-8 pb-12 pt-4 bg-zinc-950/80 animate-in slide-in-from-top-4 duration-500 border-x border-zinc-800">
                                   <div className="space-y-8">
                                      {/* Execution Hub for Staff */}
                                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                         <div className="flex items-center gap-4">
                                            <div className="p-3 bg-amber-500/10 rounded-2xl">
                                               <Zap className="text-amber-500" size={24} />
                                            </div>
                                            <div>
                                               <h4 className="text-xs font-black text-white uppercase tracking-widest">Live Execution Hub</h4>
                                               <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Status: <span className="text-amber-500">{task.skrc.status}</span></p>
                                            </div>
                                         </div>
                                         <div className="flex gap-4">
                                            {canControl && (
                                              <>
                                                {!task.skrc.isStarted ? (
                                                   <button 
                                                      onClick={(e) => { e.stopPropagation(); handleStartTask(task); }}
                                                      disabled={isUpdatingTask === task.id}
                                                      className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                                   >
                                                      {isUpdatingTask === task.id ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                                                      Start Task Node
                                                   </button>
                                                ) : task.skrc.status !== 'Completed' ? (
                                                   <button 
                                                      onClick={(e) => { e.stopPropagation(); handleCompleteTask(task); }}
                                                      disabled={isUpdatingTask === task.id}
                                                      className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                                   >
                                                      {isUpdatingTask === task.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                                      Commit as DONE
                                                   </button>
                                                ) : (
                                                   <div className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-black rounded-xl text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                                      <ShieldCheck size={14} /> Mission Accomplished
                                                   </div>
                                                )}
                                              </>
                                            )}
                                            {isManagement && (
                                               <button 
                                                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                                  className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                               >
                                                  <Trash2 size={18} />
                                               </button>
                                            )}
                                         </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-800/50 pt-8">
                                         <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pb-2 border-b border-zinc-800 flex items-center gap-2">
                                               <AlertTriangle size={12}/> PRRR DEPTH ANALYSIS
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4">
                                               {renderLargeTextBox("Root Cause & Consequences", task.problem.rootCauseAndConsequences, "amber", <Layers size={10}/>)}
                                               {renderLargeTextBox("Strategic Risk Assessment", task.problem.risk, "amber", <ShieldAlert size={10}/>)}
                                            </div>
                                         </div>
                                         <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] pb-2 border-b border-zinc-800 flex items-center gap-2">
                                               <Target size={12}/> SMART ARCHITECTURE
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4">
                                               {renderLargeTextBox("KPI / Measurable Metrics", task.smart.measurable, "blue", <Activity size={10}/>)}
                                               <div className="grid grid-cols-2 gap-4">
                                                  {renderLargeTextBox("Time Bound", task.smart.timeBound, "blue", <Clock size={10}/>)}
                                                  {renderLargeTextBox("Strategy Relevance", task.smart.relevance, "blue", <Bookmark size={10}/>)}
                                               </div>
                                            </div>
                                         </div>
                                         <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] pb-2 border-b border-zinc-800 flex items-center gap-2">
                                               <Sparkles size={12}/> SKRC REFLECTION HUB
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4">
                                               {renderLargeTextBox("Management Impact Note", task.skrc.reflection, "emerald", <Sparkles size={10}/>)}
                                               {renderLargeTextBox("Deployment Challenges", task.skrc.challenges, "emerald", <AlertTriangle size={10}/>)}
                                               {renderLargeTextBox("CEO Override Remarks", task.lineRemarks, "amber", <Settings2 size={10}/>)}
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                </td>
                             </tr>
                           )}
                        </React.Fragment>
                      );
                   })}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Strategic Entry Deployment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-6xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-8 md:p-12 max-h-[95vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in duration-500">
             <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-6">
                 <div className="p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20">
                    <Cpu className="text-amber-500" size={32} />
                 </div>
                 <div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-tight">Strategy Deployment Node</h2>
                   <p className="text-sm text-zinc-500 mt-1 uppercase tracking-[0.3em] font-bold">Protocol GMYT-ONB-V5 | Strategic Automation</p>
                 </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-500 hover:text-white transition-all"><X size={28}/></button>
             </div>
             
             <div className="space-y-12">
                {/* Section 1: Strategic Anchor */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Phase 1: Directive Identification</h4>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                      <div className="md:col-span-4 space-y-3">
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                           <UserCircle size={14} className="text-amber-500" /> Responsible Node
                        </label>
                        <select 
                           className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-sm focus:border-amber-500 outline-none font-bold text-white shadow-inner h-[66px]" 
                           value={newTask.responsibleParty} 
                           onChange={e => handleStaffSelect(e.target.value)}
                         >
                           <option value="">Select Strategic Assignee...</option>
                           {staff.map(s => <option key={s.id} value={s.name}>{s.name} ({s.position || s.role})</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-8 space-y-3">
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                           <ShieldCheck size={14} className="text-amber-500" /> Master Job Description (Strategic Anchor)
                        </label>
                        <textarea 
                           rows={2}
                           placeholder="Define the persistent corporate directive for this role..." 
                           className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-sm focus:border-amber-500 outline-none font-bold text-white shadow-inner resize-none leading-relaxed" 
                           value={newTask.role} 
                           onChange={e => setNewTask({...newTask, role: e.target.value})} 
                         />
                      </div>
                   </div>

                   {/* NEW: Tasks For Today Input Box */}
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <ListChecks size={14} className="text-blue-500" /> TASKS FOR TODAY (Numbered Checklist)
                      </label>
                      <textarea 
                        rows={5}
                        placeholder="1. task one...&#10;2. task two...&#10;3. task three..." 
                        className="w-full bg-zinc-950 border border-zinc-800 p-6 rounded-[2.5rem] text-sm focus:border-blue-500 outline-none font-bold text-blue-500 shadow-inner leading-relaxed" 
                        value={newTask.tasksForToday} 
                        onChange={e => setNewTask({...newTask, tasksForToday: e.target.value})} 
                      />
                   </div>
                </div>

                {/* Section 2: TASKS Analysis Table Structure */}
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                         <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Phase 2: TASKS & STRATEGIC ANALYSIS</h4>
                      </div>
                      <button 
                        onClick={handleAiGenerate}
                        disabled={isAiGenerating || !newTask.role}
                        className="px-8 py-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-amber-500 hover:text-black transition-all disabled:opacity-30"
                      >
                         {isAiGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                         AI Generate Full Strategic Breakdown
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      {/* Sub-Column 1: PRRR Analysis */}
                      <div className="bg-amber-500/5 border border-amber-500/10 p-8 rounded-[3rem] space-y-6">
                         <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4 py-1">
                            <h5 className="text-[11px] font-black text-amber-500 uppercase tracking-widest">PRRR Identification</h5>
                         </div>
                         <div className="space-y-5">
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Problem Description</label>
                             <textarea placeholder="Identify the core bottleneck..." className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-32 focus:border-amber-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.problem?.description} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, description: e.target.value}})} />
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Root Cause / Impact</label>
                             <textarea placeholder="Why is this happening?" className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-32 focus:border-amber-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.problem?.rootCauseAndConsequences} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, rootCauseAndConsequences: e.target.value}})} />
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Risk Assessment</label>
                             <textarea placeholder="Risk of inaction..." className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-32 focus:border-amber-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.problem?.risk} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, risk: e.target.value}})} />
                           </div>
                         </div>
                      </div>

                      {/* Sub-Column 2: SMART Architecture */}
                      <div className="bg-blue-500/5 border border-blue-500/10 p-8 rounded-[3rem] space-y-6">
                         <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4 py-1">
                            <h5 className="text-[11px] font-black text-blue-500 uppercase tracking-widest">SMART Architecture</h5>
                         </div>
                         <div className="space-y-5">
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Specific Goal</label>
                             <textarea placeholder="S - Definitive objective..." className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-24 focus:border-blue-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.smart?.specific} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, specific: e.target.value}})} />
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Measurable Outcome</label>
                             <textarea placeholder="M - Metrics of success..." className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-24 focus:border-blue-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.smart?.measurable} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, measurable: e.target.value}})} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Attainable</label>
                                <input placeholder="A - Steps" className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs focus:border-blue-500 outline-none font-medium text-white shadow-inner" value={newTask.smart?.attainable} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, attainable: e.target.value}})} />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Deadline Node</label>
                                <select 
                                   className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-[10px] focus:border-blue-500 outline-none font-black text-white h-[62px] shadow-inner" 
                                   value={newTask.smart?.timeBound} 
                                   onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, timeBound: e.target.value}})}
                                 >
                                   {TIME_BOUND_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </div>
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Business Relevance</label>
                             <textarea placeholder="R - Strategy fit..." className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-24 focus:border-blue-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.smart?.relevance} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, relevance: e.target.value}})} />
                           </div>
                         </div>
                      </div>

                      {/* Sub-Column 3: SKRC Tracking */}
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[3rem] space-y-6">
                         <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                            <h5 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">SKRC Tracking</h5>
                         </div>
                         <div className="space-y-5">
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Key Result (Target)</label>
                             <textarea placeholder="The quantifiable win..." className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-24 focus:border-emerald-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.skrc?.keyResult} onChange={e => setNewTask({...newTask, skrc: {...newTask.skrc!, keyResult: e.target.value}})} />
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Impact Reflection</label>
                             <textarea placeholder="Strategic impact notes..." className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-24 focus:border-emerald-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.skrc?.reflection} onChange={e => setNewTask({...newTask, skrc: {...newTask.skrc!, reflection: e.target.value}})} />
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Obstacles/Bottlenecks</label>
                             <textarea placeholder="What could hinder this?" className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-24 focus:border-emerald-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.skrc?.challenges} onChange={e => setNewTask({...newTask, skrc: {...newTask.skrc!, challenges: e.target.value}})} />
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Line Remarks (CEO Override)</label>
                             <textarea placeholder="Leadership feedback..." className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-xs h-24 focus:border-amber-500 outline-none resize-none font-medium text-white shadow-inner" value={newTask.lineRemarks} onChange={e => setNewTask({...newTask, lineRemarks: e.target.value})} />
                           </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Modal Footer Deployment Controls */}
                <div className="pt-12 border-t border-zinc-900 flex flex-col sm:flex-row gap-6">
                   <button onClick={handleCreateTask} className="flex-1 py-7 gold-gradient text-black font-black rounded-[2.5rem] shadow-2xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3">
                      <Zap size={20} /> Deploy Strategic Entry
                   </button>
                   <button onClick={() => setIsModalOpen(false)} className="px-16 py-7 bg-zinc-900 text-zinc-500 font-black rounded-[2.5rem] hover:bg-zinc-800 hover:text-white transition-all uppercase text-[11px] tracking-widest border border-zinc-800">
                      Abort Protocol
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
