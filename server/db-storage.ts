import { db } from './db';
import { branches, users, shifts, shiftTrades, payrollPeriods, payrollEntries, approvals, timeOffRequests, notifications, setupStatus } from '@shared/schema';
import type { IStorage } from './storage';
import type { User, InsertUser, Branch, InsertBranch, Shift, InsertShift, ShiftTrade, InsertShiftTrade, PayrollPeriod, InsertPayrollPeriod, PayrollEntry, InsertPayrollEntry, Approval, InsertApproval, InsertTimeOffRequest, InsertNotification } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: Date;
};

type TimeOffRequest = {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  type: string;
  reason: string;
  status: string;
  requestedAt: Date;
  approvedAt?: Date | null;
  approvedBy?: string | null;
};

export class DatabaseStorage implements IStorage {
  // Setup Status
  async isSetupComplete(): Promise<boolean> {
    const status = await db.select().from(setupStatus).limit(1);
    return status.length > 0 && status[0].isSetupComplete === true;
  }

  async markSetupComplete(): Promise<void> {
    const existing = await db.select().from(setupStatus).limit(1);
    if (existing.length > 0) {
      await db.update(setupStatus)
        .set({ isSetupComplete: true, setupCompletedAt: new Date() })
        .where(eq(setupStatus.id, existing[0].id));
    } else {
      await db.insert(setupStatus).values({
        id: randomUUID(),
        isSetupComplete: true,
        setupCompletedAt: new Date(),
      });
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    console.log('Creating user:', user.username);
    console.log('Plain password length:', user.password.length);

    const hashedPassword = await bcrypt.hash(user.password, 10);
    console.log('Hashed password starts with:', hashedPassword.substring(0, 10));

    try {
      // Don't pass createdAt - let the database default handle it
      await db.insert(users).values({
        id,
        ...user,
        password: hashedPassword,
        // createdAt will be set by database default: sql`(unixepoch())`
      });

      console.log('User inserted, retrieving...');

      // Give the database a moment to commit
      const created = await this.getUser(id);
      if (!created) {
        console.error('User was inserted but could not be retrieved:', id);
        throw new Error('Failed to create user');
      }

      console.log('User created successfully:', created.username);
      console.log('Stored password hash starts with:', created.password.substring(0, 10));

      return created;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: any = { ...user };
    
    // Hash password if it's being updated
    if (user.password) {
      updateData.password = await bcrypt.hash(user.password, 10);
    }
    
    await db.update(users).set(updateData).where(eq(users.id, id));
    return this.getUser(id);
  }

  async getUsersByBranch(branchId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.branchId, branchId));
  }

  // Branches
  async getBranch(id: string): Promise<Branch | undefined> {
    const result = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    return result[0];
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const id = randomUUID();
    await db.insert(branches).values({
      id,
      ...branch,
      createdAt: new Date(),
    });
    
    const created = await this.getBranch(id);
    if (!created) throw new Error('Failed to create branch');
    return created;
  }

  async getAllBranches(): Promise<Branch[]> {
    return db.select().from(branches);
  }

  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined> {
    await db.update(branches).set(branch).where(eq(branches.id, id));
    return this.getBranch(id);
  }

  // Shifts
  async createShift(shift: InsertShift): Promise<Shift> {
    const id = randomUUID();
    await db.insert(shifts).values({
      id,
      ...shift,
      createdAt: new Date(),
    });
    
    const created = await this.getShift(id);
    if (!created) throw new Error('Failed to create shift');
    return created;
  }

  async getShift(id: string): Promise<Shift | undefined> {
    const result = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);
    return result[0];
  }

  async updateShift(id: string, shift: Partial<InsertShift>): Promise<Shift | undefined> {
    await db.update(shifts).set(shift).where(eq(shifts.id, id));
    return this.getShift(id);
  }

  async getShiftsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<Shift[]> {
    let query = db.select().from(shifts).where(eq(shifts.userId, userId));
    
    if (startDate && endDate) {
      return db.select().from(shifts).where(
        and(
          eq(shifts.userId, userId),
          gte(shifts.startTime, startDate),
          lte(shifts.startTime, endDate)
        )
      );
    }
    
    return query;
  }

  async getShiftsByBranch(branchId: string, startDate?: Date, endDate?: Date): Promise<Shift[]> {
    if (startDate && endDate) {
      return db.select().from(shifts).where(
        and(
          eq(shifts.branchId, branchId),
          gte(shifts.startTime, startDate),
          lte(shifts.startTime, endDate)
        )
      );
    }
    
    return db.select().from(shifts).where(eq(shifts.branchId, branchId));
  }

  async deleteShift(id: string): Promise<boolean> {
    await db.delete(shifts).where(eq(shifts.id, id));
    return true;
  }

  // Shift Trades
  async createShiftTrade(trade: InsertShiftTrade): Promise<ShiftTrade> {
    const id = randomUUID();
    await db.insert(shiftTrades).values({
      id,
      ...trade,
      requestedAt: new Date(),
    });
    
    const created = await this.getShiftTrade(id);
    if (!created) throw new Error('Failed to create shift trade');
    return created;
  }

  async getShiftTrade(id: string): Promise<ShiftTrade | undefined> {
    const result = await db.select().from(shiftTrades).where(eq(shiftTrades.id, id)).limit(1);
    return result[0];
  }

  async updateShiftTrade(id: string, trade: Partial<InsertShiftTrade>): Promise<ShiftTrade | undefined> {
    await db.update(shiftTrades).set(trade).where(eq(shiftTrades.id, id));
    return this.getShiftTrade(id);
  }

  async getAvailableShiftTrades(branchId: string): Promise<ShiftTrade[]> {
    // Get all pending trades for shifts in this branch
    const result = await db.select({
      trade: shiftTrades,
      shift: shifts,
    })
    .from(shiftTrades)
    .leftJoin(shifts, eq(shiftTrades.shiftId, shifts.id))
    .where(
      and(
        eq(shiftTrades.status, 'pending'),
        eq(shifts.branchId, branchId)
      )
    );
    
    return result.map(r => r.trade);
  }

  async getShiftTradesByUser(userId: string): Promise<ShiftTrade[]> {
    return db.select().from(shiftTrades).where(eq(shiftTrades.fromUserId, userId));
  }

  // Payroll
  async createPayrollPeriod(period: InsertPayrollPeriod): Promise<PayrollPeriod> {
    const id = randomUUID();
    await db.insert(payrollPeriods).values({
      id,
      ...period,
      createdAt: new Date(),
    });
    
    const created = await this.getPayrollPeriod(id);
    if (!created) throw new Error('Failed to create payroll period');
    return created;
  }

  async getPayrollPeriod(id: string): Promise<PayrollPeriod | undefined> {
    const result = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, id)).limit(1);
    return result[0];
  }

  async getPayrollPeriodsByBranch(branchId: string): Promise<PayrollPeriod[]> {
    return db.select().from(payrollPeriods).where(eq(payrollPeriods.branchId, branchId));
  }

  async updatePayrollPeriod(id: string, period: Partial<InsertPayrollPeriod>): Promise<PayrollPeriod | undefined> {
    await db.update(payrollPeriods).set(period).where(eq(payrollPeriods.id, id));
    return this.getPayrollPeriod(id);
  }

  async getCurrentPayrollPeriod(branchId: string): Promise<PayrollPeriod | undefined> {
    const result = await db.select().from(payrollPeriods)
      .where(
        and(
          eq(payrollPeriods.branchId, branchId),
          eq(payrollPeriods.status, 'open')
        )
      )
      .limit(1);
    return result[0];
  }

  async createPayrollEntry(entry: InsertPayrollEntry): Promise<PayrollEntry> {
    const id = randomUUID();
    await db.insert(payrollEntries).values({
      id,
      ...entry,
      createdAt: new Date(),
    });
    
    const created = await db.select().from(payrollEntries).where(eq(payrollEntries.id, id)).limit(1);
    if (!created[0]) throw new Error('Failed to create payroll entry');
    return created[0];
  }

  async getPayrollEntriesByUser(userId: string, periodId?: string): Promise<PayrollEntry[]> {
    if (periodId) {
      return db.select().from(payrollEntries).where(
        and(
          eq(payrollEntries.userId, userId),
          eq(payrollEntries.payrollPeriodId, periodId)
        )
      );
    }
    return db.select().from(payrollEntries).where(eq(payrollEntries.userId, userId));
  }

  async getPayrollEntry(id: string): Promise<PayrollEntry | undefined> {
    const result = await db.select().from(payrollEntries).where(eq(payrollEntries.id, id)).limit(1);
    return result[0];
  }

  async updatePayrollEntry(id: string, entry: Partial<InsertPayrollEntry>): Promise<PayrollEntry | undefined> {
    await db.update(payrollEntries).set(entry).where(eq(payrollEntries.id, id));
    const result = await db.select().from(payrollEntries).where(eq(payrollEntries.id, id)).limit(1);
    return result[0];
  }

  // Approvals
  async createApproval(approval: InsertApproval): Promise<Approval> {
    const id = randomUUID();
    await db.insert(approvals).values({
      id,
      ...approval,
      requestedAt: new Date(),
    });
    
    const created = await db.select().from(approvals).where(eq(approvals.id, id)).limit(1);
    if (!created[0]) throw new Error('Failed to create approval');
    return created[0];
  }

  async updateApproval(id: string, approval: Partial<InsertApproval>): Promise<Approval | undefined> {
    await db.update(approvals).set({
      ...approval,
      respondedAt: new Date(),
    }).where(eq(approvals.id, id));
    const result = await db.select().from(approvals).where(eq(approvals.id, id)).limit(1);
    return result[0];
  }

  async getPendingApprovals(branchId: string): Promise<Approval[]> {
    // Get all pending approvals for users in this branch
    const result = await db.select({
      approval: approvals,
      user: users,
    })
    .from(approvals)
    .leftJoin(users, eq(approvals.requestedBy, users.id))
    .where(
      and(
        eq(approvals.status, 'pending'),
        eq(users.branchId, branchId)
      )
    );
    
    return result.map(r => r.approval);
  }

  // Time Off Requests
  async createTimeOffRequest(request: InsertTimeOffRequest): Promise<TimeOffRequest> {
    const id = randomUUID();
    await db.insert(timeOffRequests).values({
      id,
      ...request,
      requestedAt: new Date(),
    });
    
    const created = await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, id)).limit(1);
    if (!created[0]) throw new Error('Failed to create time off request');
    return created[0] as TimeOffRequest;
  }

  async getTimeOffRequest(id: string): Promise<TimeOffRequest | undefined> {
    const result = await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, id)).limit(1);
    return result[0] as TimeOffRequest | undefined;
  }

  async updateTimeOffRequest(id: string, request: Partial<InsertTimeOffRequest>): Promise<TimeOffRequest | undefined> {
    await db.update(timeOffRequests).set(request).where(eq(timeOffRequests.id, id));
    const result = await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, id)).limit(1);
    return result[0] as TimeOffRequest | undefined;
  }

  async getTimeOffRequestsByUser(userId: string): Promise<TimeOffRequest[]> {
    const result = await db.select().from(timeOffRequests).where(eq(timeOffRequests.userId, userId));
    return result as TimeOffRequest[];
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const dataString = notification.data ? JSON.stringify(notification.data) : null;
    
    await db.insert(notifications).values({
      id,
      ...notification,
      data: dataString,
      createdAt: new Date(),
    });
    
    const created = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    if (!created[0]) throw new Error('Failed to create notification');
    
    const result = created[0];
    return {
      ...result,
      data: result.data ? JSON.parse(result.data) : null,
      createdAt: result.createdAt instanceof Date ? result.createdAt : new Date(result.createdAt),
    } as Notification;
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    if (!result[0]) return undefined;
    
    return {
      ...result[0],
      data: result[0].data ? JSON.parse(result[0].data) : null,
      createdAt: result[0].createdAt instanceof Date ? result[0].createdAt : new Date(result[0].createdAt),
    } as Notification;
  }

  async updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification | undefined> {
    const updateData: any = { ...notification };
    if (notification.data) {
      updateData.data = JSON.stringify(notification.data);
    }
    
    await db.update(notifications).set(updateData).where(eq(notifications.id, id));
    return this.getNotification(id);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const result = await db.select().from(notifications).where(eq(notifications.userId, userId));
    return result.map(n => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null,
      createdAt: n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt),
    })) as Notification[];
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    await db.delete(notifications).where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      )
    );
    return true;
  }
}

export const dbStorage = new DatabaseStorage();

