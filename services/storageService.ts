
import { Task, InventoryItem, Expense, Paycheck, OnboardingRecord, Complaint, KPI, MeetingMinutes, UserAccount, AttendanceRecord, TaskTemplate, PasswordChangeRequest } from '../types';
import { dbEngine, STORES } from './db';

const networkDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  // Cloud Sync Core
  async getSyncKey(): Promise<string | null> {
    return localStorage.getItem('gmyt_sync_key');
  },

  async setSyncKey(key: string) {
    localStorage.setItem('gmyt_sync_key', key);
    // When a key is set, immediately pull from cloud to hydrate local DB
    return await this.pullFromCloud();
  },

  async pushToCloud() {
    const key = await this.getSyncKey();
    if (!key) return;

    try {
      const dump = await this.exportDatabase();
      const response = await fetch(`/api/sync?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: dump
      });
      
      if (response.ok) {
        localStorage.setItem('gmyt_last_sync', new Date().toISOString());
      } else {
        console.error("Cloud push rejected by server");
      }
    } catch (e) {
      console.warn("Cloud Sync Push Failed: Check DATABASE_URL in Vercel", e);
    }
  },

  async pullFromCloud(): Promise<boolean> {
    const key = await this.getSyncKey();
    if (!key) return false;

    try {
      const response = await fetch(`/api/sync?key=${key}`);
      const result = await response.json();
      
      if (result.data) {
        // Data in result.data is already an object (JSONB from CockroachDB)
        const success = await this.importDatabase(JSON.stringify(result.data));
        if (success) {
          localStorage.setItem('gmyt_last_sync', new Date().toISOString());
          return true;
        }
      }
    } catch (e) {
      console.warn("Cloud Sync Pull Failed", e);
    }
    return false;
  },

  // DB Core
  async getDbStatus() {
    await networkDelay(100);
    const lastSync = localStorage.getItem('gmyt_last_sync');
    const syncKey = await this.getSyncKey();
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
      await dbEngine.put(STORES.USERS, ceo);
      return [ceo];
    }
    return users;
  },
  async saveUser(user: UserAccount) { 
    await dbEngine.put(STORES.USERS, user); 
    this.pushToCloud();
  },
  async deleteUser(id: string) { 
    await dbEngine.delete(STORES.USERS, id); 
    this.pushToCloud();
  },

  // Password Requests
  async getPasswordRequests(): Promise<PasswordChangeRequest[]> {
    return dbEngine.getAll<PasswordChangeRequest>(STORES.PASSWORD_REQUESTS);
  },
  async createPasswordRequest(request: PasswordChangeRequest) {
    const users = await this.getUsers();
    const user = users.find(u => u.id === request.userId);
    if (user?.role === 'CEO') {
      user.password = request.newPassword;
      await this.saveUser(user);
      request.status = 'Approved';
    }
    await dbEngine.put(STORES.PASSWORD_REQUESTS, request);
    this.pushToCloud();
  },
  async processPasswordRequest(requestId: string, approved: boolean) {
    const requests = await this.getPasswordRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    if (approved) {
      const users = await this.getUsers();
      const user = users.find(u => u.id === req.userId);
      if (user) {
        user.password = req.newPassword;
        await this.saveUser(user);
        req.status = 'Approved';
      }
    } else {
      req.status = 'Rejected';
    }
    await dbEngine.put(STORES.PASSWORD_REQUESTS, req);
    this.pushToCloud();
  },

  // Tasks
  async getTasks(): Promise<Task[]> { return dbEngine.getAll<Task>(STORES.TASKS); },
  async saveTask(task: Task) { 
    await dbEngine.put(STORES.TASKS, task); 
    this.pushToCloud();
  },
  async deleteTask(id: string) { 
    await dbEngine.delete(STORES.TASKS, id); 
    this.pushToCloud();
  },

  // Inventory
  async getInventory(): Promise<InventoryItem[]> { return dbEngine.getAll<InventoryItem>(STORES.INVENTORY); },
  async saveInventory(items: InventoryItem[]) { 
    await dbEngine.putBulk(STORES.INVENTORY, items); 
    this.pushToCloud();
  },

  // Payroll
  async getPayroll(): Promise<Paycheck[]> { return dbEngine.getAll<Paycheck>(STORES.PAYROLL); },
  async savePayroll(payrolls: Paycheck[]) { 
    await dbEngine.putBulk(STORES.PAYROLL, payrolls); 
    this.pushToCloud();
  },
  async updatePaycheckStatus(id: string, status: 'Paid') {
    const payrolls = await this.getPayroll();
    const paycheck = payrolls.find(p => p.id === id);
    if (paycheck) {
      paycheck.status = status;
      await dbEngine.put(STORES.PAYROLL, paycheck);
      this.pushToCloud();
    }
  },

  // Onboarding
  async getOnboardingDocs(): Promise<OnboardingRecord[]> { return dbEngine.getAll<OnboardingRecord>(STORES.ONBOARDING); },
  async saveOnboardingDoc(doc: OnboardingRecord) { 
    await dbEngine.put(STORES.ONBOARDING, doc); 
    this.pushToCloud();
  },
  async deleteOnboardingDoc(id: string) { 
    await dbEngine.delete(STORES.ONBOARDING, id); 
    this.pushToCloud();
  },

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> { return dbEngine.getAll<AttendanceRecord>(STORES.ATTENDANCE); },
  async saveAttendanceRecord(record: AttendanceRecord) { 
    await dbEngine.put(STORES.ATTENDANCE, record); 
    this.pushToCloud();
  },

  // Complaints
  async getComplaints(): Promise<Complaint[]> { return dbEngine.getAll<Complaint>(STORES.COMPLAINTS); },
  async saveComplaint(complaint: Complaint) { 
    await dbEngine.put(STORES.COMPLAINTS, complaint); 
    this.pushToCloud();
  },
  async resolveComplaint(id: string) {
    const complaints = await this.getComplaints();
    const item = complaints.find(c => c.id === id);
    if (item) {
      item.status = 'Resolved';
      await dbEngine.put(STORES.COMPLAINTS, item);
      this.pushToCloud();
    }
  },

  // Meetings
  async getMeetings(): Promise<MeetingMinutes[]> { return dbEngine.getAll<MeetingMinutes>(STORES.MEETINGS); },
  async saveMeeting(meeting: MeetingMinutes) { 
    await dbEngine.put(STORES.MEETINGS, meeting); 
    this.pushToCloud();
  },

  // Templates
  async getTemplates(): Promise<TaskTemplate[]> { return dbEngine.getAll<TaskTemplate>(STORES.TEMPLATES); },
  async saveTemplate(template: TaskTemplate) { 
    await dbEngine.put(STORES.TEMPLATES, template); 
    this.pushToCloud();
  }
};
