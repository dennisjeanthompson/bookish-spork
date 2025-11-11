import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const branches = sqliteTable("branches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("employee"), // employee, manager, admin
  position: text("position").notNull(),
  hourlyRate: text("hourly_rate").notNull(),
  branchId: text("branch_id").references(() => branches.id).notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  blockchainVerified: integer("blockchain_verified", { mode: 'boolean' }).default(false),
  blockchainHash: text("blockchain_hash"), // Hash of the employee record for blockchain verification
  verifiedAt: integer("verified_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const shifts = sqliteTable("shifts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  branchId: text("branch_id").references(() => branches.id).notNull(),
  startTime: integer("start_time", { mode: 'timestamp' }).notNull(),
  endTime: integer("end_time", { mode: 'timestamp' }).notNull(),
  position: text("position").notNull(),
  isRecurring: integer("is_recurring", { mode: 'boolean' }).default(false),
  recurringPattern: text("recurring_pattern"), // weekly, biweekly, monthly
  status: text("status").default("scheduled"), // scheduled, completed, missed, cancelled
  actualStartTime: integer("actual_start_time", { mode: 'timestamp' }),
  actualEndTime: integer("actual_end_time", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const shiftTrades = sqliteTable("shift_trades", {
  id: text("id").primaryKey(),
  shiftId: text("shift_id").references(() => shifts.id).notNull(),
  fromUserId: text("from_user_id").references(() => users.id).notNull(),
  toUserId: text("to_user_id").references(() => users.id),
  reason: text("reason").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected, completed
  urgency: text("urgency").default("normal"), // urgent, normal, low
  notes: text("notes"),
  requestedAt: integer("requested_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
  approvedAt: integer("approved_at", { mode: 'timestamp' }),
  approvedBy: text("approved_by").references(() => users.id),
});

export const payrollPeriods = sqliteTable("payroll_periods", {
  id: text("id").primaryKey(),
  branchId: text("branch_id").references(() => branches.id).notNull(),
  startDate: integer("start_date", { mode: 'timestamp' }).notNull(),
  endDate: integer("end_date", { mode: 'timestamp' }).notNull(),
  status: text("status").default("open"), // open, closed, paid
  totalHours: text("total_hours"),
  totalPay: text("total_pay"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const payrollEntries = sqliteTable("payroll_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  payrollPeriodId: text("payroll_period_id").references(() => payrollPeriods.id).notNull(),
  totalHours: text("total_hours").notNull(),
  regularHours: text("regular_hours").notNull(),
  overtimeHours: text("overtime_hours").default("0"),
  grossPay: text("gross_pay").notNull(),
  deductions: text("deductions").default("0"),
  netPay: text("net_pay").notNull(),
  status: text("status").default("pending"), // pending, approved, paid
  // Blockchain fields
  blockchainHash: text("blockchain_hash"), // Hash of the record for blockchain verification
  blockNumber: integer("block_number"), // Block number where record was stored
  transactionHash: text("transaction_hash"), // Transaction hash for the blockchain record
  verified: integer("verified", { mode: 'boolean' }).default(false), // Whether the record has been verified on blockchain
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // shift_trade, leave_request, time_correction
  requestId: text("request_id").notNull(), // ID of the related request
  requestedBy: text("requested_by").references(() => users.id).notNull(),
  approvedBy: text("approved_by").references(() => users.id),
  status: text("status").default("pending"), // pending, approved, rejected
  reason: text("reason"),
  requestData: text("request_data"), // Additional data about the request (JSON string)
  requestedAt: integer("requested_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
  respondedAt: integer("responded_at", { mode: 'timestamp' }),
});

// Insert Schemas
export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
}).extend({
  // Coerce string dates to Date objects
  startTime: z.union([z.date(), z.string().pipe(z.coerce.date())]),
  endTime: z.union([z.date(), z.string().pipe(z.coerce.date())]),
});

export const insertShiftTradeSchema = z.object({
  id: z.string().uuid().optional(),
  shiftId: z.string().uuid(),
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required"),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  urgency: z.enum(['urgent', 'normal', 'low']).default('normal'),
  notes: z.string().optional(),
  requestedAt: z.date().optional(),
  approvedAt: z.date().optional(),
  approvedBy: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods).omit({
  id: true,
  createdAt: true,
});

export const insertPayrollEntrySchema = createInsertSchema(payrollEntries).omit({
  id: true,
  createdAt: true,
});

export const timeOffRequests = sqliteTable("time_off_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  startDate: integer("start_date", { mode: 'timestamp' }).notNull(),
  endDate: integer("end_date", { mode: 'timestamp' }).notNull(),
  type: text("type").notNull(), // vacation, sick, personal
  reason: text("reason").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  requestedAt: integer("requested_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
  approvedAt: integer("approved_at", { mode: 'timestamp' }),
  approvedBy: text("approved_by").references(() => users.id),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // payroll, schedule, announcement, system
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: 'boolean' }).default(false),
  data: text("data"), // Additional data for the notification (JSON string)
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const setupStatus = sqliteTable("setup_status", {
  id: text("id").primaryKey(),
  isSetupComplete: integer("is_setup_complete", { mode: 'boolean' }).default(false),
  setupCompletedAt: integer("setup_completed_at", { mode: 'timestamp' }),
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  requestedAt: true,
  respondedAt: true,
});

export const insertTimeOffRequestSchema = createInsertSchema(timeOffRequests).omit({
  id: true,
  requestedAt: true,
  approvedAt: true,
}).extend({
  // Coerce string dates to Date objects
  startDate: z.union([z.date(), z.string().pipe(z.coerce.date())]),
  endDate: z.union([z.date(), z.string().pipe(z.coerce.date())]),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export interface DashboardStats {
  stats: {
    late: number;
    revenue: number;
  };
}

// Types
export type Branch = typeof branches.$inferSelect;
export type User = typeof users.$inferSelect;
export type Shift = typeof shifts.$inferSelect;
export type ShiftTrade = typeof shiftTrades.$inferSelect;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type PayrollEntry = typeof payrollEntries.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type SetupStatus = typeof setupStatus.$inferSelect;

export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type InsertShiftTrade = z.infer<typeof insertShiftTradeSchema>;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
export type InsertPayrollEntry = z.infer<typeof insertPayrollEntrySchema>;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type InsertTimeOffRequest = z.infer<typeof insertTimeOffRequestSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
