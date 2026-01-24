
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, CheckCircle, Trash2, X, Play, 
  CheckSquare, Loader2, Layers,
  ChevronDown, ChevronUp, Activity, ShieldAlert,
  Target, Bookmark, Clock, AlertTriangle, ShieldCheck,
  ClipboardList, Settings2, Sparkles, Wand2, UserCircle,
  Zap, Cpu, ListChecks, FileInput, Send, Printer, MessageSquare,
  FileText
} from 'lucide-react';
import { Task, UserAccount } from '../types';
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

  // Comment state
  const [newComment, setNewComment] = useState('');

  // Report Modal States
  const [reportingTask, setReportingTask] = useState<Task | null>(null);
  const [reportText, setReportText] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const isCEO = user.role === 'CEO';
  const isPM = user.role === 'Project Manager';
  const isManagement = isCEO || isPM;

  const TIME_BOUND_OPTIONS = [
    "30 Minutes", "1 Hour", "1.5 Hours", "2 Hours", "2.5 Hours", 
    "3 Hours", "4 Hours", "6 Hours", "8 Hours", "24 Hours"
  ];

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
    if (!newTask.role) return alert("Please specify the Job Description first.");
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

  const handleCreateTask = async () => {
    if (!newTask.role?.trim() || !newTask.responsibleParty?.trim()) {
      alert("Required: Job Description and Responsible Party.");
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
        status: 'Completed',
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

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this strategic entry?")) return;
    await storageService.deleteTask(id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredTasks = tasks.filter(t => 
    t.role.toLowerCase().includes(search.toLowerCase()) || 
    t.responsibleParty.toLowerCase().includes(search.toLowerCase())
  );

  const renderLargeTextBox = (title: string, content: string, color: string = "amber", icon?: React.ReactNode) => (
    <div className={`p-5 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-3 h-full shadow-inner`}>
       <div className="flex items-center gap-2 mb-1">
          {icon && <div className={`text-${color}-500`}>{icon}</div>}
          <span className={`text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]`}>{title}</span>
       </div>
       <div className="text-sm font-medium text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {content || <span className="text-zinc-800 italic">No entry.</span>}
       </div>
    </div>
  );

  return (
    <div className="space-y-6 relative pb-24 print:bg-white print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center print:hidden">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-amber-500/10 rounded-2xl">
              <ClipboardList className="text-amber-500" size={32} />
           </div>
           <div>
              <h2 className="text-2xl font-black gold-text uppercase tracking-tight">Strategic Task Board</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                 GMYT Framework: PRRR + SMART + SKRC
              </p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={handlePrint} className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:text-white transition-all">
             <Printer size={18} />
          </button>
          {isManagement && (
            <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 gold-gradient rounded-xl font-black text-black text-xs uppercase tracking-widest flex items-center gap-2">
              <Plus size={18} /> Deploy Strategy
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 print-area">
        {isLoading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-amber-500" size={40} /></div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/50 rounded-[3rem] border border-zinc-800 text-zinc-500 italic">No strategic tasks.</div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
             <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em] print:bg-zinc-100">
                   <tr>
                      <th className="px-8 py-6 w-16 text-center border-r border-zinc-800/50">SN</th>
                      <th className="px-8 py-6 w-1/5 border-r border-zinc-800/50">Job Description</th>
                      <th className="px-8 py-6 w-1/4 border-r border-zinc-800/50">Today's Tasks</th>
                      <th className="px-8 py-6">Strategic Analysis</th>
                      <th className="px-8 py-6 w-20 text-right print:hidden">Control</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                   {filteredTasks.map((task) => {
                      const isAssignedToMe = user.name === task.responsibleParty;
                      const canControl = isAssignedToMe || isManagement;

                      return (
                        <React.Fragment key={task.id}>
                           <tr 
                             className={`hover:bg-zinc-800/30 transition-all cursor-pointer ${expandedTaskId === task.id ? 'bg-amber-500/5' : ''}`}
                             onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                           >
                              <td className="px-8 py-6 text-center border-r border-zinc-800/50 align-top">
                                 <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center font-black text-amber-500 shadow-inner text-xs">{task.sn}</div>
                              </td>
                              <td className="px-8 py-6 border-r border-zinc-800/50 align-top">
                                 {renderLargeTextBox("Directive", task.role, "amber")}
                                 <div className="mt-4 flex items-center gap-2 px-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isAssignedToMe ? 'text-amber-500' : 'text-zinc-300'}`}>
                                       {task.responsibleParty}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 border-r border-zinc-800/50 align-top">
                                 {renderLargeTextBox("Execution Node", task.tasksForToday, "blue")}
                                 <div className="mt-3 flex gap-2">
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-full border ${task.skrc.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                                       {task.skrc.status.toUpperCase()}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 align-top">
                                 <div className="grid grid-cols-3 gap-3 h-full min-h-[140px]">
                                    {renderLargeTextBox("PRRR", task.problem.description, "amber")}
                                    {renderLargeTextBox("SMART", task.smart.specific, "blue")}
                                    {renderLargeTextBox("SKRC", task.skrc.keyResult || 'Awaiting...', "emerald")}
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-right align-top print:hidden">
                                 {expandedTaskId === task.id ? <ChevronUp size={20} className="text-amber-500" /> : <ChevronDown size={20} className="text-zinc-600" />}
                              </td>
                           </tr>
                           {expandedTaskId === task.id && (
                             <tr className="print:hidden">
                                <td colSpan={5} className="px-8 pb-12 pt-4 bg-zinc-950/80 border-x border-zinc-800">
                                   <div className="space-y-8">
                                      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                         <div className="flex items-center gap-4">
                                            <Zap className="text-amber-500" size={24} />
                                            <div>
                                               <h4 className="text-xs font-black text-white uppercase tracking-widest">Execution Hub</h4>
                                               <p className="text-[10px] text-zinc-500 uppercase">Status: <span className="text-amber-500">{task.skrc.status}</span></p>
                                            </div>
                                         </div>
                                         <div className="flex gap-4">
                                            {isAssignedToMe && !task.skrc.isStarted && (
                                              <button onClick={(e) => { e.stopPropagation(); handleStartTask(task); }} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest">Start Task</button>
                                            )}
                                            {canControl && task.skrc.isStarted && task.skrc.status !== 'Completed' && (
                                              <button onClick={(e) => { e.stopPropagation(); handleInitiateDone(task); }} className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest">Mark as DONE</button>
                                            )}
                                            {isManagement && (
                                              <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                            )}
                                         </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                         <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14}/> Communication & Complaints</h4>
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                                               {(task.comments || []).map((c, i) => (
                                                  <div key={i} className="space-y-1 border-b border-zinc-800 pb-2 last:border-0">
                                                     <div className="flex justify-between text-[9px] font-bold">
                                                        <span className="text-amber-500">{c.user}</span>
                                                        <span className="text-zinc-500">{c.date}</span>
                                                     </div>
                                                     <p className="text-xs text-zinc-300 mt-1">{c.text}</p>
                                                  </div>
                                               ))}
                                               <div className="pt-2 flex gap-2">
                                                  <input 
                                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-500"
                                                    placeholder="Lodge complaint or update PM..."
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                  />
                                                  <button onClick={() => handleAddComment(task)} className="p-2 bg-amber-500 text-black rounded-xl hover:scale-105 transition-all"><Send size={14}/></button>
                                               </div>
                                            </div>
                                         </div>
                                         <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><FileInput size={14}/> Mission Reflection</h4>
                                            {renderLargeTextBox("Report Summary", task.skrc.report || "No report submitted yet.", "emerald", <FileText size={10}/>)}
                                            {isManagement && (
                                               <div className="space-y-2">
                                                  <label className="text-[9px] font-bold text-zinc-600 uppercase">Strategic Line Remarks</label>
                                                  <textarea 
                                                     className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 outline-none focus:border-amber-500"
                                                     placeholder="Provide management feedback..."
                                                     value={task.lineRemarks}
                                                     onChange={async (e) => {
                                                        const updatedTask = { ...task, lineRemarks: e.target.value };
                                                        await storageService.saveTask(updatedTask);
                                                        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
                                                     }}
                                                  />
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
        )}
      </div>

      {isReportModalOpen && reportingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsReportModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-6">
                 <CheckCircle className="text-emerald-500" size={32} />
                 <div>
                   <h2 className="text-2xl font-black text-white uppercase tracking-tight">Mission Completion</h2>
                   <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Document Results & Challenges</p>
                 </div>
               </div>
               <button onClick={() => setIsReportModalOpen(false)} className="p-4 bg-zinc-900 rounded-3xl text-zinc-500 hover:text-white"><X size={24}/></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-600 uppercase">Input Execution Challenges & Results</label>
                   <textarea 
                     rows={6}
                     placeholder="Provide your completion report, results, and any challenges encountered..." 
                     className="w-full bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] text-sm focus:border-emerald-500 outline-none text-white leading-relaxed" 
                     value={reportText} 
                     onChange={e => setReportText(e.target.value)} 
                   />
                </div>
                <button onClick={handleSubmitReport} className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-emerald-600/20 transition-all">
                   <Send size={18} /> Finalize Mission & Log Report
                </button>
             </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
             <div className="flex justify-between items-center mb-10">
               <h2 className="text-3xl font-black text-white uppercase tracking-tight">Strategy Node Deployment</h2>
               <button onClick={() => setIsModalOpen(false)} className="p-4 bg-zinc-900 rounded-3xl text-zinc-500 hover:text-white transition-all hover:bg-zinc-800"><X size={28}/></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[11px] font-black text-zinc-500 uppercase">Strategic Assignee</label>
                   <select className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-sm font-bold text-white shadow-inner" value={newTask.responsibleParty} onChange={e => {
                      const staffId = e.target.value;
                      handleStaffSelect(staffId);
                   }}>
                      <option value="">Select Assignee...</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.position || s.role})</option>)}
                   </select>
                </div>
                <div className="space-y-4">
                   <label className="text-[11px] font-black text-zinc-500 uppercase">Today's Specific Tasks (Numbered)</label>
                   <textarea rows={2} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-sm text-white shadow-inner" value={newTask.tasksForToday} onChange={e => setNewTask({...newTask, tasksForToday: e.target.value})} placeholder="1. Task one... 2. Task two..." />
                </div>
             </div>
             
             {/* Retaining Analysis Inputs */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="space-y-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                   <h4 className="text-[10px] font-black text-amber-500 uppercase">PRRR Identification</h4>
                   <textarea className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-white" placeholder="Describe the problem..." value={newTask.problem?.description} onChange={e => setNewTask({...newTask, problem: {...newTask.problem!, description: e.target.value}})} />
                </div>
                <div className="space-y-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                   <h4 className="text-[10px] font-black text-blue-500 uppercase">SMART Goal</h4>
                   <textarea className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-white" placeholder="Specific goal..." value={newTask.smart?.specific} onChange={e => setNewTask({...newTask, smart: {...newTask.smart!, specific: e.target.value}})} />
                </div>
                <div className="space-y-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                   <h4 className="text-[10px] font-black text-emerald-500 uppercase">Target Results</h4>
                   <textarea className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-white" placeholder="Expected outcome..." value={newTask.skrc?.keyResult} onChange={e => setNewTask({...newTask, skrc: {...newTask.skrc!, keyResult: e.target.value}})} />
                </div>
             </div>

             <div className="mt-8 flex gap-4">
                <button onClick={handleAiGenerate} disabled={isAiGenerating} className="px-8 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all">
                   {isAiGenerating ? <Loader2 className="animate-spin" size={16}/> : <><Wand2 size={16} /> AI Strategy Engine</>}
                </button>
                <button onClick={handleCreateTask} className="flex-1 py-4 gold-gradient text-black font-black rounded-xl uppercase tracking-widest text-xs shadow-xl shadow-amber-500/10 hover:scale-[1.01] transition-all">Deploy Strategy Ledger</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
