
import { Task, InventoryItem, Expense, Paycheck, OnboardingRecord, Complaint, KPI, MeetingMinutes, UserAccount, AttendanceRecord, TaskTemplate, PasswordChangeRequest } from '../types';
import { dbEngine, STORES } from './db';

const networkDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  // DB Core
  async getDbStatus() {
    await networkDelay(100);
    return {
      status: 'Online',
      latency: '2ms',
      engine: 'IndexedDB Pro v3.0',
      persistence: 'Transactional'
    };
  },

  async exportDatabase(): Promise<string> {
    const dbDump: Record<string, any> = {};
    for (const storeName of Object.values(STORES)) {
      dbDump[storeName] = await dbEngine.getAll(storeName);
    }
    return JSON.stringify(dbDump, null, 2);
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
  async saveUser(user: UserAccount) { await dbEngine.put(STORES.USERS, user); await networkDelay(100); },
  async deleteUser(id: string) { await dbEngine.delete(STORES.USERS, id); },

  // Password Requests
  async getPasswordRequests(): Promise<PasswordChangeRequest[]> {
    return dbEngine.getAll<PasswordChangeRequest>(STORES.PASSWORD_REQUESTS);
  },
  async createPasswordRequest(request: PasswordChangeRequest) {
    const users = await this.getUsers();
    const user = users.find(u => u.id === request.userId);
    
    // CEO bypass approval queue
    if (user?.role === 'CEO') {
      user.password = request.newPassword;
      await this.saveUser(user);
      request.status = 'Approved';
    }
    
    await dbEngine.put(STORES.PASSWORD_REQUESTS, request);
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
  },

  // Tasks
  async getTasks(): Promise<Task[]> { return dbEngine.getAll<Task>(STORES.TASKS); },
  async saveTask(task: Task) { await dbEngine.put(STORES.TASKS, task); await networkDelay(100); },
  async deleteTask(id: string) { await dbEngine.delete(STORES.TASKS, id); },

  // Inventory
  async getInventory(): Promise<InventoryItem[]> { return dbEngine.getAll<InventoryItem>(STORES.INVENTORY); },
  async saveInventory(items: InventoryItem[]) { await dbEngine.putBulk(STORES.INVENTORY, items); },

  // Payroll
  async getPayroll(): Promise<Paycheck[]> { return dbEngine.getAll<Paycheck>(STORES.PAYROLL); },
  async savePayroll(payrolls: Paycheck[]) { await dbEngine.putBulk(STORES.PAYROLL, payrolls); },
  async updatePaycheckStatus(id: string, status: 'Paid') {
    const payrolls = await this.getPayroll();
    const paycheck = payrolls.find(p => p.id === id);
    if (paycheck) {
      paycheck.status = status;
      await dbEngine.put(STORES.PAYROLL, paycheck);
    }
  },

  // Onboarding
  async getOnboardingDocs(): Promise<OnboardingRecord[]> { return dbEngine.getAll<OnboardingRecord>(STORES.ONBOARDING); },
  async saveOnboardingDoc(doc: OnboardingRecord) { await dbEngine.put(STORES.ONBOARDING, doc); },
  async deleteOnboardingDoc(id: string) { await dbEngine.delete(STORES.ONBOARDING, id); },

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> { return dbEngine.getAll<AttendanceRecord>(STORES.ATTENDANCE); },
  async saveAttendanceRecord(record: AttendanceRecord) { await dbEngine.put(STORES.ATTENDANCE, record); },

  // Complaints
  async getComplaints(): Promise<Complaint[]> { return dbEngine.getAll<Complaint>(STORES.COMPLAINTS); },
  async saveComplaint(complaint: Complaint) { await dbEngine.put(STORES.COMPLAINTS, complaint); },
  async resolveComplaint(id: string) {
    const complaints = await this.getComplaints();
    const item = complaints.find(c => c.id === id);
    if (item) {
      item.status = 'Resolved';
      await dbEngine.put(STORES.COMPLAINTS, item);
    }
  },

  // Meetings
  async getMeetings(): Promise<MeetingMinutes[]> { return dbEngine.getAll<MeetingMinutes>(STORES.MEETINGS); },
  async saveMeeting(meeting: MeetingMinutes) { await dbEngine.put(STORES.MEETINGS, meeting); },

  // Templates
  async getTemplates(): Promise<TaskTemplate[]> { return dbEngine.getAll<TaskTemplate>(STORES.TEMPLATES); },
  async saveTemplate(template: TaskTemplate) { await dbEngine.put(STORES.TEMPLATES, template); }
};
