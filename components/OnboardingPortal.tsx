import React, { useState, useEffect } from 'react';
import { 
  FolderLock, Search, UserPlus, FileText, CheckCircle2, 
  XCircle, Loader2, Trash2, ShieldCheck,
  AlertCircle, FileCheck, Info, ChevronDown, ChevronUp,
  CreditCard, UserCheck, Mail, Briefcase, Stamp, Settings2,
  CheckSquare, Square, Rocket
} from 'lucide-react';
import { OnboardingRecord, UserRole, UserAccount, Task } from '../types';
import { storageService } from '../services/storageService';

interface OnboardingProps {
  role: UserRole;
  staff: UserAccount[];
}

type ChecklistItem = { 
  sn: number; 
  key: keyof OnboardingRecord['docs']; 
  label: string; 
  category: string; 
};

const CHECKLIST_ITEMS: ChecklistItem[] = ([
  { sn: 1, key: 'confidentiality', label: 'Employee confidentiality, non-compete, non-circumvent agreement', category: 'Legal & Agreement' },
  { sn: 2, key: 'handbook', label: 'Academy Handbook and Policy (Peruse & Sign)', category: 'Legal & Agreement' },
  { sn: 3, key: 'inductionForm', label: 'Staff induction form (Print and Fill)', category: 'Legal & Agreement' },
  { sn: 4, key: 'dataProtection', label: 'GMYT Data Protection Policy', category: 'Legal & Agreement' },
  { sn: 5, key: 'employmentAgreement', label: 'Employment Agreement Form (Sign & Submit)', category: 'Legal & Agreement' },
  { sn: 6, key: 'offerLetter', label: 'Employment offer letter', category: 'Legal & Agreement' },
  { sn: 17, key: 'acceptanceSignature', label: 'Acceptance and signature', category: 'Legal & Agreement' },
  { sn: 18, key: 'governingLaw', label: 'Governing Law and Resolution', category: 'Legal & Agreement' },
  { sn: 23, key: 'disclaimerNotice', label: 'GMYT Group Ltd Disclaimer Notice', category: 'Legal & Agreement' },
  
  { sn: 7, key: 'bioData', label: 'Employment Bio-Data (Fill & Print)', category: 'Personal Records' },
  { sn: 14, key: 'passportPhotos', label: '2 Passport photographs', category: 'Personal Records' },
  { sn: 15, key: 'cv', label: 'Curriculum Vitae', category: 'Personal Records' },
  { sn: 16, key: 'credentials', label: 'Photocopy of ALL credentials', category: 'Personal Records' },
  { sn: 11, key: 'personalDataProtection', label: 'Personal Data Protection form', category: 'Personal Records' },
  { sn: 24, key: 'bioAndPicture', label: 'Short Bio & BOLD Professional Picture', category: 'Personal Records' },
  
  { sn: 8, key: 'guarantorForm', label: '2 Guarantor forms (with Passports)', category: 'Verification' },
  { sn: 9, key: 'guarantorId', label: 'Photocopy of guarantor ID cards', category: 'Verification' },
  { sn: 12, key: 'recommendationLetter', label: 'Recommendation letter', category: 'Verification' },
  { sn: 13, key: 'paySlip', label: 'Last pay cheque / pay slip', category: 'Verification' },
  { sn: 10, key: 'coverLetter', label: 'Application Form (COVER LETTER)', category: 'Verification' },
  
  { sn: 20, key: 'fileOpeningFee', label: '₦1,000 for staff file opening (PAID)', category: 'Financial & Conduct' },
  { sn: 21, key: 'codeOfConduct', label: 'GMYT Group Ltd Code of Conduct Document', category: 'Financial & Conduct' },
  { sn: 22, key: 'conductViolationRef', label: 'Code of Conduct Violation Reference', category: 'Financial & Conduct' },
  { sn: 19, key: 'smartTaskSheet', label: 'Smart Task Sheet Agreement (Weekly)', category: 'Financial & Conduct' },
  
  { sn: 25, key: 'softCopySubmission', label: 'Submit ALL soft copies via link', category: 'Submission Stages' },
  { sn: 26, key: 'signedScannedDocs', label: 'Email back signed/scanned documents', category: 'Submission Stages' },
  { sn: 27, key: 'hardcopySubmission', label: 'Physical HARDCOPY submission (Resumption)', category: 'Submission Stages' },
  { sn: 28, key: 'staffEmailCreated', label: 'Official @gmyt staff email opened', category: 'Submission Stages' },
] as ChecklistItem[]).sort((a, b) => a.sn - b.sn);

const OnboardingPortal: React.FC<OnboardingProps> = ({ role, staff }) => {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isCEO = role === 'CEO';
  const isManagement = isCEO || role === 'Project Manager';

  useEffect(() => {
    loadOnboardingDocs();
  }, []);

  const loadOnboardingDocs = async () => {
    setIsLoading(true);
    const data = await storageService.getOnboardingDocs();
    setRecords(data);
    setIsLoading(false);
  };

  const handleAutoDeployTasks = async (record: OnboardingRecord) => {
    setIsDeploying(true);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    const deadlineStr = deadline.toISOString().split('T')[0];

    const onboardingTasks: Partial<Task>[] = [
      { role: "Staff Induction", smart: { specific: "Complete full academy tour and handbook review", measurable: "HR sign-off", attainable: "Yes", relevance: "Policy alignment", timeBound: "7 Days" } },
      { role: "Workstation Setup", smart: { specific: "Configure corporate email and tools", measurable: "IT verification", attainable: "Yes", relevance: "Operational readiness", timeBound: "2 Days" } },
      { role: "PRRR-SMART Training", smart: { specific: "Watch corporate framework training video", measurable: "Training Quiz 100%", attainable: "Yes", relevance: "Strategic alignment", timeBound: "3 Days" } }
    ];

    for (const base of onboardingTasks) {
      // Fix: Add missing 'tasksForToday' property to comply with the Task interface
      const task: Task = {
        id: `auto-${Date.now()}-${Math.random()}`,
        sn: 0, // Storage service will need to handle SN properly in real app
        role: base.role!,
        tasksForToday: base.smart?.specific || "Perform induction tasks.",
        responsibleParty: record.staffName,
        problem: { description: "New staff induction", rootCauseAndConsequences: "Lack of corporate alignment", risk: "Operational friction" },
        smart: base.smart as any,
        skrc: { status: 'Pending', isStarted: false, keyResult: '', reflection: '', challenges: '' },
        lineRemarks: 'Automated deployment via Onboarding Verification.',
        deadline: deadlineStr,
        priority: 2,
        comments: [],
        addedBy: 'CEO'
      };
      await storageService.saveTask(task);
    }

    alert(`Success: Standard induction tasks deployed to the Smart Task Sheet for ${record.staffName}.`);
    setIsDeploying(false);
  };

  const handleCreateDossier = async () => {
    if (!selectedStaffId) return;
    const staffMember = staff.find(s => s.id === selectedStaffId);
    if (!staffMember) return;

    const initialDocs = CHECKLIST_ITEMS.reduce((acc, item) => {
      acc[item.key] = false;
      return acc;
    }, {} as any);

    const newRecord: OnboardingRecord = {
      id: `onb-${staffMember.id}`,
      staffName: staffMember.name,
      position: staffMember.role,
      status: 'Incomplete',
      docs: initialDocs,
      notes: '',
      lastUpdated: new Date().toLocaleDateString()
    };

    await storageService.saveOnboardingDoc(newRecord);
    await loadOnboardingDocs();
    setIsModalOpen(false);
    setSelectedStaffId('');
  };

  const handleToggleDoc = async (id: string, docKey: keyof OnboardingRecord['docs']) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    const updatedRecord: OnboardingRecord = {
      ...record,
      docs: {
        ...record.docs,
        [docKey]: !record.docs[docKey]
      },
      lastUpdated: new Date().toLocaleDateString()
    };

    const docValues = Object.values(updatedRecord.docs);
    const completedCount = docValues.filter(v => v).length;
    
    if (completedCount === 0) updatedRecord.status = 'Incomplete';
    else if (completedCount === docValues.length) updatedRecord.status = 'Verified';
    else updatedRecord.status = 'Pending Review';

    await storageService.saveOnboardingDoc(updatedRecord);
    await loadOnboardingDocs();
  };

  const handleBulkVerify = async (id: string) => {
    if (!isManagement) return;
    const record = records.find(r => r.id === id);
    if (!record) return;

    const allVerifiedDocs = { ...record.docs };
    Object.keys(allVerifiedDocs).forEach(key => {
      allVerifiedDocs[key as keyof OnboardingRecord['docs']] = true;
    });

    const updatedRecord: OnboardingRecord = {
      ...record,
      docs: allVerifiedDocs,
      status: 'Verified',
      lastUpdated: new Date().toLocaleDateString()
    };

    await storageService.saveOnboardingDoc(updatedRecord);
    await loadOnboardingDocs();
  };

  const filteredRecords = records.filter(r => 
    r.staffName.toLowerCase().includes(search.toLowerCase()) || 
    r.position.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl">
            <FolderLock className="text-amber-500" size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black gold-text uppercase tracking-tight">Recruitment Checklist Registry</h2>
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
               GMYT SOP-04: 28-Point Verification Protocol
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500" size={16} />
            <input 
              type="text" 
              placeholder="Search directory..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isManagement && (
            <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 gold-gradient rounded-xl font-black text-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
              <UserPlus size={18} /> New Entry
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {filteredRecords.map((r) => {
          const docValues = Object.values(r.docs);
          const progress = (docValues.filter(v => v).length / docValues.length) * 100;
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className={`bg-zinc-900 border rounded-[3rem] overflow-hidden transition-all duration-500 ${isExpanded ? 'border-amber-500 shadow-2xl ring-1 ring-amber-500/20' : 'border-zinc-800'}`}>
              <div 
                className="p-8 cursor-pointer flex flex-wrap items-center justify-between gap-6 group"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${progress === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-950 text-amber-500 border border-zinc-800'}`}>
                    {progress === 100 ? <ShieldCheck size={32} /> : <FileText size={32} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-amber-500 transition-colors">{r.staffName}</h3>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                         <Briefcase size={12} className="text-amber-500" /> {r.position}
                      </span>
                      <span className={`text-[10px] font-black uppercase border px-3 py-1 rounded-full ${r.status === 'Verified' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/30 text-amber-500 bg-amber-500/5'}`}>
                         {r.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   {r.status === 'Verified' && isManagement && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleAutoDeployTasks(r); }}
                       disabled={isDeploying}
                       className="px-6 py-2.5 bg-zinc-800 text-amber-500 border border-amber-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500 hover:text-black transition-all"
                     >
                       <Rocket size={16} /> Auto-Deploy Tasks
                     </button>
                   )}
                   {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-10 border-t border-zinc-800 bg-zinc-950/40 animate-in slide-in-from-top-6 duration-700">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {CHECKLIST_ITEMS.map(item => (
                        <button 
                          key={item.key}
                          onClick={() => handleToggleDoc(r.id, item.key)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${r.docs[item.key] ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                        >
                          <span className="text-xs font-bold">{item.label}</span>
                          {r.docs[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                     ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-2xl animate-in zoom-in duration-500">
            <h3 className="text-xl font-black text-white uppercase mb-8">Initialize Dossier</h3>
            <div className="space-y-6">
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-amber-500 outline-none font-bold text-white shadow-inner"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="">Search Employee Pool...</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
              <button onClick={handleCreateDossier} className="w-full py-5 gold-gradient text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">Initiate Dossier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPortal;