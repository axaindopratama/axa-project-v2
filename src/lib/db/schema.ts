import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  number: text('number').notNull().unique(),
  name: text('name').notNull(),
  budget: integer('budget').notNull(),
  status: text('status').notNull().default('planning'),
  hourlyRate: integer('hourly_rate').notNull().default(150000),
  startDate: text('start_date'),
  endDate: text('end_date'),
  createdBy: text('created_by'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  assignedTo: text('assigned_to').references(() => entities.id), // Link to an employee entity
  title: text('title').notNull(),
  status: text('status').notNull().default('todo'),
  estCost: integer('est_cost').default(0),
  actCost: integer('act_cost').default(0),
  hours: real('hours').default(0),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
});

// Entities table (Vendor/Client/Employee)
export const entities = sqliteTable('entities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'vendor', 'client', or 'employee'
  contact: text('contact'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  createdAt: text('created_at'),
});

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  entityId: text('entity_id').references(() => entities.id),
  date: text('date').notNull(),
  amount: integer('amount').notNull(),
  type: text('type').notNull(), // 'expense' or 'income'
  paymentStatus: text('payment_status').notNull().default('lunas'),
  paidAmount: integer('paid_amount').default(0),
  dueDate: text('due_date'),
  paidDate: text('paid_date'),
  paymentMethod: text('payment_method'),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  createdAt: text('created_at'),
});

// Transaction items table
export const transactionItems = sqliteTable('transaction_items', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  description: text('description').notNull(),
  qty: integer('qty').notNull().default(1),
  unitPrice: integer('unit_price').notNull(),
  totalPrice: integer('total_price').notNull(),
});

// Project settings table
export const projectSettings = sqliteTable('project_settings', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id).unique(),
  hourlyRate: integer('hourly_rate').default(150000),
  alertThresholdWarning: integer('alert_threshold_warning').default(60),
  alertThresholdCritical: integer('alert_threshold_critical').default(80),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at'),
});

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  supabaseUserId: text('supabase_user_id').notNull().unique(),
  companyId: text('company_id'), // nullable initially, set when user completes profile
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('user'),
  avatar: text('avatar'),
  phone: text('phone'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Company settings table
export const companySettings = sqliteTable('company_settings', {
  id: text('id').primaryKey(),
  companyName: text('company_name'),
  companyAddress: text('company_address'),
  companyPhone: text('company_phone'),
  companyEmail: text('company_email'),
  companyNpwp: text('company_npwp'),
  companySubtitle: text('company_subtitle'),
  logo: text('logo'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Audit logs table
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  projectId: text('project_id').references(() => projects.id),
  action: text('action').notNull(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: text('created_at'),
});

// Relations
export const projectRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  transactions: many(transactions),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const entityRelations = relations(entities, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionRelations = relations(transactions, ({ one, many }) => ({
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
  entity: one(entities, {
    fields: [transactions.entityId],
    references: [entities.id],
  }),
  items: many(transactionItems),
}));

export const transactionItemRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
}));

// Type exports
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type Entity = typeof entities.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type CompanySettings = typeof companySettings.$inferSelect;