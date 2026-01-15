
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, CheckCircle, Trash2, X, Play, 
  MessageSquarePlus, Square, CheckSquare, 
  ArrowUp, ArrowDown, Loader2, AlertCircle, Layers,
  CalendarDays, UserCheck, FileText, Edit3, Save,
  ChevronDown, ChevronUp, Info, Activity, ShieldAlert,
  Target, Bookmark, Copy, Clock, AlertTriangle, ShieldCheck,
  ClipboardList, Settings2, Sparkles, Wand2, UserCircle
} from 'lucide-react';
import { Task, TaskStatus, UserRole, UserAccount, TaskTemplate } from '../types';
import { storageService } from '../services/storageService';
import { generateTaskSchema } from '../services/geminiService';

interface TaskBoardProps {
  role: UserRole;
  staff: UserAccount[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ role, staff }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'priority' | 'deadline' | 'sn'>('sn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const isCEO = role === 'CEO';
  const isManagement = isCEO || role === 'Project Manager';

  const TIME_BOUND_OPTIONS = [
    "30 Minutes", "1 Hour", "1.5 Hours", "2 Hours", "2.5 Hours", 
    "3 Hours", "3.5 Hours", "4 Hours", "4.5 Hours", "5 Hours", "5.5 Hours", "6 Hours"
  ];

  const initialTaskState: Partial<Task> = {
    role: '',
    responsibleParty: '',
    problem: { description: '', rootCauseAndConsequences: '', risk: '' },
    smart: { specific: '', measurable: '', attainable: '', relevance: '', timeBound: '1 Hour' },
    skrc: { status: 'Pending', isStarted: false, keyResult: '', reflection: '', challenges: '' },
    lineRemarks: '',
    deadline: new Date().toISOString().split('T')[0],
    priority: 3,
    comments: [],
    addedBy: role
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

  const handleAiGenerate = async () => {
    if (!newTask.role) return alert("Please specify the Job Description first so AI knows the context.");
    setIsAiGenerating(true);
    const suggestion = await generateTaskSchema(newTask.role, "Optimal performance and corporate excellence");
    if (suggestion) {
      setNewTask({
        ...newTask,
        problem: suggestion.problem,
        smart: {
          ...suggestion.smart,
          timeBound: newTask.smart?.timeBound || '1 Hour'
        }
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
        status: (role === 'Staff' || role === 'Accountant') ? 'Awaiting Approval' : 'Pending',
      },
      comments: [],
      addedBy: role
    } as Task;

    await storageService.saveTask(taskToAdd);
    await loadTasks();
    setIsModalOpen(false);
    setNewTask(initialTaskState);
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

  const renderField = (label: string, value: string, icon: React.ReactNode, colSpan: string = "col-span-1") => (
    <div className={`${colSpan} space-y-1.5`}>
      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
        {icon} {label}
      </div>
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 min-h-[44px] whitespace-pre-wrap leading-relaxed">
        {value || <span className="text-zinc-700 italic">Not specified</span>}
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
                 GMYT Framework: PRRR + SMART + SKRC
                 {isCEO && <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck size={14} /> Full CEO Override</span>}
              </p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="Filter tasks..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 gold-gradient rounded-xl font-black text-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
            <Plus size={18} /> New Objective
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-amber-500" size={40} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/50 rounded-[3rem] border border-zinc-800 text-zinc-500 italic flex flex-col items-center gap-4">
            <Target size={48} className="opacity-20" />
            <p>No strategic tasks logged in the system.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
             <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden transition-all duration-300 hover:border-amber-500/50">
                <div 
                  className="p-8 flex items-center justify-between cursor-pointer group" 
                  onClick={() => toggleTaskExpansion(task.id)}
                >
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center font-black text-amber-500 shadow-inner">{task.sn}</div>
                     <div>
                        <h3 className="font-bold text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{task.role}</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                          <UserCircle size={12} className="text-amber-500/50" /> {task.responsibleParty} | <Clock size={12} className="text-zinc-600" /> {task.smart.timeBound} | Due: {task.deadline}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className={`text-[9px] font-black px-4 py-1.5 rounded-full border ${
                        task.skrc.status === 'Completed' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' :
                        task.skrc.status === 'Ongoing' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' :
                        'border-amber-500/30 text-amber-500 bg-amber-500/5'
                     }`}>
                        {task.skrc.status.toUpperCase()}
                     </span>
                     {expandedTaskId === task.id ? <ChevronUp size={20} className="text-zinc-600" /> : <ChevronDown size={20} className="text-zinc-600" />}
                  </div>
                </div>

                {expandedTaskId === task.id && (
                  <div className="p-10 bg-zinc-950/40 border-t border-zinc-800 space-y-10 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {renderField("Job Description", task.role, <FileText size={12}/>, "col-span-2")}
                      {renderField("Responsible Party", task.responsibleParty, <UserCircle size={12}/>)}
                      {renderField("Deadline", task.deadline, <CalendarDays size={12}/>)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pb-2 border-b border-zinc-800">PRRR Analysis</h4>
                          {renderField("Problem Identification", task.problem.description, <AlertCircle size={12}/>)}
                          {renderField("Root Cause & Consequences", task.problem.rootCauseAndConsequences, <Layers size={12}/>)}
                          {renderField("Risk Assessment", task.problem.risk, <ShieldAlert size={12}/>)}
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] pb-2 border-b border-zinc-800">SMART Execution</h4>
                          {renderField("Specific", task.smart.specific, <Target size={12}/>)}
                          {renderField("Measurable", task.smart.measurable, <Activity size={12}/>)}
                          {renderField("Time Bound", task.smart.timeBound, <Clock size={12}/>)}
                          {renderField("Attainable / Relevance", `${task.smart.attainable} | ${task.smart.relevance}`, <Bookmark size={12}/>)}
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] pb-2 border-b border-zinc-800">SKRC Tracking</h4>
                          {renderField("Key Result", task.skrc.keyResult, <CheckSquare size={12}/>)}
                          {renderField("Reflection", task.skrc.reflection, <Sparkles size={12}/>)}
                          {renderField("Challenges", task.skrc.challenges, <AlertTriangle size={12}/>)}
                          {renderField("Sup / Line Remarks", task.lineRemarks, <Settings2 size={12}/>)}
                       </div>
                    </div>
                  </div>
                )}
             </div>
          ))
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-6xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-8 md:p-12 max-h-[95vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in duration-500">
             <div className="flex justify-between items-center mb-10">
               <div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tight">Deploy Strategic Sheet</h2>
                 <p className="text-sm text-zinc-500 mt-1 uppercase tracking-[0.3em] font-bold">Protocol GMYT-SOP-04 | PRRR-SMART Framework</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-500 hover:text-white transition-all"><X size={28}/></button>
             </div>
             
             <div className="space-y-10">
                {/* Core Header Fields */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                   <div className="md:col-span-4 space-y-2">
                     <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Job Description (Objective)</label>
                     <textarea 
                        rows={2}
                        placeholder="Define the core objective..." 
                        className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-sm focus:border-amber-500 outline-none font-bold text-white shadow-inner resize-none" 
                        value={newTask.role} 
                        onChange={e => setNewTask({...newTask, role: e.target.value})} 
                      />
                   </div>
                   <div className="md:col-span-3 space-y-2">
                     <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Responsible Party</label>
                     <select 
                        className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-sm focus:border-amber-500 outline-none font-bold text-white shadow-inner h-[62px]" 
                        value={newTask.responsibleParty} 
                        onChange={e => setNewTask({...newTask, responsibleParty: e.target.value})}
                      >
                        <option value="">Select Assignee...</option>
                        {staff.map(s => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
                     </select>
                   </div>
                   <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Time Bound</label>
                     <select 
                        className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-sm focus:border-blue-500 outline-none font-bold text-white shadow-inner h-[62px]" 
                        value={newTask.smart?.timeBound} 
                        onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, timeBound: e.target.value}})}
                      >
                        {TIME_BOUND_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                   </div>
                   <div className="md:col-span-3">
                      <button 
                        onClick={handleAiGenerate}
                        disabled={isAiGenerating || !newTask.role}
                        className="w-full py-5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-500 hover:text-black transition-all disabled:opacity-30 h-[62px]"
                      >
                         {isAiGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                         AI Generate Full Analysis
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   {/* Column 1: PRRR */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 border-l-2 border-amber-500 pl-4">
                         <h4 className="text-[11px] font-black text-white uppercase tracking-widest">PRRR Identification</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Problem Identification</label>
                          <textarea placeholder="Describe the problem..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-28 focus:border-amber-500 outline-none resize-none" value={newTask.problem?.description} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, description: e.target.value}})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Root Cause & Consequences</label>
                          <textarea placeholder="Identify the root cause..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-28 focus:border-amber-500 outline-none resize-none" value={newTask.problem?.rootCauseAndConsequences} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, rootCauseAndConsequences: e.target.value}})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Risk Assessment</label>
                          <textarea placeholder="Define potential risks..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-28 focus:border-amber-500 outline-none resize-none" value={newTask.problem?.risk} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, risk: e.target.value}})} />
                        </div>
                      </div>
                   </div>

                   {/* Column 2: SMART */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 border-l-2 border-blue-500 pl-4">
                         <h4 className="text-[11px] font-black text-white uppercase tracking-widest">SMART Strategy</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Specific Goal</label>
                          <textarea placeholder="S - Specific goal..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-20 focus:border-blue-500 outline-none resize-none" value={newTask.smart?.specific} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, specific: e.target.value}})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Measurable Outcome</label>
                          <textarea placeholder="M - How to measure..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-20 focus:border-blue-500 outline-none resize-none" value={newTask.smart?.measurable} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, measurable: e.target.value}})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Attainable Steps</label>
                          <textarea placeholder="A - Actionable steps..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-20 focus:border-blue-500 outline-none resize-none" value={newTask.smart?.attainable} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, attainable: e.target.value}})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Relevance to Business</label>
                          <textarea placeholder="R - Why it matters..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-20 focus:border-blue-500 outline-none resize-none" value={newTask.smart?.relevance} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, relevance: e.target.value}})} />
                        </div>
                      </div>
                   </div>

                   {/* Column 3: SKRC & Line Remarks */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 border-l-2 border-emerald-500 pl-4">
                         <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Tracking & Oversight</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Key Result (Outcome)</label>
                          <textarea placeholder="Expected key result..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-20 focus:border-emerald-500 outline-none resize-none" value={newTask.skrc?.keyResult} onChange={e => setNewTask({...newTask, skrc: {...newTask.skrc!, keyResult: e.target.value}})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Reflection / Impact</label>
                          <textarea placeholder="Impact reflection..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-20 focus:border-emerald-500 outline-none resize-none" value={newTask.skrc?.reflection} onChange={e => setNewTask({...newTask, skrc: {...newTask.skrc!, reflection: e.target.value}})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Challenges Encountered</label>
                          <textarea placeholder="List bottlenecks..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-20 focus:border-emerald-500 outline-none resize-none" value={newTask.skrc?.challenges} onChange={e => setNewTask({...newTask, skrc: {...newTask.skrc!, challenges: e.target.value}})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Sup / Line Remarks</label>
                          <textarea placeholder="Supervisor feedback..." className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs h-20 focus:border-emerald-500 outline-none resize-none" value={newTask.lineRemarks} onChange={e => setNewTask({...newTask, lineRemarks: e.target.value})} />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="pt-10 border-t border-zinc-900 flex flex-col sm:flex-row gap-6">
                   <button onClick={handleCreateTask} className="flex-1 py-6 gold-gradient text-black font-black rounded-3xl shadow-2xl shadow-amber-500/20 hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-xs">Deploy Strategic Entry</button>
                   <button onClick={() => setIsModalOpen(false)} className="px-16 py-6 bg-zinc-900 text-zinc-500 font-bold rounded-3xl hover:bg-zinc-800 transition-all uppercase text-[10px] tracking-widest">Abort Process</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
