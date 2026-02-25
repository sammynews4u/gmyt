
import React, { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, Trash2, X, 
  CheckSquare, Loader2,
  ChevronDown, ChevronUp, Activity, ShieldAlert,
  Target, Clock, AlertTriangle,
  ClipboardList, Wand2,
  Zap, BarChart, Send, Printer,
  FileText, AlertCircle, ThumbsUp, RotateCcw,
  ArrowRight, Edit,
  Check, User, Upload, Database,
  Eye, MessageSquare, Target as TargetIcon
} from 'lucide-react';
import { Task, UserAccount, TaskStatus } from '../types';
import { storageService } from '../services/storageService';
import { generateTaskSchema } from '../services/geminiService';
import { taskSeeder } from '../services/taskSeeder';
import { generateId } from '../utils/id';

interface TaskBoardProps {
  user: UserAccount;
  staff: UserAccount[];
}

export default function TaskBoard({ user, staff }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Reporting State
  const [reportingTask, setReportingTask] = useState<Task | null>(null);
  const [reportText, setReportText] = useState('');
  const [reportStatus, setReportStatus] = useState<TaskStatus>('Completed');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const isCEO = user.role === 'CEO';
  const isPM = user.role === 'Project Manager';
  const isManagement = isCEO || isPM;

  const initialTaskState: Partial<Task> = {
    role: '',
    dateLogged: new Date().toLocaleDateString(),
    tasksForToday: '', 
    responsibleParty: '',
    problem: { description: '', rootCauseAndConsequences: '', risk: '' },
    smart: { specific: '', measurable: '', attainable: '', relevance: '', timeBound: 'Today EOD' },
    skrc: { status: 'Pending', isStarted: false, keyResult: '', reflection: '', challenges: '', report: '' },
    lineRemarks: '',
    deadline: new Date().toISOString().split('T')[0],
    priority: 3,
    comments: [],
    addedBy: user.role
  };

  const [formTask, setFormTask] = useState<Partial<Task>>(initialTaskState);

  const [activeTab, setActiveTab] = useState<'task' | 'prrr' | 'smart' | 'skrc' | 'report'>('task');
  const [expandedTab, setExpandedTab] = useState<'details' | 'report'>('details');

  const loadTasks = async () => {
    setIsLoading(true);
    const data = await storageService.getTasks();
    setTasks(data);
    setIsLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await loadTasks();
    };
    init();

    // Listen for sync completion to refresh task list
    const handleSyncComplete = () => {
      loadTasks();
    };
    window.addEventListener('gmyt-sync-complete', handleSyncComplete);
    return () => window.removeEventListener('gmyt-sync-complete', handleSyncComplete);
  }, []);

  const handleStaffSelect = (staffId: string) => {
    const member = staff.find(s => s.id === staffId);
    if (member) {
      setFormTask({
        ...formTask,
        responsibleParty: member.name,
        role: member.jobDescription || formTask.role || ''
      });
    }
  };

  const handleAiGenerate = async () => {
    const input = formTask.tasksForToday || formTask.role;
    if (!input) return alert("Please specify the Task Objective or Job Description first.");
    setIsAiGenerating(true);
    const suggestion = await generateTaskSchema(formTask.role || "Staff Member", input);
    if (suggestion) {
      setFormTask({
        ...formTask,
        tasksForToday: suggestion.tasksForToday || formTask.tasksForToday || '',
        problem: suggestion.problem,
        smart: { ...suggestion.smart, timeBound: suggestion.smart.timeBound || 'Today EOD' }
      });
    }
    setIsAiGenerating(false);
  };

  const handleSaveTask = async () => {
    if (!formTask.role || !formTask.responsibleParty) {
      alert("Job Description/Role and Responsible Party are mandatory.");
      return;
    }

    const taskToSave: Task = {
      ...initialTaskState,
      ...formTask,
      id: editingTask ? editingTask.id : generateId('task-'),
      sn: editingTask ? editingTask.sn : tasks.length + 1,
      dateLogged: editingTask ? editingTask.dateLogged : new Date().toLocaleDateString(),
      skrc: { ...initialTaskState.skrc!, ...formTask.skrc },
      comments: editingTask ? editingTask.comments : [],
      addedBy: editingTask ? editingTask.addedBy : user.role
    } as Task;

    await storageService.saveTask(taskToSave);
    await loadTasks();
    setIsModalOpen(false);
    setEditingTask(null);
    setFormTask(initialTaskState);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm("Are you sure you want to delete this strategic entry?")) {
      await storageService.deleteTask(id);
      await loadTasks();
    }
  };

  // --- REPORTING WORKFLOW ---

  const handleOpenReport = (task: Task) => {
    setReportingTask(task);
    setReportText(task.skrc.report || '');
    setReportStatus(task.skrc.status === 'Pending' || task.skrc.status === 'Ongoing' ? 'Completed' : task.skrc.status);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!reportingTask) return;
    
    let nextStatus = reportStatus;
    // If reporting completed, it goes to approval queue
    if (reportStatus === 'Completed') {
      nextStatus = 'Awaiting Approval';
    }

    const updatedTask: Task = {
      ...reportingTask,
      skrc: { 
        ...reportingTask.skrc, 
        status: nextStatus,
        report: reportText,
        // If they report it as started/ongoing/completed, isStarted is true
        isStarted: true 
      }
    };

    await storageService.saveTask(updatedTask);
    await loadTasks();
    setIsReportModalOpen(false);
    setReportingTask(null);
  };

  // --- MANAGEMENT VERIFICATION ---

  const handleVerifyTask = async (task: Task, isApproved: boolean) => {
    const updatedTask: Task = {
      ...task,
      skrc: {
        ...task.skrc,
        status: isApproved ? 'Completed' : 'Ongoing', // If rejected, goes back to Ongoing
      },
      lineRemarks: isApproved 
        ? `${task.lineRemarks ? task.lineRemarks + '\n' : ''}[VERIFIED by ${user.name}]` 
        : `${task.lineRemarks ? task.lineRemarks + '\n' : ''}[REJECTED by ${user.name}: Re-work required]`
    };
    await storageService.saveTask(updatedTask);
    await loadTasks();
  };

  const handleSeedData = async () => {
    if (confirm("This will populate the sheet with the strategic tasks from the organization document. Continue?")) {
      await taskSeeder.seedTasks();
      await loadTasks();
      alert("Strategic tasks have been successfully synchronized.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (Array.isArray(data)) {
          for (const item of data) {
            const task: Task = {
              ...initialTaskState,
              ...item,
              id: generateId('import-'),
              sn: tasks.length + 1,
              dateLogged: new Date().toLocaleDateString(),
              addedBy: user.role
            } as Task;
            await storageService.saveTask(task);
          }
          await loadTasks();
          alert(`${data.length} tasks imported successfully.`);
        } else {
          alert("Invalid file format. Please upload a JSON array of tasks.");
        }
      } catch {
        alert("Failed to parse file. Ensure it is a valid JSON document.");
      }
    };
    reader.readAsText(file);
  };

  const filteredTasks = tasks.filter(t => 
    t.role.toLowerCase().includes(search.toLowerCase()) || 
    t.responsibleParty.toLowerCase().includes(search.toLowerCase()) ||
    t.smart.specific.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Pending': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      case 'Ongoing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Awaiting Approval': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Delayed': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  const renderLargeTextBox = (title: string, content: string, color: string = "amber", icon?: React.ReactNode) => (
    <div className={`p-6 bg-zinc-950/50 border border-zinc-800/60 rounded-[2rem] space-y-4 h-full shadow-inner flex flex-col justify-start hover:border-${color}-500/30 transition-colors`}>
       <div className="flex items-center gap-3 mb-1 shrink-0">
          {icon && <div className={`text-${color}-500`}>{icon}</div>}
          <span className={`text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]`}>{title}</span>
       </div>
       <div className="text-sm font-medium text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {content || <span className="text-zinc-700 italic">No entry provided.</span>}
       </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 relative pb-24 h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center shrink-0">
        <div className="flex items-center gap-4 md:gap-5">
           <div className="p-3 md:p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20">
              <ClipboardList className="text-amber-500" size={28} />
           </div>
           <div>
              <h2 className="text-2xl md:text-3xl font-black gold-text uppercase tracking-tight">Smart Task Sheet</h2>
              <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-[0.3em]">
                 Strategic Project Management System
              </p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          {isManagement && (
            <>
              <button 
                onClick={handleSeedData}
                className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl hover:bg-amber-500 hover:text-black transition-all shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                title="Seed Strategic Data"
              >
                <Database size={18} /> Seed Data
              </button>
              <div className="relative">
                <input 
                  type="file" 
                  id="task-upload" 
                  className="hidden" 
                  accept=".json"
                  onChange={handleFileUpload}
                />
                <label 
                  htmlFor="task-upload"
                  className="p-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl hover:text-white transition-all shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                >
                  <Upload size={18} /> Import JSON
                </label>
              </div>
            </>
          )}
          <div className="relative flex-1 sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search sheet..." 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-amber-500 outline-none transition-all shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => window.print()} className="p-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl hover:text-white transition-all shadow-md">
             <Printer size={20} />
          </button>
          <button onClick={() => { setEditingTask(null); setFormTask(initialTaskState); setIsModalOpen(true); }} className="px-6 md:px-8 py-3.5 gold-gradient rounded-2xl font-black text-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-3 hover:shadow-2xl hover:shadow-amber-500/20 active:scale-95 transition-all justify-center">
            <Plus size={18} /> Log Task
          </button>
        </div>
      </div>

      {/* Sheet Table Container */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 z-10">
             <Loader2 className="animate-spin text-amber-500" size={48} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-500">
             <ClipboardList size={48} className="mb-4 opacity-20" />
             <p className="text-xs uppercase tracking-widest font-bold">No tasks logged in the sheet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto h-full no-scrollbar">
            <table className="w-full border-collapse min-w-[4500px]">
              <thead className="bg-zinc-950 text-zinc-400 text-[11px] uppercase font-black tracking-[0.15em] sticky top-0 z-10 border-b border-zinc-800">
                <tr>
                  <th className="p-8 w-16 sticky left-0 bg-zinc-950 z-20"></th>
                  <th className="p-8 w-40 text-center border-r border-zinc-800 bg-zinc-950 sticky left-16 z-20">SN / Days</th>
                  <th className="p-8 w-80 text-left border-r border-zinc-800">Job Description / Role</th>
                  <th className="p-8 w-96 text-left border-r border-zinc-800 bg-amber-500/5">TASK (Strategic Objective)</th>
                  <th className="p-8 w-96 text-left border-r border-zinc-800">Problem Identification</th>
                  <th className="p-8 w-96 text-left border-r border-zinc-800">Root Cause & / or Consequence</th>
                  <th className="p-8 w-96 text-left border-r border-zinc-800">Risk</th>
                  <th className="p-8 w-64 text-left border-r border-zinc-800">Responsible Party</th>
                  <th className="p-8 w-96 text-left border-r border-zinc-800">Specific (Action Steps)</th>
                  <th className="p-8 w-64 text-left border-r border-zinc-800">Measurable</th>
                  <th className="p-8 w-48 text-left border-r border-zinc-800">Attainable</th>
                  <th className="p-8 w-64 text-left border-r border-zinc-800">Relevance</th>
                  <th className="p-8 w-48 text-left border-r border-zinc-800">Time Bound</th>
                  <th className="p-8 w-56 text-center border-r border-zinc-800">Status</th>
                  <th className="p-8 w-96 text-left border-r border-zinc-800">Key Result</th>
                  <th className="p-8 w-96 text-left border-r border-zinc-800">Reflections</th>
                  <th className="p-8 w-96 text-left border-r border-zinc-800">Challenges</th>
                  <th className="p-8 w-96 text-left border-r border-zinc-800">SUP / Line Remarks</th>
                  <th className="p-8 w-48 text-center sticky right-0 bg-zinc-950 z-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredTasks.map((task) => {
                  const isAssignedToMe = task.responsibleParty === user.name;
                  const isAwaitingApproval = task.skrc.status === 'Awaiting Approval';

                  return (
                  <React.Fragment key={task.id}>
                    <tr 
                      className={`hover:bg-zinc-800/40 transition-colors group text-base text-zinc-300 cursor-pointer ${expandedTaskId === task.id ? 'bg-zinc-800/30' : ''} ${isAwaitingApproval ? 'bg-amber-500/5' : ''}`}
                      onClick={() => {
                        if (expandedTaskId !== task.id) setExpandedTab('details');
                        setExpandedTaskId(expandedTaskId === task.id ? null : task.id);
                      }}
                    >
                      <td className="p-8 sticky left-0 bg-zinc-900 group-hover:bg-zinc-800 z-10 border-r border-zinc-800 text-center">
                         {expandedTaskId === task.id ? <ChevronUp size={20} className="text-amber-500"/> : <ChevronDown size={20}/>}
                      </td>
                      <td className="p-8 text-center font-mono border-r border-zinc-800 bg-zinc-900 group-hover:bg-zinc-800 sticky left-16 z-10">
                         <div className="font-black text-amber-500 text-lg">#{task.sn}</div>
                         <div className="text-[11px] text-zinc-500 mt-1 font-bold">{task.dateLogged || 'N/A'}</div>
                      </td>
                      <td className="p-8 border-r border-zinc-800 font-black text-white whitespace-pre-wrap text-base leading-tight bg-zinc-900/30">{task.role}</td>
                      <td className="p-8 border-r border-zinc-800 font-bold text-amber-500 bg-amber-500/5 whitespace-pre-wrap text-base">{task.tasksForToday}</td>
                      <td className="p-8 border-r border-zinc-800 whitespace-pre-wrap">{task.problem.description}</td>
                      <td className="p-8 border-r border-zinc-800 whitespace-pre-wrap">{task.problem.rootCauseAndConsequences}</td>
                      <td className="p-8 border-r border-zinc-800 text-rose-400 whitespace-pre-wrap">{task.problem.risk}</td>
                      <td className="p-8 border-r border-zinc-800 font-bold text-amber-500 text-base">{task.responsibleParty}</td>
                      <td className="p-8 border-r border-zinc-800 whitespace-pre-wrap">{task.smart.specific}</td>
                      <td className="p-8 border-r border-zinc-800 whitespace-pre-wrap">{task.smart.measurable}</td>
                      <td className="p-8 border-r border-zinc-800 whitespace-pre-wrap">{task.smart.attainable}</td>
                      <td className="p-8 border-r border-zinc-800 whitespace-pre-wrap">{task.smart.relevance}</td>
                      <td className="p-8 border-r border-zinc-800 font-mono text-emerald-400 text-base">{task.smart.timeBound}</td>
                      <td className="p-8 border-r border-zinc-800 text-center">
                         <span className={`px-4 py-2 rounded-full text-[11px] font-black uppercase border ${getStatusColor(task.skrc.status)}`}>
                            {task.skrc.status}
                         </span>
                      </td>
                      <td className="p-8 border-r border-zinc-800 whitespace-pre-wrap">{task.skrc.keyResult || '-'}</td>
                      <td className="p-8 border-r border-zinc-800 italic whitespace-pre-wrap">{task.skrc.reflection || '-'}</td>
                      <td className="p-8 border-r border-zinc-800 text-rose-400 whitespace-pre-wrap">{task.skrc.challenges || '-'}</td>
                      <td className="p-8 border-r border-zinc-800 font-bold text-blue-400 whitespace-pre-wrap">{task.lineRemarks || '-'}</td>
                      <td className="p-8 text-center sticky right-0 bg-zinc-900 group-hover:bg-zinc-800 z-10 flex gap-3 justify-center">
                         <button onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} className="p-3 bg-zinc-800 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-black transition-all shadow-lg"><Edit size={18} /></button>
                         {isManagement && (
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-3 bg-zinc-800 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"><Trash2 size={18} /></button>
                         )}
                      </td>
                    </tr>
                    {expandedTaskId === task.id && (
                      <tr>
                        <td colSpan={19} className="bg-zinc-950/50 p-0 border-b border-zinc-800">
                           <div className="p-8 md:p-12 animate-in slide-in-from-top-4 duration-500 space-y-12">
                              {/* Expanded Status & Action Banner */}
                              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                                 <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${task.skrc.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                       <Activity size={28} />
                                    </div>
                                    <div>
                                       <h3 className="text-2xl font-black gold-text uppercase tracking-tighter leading-none mb-1">{task.role}</h3>
                                       <div className="flex items-center gap-3 mt-2">
                                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{task.responsibleParty}</span>
                                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{task.dateLogged}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex gap-4">
                                    <div className="flex p-1 bg-zinc-950 rounded-2xl border border-zinc-800">
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setExpandedTab('details'); }}
                                         className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${expandedTab === 'details' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                                       >
                                         Details
                                       </button>
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setExpandedTab('report'); }}
                                         className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${expandedTab === 'report' ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                                       >
                                         Report
                                       </button>
                                    </div>
                                    {/* STAFF ACTIONS: Submit Report */}
                                    {isAssignedToMe && task.skrc.status !== 'Completed' && (
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); handleOpenReport(task); }}
                                          className="px-8 py-4 gold-gradient text-black font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center gap-3"
                                       >
                                          <FileText size={16} /> Submit Daily Report
                                       </button>
                                    )}

                                    {/* MANAGER ACTIONS: Verify/Reject */}
                                    {isManagement && isAwaitingApproval && (
                                      <div className="flex gap-3">
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleVerifyTask(task, true); }}
                                            className="px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all flex items-center gap-2"
                                         >
                                            <ThumbsUp size={16} /> Verify Done
                                         </button>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleVerifyTask(task, false); }}
                                            className="px-6 py-4 bg-zinc-800 text-rose-500 border border-rose-500/30 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2"
                                         >
                                            <RotateCcw size={16} /> Reject
                                         </button>
                                      </div>
                                    )}
                                 </div>
                              </div>

                               {expandedTab === 'details' ? (
                                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-500">
                                   {/* Left Column: Task & PRRR & SMART */}
                                   <div className="lg:col-span-12 space-y-12">
                                      {/* TASK SECTION */}
                                      <div className="space-y-6">
                                         <h4 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-3"><Zap size={20}/> Strategic Task Objective</h4>
                                         <div className="bg-amber-500/5 border border-amber-500/20 p-10 rounded-[3rem] text-3xl font-black text-white leading-tight shadow-2xl">
                                            {task.tasksForToday || "No task objective defined."}
                                         </div>
                                      </div>

                                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                         {/* PRRR Grid */}
                                         <div className="space-y-6">
                                            <h4 className="text-sm font-black text-rose-500 uppercase tracking-[0.4em] flex items-center gap-3"><ShieldAlert size={20}/> PRRR Analysis Protocol</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                                               {renderLargeTextBox("Problem Identification", task.problem.description, "rose", <AlertCircle size={18}/>)}
                                               {renderLargeTextBox("Root Cause & Consequence", task.problem.rootCauseAndConsequences, "amber", <Activity size={18}/>)}
                                               {renderLargeTextBox("Risk Exposure", task.problem.risk, "rose", <AlertTriangle size={18}/>)}
                                            </div>
                                         </div>

                                         {/* SMART Grid */}
                                         <div className="space-y-6">
                                            <h4 className="text-sm font-black text-blue-500 uppercase tracking-[0.4em] flex items-center gap-3"><Target size={20}/> SMART Execution Framework</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
                                               {renderLargeTextBox("Specific", task.smart.specific, "blue")}
                                               {renderLargeTextBox("Measurable", task.smart.measurable, "emerald")}
                                               {renderLargeTextBox("Attainable", task.smart.attainable, "blue")}
                                               {renderLargeTextBox("Relevance", task.smart.relevance, "amber")}
                                               {renderLargeTextBox("Time Bound", task.smart.timeBound, "rose", <Clock size={18}/>)}
                                            </div>
                                         </div>
                                      </div>
                                   </div>

                                   {/* SKRC Metrics */}
                                   <div className="lg:col-span-12 space-y-8 pt-12 border-t border-zinc-800">
                                      <div className="flex items-center justify-between mb-4">
                                         <h4 className="text-lg font-black text-emerald-500 uppercase tracking-[0.5em] flex items-center gap-4"><BarChart size={28}/> SKRC Performance Metrics</h4>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                         {renderLargeTextBox("Key Result (Outcome)", task.skrc.keyResult, "emerald", <CheckSquare size={20}/>)}
                                         {renderLargeTextBox("Reflections (Learnings)", task.skrc.reflection, "blue", <Eye size={20}/>)}
                                         {renderLargeTextBox("Challenges (Blockers)", task.skrc.challenges, "rose", <ShieldAlert size={20}/>)}
                                         {renderLargeTextBox("SUP / Line Remarks", task.lineRemarks, "amber", <MessageSquare size={20}/>)}
                                      </div>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="flex items-center justify-between">
                                       <h4 className="text-lg font-black text-emerald-500 uppercase tracking-[0.5em] flex items-center gap-4"><FileText size={28}/> Final Execution Findings</h4>
                                       <div className={`px-6 py-2 rounded-full text-xs font-black uppercase border ${getStatusColor(task.skrc.status)}`}>
                                          Current Status: {task.skrc.status}
                                       </div>
                                    </div>
                                    <div className="bg-zinc-900/80 border border-zinc-800 p-12 rounded-[4rem] text-xl text-zinc-200 leading-relaxed shadow-2xl min-h-[500px] whitespace-pre-wrap">
                                       {task.skrc.report || <span className="text-zinc-700 italic">No report submitted yet. The staff member has not transmitted the final execution findings for this strategic objective.</span>}
                                    </div>
                                 </div>
                               )}
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

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-7xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-8 md:p-12 max-h-[95vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in duration-500">
             <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
                     <TargetIcon size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{editingTask ? 'Edit Task Sheet Entry' : 'Log New Smart Task'}</h2>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-[0.4em] font-bold">Comprehensive PRRR-SMART-SKRC Protocol</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all"><X size={24} /></button>
             </div>

             {/* Tab Navigation */}
             <div className="flex gap-2 p-1.5 bg-zinc-900 rounded-2xl mb-10 border border-zinc-800 overflow-x-auto no-scrollbar">
                {[
                  { id: 'task', label: '1. TASK Objective', icon: <Zap size={16}/> },
                  { id: 'prrr', label: '2. PRRR Analysis', icon: <ShieldAlert size={16}/> },
                  { id: 'smart', label: '3. SMART Execution', icon: <Target size={16}/> },
                  { id: 'skrc', label: '4. SKRC Performance', icon: <BarChart size={16}/> },
                  { id: 'report', label: '5. FINAL REPORT', icon: <FileText size={16}/> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-none md:flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
             </div>

             <div className="space-y-10">
                {activeTab === 'task' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* TASK Section */}
                    <div className="space-y-6">
                       <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Zap size={16} /> 1. Strategic Task Objective</h3>
                          <button 
                            onClick={handleAiGenerate} 
                            disabled={isAiGenerating}
                            className="px-6 py-2 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {isAiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                            AI Auto-Fill Sheet
                          </button>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">What is the primary task or objective to be achieved today?</label>
                          <textarea rows={4} className="w-full bg-amber-500/5 border border-zinc-800 p-6 rounded-[2rem] text-lg font-bold text-white focus:border-amber-500 outline-none resize-none shadow-inner" value={formTask.tasksForToday} onChange={e => setFormTask({...formTask, tasksForToday: e.target.value})} placeholder="e.g. Audit all ICT systems for security vulnerabilities..." />
                       </div>
                    </div>

                    {/* Identity Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-800 pt-10">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <User size={14} /> Assign Responsible Party
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-zinc-900/50 rounded-[2rem] border border-zinc-800 no-scrollbar">
                             {staff.map(s => (
                               <button
                                 key={s.id}
                                 onClick={() => handleStaffSelect(s.id)}
                                 className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border text-left flex flex-col justify-between h-24 ${formTask.responsibleParty === s.name ? 'bg-amber-500 text-black border-amber-500 shadow-xl scale-[1.02]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}
                               >
                                 <span className="truncate w-full">{s.name}</span>
                                 <span className={`text-[8px] mt-1 line-clamp-2 ${formTask.responsibleParty === s.name ? 'text-black/60' : 'text-zinc-500'}`}>{s.role}</span>
                               </button>
                             ))}
                          </div>
                          {formTask.responsibleParty && (
                            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                               <Check size={14} className="text-amber-500" />
                               <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Selected: {formTask.responsibleParty}</span>
                            </div>
                          )}
                       </div>

                       <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Job Description / Role Context</label>
                             <textarea rows={4} className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-sm font-bold text-white focus:border-amber-500 outline-none resize-none shadow-inner leading-relaxed" value={formTask.role} onChange={e => setFormTask({...formTask, role: e.target.value})} placeholder="e.g. Head of ICT Duties: Oversee, manage and ensure full functionality..." />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Time Bound (Deadline)</label>
                             <input type="text" className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs text-white focus:border-amber-500 outline-none" value={formTask.smart?.timeBound} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, timeBound: e.target.value}})} placeholder='e.g. "Today EOD", "By Friday 3pm"' />
                          </div>
                       </div>
                    </div>

                    <div className="flex justify-end">
                       <button onClick={() => setActiveTab('prrr')} className="px-8 py-4 bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center gap-2">Next: PRRR Analysis <ArrowRight size={16}/></button>
                    </div>
                  </div>
                )}

                {activeTab === 'prrr' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* PRRR Section */}
                    <div className="space-y-6">
                       <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={16} /> PRRR Analysis</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Problem Identification</label>
                             <textarea rows={8} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-rose-500 outline-none resize-none" value={formTask.problem?.description} onChange={e => setFormTask({...formTask, problem: {...formTask.problem!, description: e.target.value}})} placeholder="What is wrong? Be factual." />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Root Cause & Consequence</label>
                             <textarea rows={8} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-rose-500 outline-none resize-none" value={formTask.problem?.rootCauseAndConsequences} onChange={e => setFormTask({...formTask, problem: {...formTask.problem!, rootCauseAndConsequences: e.target.value}})} placeholder="Why it happened & Impact." />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Risk</label>
                             <textarea rows={8} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-rose-500 outline-none resize-none" value={formTask.problem?.risk} onChange={e => setFormTask({...formTask, problem: {...formTask.problem!, risk: e.target.value}})} placeholder="Potential damage/loss." />
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-between">
                       <button onClick={() => setActiveTab('task')} className="px-8 py-4 bg-zinc-900 text-zinc-500 font-black rounded-2xl uppercase tracking-widest text-xs">Back</button>
                       <button onClick={() => setActiveTab('smart')} className="px-8 py-4 bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center gap-2">Next: SMART Execution <ArrowRight size={16}/></button>
                    </div>
                  </div>
                )}

                {activeTab === 'smart' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* SMART Section */}
                    <div className="space-y-6">
                       <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center gap-2"><Target size={16} /> SMART Execution</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Specific (Concrete Action Steps)</label>
                             <textarea rows={4} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-blue-500 outline-none resize-none" value={formTask.smart?.specific} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, specific: e.target.value}})} placeholder="Exactly what you will do." />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Measurable (Success Indicator)</label>
                             <textarea rows={4} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-blue-500 outline-none resize-none" value={formTask.smart?.measurable} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, measurable: e.target.value}})} placeholder="How will you know it's done?" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Attainable (Feasibility)</label>
                             <textarea rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-blue-500 outline-none resize-none" value={formTask.smart?.attainable} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, attainable: e.target.value}})} placeholder="Is it achievable with current resources?" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Relevance (Business Value)</label>
                             <textarea rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-blue-500 outline-none resize-none" value={formTask.smart?.relevance} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, relevance: e.target.value}})} placeholder="Why does this matter?" />
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-between">
                       <button onClick={() => setActiveTab('prrr')} className="px-8 py-4 bg-zinc-900 text-zinc-500 font-black rounded-2xl uppercase tracking-widest text-xs">Back</button>
                       <button onClick={() => setActiveTab('skrc')} className="px-8 py-4 bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center gap-2">Next: SKRC Performance <ArrowRight size={16}/></button>
                    </div>
                  </div>
                )}

                {activeTab === 'skrc' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* SKRC & Feedback Section */}
                    <div className="space-y-6">
                       <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><BarChart size={16} /> SKRC & Feedback</h3>
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</label>
                             <select className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs font-bold text-white focus:border-emerald-500 outline-none" value={formTask.skrc?.status} onChange={e => setFormTask({...formTask, skrc: {...formTask.skrc!, status: e.target.value as TaskStatus}})}>
                                <option value="Pending">Pending</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Awaiting Approval">Awaiting Approval</option>
                                <option value="Completed">Completed</option>
                                <option value="Delayed">Delayed</option>
                             </select>
                          </div>
                          <div className="space-y-2 md:col-span-3">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Key Result (Outcome)</label>
                             <textarea rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-emerald-500 outline-none resize-none" value={formTask.skrc?.keyResult} onChange={e => setFormTask({...formTask, skrc: {...formTask.skrc!, keyResult: e.target.value}})} placeholder="Final deliverable or impact achieved." />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reflections (Learnings)</label>
                             <textarea rows={4} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-emerald-500 outline-none resize-none" value={formTask.skrc?.reflection} onChange={e => setFormTask({...formTask, skrc: {...formTask.skrc!, reflection: e.target.value}})} placeholder="What was learned or process insights." />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Challenges (Blockers)</label>
                             <textarea rows={4} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-zinc-300 focus:border-emerald-500 outline-none resize-none" value={formTask.skrc?.challenges} onChange={e => setFormTask({...formTask, skrc: {...formTask.skrc!, challenges: e.target.value}})} placeholder="Difficulties faced during execution." />
                          </div>
                       </div>
                       
                       {isManagement && (
                         <div className="space-y-2 pt-4 border-t border-zinc-800/50">
                            <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">SUP / Line Remarks (Supervisor Only)</label>
                            <textarea rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-sm text-white focus:border-amber-500 outline-none resize-none font-bold" value={formTask.lineRemarks} onChange={e => setFormTask({...formTask, lineRemarks: e.target.value})} placeholder="Feedback, approval, or directives." />
                         </div>
                       )}
                    </div>
                    <div className="flex justify-start">
                       <button onClick={() => setActiveTab('smart')} className="px-8 py-4 bg-zinc-900 text-zinc-500 font-black rounded-2xl uppercase tracking-widest text-xs">Back</button>
                    </div>
                  </div>
                )}

                {activeTab === 'report' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-6">
                       <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><FileText size={16} /> Final Execution Report</h3>
                       <div className="space-y-4">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Detailed Paragraph Report (Findings & Results)</label>
                          <textarea 
                            rows={12} 
                            className="w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] text-lg text-white focus:border-emerald-500 outline-none resize-none shadow-inner leading-relaxed" 
                            value={formTask.skrc?.report} 
                            onChange={e => setFormTask({...formTask, skrc: {...formTask.skrc!, report: e.target.value}})} 
                            placeholder="Provide a comprehensive breakdown of your results, achievement of SMART goals, and critical challenges faced..." 
                          />
                       </div>
                    </div>
                    <div className="flex justify-start">
                       <button onClick={() => setActiveTab('skrc')} className="px-8 py-4 bg-zinc-900 text-zinc-500 font-black rounded-2xl uppercase tracking-widest text-xs">Back</button>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-zinc-800">
                   <button onClick={handleSaveTask} className="flex-1 py-4 gold-gradient text-black font-black rounded-2xl uppercase tracking-widest text-xs hover:shadow-xl transition-all">
                      {editingTask ? 'Update Sheet Entry' : 'Log Task to Sheet'}
                   </button>
                   <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-black rounded-2xl uppercase tracking-widest text-xs hover:text-white transition-all">
                      Cancel
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {isReportModalOpen && reportingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-md" onClick={() => setIsReportModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-6">
                 <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                    <CheckCircle size={32} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-white uppercase tracking-tight">Daily Execution Report</h2>
                   <p className="text-xs text-zinc-500 mt-1 uppercase tracking-[0.2em] font-bold">End of Day (EOD) Submission</p>
                 </div>
               </div>
               <button onClick={() => setIsReportModalOpen(false)} className="p-4 bg-zinc-900 rounded-3xl text-zinc-500 hover:text-white"><X size={24}/></button>
             </div>
             <div className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[11px] font-black text-zinc-600 uppercase tracking-widest ml-1">Current Execution Status</label>
                   <div className="grid grid-cols-3 gap-4">
                      {['Completed', 'Ongoing', 'Delayed'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setReportStatus(status as TaskStatus)}
                          className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${reportStatus === status ? 
                            (status === 'Completed' ? 'bg-emerald-500 text-black border-emerald-500' : 
                             status === 'Ongoing' ? 'bg-blue-500 text-white border-blue-500' : 
                             'bg-rose-500 text-white border-rose-500') 
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                        >
                          {status}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[11px] font-black text-zinc-600 uppercase tracking-widest ml-1">Report Findings (Detailed Paragraph)</label>
                   <textarea 
                     rows={6}
                     placeholder="Provide a comprehensive breakdown of your results, achievement of SMART goals, and critical challenges faced during this execution phase..." 
                     className="w-full bg-zinc-950 border border-zinc-800 p-6 md:p-8 rounded-[2rem] text-sm focus:border-emerald-500 outline-none text-zinc-200 leading-relaxed shadow-inner" 
                     value={reportText} 
                     onChange={e => setReportText(e.target.value)} 
                   />
                </div>
                <button onClick={handleSubmitReport} className="w-full py-6 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-[11px] flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-emerald-600/30 transition-all">
                   <Send size={20} /> Transmit Report
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
    