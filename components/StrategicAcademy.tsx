import React, { useState } from 'react';
import { 
  BookOpen, GraduationCap, Target, Zap, ShieldCheck, 
  ChevronRight, ArrowRight, Info, CheckCircle, 
  Layout, ClipboardList, Banknote, Clock, MessageSquare,
  Crown, Briefcase, Calculator, Users, Sparkles, Lightbulb,
  FileText, ShieldAlert, Activity, BarChart, Rocket
} from 'lucide-react';
import { UserRole } from '../types';

interface AcademyProps {
  role: UserRole;
}

export default function StrategicAcademy({ role }: AcademyProps) {
  const [activeSection, setActiveSection] = useState<'framework' | 'walkthrough' | 'roles' | 'onboarding' | 'jd-training'>('framework');

  const walkthroughSteps = [
    {
      title: 'The Morning Ritual (09:00 AM)',
      icon: <Clock className="text-amber-500" />,
      content: 'Every operational day begins with the Attendance Register. Clocking in before 09:00 AM is not just about presence; it initializes your node in the system, allowing the Project Manager to assign SMART tasks to your profile.'
    },
    {
      title: 'Directive Acquisition',
      icon: <Target className="text-blue-500" />,
      content: 'Once clocked in, navigate to the SMART Task Sheet. Here, you will find your strategic directives. Each task is analyzed through the PRRR protocol (Problem, Root Cause, Risk) to ensure you understand the "Why" before the "How".'
    },
    {
      title: 'The Execution Phase',
      icon: <Zap className="text-emerald-500" />,
      content: 'Execute your tasks based on the SMART criteria. If you encounter friction, use the Strategic Hub (Chat) to communicate with your department or the ICT Nexus for technical support.'
    },
    {
      title: 'EOD Reporting (SKRC)',
      icon: <FileText className="text-rose-500" />,
      content: 'Before clocking out, you must submit an SKRC report for every task. This includes your Key Results, Reflections on the process, and any Challenges faced. This data feeds into your KPI Performance metrics.'
    }
  ];

  const jdTrainingContent = [
    {
      title: 'What is a Strategic Job Description?',
      desc: 'At GMYT, a Job Description (JD) is not a static list of duties. It is a dynamic Core Objective that defines your purpose within the ecosystem.',
      points: [
        'Binary Clarity: Every duty must have a clear "Done" or "Not Done" state.',
        'Strategic Alignment: Your JD must contribute directly to the company\'s weekly goals.',
        'Evolutionary: JDs are updated as you master your node and take on more complexity.'
      ]
    },
    {
      title: 'Writing SMART Tasks from your JD',
      desc: 'How to translate your general duties into daily actionable tasks:',
      points: [
        'Identify the Problem: What is preventing your JD from being 100% effective today?',
        'Apply SMART: Turn that duty into a Specific, Measurable, Attainable, Relevant, and Time-bound goal.',
        'Risk Mitigation: What happens if this JD duty is ignored today?'
      ]
    }
  ];

  const frameworkContent = [
    {
      id: 'prrr',
      title: 'PRRR: The Analysis Phase',
      subtitle: 'Strategic Identification & Risk Mitigation',
      icon: <ShieldAlert className="text-rose-500" />,
      steps: [
        { label: 'Problem Identification', desc: 'Surgically isolate the bottleneck. Example: "Inconsistent stitching on the AW25 collection" rather than "Quality issue".' },
        { label: 'Root Cause & Consequences', desc: 'Identify why it happened and the ripple effect on the business if left unaddressed.' },
        { label: 'Risk Assessment', desc: 'Assign a severity level. What is the financial and temporal cost of failure?' }
      ],
      example: 'Good: "Non-functional industrial steamer (Asset #42) delaying finishing for 50 units." Bad: "Steamer broken."'
    },
    {
      id: 'smart',
      title: 'SMART: The Execution Phase',
      subtitle: 'Precision Target Acquisition',
      icon: <Target className="text-blue-500" />,
      steps: [
        { label: 'Specific', desc: 'Unambiguous, binary goals. You either hit it or you didn\'t.' },
        { label: 'Measurable', desc: 'Define the KPI. Use numbers, percentages, or milestones.' },
        { label: 'Attainable', desc: 'Ensure the staff node has the resources to complete the directive.' },
        { label: 'Relevance', desc: 'Align the task with the current Weekly Strategic Directive.' },
        { label: 'Time Bound', desc: 'Strict hourly or daily deadlines. Precision timing is mandatory.' }
      ],
      example: 'Good: "Finalize pattern cutting for 20 evening gowns by 14:00 today."'
    },
    {
      id: 'skrc',
      title: 'SKRC: The Feedback Loop',
      subtitle: 'Institutional Wisdom & Accountability',
      icon: <Activity className="text-amber-500" />,
      steps: [
        { label: 'Status Tracking', desc: 'Pending (0%), Ongoing (50%), Awaiting Approval (75%), Completed (100%).' },
        { label: 'Key Results', desc: 'Compare actual output against the SMART metrics defined at the start.' },
        { label: 'Reflection', desc: 'What was learned? How can we prevent the PRRR problem from recurring?' },
        { label: 'Challenges', desc: 'Transparently list every friction point encountered during execution.' }
      ]
    }
  ];

  const roleDirectives = [
    { 
      role: 'CEO', 
      icon: <Crown className="text-amber-500" />, 
      responsibilities: [
        'Strategic Architecture: Defining the long-term vision of the GMYT ecosystem.',
        'Financial Authority: Approving all budget tenders and major disbursements.',
        'Final Appraisal: Reviewing high-level staff performance through the KPI engine.',
        'Crisis Intervention: Handling critical risks flagged in the PRRR analysis.'
      ]
    },
    { 
      role: 'Project Manager', 
      icon: <Users className="text-blue-500" />, 
      responsibilities: [
        'Directive Deployment: Translating CEO vision into daily SMART task sheets for staff.',
        'Workflow Optimization: Monitoring task progress bars and removing bottlenecks.',
        'Personnel Development: Managing recruitment, interviews, and onboarding dossiers.',
        'Policy Enforcement: Monitoring attendance and operational protocol compliance.'
      ]
    },
    { 
      role: 'Accountant', 
      icon: <Calculator className="text-emerald-500" />, 
      responsibilities: [
        'Asset Persistence: Maintaining 100% accuracy in the Warehouse/Inventory registry.',
        'Treasury Control: Vetting budget tenders and managing the corporate expense ledger.',
        'Payroll Accuracy: Generating and verifying monthly staff emoluments and deductions.',
        'Audit Preparedness: Ensuring every expense is backed by a PRRR justification.'
      ]
    },
    { 
      role: 'Staff', 
      icon: <Briefcase className="text-zinc-500" />, 
      responsibilities: [
        'Binary Execution: Completing assigned SMART tasks within the defined time-bounds.',
        'Self-Reporting: Submitting high-quality SKRC reports with honest reflections.',
        'Operational Discipline: Strict adherence to the 09:00 AM clock-in protocol.',
        'Proactive Communication: Flagging risks and challenges via the ICT or Global Hubs.'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-6 md:gap-10">
         <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
            <GraduationCap size={200} />
         </div>
         <div className="w-20 h-20 md:w-28 md:h-28 rounded-[2rem] md:rounded-[2.5rem] gold-gradient flex items-center justify-center text-black shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <BookOpen className="w-10 h-10 md:w-14 md:h-14" />
         </div>
         <div className="text-center md:text-left relative z-10">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">Strategic Academy</h1>
            <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-[0.4em] mt-3">
               Universal Operational Protocol & Intelligence Manual
            </p>
         </div>
      </div>

      {/* Nav */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 sticky top-4 z-40">
         {[
           { id: 'framework', label: 'Framework Mastery', icon: <Zap size={16} /> },
           { id: 'roles', label: 'Role Responsibilities', icon: <ShieldCheck size={16} /> },
           { id: 'jd-training', label: 'JD Training', icon: <Briefcase size={16} /> },
           { id: 'walkthrough', label: 'Platform Walkthrough', icon: <Layout size={16} /> },
           { id: 'onboarding', label: 'Quick-Start Guide', icon: <Rocket size={16} /> }
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveSection(tab.id as any)}
             className={`px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md ${activeSection === tab.id ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20' : 'bg-zinc-900/80 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}`}
           >
              {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      {/* Frameworks */}
      {activeSection === 'framework' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700">
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
              {frameworkContent.map(card => (
                 <div key={card.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 flex flex-col shadow-2xl group hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-6 mb-8 md:mb-10">
                       <div className="p-4 md:p-5 bg-zinc-950 rounded-[2rem] border border-zinc-800 shadow-inner group-hover:scale-110 transition-transform">
                          {card.icon}
                       </div>
                       <div>
                          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">{card.title}</h3>
                          <p className="text-[9px] md:text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{card.subtitle}</p>
                       </div>
                    </div>

                    <div className="space-y-6 md:space-y-8 flex-1">
                       {card.steps.map((step, idx) => (
                          <div key={idx} className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[9px] md:text-[10px] font-black text-amber-500">{idx+1}</span>
                                <h4 className="text-[10px] md:text-[12px] font-black text-zinc-300 uppercase tracking-widest">{step.label}</h4>
                             </div>
                             <p className="text-xs md:text-sm text-zinc-500 leading-relaxed pl-8 md:pl-9 font-medium">{step.desc}</p>
                          </div>
                       ))}
                    </div>

                    {card.example && (
                      <div className="mt-8 md:mt-10 p-5 md:p-6 bg-zinc-950 border border-zinc-800/50 rounded-3xl italic">
                         <div className="flex items-center gap-2 mb-3">
                            <Lightbulb size={14} className="text-amber-500" />
                            <span className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocol Example</span>
                         </div>
                         <p className="text-[11px] md:text-[12px] text-zinc-400 leading-relaxed font-medium">{card.example}</p>
                      </div>
                    )}
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Roles */}
      {activeSection === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-10 duration-700">
           {roleDirectives.map((r, idx) => (
              <div key={idx} className={`bg-zinc-900 border rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 flex flex-col gap-6 md:gap-10 shadow-2xl relative overflow-hidden group ${role === r.role ? 'border-amber-500/50 ring-2 ring-amber-500/5' : 'border-zinc-800'}`}>
                 <div className="absolute -top-10 -right-10 p-20 opacity-[0.02] group-hover:opacity-10 transition-opacity rotate-12">
                    {r.icon}
                 </div>
                 <div className="flex items-center gap-6 md:gap-8">
                    <div className="p-6 md:p-8 bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] shadow-inner border border-zinc-800 group-hover:border-amber-500/30 transition-all">
                       {React.cloneElement(r.icon as React.ReactElement<any>, { size: 40 })}
                    </div>
                    <div>
                       <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{r.role} Directives</h3>
                       <p className="text-[10px] md:text-[11px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Personnel Node Level: {idx + 1}</p>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <p className="text-[10px] md:text-[11px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3">
                       <ShieldCheck size={14} /> Mission Responsibilities
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                       {r.responsibilities.map((resp, i) => (
                          <div key={i} className="flex items-start gap-4 md:gap-5 p-5 md:p-6 bg-zinc-950/40 border border-zinc-800 rounded-3xl group-hover:bg-zinc-950 transition-colors">
                             <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                             <span className="text-xs md:text-sm text-zinc-300 font-bold leading-relaxed">{resp}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* JD Training */}
      {activeSection === 'jd-training' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {jdTrainingContent.map((item, idx) => (
                 <div key={idx} className="bg-zinc-900 border border-zinc-800 p-10 md:p-12 rounded-[3rem] shadow-2xl space-y-8">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                          <Briefcase size={32} />
                       </div>
                       <h3 className="text-2xl font-black text-white uppercase tracking-tight">{item.title}</h3>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">{item.desc}</p>
                    <div className="space-y-4">
                       {item.points.map((point, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                             <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                             <span className="text-xs text-zinc-300 font-bold">{point}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Walkthrough */}
      {activeSection === 'walkthrough' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {walkthroughSteps.map((step, idx) => (
                 <div key={idx} className="bg-zinc-900 border border-zinc-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl flex flex-col gap-6 group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between">
                       <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-blue-500 group-hover:scale-110 transition-transform">
                          {step.icon}
                       </div>
                       <span className="text-4xl font-black text-zinc-800">0{idx + 1}</span>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{step.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">{step.content}</p>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Quick Start */}
      {activeSection === 'onboarding' && (
        <div className="max-w-4xl mx-auto space-y-12 animate-in zoom-in duration-500">
           <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-2xl space-y-8 md:space-y-10">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase text-center tracking-tight">The 5-Step Strategic Induction</h2>
              <div className="space-y-6">
                 {[
                   { title: 'Identity Initialization', desc: 'Clock in via the Attendance Register before 09:00 AM. This initializes your daily node status.' },
                   { title: 'Directive Acquisition', desc: 'Navigate to the SMART Task Sheet. Review your assigned PRRR/SMART analysis for the day.' },
                   { title: 'Communication Handshake', desc: 'Access the Strategic Hub. Ensure you are tagged in your relevant department channel.' },
                   { title: 'Execution & Reflection', desc: 'Perform your SMART goals. Once complete, submit an SKRC report with findings.' },
                   { title: 'Executive Approval', desc: 'Your PM or CEO will review your report. If verified, the task progress will hit 100%.' }
                 ].map((step, i) => (
                    <div key={i} className="flex items-center gap-6 md:gap-8 p-6 md:p-8 bg-zinc-950 border border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] group hover:border-amber-500/40 transition-all">
                       <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg md:text-xl font-black text-amber-500 shrink-0 shadow-inner">
                          {i+1}
                       </div>
                       <div>
                          <h4 className="text-sm md:text-lg font-black text-white uppercase tracking-widest">{step.title}</h4>
                          <p className="text-xs md:text-sm text-zinc-500 font-medium mt-1 leading-relaxed">{step.desc}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-zinc-900 border border-zinc-800 p-10 md:p-16 rounded-[3rem] md:rounded-[5rem] text-center space-y-8 relative overflow-hidden">
         <div className="absolute inset-0 bg-amber-500/[0.02] animate-pulse"></div>
         <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-[0.2em] relative z-10">Need Tactical Support?</h4>
         <p className="text-zinc-500 text-xs md:text-sm max-w-2xl mx-auto font-medium leading-relaxed relative z-10">
            If you encounter operational friction or system errors, dispatch an immediate memo via the 
            <strong> ICT Nexus</strong> channel in the Strategic Hub. Our support nodes are active 24/7.
         </p>
         <div className="flex justify-center pt-6 relative z-10">
            <button className="px-10 md:px-12 py-4 md:py-5 bg-zinc-800 text-white rounded-3xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-zinc-700 transition-all border border-zinc-700 shadow-xl">
               Download Operational PDF <ArrowRight size={20} />
            </button>
         </div>
      </div>
    </div>
  );
}