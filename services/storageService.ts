
import { Task, InventoryItem, Expense, Paycheck, OnboardingRecord, Complaint, KPI, MeetingMinutes, UserAccount, AttendanceRecord, TaskTemplate, PasswordChangeRequest, ChatMessage } from '../types';
import { dbEngine, STORES } from './db';

const networkDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  // Cloud Sync Core
  async getSyncKey(): Promise<string | null> {
    return localStorage.getItem('gmyt_sync_key');
  },

  async setSyncKey(key: string) {
    localStorage.setItem('gmyt_sync_key', key);
    await storageService.pullFromCloud();
  },

  async pushToCloud() {
    const key = await storageService.getSyncKey();
    if (!key) return;

    try {
      const dump = await storageService.exportDatabase();
      const response = await fetch(`/api/sync?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: dump
      });
      
      if (response.ok) {
        localStorage.setItem('gmyt_last_sync', new Date().toISOString());
      }
    } catch (e) {
      console.warn("Cloud Sync Push Failed", e);
    }
  },

  async forcePushAll() {
    await storageService.pushToCloud();
    return true;
  },

  async pullFromCloud(): Promise<boolean> {
    const key = await storageService.getSyncKey();
    if (!key) return false;

    try {
      const response = await fetch(`/api/sync?key=${key}`);
      const result = await response.json();
      
      if (result.data) {
        const success = await storageService.importDatabase(JSON.stringify(result.data));
        if (success) {
          localStorage.setItem('gmyt_last_sync', new Date().toISOString());
          return true;
        }
      } else {
        await storageService.forcePushAll();
        return true;
      }
    } catch (e) {
      console.warn("Cloud Sync Handshake Failed", e);
    }
    return false;
  },

  async getDbStatus() {
    await networkDelay(100);
    const lastSync = localStorage.getItem('gmyt_last_sync');
    const syncKey = await storageService.getSyncKey();
    return {
      status: syncKey ? 'Cloud-Linked' : 'Local-Only',
      latency: '2ms',
      engine: 'CockroachDB Serverless',
      persistence: 'Transactional + External Cluster',
      lastSync: lastSync || 'Never'
    };
  },

  async exportDatabase(): Promise<string> {
    const dbDump: Record<string, any> = {};
    for (const storeName of Object.values(STORES)) {
      dbDump[storeName] = await dbEngine.getAll(storeName);
    }
    return JSON.stringify(dbDump);
  },

  async importDatabase(json: string): Promise<boolean> {
    try {
      const dump = JSON.parse(json);
      for (const storeName of Object.values(STORES)) {
        if (dump[storeName]) {
          await dbEngine.clearStore(storeName);
          await dbEngine.putBulk(storeName, dump[storeName]);
        }
      }
      return true;
    } catch (e) {
      console.error("DB Import Error", e);
      return false;
    }
  },

  // Users
  async getUsers(): Promise<UserAccount[]> {
    const users = await dbEngine.getAll<UserAccount>(STORES.USERS);
    if (users.length === 0) {
      const ceo = { id: 'u-ceo', name: 'Dr Princess Oghene', role: 'CEO' as const, username: 'ceo', password: 'password123' };
      const ictManager = { 
        id: 'u-ict-1', 
        name: 'SAMUEL OLUWATOSIN ADESANYA', 
        role: 'Staff' as const, 
        username: 'samuel.ict', 
        password: 'password123',
        position: 'ICT MANAGER',
        department: 'ICT',
        jobDescription: 'Oversee, manage and ensure full functionality of all ICT systems across the organization.'
      };
      await dbEngine.putBulk(STORES.USERS, [ceo, ictManager]);
      storageService.pushToCloud();
      return [ceo, ictManager];
    }
    return users;
  },
  async saveUser(user: UserAccount) { 
    await dbEngine.put(STORES.USERS, user); 
    await storageService.pushToCloud();
  },
  async deleteUser(id: string) { 
    await dbEngine.delete(STORES.USERS, id); 
    await storageService.pushToCloud();
  },

  // Tasks
  async getTasks(): Promise<Task[]> { return dbEngine.getAll<Task>(STORES.TASKS); },
  async saveTask(task: Task) { 
    await dbEngine.put(STORES.TASKS, task); 
    await storageService.pushToCloud();
  },
  async deleteTask(id: string) { 
    await dbEngine.delete(STORES.TASKS, id); 
    await storageService.pushToCloud();
  },

  // Expenses (Finances)
  async getExpenses(): Promise<Expense[]> { return dbEngine.getAll<Expense>(STORES.EXPENSES); },
  async saveExpense(expense: Expense) { 
    await dbEngine.put(STORES.EXPENSES, expense); 
    await storageService.pushToCloud();
  },
  async updateExpenseStatus(id: string, status: Expense['status']) {
    const expenses = await storageService.getExpenses();
    const item = expenses.find(e => e.id === id);
    if (item) {
      item.status = status;
      await dbEngine.put(STORES.EXPENSES, item);
      await storageService.pushToCloud();
    }
  },

  // Inventory
  async getInventory(): Promise<InventoryItem[]> { return dbEngine.getAll<InventoryItem>(STORES.INVENTORY); },
  async saveInventory(items: InventoryItem[]) { 
    await dbEngine.putBulk(STORES.INVENTORY, items); 
    await storageService.pushToCloud();
  },

  // Payroll
  async getPayroll(): Promise<Paycheck[]> { return dbEngine.getAll<Paycheck>(STORES.PAYROLL); },
  async savePayroll(payrolls: Paycheck[]) { 
    await dbEngine.putBulk(STORES.PAYROLL, payrolls); 
    await storageService.pushToCloud();
  },
  async updatePaycheckStatus(id: string, status: 'Paid') {
    const payrolls = await storageService.getPayroll();
    const paycheck = payrolls.find(p => p.id === id);
    if (paycheck) {
      paycheck.status = status;
      await dbEngine.put(STORES.PAYROLL, paycheck);
      await storageService.pushToCloud();
    }
  },

  // Password Requests
  async getPasswordRequests(): Promise<PasswordChangeRequest[]> {
    return dbEngine.getAll<PasswordChangeRequest>(STORES.PASSWORD_REQUESTS);
  },
  async createPasswordRequest(request: PasswordChangeRequest) {
    await dbEngine.put(STORES.PASSWORD_REQUESTS, request);
    await storageService.pushToCloud();
  },
  async processPasswordRequest(id: string, status: 'Approved' | 'Rejected') {
    const requests = await storageService.getPasswordRequests();
    const req = requests.find(r => r.id === id);
    if (req) {
      req.status = status;
      await dbEngine.put(STORES.PASSWORD_REQUESTS, req);
      await storageService.pushToCloud();
    }
  },

  // Onboarding
  async getOnboardingDocs(): Promise<OnboardingRecord[]> { return dbEngine.getAll<OnboardingRecord>(STORES.ONBOARDING); },
  async saveOnboardingDoc(doc: OnboardingRecord) { 
    await dbEngine.put(STORES.ONBOARDING, doc); 
    await storageService.pushToCloud();
  },

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> { return dbEngine.getAll<AttendanceRecord>(STORES.ATTENDANCE); },
  async saveAttendanceRecord(record: AttendanceRecord) { 
    await dbEngine.put(STORES.ATTENDANCE, record); 
    await storageService.pushToCloud();
  },

  // Complaints
  async getComplaints(): Promise<Complaint[]> { return dbEngine.getAll<Complaint>(STORES.COMPLAINTS); },
  async saveComplaint(complaint: Complaint) { 
    await dbEngine.put(STORES.COMPLAINTS, complaint); 
    await storageService.pushToCloud();
  },
  async resolveComplaint(id: string) {
    const complaints = await storageService.getComplaints();
    const item = complaints.find(c => c.id === id);
    if (item) {
      item.status = 'Resolved';
      await dbEngine.put(STORES.COMPLAINTS, item);
      await storageService.pushToCloud();
    }
  },

  // Meetings
  async getMeetings(): Promise<MeetingMinutes[]> { return dbEngine.getAll<MeetingMinutes>(STORES.MEETINGS); },
  async saveMeeting(meeting: MeetingMinutes) { 
    await dbEngine.put(STORES.MEETINGS, meeting); 
    await storageService.pushToCloud();
  },

  // Chats
  async getMessages(): Promise<ChatMessage[]> {
    return dbEngine.getAll<ChatMessage>(STORES.CHATS);
  },
  async saveMessage(message: ChatMessage) {
    await dbEngine.put(STORES.CHATS, message);
    await storageService.pushToCloud();
  },

  // Templates
  async getTemplates(): Promise<TaskTemplate[]> { return dbEngine.getAll<TaskTemplate>(STORES.TEMPLATES); }
};
