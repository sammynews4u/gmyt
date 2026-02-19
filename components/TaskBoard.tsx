
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, CheckCircle, Trash2, X, Play, 
  CheckSquare, Loader2, Layers,
  ChevronDown, ChevronUp, Activity, ShieldAlert,
  Target, Bookmark, Clock, AlertTriangle, ShieldCheck,
  ClipboardList, Settings2, Sparkles, Wand2, UserCircle,
  Zap, Cpu, ListChecks, FileInput, Send, Printer, MessageSquare,
  FileText, AlertCircle, Eye, ThumbsUp, RotateCcw,
  Target as TargetIcon, ArrowRight, Info, BarChart, Edit,
  Calendar, Check
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
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const isCEO = user.role === 'CEO';
  const isPM = user.role === 'Project Manager';
  const isManagement = isCEO || isPM;

  const initialTaskState: Partial<Task> = {
    role: '',
    dateLogged: new Date().toLocaleDateString(),
    tasksForToday: '', // Mapped to Specific primarily
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
      setFormTask({
        ...formTask,
        responsibleParty: member.name,
        role: member.jobDescription || formTask.role || ''
      });
    }
  };

  const handleAiGenerate = async () => {
    if (!formTask.role) return alert("Please specify the Core Objective (Job Description) first.");
    setIsAiGenerating(true);
    const suggestion = await generateTaskSchema(formTask.role, "Optimal performance goals.");
    if (suggestion) {
      setFormTask({
        ...formTask,
        problem: suggestion.problem,
        smart: { ...suggestion.smart, timeBound: 'Today EOD' }
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
      id: editingTask ? editingTask.id : Date.now().toString(),
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

  const handleStatusUpdate = async (task: Task, newStatus: TaskStatus) => {
    const updated = { ...task, skrc: { ...task.skrc, status: newStatus } };
    await storageService.saveTask(updated);
    setTasks(tasks.map(t => t.id === task.id ? updated : t));
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
    <div className={`p-5 bg-zinc-950/50 border border-zinc-800/60 rounded-3xl space-y-3 h-full shadow-inner flex flex-col justify-start hover:border-${color}-500/30 transition-colors`}>
       <div className="flex items-center gap-2 mb-1 shrink-0">
          {icon && <div className={`text-${color}-500`}>{icon}</div>}
          <span className={`text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]`}>{title}</span>
       </div>
       <div className="text-xs font-medium text-zinc-300 leading-relaxed whitespace-pre-wrap">
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
            <table className="w-full border-collapse min-w-[3000px]">
              <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase font-black tracking-[0.1em] sticky top-0 z-10 border-b border-zinc-800">
                <tr>
                  <th className="p-4 w-12 sticky left-0 bg-zinc-950 z-20"></th>
                  <th className="p-4 w-32 text-center border-r border-zinc-800 bg-zinc-950 sticky left-12 z-20">SN / Days</th>
                  <th className="p-4 w-64 text-left border-r border-zinc-800">Job Description / Role</th>
                  <th className="p-4 w-64 text-left border-r border-zinc-800">Problem Identification</th>
                  <th className="p-4 w-64 text-left border-r border-zinc-800">Root Cause & / or Consequence</th>
                  <th className="p-4 w-64 text-left border-r border-zinc-800">Risk</th>
                  <th className="p-4 w-48 text-left border-r border-zinc-800">Responsible Party</th>
                  <th className="p-4 w-64 text-left border-r border-zinc-800">Specific (Action Steps)</th>
                  <th className="p-4 w-48 text-left border-r border-zinc-800">Measurable</th>
                  <th className="p-4 w-32 text-left border-r border-zinc-800">Attainable</th>
                  <th className="p-4 w-48 text-left border-r border-zinc-800">Relevance</th>
                  <th className="p-4 w-32 text-left border-r border-zinc-800">Time Bound</th>
                  <th className="p-4 w-40 text-center border-r border-zinc-800">Status</th>
                  <th className="p-4 w-64 text-left border-r border-zinc-800">Key Result</th>
                  <th className="p-4 w-64 text-left border-r border-zinc-800">Reflections</th>
                  <th className="p-4 w-64 text-left border-r border-zinc-800">Challenges</th>
                  <th className="p-4 w-64 text-left border-r border-zinc-800">SUP / Line Remarks</th>
                  <th className="p-4 w-32 text-center sticky right-0 bg-zinc-950 z-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <tr 
                      className={`hover:bg-zinc-800/40 transition-colors group text-xs text-zinc-300 cursor-pointer ${expandedTaskId === task.id ? 'bg-zinc-800/30' : ''}`}
                      onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    >
                      <td className="p-4 sticky left-0 bg-zinc-900 group-hover:bg-zinc-800 z-10 border-r border-zinc-800 text-center">
                         {expandedTaskId === task.id ? <ChevronUp size={16} className="text-amber-500"/> : <ChevronDown size={16}/>}
                      </td>
                      <td className="p-4 text-center font-mono border-r border-zinc-800 bg-zinc-900 group-hover:bg-zinc-800 sticky left-12 z-10">
                         <div className="font-black text-amber-500">#{task.sn}</div>
                         <div className="text-[10px] text-zinc-500 mt-1 font-bold">{task.dateLogged || 'N/A'}</div>
                      </td>
                      <td className="p-4 border-r border-zinc-800 font-bold text-white whitespace-pre-wrap">{task.role}</td>
                      <td className="p-4 border-r border-zinc-800 whitespace-pre-wrap line-clamp-2">{task.problem.description}</td>
                      <td className="p-4 border-r border-zinc-800 whitespace-pre-wrap line-clamp-2">{task.problem.rootCauseAndConsequences}</td>
                      <td className="p-4 border-r border-zinc-800 text-rose-400 whitespace-pre-wrap line-clamp-2">{task.problem.risk}</td>
                      <td className="p-4 border-r border-zinc-800 font-bold text-amber-500">{task.responsibleParty}</td>
                      <td className="p-4 border-r border-zinc-800 whitespace-pre-wrap line-clamp-2">{task.smart.specific}</td>
                      <td className="p-4 border-r border-zinc-800 whitespace-pre-wrap line-clamp-2">{task.smart.measurable}</td>
                      <td className="p-4 border-r border-zinc-800 whitespace-pre-wrap">{task.smart.attainable}</td>
                      <td className="p-4 border-r border-zinc-800 whitespace-pre-wrap line-clamp-2">{task.smart.relevance}</td>
                      <td className="p-4 border-r border-zinc-800 font-mono text-emerald-400">{task.smart.timeBound}</td>
                      <td className="p-4 border-r border-zinc-800 text-center">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(task.skrc.status)}`}>
                            {task.skrc.status}
                         </span>
                      </td>
                      <td className="p-4 border-r border-zinc-800 whitespace-pre-wrap line-clamp-2">{task.skrc.keyResult || '-'}</td>
                      <td className="p-4 border-r border-zinc-800 italic whitespace-pre-wrap line-clamp-2">{task.skrc.reflection || '-'}</td>
                      <td className="p-4 border-r border-zinc-800 text-rose-400 whitespace-pre-wrap line-clamp-2">{task.skrc.challenges || '-'}</td>
                      <td className="p-4 border-r border-zinc-800 font-bold text-blue-400 whitespace-pre-wrap line-clamp-2">{task.lineRemarks || '-'}</td>
                      <td className="p-4 text-center sticky right-0 bg-zinc-900 group-hover:bg-zinc-800 z-10 flex gap-2 justify-center">
                         <button onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} className="p-2 bg-zinc-800 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-black transition-all"><Edit size={14} /></button>
                         {isManagement && (
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-2 bg-zinc-800 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                         )}
                      </td>
                    </tr>
                    {expandedTaskId === task.id && (
                      <tr>
                        <td colSpan={18} className="bg-zinc-950/50 p-0 border-b border-zinc-800">
                           <div className="p-8 md:p-12 animate-in slide-in-from-top-4 duration-500">
                              {/* Expanded Status & Action Banner */}
                              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                                 <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${task.skrc.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                       <Activity size={28} />
                                    </div>
                                    <div>
                                       <h3 className="text-xl font-black text-white uppercase tracking-tight">{task.role}</h3>
                                       <div className="flex items-center gap-3 mt-2">
                                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{task.responsibleParty}</span>
                                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{task.dateLogged}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex gap-3">
                                    {['Pending', 'Ongoing', 'Completed'].map((s) => (
                                       <button 
                                          key={s}
                                          onClick={() => handleStatusUpdate(task, s as TaskStatus)}
                                          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${task.skrc.status === s ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-white'}`}
                                       >
                                          {s}
                                       </button>
                                    ))}
                                 </div>
                              </div>

                              {/* PRRR Grid */}
                              <div className="mb-10">
                                 <h4 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><ShieldAlert size={14}/> PRRR Analysis Protocol</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {renderLargeTextBox("Problem Identification", task.problem.description, "rose", <AlertCircle size={14}/>)}
                                    {renderLargeTextBox("Root Cause & Consequence", task.problem.rootCauseAndConsequences, "amber", <Activity size={14}/>)}
                                    {renderLargeTextBox("Risk Exposure", task.problem.risk, "rose", <AlertTriangle size={14}/>)}
                                 </div>
                              </div>

                              {/* SMART Grid */}
                              <div className="mb-10">
                                 <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><Target size={14}/> SMART Execution Framework</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {renderLargeTextBox("Specific", task.smart.specific, "blue")}
                                    {renderLargeTextBox("Measurable", task.smart.measurable, "emerald")}
                                    {renderLargeTextBox("Attainable", task.smart.attainable, "blue")}
                                    {renderLargeTextBox("Relevance", task.smart.relevance, "amber")}
                                    {renderLargeTextBox("Time Bound", task.smart.timeBound, "rose", <Clock size={14}/>)}
                                 </div>
                              </div>

                              {/* SKRC & Feedback Grid */}
                              <div>
                                 <h4 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><BarChart size={14}/> SKRC Feedback Loop</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {renderLargeTextBox("Key Result", task.skrc.keyResult, "emerald", <CheckSquare size={14}/>)}
                                    {renderLargeTextBox("Reflections", task.skrc.reflection, "blue", <Eye size={14}/>)}
                                    {renderLargeTextBox("Challenges", task.skrc.challenges, "rose", <ShieldAlert size={14}/>)}
                                    {renderLargeTextBox("SUP / Line Remarks", task.lineRemarks, "amber", <MessageSquare size={14}/>)}
                                 </div>
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
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

             <div className="space-y-10">
                {/* Identity Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Job Description / Role</label>
                      <div className="flex gap-2">
                        <textarea rows={1} className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs text-white focus:border-amber-500 outline-none resize-none" value={formTask.role} onChange={e => setFormTask({...formTask, role: e.target.value})} placeholder="e.g. Head of ICT Duties" />
                        <button onClick={handleAiGenerate} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-500 hover:text-white" title="AI Auto-Fill"><Wand2 size={18} /></button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Responsible Party</label>
                      <select className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs font-bold text-white focus:border-amber-500 outline-none" value={formTask.responsibleParty} onChange={e => handleStaffSelect(e.target.value)}>
                         <option value="">Select Staff...</option>
                         {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Time Bound (Deadline)</label>
                      <input type="text" className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs text-white focus:border-amber-500 outline-none" value={formTask.smart?.timeBound} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, timeBound: e.target.value}})} placeholder='e.g. "Today EOD", "By Friday 3pm"' />
                   </div>
                </div>

                {/* PRRR Section */}
                <div className="space-y-6 border-t border-zinc-800 pt-6">
                   <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={16} /> PRRR Analysis</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Problem Identification</label>
                         <textarea rows={4} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-rose-500 outline-none resize-none" value={formTask.problem?.description} onChange={e => setFormTask({...formTask, problem: {...formTask.problem!, description: e.target.value}})} placeholder="What is wrong? Be factual." />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Root Cause & Consequence</label>
                         <textarea rows={4} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-rose-500 outline-none resize-none" value={formTask.problem?.rootCauseAndConsequences} onChange={e => setFormTask({...formTask, problem: {...formTask.problem!, rootCauseAndConsequences: e.target.value}})} placeholder="Why it happened & Impact." />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Risk</label>
                         <textarea rows={4} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-rose-500 outline-none resize-none" value={formTask.problem?.risk} onChange={e => setFormTask({...formTask, problem: {...formTask.problem!, risk: e.target.value}})} placeholder="Potential damage/loss." />
                      </div>
                   </div>
                </div>

                {/* SMART Section */}
                <div className="space-y-6 border-t border-zinc-800 pt-6">
                   <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center gap-2"><Target size={16} /> SMART Execution</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Specific (Concrete Action Steps)</label>
                         <textarea rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-blue-500 outline-none resize-none" value={formTask.smart?.specific} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, specific: e.target.value}})} placeholder="Exactly what you will do." />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Measurable (Success Indicator)</label>
                         <textarea rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-blue-500 outline-none resize-none" value={formTask.smart?.measurable} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, measurable: e.target.value}})} placeholder="How will you know it's done?" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Attainable (Feasibility)</label>
                         <textarea rows={2} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-blue-500 outline-none resize-none" value={formTask.smart?.attainable} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, attainable: e.target.value}})} placeholder="Is it achievable with current resources?" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Relevance (Business Value)</label>
                         <textarea rows={2} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-blue-500 outline-none resize-none" value={formTask.smart?.relevance} onChange={e => setFormTask({...formTask, smart: {...formTask.smart!, relevance: e.target.value}})} placeholder="Why does this matter?" />
                      </div>
                   </div>
                </div>

                {/* SKRC & Feedback Section */}
                <div className="space-y-6 border-t border-zinc-800 pt-6">
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
                         <textarea rows={2} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-emerald-500 outline-none resize-none" value={formTask.skrc?.keyResult} onChange={e => setFormTask({...formTask, skrc: {...formTask.skrc!, keyResult: e.target.value}})} placeholder="Final deliverable or impact achieved." />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reflections (Learnings)</label>
                         <textarea rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-emerald-500 outline-none resize-none" value={formTask.skrc?.reflection} onChange={e => setFormTask({...formTask, skrc: {...formTask.skrc!, reflection: e.target.value}})} placeholder="What was learned or process insights." />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Challenges (Blockers)</label>
                         <textarea rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 focus:border-emerald-500 outline-none resize-none" value={formTask.skrc?.challenges} onChange={e => setFormTask({...formTask, skrc: {...formTask.skrc!, challenges: e.target.value}})} placeholder="Difficulties faced during execution." />
                      </div>
                   </div>
                   
                   {isManagement && (
                     <div className="space-y-2 pt-4 border-t border-zinc-800/50">
                        <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">SUP / Line Remarks (Supervisor Only)</label>
                        <textarea rows={2} className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-xs text-white focus:border-amber-500 outline-none resize-none font-bold" value={formTask.lineRemarks} onChange={e => setFormTask({...formTask, lineRemarks: e.target.value})} placeholder="Feedback, approval, or directives." />
                     </div>
                   )}
                </div>

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
    </div>
  );
}
