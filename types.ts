
export type UserRole = 'CEO' | 'Project Manager' | 'Staff' | 'Accountant';

export type TaskStatus = 'Pending' | 'Ongoing' | 'Completed' | 'Delayed' | 'Awaiting Approval';

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
  // Staff Profile Details
  title?: string;
  position?: string;
  email?: string;
  phone?: string;
  salary?: number;
  department?: string;
  jobDescription?: string; // Persistent Job Description for Task Sheet
  joinDate?: string;
  status?: 'Active' | 'Suspended' | 'Terminated';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId?: string; // If undefined, it's a channel/broadcast message
  channelId?: string; // 'global', 'management', 'ict', 'accounts'
  text: string;
  timestamp: string;
  isRead: boolean;
  mentions?: string[]; // User IDs or Role tags
}

export interface PasswordChangeRequest {
  id: string;
  userId: string;
  userName: string;
  newPassword: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: 'Present' | 'Late' | 'On Leave';
}

export interface Task {
  id: string;
  sn: number;
  role: string; // Job Description / Core Objective
  tasksForToday: string; // Immediate execution items
  problem: {
    description: string; // Problem Identification
    rootCauseAndConsequences: string; // Root Cause & Consequences
    risk: string; // Risk
  };
  responsibleParty: string;
  smart: {
    specific: string;
    measurable: string;
    attainable: string;
    relevance: string;
    timeBound: string;
  };
  skrc: {
    status: TaskStatus;
    isStarted: boolean;
    keyResult: string;
    reflection: string;
    challenges: string;
    report?: string; // Completion report
  };
  comments: Array<{ user: string, text: string, date: string }>;
  lineRemarks: string; // Sup/Line Remarks
  deadline: string;
  priority: number;
  addedBy: UserRole;
}

export interface TaskTemplate {
  id: string;
  name: string;
  role: string;
  problem: {
    description: string;
    rootCauseAndConsequences: string;
    risk: string;
  };
  smart: {
    specific: string;
    measurable: string;
    attainable: string;
    relevance: string;
    timeBound: string;
  };
}

export interface OnboardingRecord {
  id: string;
  staffName: string;
  position: string;
  status: 'Incomplete' | 'Pending Review' | 'Verified';
  docs: {
    confidentiality: boolean;
    handbook: boolean;
    inductionForm: boolean;
    dataProtection: boolean;
    employmentAgreement: boolean;
    offerLetter: boolean;
    bioData: boolean;
    guarantorForm: boolean;
    guarantorId: boolean;
    coverLetter: boolean;
    personalDataProtection: boolean;
    recommendationLetter: boolean;
    paySlip: boolean;
    passportPhotos: boolean;
    cv: boolean;
    credentials: boolean;
    acceptanceSignature: boolean;
    governingLaw: boolean;
    smartTaskSheet: boolean;
    fileOpeningFee: boolean;
    codeOfConduct: boolean;
    conductViolationRef: boolean;
    disclaimerNotice: boolean;
    bioAndPicture: boolean;
    softCopySubmission: boolean;
    signedScannedDocs: boolean;
    hardcopySubmission: boolean;
    staffEmailCreated: boolean;
  };
  notes: string;
  lastUpdated: string;
}

export interface Expense {
  id: string;
  invoiceDate: string;
  accountName: string;
  problem: string;
  purpose: string;
  quantity: number;
  amount: number;
  status: 'Pending' | 'Approved' | 'Paid';
}

export interface Paycheck {
  id: string;
  staffName: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: 'Generated' | 'Paid';
  date: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  status: 'Applied' | 'Interviewing' | 'Hired' | 'Rejected';
  interviewNotes: string;
}

export interface Complaint {
  id: string;
  from: string;
  text: string;
  date: string;
  status: 'Open' | 'Resolved';
}

export interface InventoryItem {
  id: string;
  product: string;
  quantity: number;
  in: number;
  out: number;
  balance: number;
  reorderLevel: number;
  responsibleParty: string;
  date: string;
}

export interface KPI {
  id: string;
  metric: string;
  weight: number;
  target: number;
  actual: number;
  rating: number; // 0-5
  remarks: string;
}

export interface MeetingMinutes {
  id: string;
  date: string;
  time: string;
  attendance: string[];
  agenda: string;
  actionNotes: string;
  deadlines: string;
  responsibleParty: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
}
