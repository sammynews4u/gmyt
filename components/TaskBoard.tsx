import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, CheckCircle, Trash2, X, Play, 
  CheckSquare, Loader2, Layers,
  ChevronDown, ChevronUp, Activity, ShieldAlert,
  Target, Bookmark, Clock, AlertTriangle, ShieldCheck,
  ClipboardList, Settings2, Sparkles, Wand2, UserCircle,
  Zap, Cpu, ListChecks, FileInput, Send, Printer, MessageSquare,
  FileText, AlertCircle, Eye, ThumbsUp, RotateCcw,
  Target as TargetIcon, ArrowRight, Info, BarChart
} from 'lucide-react';
import { Task, UserAccount, TaskStatus } from '../types';
import { storageService } from '../services/storageService';
import { generateTaskSchema } from '../services/geminiService';

interface TaskBoardProps {
  user: UserAccount;
  staff: UserAccount[];
}

export default function TaskBoard({ user, staff }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [reportingTask, setReportingTask] = useState<Task | null>(null);
  const [reportText, setReportText] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const isCEO = user.role === 'CEO';
  const isPM = user.role === 'Project Manager';
  const isICT = user.department === 'ICT';
  const isManagement = isCEO || isPM || isICT;

  const initialTaskState: Partial<Task> = {
    role: '',
    tasksForToday: '',
    responsibleParty: '',
    problem: { description: '', rootCauseAndConsequences: '', risk: '' },
    smart: { specific: '', measurable: '', attainable: '', relevance: '', timeBound: '1 Hour' },
    skrc: { status: 'Pending', isStarted: false, keyResult: '', reflection: '', challenges: '', report: '' },
    lineRemarks: '',
    deadline: new Date().toISOString().split('T')[0],
    priority: 3,
    comments: [],
    addedBy: user.role
  };

  const [newTask, setNewTask] = useState<Partial<Task>>(initialTaskState);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    const data = await storageService.getTasks();
    setTasks(data);
    setIsLoading(false);
  };

  const handleStaffSelect = (staffId: string) => {
    const member = staff.find(s => s.id === staffId);
    if (member) {
      setNewTask({
        ...newTask,
        responsibleParty: member.name,
        role: member.jobDescription || newTask.role || ''
      });
    }
  };

  const handleAiGenerate = async () => {
    if (!newTask.role) return alert("Please specify the Core Objective (Job Description) first.");
    setIsAiGenerating(true);
    const suggestion = await generateTaskSchema(newTask.role, "Optimal performance goals.");
    if (suggestion) {
      setNewTask({
        ...newTask,
        problem: suggestion.problem,
        smart: { ...suggestion.smart, timeBound: '1 Hour' }
      });
    }
    setIsAiGenerating(false);
  };

  const validateTask = () => {
    if (!newTask.role?.trim()) return "Job Description (Core Objective) is required.";
    if (!newTask.responsibleParty?.trim()) return "Responsible Party is required.";
    if (!newTask.tasksForToday?.trim()) return "Tasks for Today is required.";
    
    // PRRR Validation
    if (!newTask.problem?.description?.trim()) return "PRRR: Problem Identification is required.";
    if (!newTask.problem?.rootCauseAndConsequences?.trim()) return "PRRR: Root Cause is required.";
    if (!newTask.problem?.risk?.trim()) return "PRRR: Risk Assessment is required.";
    
    // SMART Validation
    if (!newTask.smart?.specific?.trim()) return "SMART: Specific Goal is required.";
    if (!newTask.smart?.measurable?.trim()) return "SMART: Measurable Outcome is required.";
    
    return null;
  };

  const handleCreateTask = async () => {
    const error = validateTask();
    if (error) {
      alert(error);
      return;
    }

    const taskToAdd: Task = {
      ...initialTaskState,
      ...newTask,
      id: Date.now().toString(),
      sn: tasks.length + 1,
      skrc: { ...initialTaskState.skrc!, ...newTask.skrc },
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
    setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
    setIsUpdatingTask(null);
  };

  const handleInitiateDone = (task: Task) => {
    setReportingTask(task);
    setReportText(task.skrc.report || '');
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!reportingTask) return;
    setIsUpdatingTask(reportingTask.id);
    const updatedTask: Task = {
      ...reportingTask,
      skrc: { 
        ...reportingTask.skrc, 
        status: 'Awaiting Approval',
        report: reportText 
      }
    };
    await storageService.saveTask(updatedTask);
    setTasks(tasks.map(t => t.id === reportingTask.id ? updatedTask : t));
    setIsUpdatingTask(null);
    setIsReportModalOpen(false);
    setReportingTask(null);
    setReportText('');
  };

  const handleApproveTask = async (task: Task) => {
    if (!isManagement) return;
    setIsUpdatingTask(task.id);
    const updatedTask: Task = {
      ...task,
      skrc: { ...task.skrc, status: 'Completed' }
    };
    await storageService.saveTask(updatedTask);
    setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
    setIsUpdatingTask(null);
  };

  const handleRejectTask = async (task: Task) => {
    if (!isManagement) return;
    setIsUpdatingTask(task.id);
    const updatedTask: Task = {
      ...task,
      skrc: { ...task.skrc, status: 'Ongoing' }
    };
    await storageService.saveTask(updatedTask);
    setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
    setIsUpdatingTask(null);
  };

  const handleAddComment = async (task: Task) => {
    if (!newComment.trim()) return;
    const comment = {
      user: user.name,
      text: newComment,
      date: new Date().toLocaleString()
    };
    const updatedTask = { ...task, comments: [...(task.comments || []), comment] };
    await storageService.saveTask(updatedTask);
    setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
    setNewComment('');
  };

  const handleDeleteTrigger = (task: Task) => {
    setTaskToDelete(task);
    setDeleteConfirmationText('');
    setIsDeleteModalOpen(true);
  };

  const executeDeleteTask = async () => {
    if (!taskToDelete || deleteConfirmationText !== 'DELETE') return;
    
    setIsUpdatingTask(taskToDelete.id);
    await storageService.deleteTask(taskToDelete.id);
    setTasks(tasks.filter(t => t.id !== taskToDelete.id));
    setIsUpdatingTask(null);
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusProgress = (status: TaskStatus) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Ongoing': return 50;
      case 'Awaiting Approval': return 75;
      case 'Completed': return 100;
      case 'Delayed': return 30; // Custom addition for context
      default: return 0;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Pending': return 'amber';
      case 'Ongoing': return 'blue';
      case 'Awaiting Approval': return 'indigo';
      case 'Completed': return 'emerald';
      case 'Delayed': return 'rose';
      default: return 'zinc';
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.role.toLowerCase().includes(search.toLowerCase()) || 
    t.responsibleParty.toLowerCase().includes(search.toLowerCase())
  );

  const renderLargeTextBox = (title: string, content: string, color: string = "amber", icon?: React.ReactNode) => (
    <div className={`p-4 md:p-6 bg-zinc-950/40 border border-zinc-800/60 rounded-[2rem] space-y-3 h-full shadow-inner flex flex-col justify-start`}>
       <div className="flex items-center gap-2 mb-1 shrink-0">
          {icon && <div className={`text-${color}-500`}>{icon}</div>}
          <span className={`text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]`}>{title}</span>
       </div>
       <div className="text-[12px] md:text-[13px] font-medium text-zinc-300 leading-relaxed whitespace-pre-wrap overflow-hidden line-clamp-[8]">
          {content || <span className="text-zinc-800 italic">No entry provided.</span>}
       </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 relative pb-24 print:bg-white print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center print:hidden">
        <div className="flex items-center gap-4 md:gap-5">
           <div className="p-3 md:p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20">
              <ClipboardList className="text-amber-500" size={28} />
           </div>
           <div>
              <h2 className="text-2xl md:text-3xl font-black gold-text uppercase tracking-tight">Strategic Directive Ledger</h2>
              <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                 GMYT Protocol: PRRR + SMART
                 {isICT && <span className="ml-3 text-blue-500 hidden sm:flex items-center gap-1.5"><ShieldCheck size={14} /> System Access: ICT</span>}
              </p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by directive or personnel..." 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-amber-500 outline-none transition-all shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={handlePrint} className="p-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl hover:text-white transition-all shadow-md">
             <Printer size={20} />
          </button>
          {isManagement && (
            <button onClick={() => setIsModalOpen(true)} className="px-6 md:px-8 py-3.5 gold-gradient rounded-2xl font-black text-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-3 hover:shadow-2xl hover:shadow-amber-500/20 active:scale-95 transition-all justify-center">
              <Plus size={18} /> Deploy Objective
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 print-area">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <Loader2 className="animate-spin text-amber-500" size={56} />
             <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">Synchronizing Enterprise Registry...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-32 bg-zinc-900/30 rounded-[3.5rem] border border-zinc-800 text-zinc-600 italic font-medium">No strategic objectives found in current filter.</div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-sm">
             <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                  <thead className="bg-zinc-950 text-zinc-500 text-[11px] uppercase font-black tracking-[0.25em] print:bg-zinc-100">
                     <tr>
                        <th className="px-6 md:px-10 py-8 w-24 text-center border-r border-zinc-800/50">SN</th>
                        <th className="px-6 md:px-10 py-8 w-1/4 border-r border-zinc-800/50">Strategic Directive</th>
                        <th className="px-6 md:px-10 py-8 w-1/4 border-r border-zinc-800/50">Execution Node</th>
                        <th className="px-6 md:px-10 py-8">Workflow Velocity</th>
                        <th className="px-6 md:px-10 py-8 w-24 text-right print:hidden">View</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                     {filteredTasks.map((task) => {
                        const isAssignedToMe = user.name === task.responsibleParty;
                        const isAwaiting = task.skrc.status === 'Awaiting Approval';
                        const progress = getStatusProgress(task.skrc.status);
                        const color = getStatusColor(task.skrc.status);

                        return (
                          <React.Fragment key={task.id}>
                             <tr 
                               className={`hover:bg-zinc-800/40 transition-all cursor-pointer group ${expandedTaskId === task.id ? 'bg-amber-500/5' : ''} ${isAwaiting ? 'border-l-[6px] border-l-blue-500' : ''}`}
                               onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                             >
                                <td className="px-6 md:px-10 py-8 md:py-10 text-center border-r border-zinc-800/50 align-top">
                                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-amber-500 shadow-inner group-hover:border-amber-500/30 transition-colors text-xs md:text-sm">
                                      {task.sn}
                                   </div>
                                </td>
                                <td className="px-6 md:px-10 py-8 md:py-10 border-r border-zinc-800/50 align-top">
                                   {renderLargeTextBox("Directive Objective", task.role, "amber", <TargetIcon size={12}/>)}
                                   <div className="mt-4 md:mt-6 flex items-center gap-3 px-4">
                                      <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                         <UserCircle size={14} className="text-zinc-600" />
                                      </div>
                                      <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest truncate ${isAssignedToMe ? 'text-amber-500' : 'text-zinc-400'}`}>
                                         {task.responsibleParty}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-6 md:px-10 py-8 md:py-10 border-r border-zinc-800/50 align-top">
                                   {renderLargeTextBox("Daily Execution Plan", task.tasksForToday, "blue", <Zap size={12}/>)}
                                   <div className="mt-4 md:mt-6 flex gap-2">
                                      <span className={`text-[9px] md:text-[10px] font-black px-4 py-1.5 rounded-full border shadow-sm ${
                                        task.skrc.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 
                                        task.skrc.status === 'Awaiting Approval' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' :
                                        'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                      }`}>
                                         {task.skrc.status.toUpperCase()}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-6 md:px-10 py-8 md:py-10 align-top">
                                   <div className="space-y-6">
                                      <div className="flex justify-between items-end">
                                         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Task Integrity</span>
                                         <span className={`text-lg font-black text-${color}-500`}>{progress}%</span>
                                      </div>
                                      <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
                                         <div 
                                            className={`h-full bg-${color}-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-1000 ease-out`}
                                            style={{ width: `${progress}%` }}
                                         ></div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 opacity-60">
                                         <div className="p-4 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                                            <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Risk Node</p>
                                            <p className="text-[10px] font-bold text-zinc-400 truncate">{task.problem.risk || "Evaluating..."}</p>
                                         </div>
                                         <div className="p-4 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                                            <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Timeline</p>
                                            <p className="text-[10px] font-bold text-zinc-400 truncate">{task.smart.timeBound}</p>
                                         </div>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 md:px-10 py-8 md:py-10 text-right align-top print:hidden">
                                   <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 group-hover:border-zinc-700 transition-colors inline-block">
                                      {expandedTaskId === task.id ? <ChevronUp size={22} className="text-amber-500" /> : <ChevronDown size={22} className="text-zinc-600" />}
                                   </div>
                                </td>
                             </tr>
                             {expandedTaskId === task.id && (
                               <tr className="print:hidden">
                                  <td colSpan={5} className="px-4 md:px-10 pb-16 pt-6 bg-zinc-950/80 border-x border-zinc-800">
                                     <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                        {/* Status Action Banner with Progress Overview */}
                                        <div className={`bg-zinc-900/80 backdrop-blur-md border rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col items-stretch gap-6 md:gap-10 ${isAwaiting ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-zinc-800 shadow-2xl'}`}>
                                           <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                                              <div className="flex items-center gap-4 md:gap-6">
                                                 <div className={`p-4 md:p-5 rounded-3xl ${isAwaiting ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {isAwaiting ? <Eye size={24} /> : <Zap size={24} />}
                                                 </div>
                                                 <div>
                                                    <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-[0.3em]">
                                                       {isAwaiting ? 'Verification Protocol' : 'Mission Status'}
                                                    </h4>
                                                    <p className={`text-[10px] md:text-[11px] mt-1 font-bold uppercase tracking-widest ${isAwaiting ? 'text-blue-500' : 'text-zinc-500'}`}>
                                                       Current State: {task.skrc.status}
                                                    </p>
                                                 </div>
                                              </div>

                                              <div className="flex flex-wrap gap-3 justify-center">
                                                 {isManagement && isAwaiting && (
                                                   <>
                                                     <button 
                                                       onClick={(e) => { e.stopPropagation(); handleApproveTask(task); }} 
                                                       className="px-6 md:px-10 py-3 md:py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] md:text-[11px] uppercase tracking-widest flex items-center gap-2 md:gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20"
                                                     >
                                                        <ThumbsUp size={16} /> Finalize
                                                     </button>
                                                     <button 
                                                       onClick={(e) => { e.stopPropagation(); handleRejectTask(task); }} 
                                                       className="px-6 md:px-10 py-3 md:py-4 bg-rose-600/10 text-rose-500 border border-rose-500/20 font-black rounded-2xl text-[10px] md:text-[11px] uppercase tracking-widest flex items-center gap-2 md:gap-3 hover:bg-rose-600 hover:text-white transition-all shadow-xl"
                                                     >
                                                        <RotateCcw size={16} /> Revision
                                                     </button>
                                                   </>
                                                 )}

                                                 {isAssignedToMe && !task.skrc.isStarted && (
                                                   <button onClick={(e) => { e.stopPropagation(); handleStartTask(task); }} className="px-8 md:px-12 py-3 md:py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] md:text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-600/20">Acknowledge & Start</button>
                                                 )}
                                                 {isAssignedToMe && task.skrc.isStarted && task.skrc.status === 'Ongoing' && (
                                                   <button onClick={(e) => { e.stopPropagation(); handleInitiateDone(task); }} className="px-8 md:px-12 py-3 md:py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] md:text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-emerald-600/20">Submit Completion Report</button>
                                                 )}
                                                 {isAssignedToMe && isAwaiting && (
                                                   <div className="px-6 md:px-8 py-3 md:py-4 bg-zinc-800 text-blue-500 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] border border-blue-500/20 flex items-center gap-3">
                                                     <Clock size={16}/> Awaiting Approval
                                                   </div>
                                                 )}

                                                 {isManagement && (
                                                   <button onClick={(e) => { e.stopPropagation(); handleDeleteTrigger(task); }} className="p-3 md:p-4 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20" title="Decommission Task"><Trash2 size={20} /></button>
                                                 )}
                                              </div>
                                           </div>
                                        </div>

                                        {/* Main Strategic Details: Two Column Refactor */}
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-12">
                                           {/* Column 1: PRRR ANALYSIS FRAMEWORK */}
                                           <div className="space-y-6 md:space-y-8 bg-zinc-900/30 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-zinc-800/40">
                                              <div className="flex items-center gap-4 border-b border-zinc-800/50 pb-6 mb-2">
                                                 <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl"><ShieldAlert size={20}/></div>
                                                 <div>
                                                    <h4 className="text-[12px] md:text-[14px] font-black text-white uppercase tracking-[0.3em]">PRRR Analysis</h4>
                                                    <p className="text-[9px] md:text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Problem Persistence Management</p>
                                                 </div>
                                              </div>
                                              
                                              <div className="space-y-6">
                                                 {renderLargeTextBox("Problem Identification", task.problem.description, "rose", <AlertCircle size={12}/>)}
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {renderLargeTextBox("Root Cause", task.problem.rootCauseAndConsequences, "amber", <Activity size={12}/>)}
                                                    {renderLargeTextBox("Risk Exposure", task.problem.risk, "rose", <AlertTriangle size={12}/>)}
                                                 </div>
                                              </div>
                                           </div>

                                           {/* Column 2: SMART EXECUTION HUB */}
                                           <div className="space-y-6 md:space-y-8 bg-zinc-900/30 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-zinc-800/40">
                                              <div className="flex items-center gap-4 border-b border-zinc-800/50 pb-6 mb-2">
                                                 <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><TargetIcon size={20}/></div>
                                                 <div>
                                                    <h4 className="text-[12px] md:text-[14px] font-black text-white uppercase tracking-[0.3em]">SMART Framework</h4>
                                                    <p className="text-[9px] md:text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Precision Execution Parameters</p>
                                                 </div>
                                              </div>

                                              <div className="space-y-6">
                                                 {renderLargeTextBox("Specific Strategic Goal", task.smart.specific, "blue", <Target size={12}/>)}
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {renderLargeTextBox("Measurable Metrics", task.smart.measurable, "emerald", <BarChart size={12}/>)}
                                                    {renderLargeTextBox("Operational Deadline", task.deadline + " | " + task.smart.timeBound, "blue", <Clock size={12}/>)}
                                                 </div>
                                              </div>
                                           </div>
                                        </div>

                                        {/* Interaction & Dialogue Grid */}
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-12">
                                           <div className="space-y-5">
                                              <h4 className="text-[12px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3 ml-4">
                                                 <MessageSquare size={16}/> Executive-Staff Dialogue
                                              </h4>
                                              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 max-h-[400px] overflow-y-auto no-scrollbar shadow-inner">
                                                 {(task.comments || []).map((c, i) => (
                                                    <div key={i} className="space-y-2 border-b border-zinc-800/50 pb-4 last:border-0">
                                                       <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                                          <span className="text-amber-500 flex items-center gap-2"><UserCircle size={12}/> {c.user}</span>
                                                          <span className="text-zinc-600">{c.date}</span>
                                                       </div>
                                                       <p className="text-[13px] text-zinc-300 leading-relaxed pl-5 border-l border-zinc-800">{c.text}</p>
                                                    </div>
                                                 ))}
                                                 <div className="pt-4 flex gap-3">
                                                    <input 
                                                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-3.5 text-xs text-white outline-none focus:border-amber-500 shadow-inner"
                                                      placeholder="Add a strategic note or update..."
                                                      value={newComment}
                                                      onChange={e => setNewComment(e.target.value)}
                                                    />
                                                    <button onClick={() => handleAddComment(task)} className="p-3.5 bg-amber-500 text-black rounded-2xl hover:scale-110 transition-all shadow-lg shadow-amber-500/20"><Send size={18}/></button>
                                                 </div>
                                              </div>
                                           </div>

                                           <div className="space-y-10">
                                              <div className="space-y-5">
                                                 <h4 className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3 ml-4">
                                                    <FileInput size={16}/> Mission Reflection
                                                 </h4>
                                                 <div className="h-[280px]">
                                                    {renderLargeTextBox("Staff Completion Report", task.skrc.report || "Awaiting submission of execution report.", "emerald", <FileText size={14}/>)}
                                                 </div>
                                              </div>

                                              {isManagement && (
                                                 <div className="space-y-5">
                                                    <h4 className="text-[12px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 ml-4">
                                                       <ShieldCheck size={16}/> Executive appraisal
                                                    </h4>
                                                    <div className="relative group">
                                                       <textarea 
                                                          rows={5}
                                                          className="w-full bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 md:p-8 text-sm text-zinc-300 outline-none focus:border-amber-500 shadow-inner transition-all leading-relaxed"
                                                          placeholder="Provide formal feedback or appraisal remarks here..."
                                                          value={task.lineRemarks}
                                                          onChange={async (e) => {
                                                             const updatedTask = { ...task, lineRemarks: e.target.value };
                                                             await storageService.saveTask(updatedTask);
                                                             setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                                                          }}
                                                       />
                                                       <div className="absolute top-4 right-4 text-zinc-800 group-focus-within:text-amber-500/30 transition-colors">
                                                          <Settings2 size={24} />
                                                       </div>
                                                    </div>
                                                 </div>
                                              )}
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
          </div>
        )}
      </div>

      {/* Deployment Modal - ONE TASK PER FORM Focus */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-[3rem] md:rounded-[4rem] p-6 md:p-16 max-h-[95vh] overflow-y-auto no-scrollbar shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in slide-in-from-bottom-10 duration-700">
             <div className="flex justify-between items-center mb-8 md:mb-16">
               <div className="flex items-center gap-4 md:gap-6">
                  <div className="p-3 md:p-5 bg-amber-500/10 rounded-[2rem] border border-amber-500/20 text-amber-500">
                     <TargetIcon className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">Strategy Deployment</h2>
                    <p className="text-[9px] md:text-[11px] text-zinc-500 mt-2 uppercase tracking-[0.4em] font-bold">Persistence Node: Strategic Objective Master</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-4 md:p-5 bg-zinc-900 border border-zinc-800 rounded-[2rem] text-zinc-500 hover:text-white transition-all hover:bg-zinc-800 hover:rotate-90"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
             </div>

             <div className="space-y-12 md:space-y-16">
                {/* Section 1: Core Identification */}
                <div className="space-y-8 md:space-y-10">
                   <div className="flex items-center gap-4 border-l-4 border-amber-500 pl-6">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest">01. Objective Identification</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                      <div className="space-y-3">
                         <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Strategic Assignee</label>
                         <select className="w-full bg-zinc-900/50 border border-zinc-800 p-5 rounded-[1.5rem] text-sm font-bold text-white shadow-inner focus:border-amber-500 outline-none" value={newTask.responsibleParty} onChange={e => handleStaffSelect(e.target.value)}>
                            <option value="">Select Responsible Node...</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.position || s.role})</option>)}
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Deadline Date</label>
                         <input type="date" className="w-full bg-zinc-900/50 border border-zinc-800 p-5 rounded-[1.5rem] text-sm text-white shadow-inner focus:border-emerald-500 outline-none font-bold" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                         <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Core Objective (Job Description Context)</label>
                         <textarea rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] text-sm text-white shadow-inner focus:border-amber-500 outline-none transition-all leading-relaxed" value={newTask.role} onChange={e => setNewTask({...newTask, role: e.target.value})} placeholder="Define the core strategic objective for this session..." />
                      </div>
                   </div>
                </div>

                {/* Section 2: PRRR Framework */}
                <div className="space-y-8 md:space-y-10">
                   <div className="flex items-center justify-between border-l-4 border-rose-500 pl-6">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest">02. PRRR Analysis (Mandatory)</h3>
                      <button onClick={handleAiGenerate} disabled={isAiGenerating || !newTask.role} className="px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500 hover:text-black transition-all disabled:opacity-30">
                         {isAiGenerating ? <Loader2 className="animate-spin" size={14}/> : <><Wand2 size={14} /> Refine with AI</>}
                      </button>
                   </div>
                   
                   <div className="space-y-8 md:space-y-10">
                      <div className="space-y-3">
                         <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Info size={14}/> Problem Identification (Detailed Paragraph)</label>
                         <textarea rows={5} className="w-full bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-[2.5rem] text-sm text-zinc-300 shadow-inner focus:border-rose-500 outline-none transition-all leading-relaxed" placeholder="Identify and describe the core business problem this task addresses..." value={newTask.problem?.description} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, description: e.target.value}})} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                         <div className="space-y-3">
                            <label className="text-[11px] font-black text-amber-500 uppercase tracking-widest ml-1">Root Cause & Consequences</label>
                            <textarea rows={5} className="w-full bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-[2rem] text-sm text-zinc-300 shadow-inner focus:border-amber-500 outline-none leading-relaxed" placeholder="What is the underlying cause?" value={newTask.problem?.rootCauseAndConsequences} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, rootCauseAndConsequences: e.target.value}})} />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest ml-1">Operational Risk Assessment</label>
                            <textarea rows={5} className="w-full bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-[2rem] text-sm text-zinc-300 shadow-inner focus:border-rose-500 outline-none leading-relaxed" placeholder="What are the risks if ignored?" value={newTask.problem?.risk} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, risk: e.target.value}})} />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Section 3: SMART Execution */}
                <div className="space-y-8 md:space-y-10">
                   <div className="flex items-center gap-4 border-l-4 border-blue-500 pl-6">
                      <h3 className="text-lg font-black text-white uppercase tracking-widest">03. SMART Execution Hub</h3>
                   </div>
                   
                   <div className="space-y-8 md:space-y-10">
                      <div className="space-y-3">
                         <label className="text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1">Tasks for Today (Execution Steps)</label>
                         <textarea rows={4} className="w-full bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-[2rem] text-sm text-white shadow-inner focus:border-blue-500 outline-none leading-relaxed" placeholder="1. Detailed step one... 2. Detailed step two..." value={newTask.tasksForToday} onChange={e => setNewTask({...newTask, tasksForToday: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                         <div className="space-y-3">
                            <label className="text-[11px] font-black text-blue-500 uppercase tracking-widest ml-1">Specific Goal Definition</label>
                            <textarea rows={4} className="w-full bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-[2rem] text-sm text-zinc-300 shadow-inner focus:border-blue-500 outline-none" value={newTask.smart?.specific} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, specific: e.target.value}})} />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[11px] font-black text-emerald-500 uppercase tracking-widest ml-1">Measurable KPI / Outcome</label>
                            <textarea rows={4} className="w-full bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-[2rem] text-sm text-zinc-300 shadow-inner focus:border-emerald-500 outline-none" value={newTask.smart?.measurable} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, measurable: e.target.value}})} />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-10 md:pt-16 border-t border-zinc-900 flex flex-col sm:flex-row gap-6 md:gap-8">
                   <button onClick={handleCreateTask} className="flex-1 py-5 md:py-7 gold-gradient text-black font-black rounded-[2.5rem] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.25em] text-xs md:text-sm flex items-center justify-center gap-4 group">
                      <RocketIcon className="group-hover:translate-y-[-4px] transition-transform" /> Commit Strategic objective
                   </button>
                   <button onClick={() => setIsModalOpen(false)} className="px-10 md:px-16 py-5 md:py-7 bg-zinc-900 text-zinc-500 font-black rounded-[2.5rem] hover:bg-zinc-800 hover:text-white transition-all uppercase text-[10px] md:text-[11px] tracking-widest border border-zinc-800">
                      Abort Deployment
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Re-using other modals (Delete, Report) as they are standard functionality */}
      {isDeleteModalOpen && taskToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-xl" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-zinc-950 border border-rose-500/30 rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex items-center gap-6 mb-10">
               <div className="p-6 bg-rose-500/10 rounded-3xl border border-rose-500/20 text-rose-500">
                  <ShieldAlert size={40} />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Decommissioning Protocol</h2>
                  <p className="text-xs text-rose-500 font-bold uppercase tracking-widest mt-1">Strategic Clearance Required</p>
               </div>
             </div>
             <div className="space-y-6">
                <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
                   <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Entry SN</span>
                      <p className="text-lg font-black text-white">#{taskToDelete.sn}</p>
                   </div>
                   <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Objective Title</span>
                      <p className="text-[13px] font-medium text-zinc-300 line-clamp-2 italic leading-relaxed">"{taskToDelete.role}"</p>
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Type "DELETE" to confirm decommissioning</label>
                   <input 
                     type="text" 
                     autoFocus
                     className="w-full bg-zinc-950 border border-rose-500/30 rounded-2xl py-5 px-8 text-sm text-rose-500 font-black tracking-[0.3em] outline-none focus:border-rose-500 shadow-inner transition-all placeholder:text-zinc-900"
                     placeholder="CONFIRMATION KEY"
                     value={deleteConfirmationText}
                     onChange={(e) => setDeleteConfirmationText(e.target.value.toUpperCase())}
                   />
                </div>
                <div className="flex gap-4 pt-4">
                   <button 
                     onClick={executeDeleteTask}
                     disabled={deleteConfirmationText !== 'DELETE' || isUpdatingTask === taskToDelete.id}
                     className="flex-1 py-5 bg-rose-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all disabled:opacity-20"
                   >
                      {isUpdatingTask === taskToDelete.id ? <Loader2 className="animate-spin" size={18} /> : "Destroy Entry"}
                   </button>
                   <button onClick={() => setIsDeleteModalOpen(false)} className="px-8 py-5 bg-zinc-900 text-zinc-400 font-black rounded-2xl uppercase tracking-widest text-xs border border-zinc-800">Cancel</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {isReportModalOpen && reportingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-md" onClick={() => setIsReportModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-6">
                 <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                    <CheckCircle size={32} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-white uppercase tracking-tight">Mission Realization</h2>
                   <p className="text-xs text-zinc-500 mt-1 uppercase tracking-[0.2em] font-bold">Report Findings for Executive Review</p>
                 </div>
               </div>
               <button onClick={() => setIsReportModalOpen(false)} className="p-4 bg-zinc-900 rounded-3xl text-zinc-500 hover:text-white"><X size={24}/></button>
             </div>
             <div className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[11px] font-black text-zinc-600 uppercase tracking-widest ml-1">Execution Findings (Detailed Paragraph)</label>
                   <textarea 
                     rows={8}
                     placeholder="Provide a comprehensive breakdown of your results, achievement of SMART goals, and critical challenges faced during this execution phase..." 
                     className="w-full bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-[2rem] text-sm focus:border-emerald-500 outline-none text-zinc-200 leading-relaxed shadow-inner" 
                     value={reportText} 
                     onChange={e => setReportText(e.target.value)} 
                   />
                </div>
                <button onClick={handleSubmitReport} className="w-full py-6 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest text-[11px] flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-blue-600/30 transition-all">
                   <Send size={20} /> Transmit for Executive Verification
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

const RocketIcon = ({ className }: { className?: string }) => (
   <svg 
     xmlns="http://www.w3.org/2000/svg" 
     width="20" 
     height="20" 
     viewBox="0 0 24 24" 
     fill="none" 
     stroke="currentColor" 
     strokeWidth="2.5" 
     strokeLinecap="round" 
     strokeLinejoin="round" 
     className={className}
   >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71.79-1.81.2-2.5l-2.4-2.4c-.69-.59-1.79-.51-2.5.2Z"/><path d="m12.5 7.5 4 4"/><path d="m15 5 4 4"/><path d="M18.5 12c.35 3.5-4.5 7.5-12 11l2.5-2.5c.71-.71.79-1.81.2-2.5l-2.4-2.4c-.69-.59-1.79-.51-2.5.2L1.5 21.5c3.5-7.5 7.5-12 11-12c.35 0 .7.03 1.05.1"/><path d="M21.4 7.5c.29 0 .54-.22.61-.5a12.02 12.02 0 0 0-4.01-11c-.24-.19-.58-.19-.82 0a12.02 12.02 0 0 0-4.01 11c.07.28.32.5.61.5h7.62Z"/>
   </svg>
);