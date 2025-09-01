import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  boolean,
  json,
  integer,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { authUsers } from './auth.js';

// Chart of Accounts - defines all account types
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g., '1000', '2000', '3000'
  name: text('name').notNull(), // e.g., 'Cash', 'NWT Token Inventory', 'User Deposits'
  type: text('type').notNull(), // 'asset', 'liability', 'equity', 'revenue', 'expense'
  parentAccountId: uuid('parent_account_id'),
  normalBalance: text('normal_balance').notNull(), // 'debit' or 'credit'
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  level: integer('level').notNull().default(1), // Account hierarchy level
  fullPath: text('full_path').notNull(), // e.g., "Assets > Current Assets > Cash"
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// Double-Entry Ledger Entries
export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull(), // Groups related entries
  userId: uuid('user_id').references(() => authUsers.id), // Optional: user associated with entry
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id),
  debitAmount: decimal('debit_amount', { precision: 18, scale: 8 }).notNull().default('0.00000000'),
  creditAmount: decimal('credit_amount', { precision: 18, scale: 8 }).notNull().default('0.00000000'),
  description: text('description').notNull(),
  referenceType: text('reference_type'), // 'nwt_purchase', 'comic_purchase', 'event_ticket'
  referenceId: text('reference_id'), // ID of the related transaction
  metadata: json('metadata'), // Additional context data
  entryDate: timestamp('entry_date', { mode: 'date' }).notNull().defaultNow(),
  isReversed: boolean('is_reversed').notNull().default(false),
  reversedBy: uuid('reversed_by'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// Transaction Headers (groups ledger entries)
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  description: text('description').notNull(),
  type: text('type').notNull(), // 'nwt_purchase', 'comic_purchase', 'event_ticket', etc.
  userId: uuid('user_id').references(() => authUsers.id),
  totalAmount: decimal('total_amount', { precision: 18, scale: 8 }).notNull(),
  currency: text('currency').notNull().default('NWT'),
  status: text('status').notNull().default('completed'), // 'pending', 'completed', 'reversed'
  referenceId: text('reference_id'), // External reference (Stripe payment, etc.)
  isReversed: boolean('is_reversed').notNull().default(false),
  reversedBy: uuid('reversed_by'),
  transactionDate: timestamp('transaction_date', { mode: 'date' }).notNull().defaultNow(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

// Account Balances (cached for performance)
export const accountBalances = pgTable('account_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id),
  userId: uuid('user_id').references(() => authUsers.id), // For user-specific balances
  debitBalance: decimal('debit_balance', { precision: 18, scale: 8 }).notNull().default('0.00000000'),
  creditBalance: decimal('credit_balance', { precision: 18, scale: 8 }).notNull().default('0.00000000'),
  netBalance: decimal('net_balance', { precision: 18, scale: 8 }).notNull().default('0.00000000'),
  lastUpdated: timestamp('last_updated', { mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => {
  return {
    unique_account_user: unique().on(table.accountId, table.userId)
  };
});

// Audit Trail
export const auditTrail = pgTable('audit_trail', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  action: text('action').notNull(), // 'insert', 'update', 'delete'
  oldValues: json('old_values'),
  newValues: json('new_values'),
  userId: uuid('user_id').references(() => authUsers.id),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
});

export type InsertAccount = typeof accounts.$inferInsert;
export type SelectAccount = typeof accounts.$inferSelect;

export type InsertLedgerEntry = typeof ledgerEntries.$inferInsert;
export type SelectLedgerEntry = typeof ledgerEntries.$inferSelect;

export type InsertTransaction = typeof transactions.$inferInsert;
export type SelectTransaction = typeof transactions.$inferSelect;

export type InsertAccountBalance = typeof accountBalances.$inferInsert;
export type SelectAccountBalance = typeof accountBalances.$inferSelect;

export type InsertAuditTrail = typeof auditTrail.$inferInsert;
export type SelectAuditTrail = typeof auditTrail.$inferSelect;

// Relations
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  parentAccount: one(accounts, {
    fields: [accounts.parentAccountId],
    references: [accounts.id],
    relationName: "parent_account"
  }),
  childAccounts: many(accounts, { relationName: "parent_account" }),
  ledgerEntries: many(ledgerEntries),
  accountBalances: many(accountBalances),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  account: one(accounts, {
    fields: [ledgerEntries.accountId],
    references: [accounts.id],
  }),
  transaction: one(transactions, {
    fields: [ledgerEntries.transactionId],
    references: [transactions.id],
  }),
  user: one(authUsers, {
    fields: [ledgerEntries.userId],
    references: [authUsers.id],
  }),
  reversedByEntry: one(ledgerEntries, {
    fields: [ledgerEntries.reversedBy],
    references: [ledgerEntries.id],
    relationName: "reversed_entry"
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [transactions.userId],
    references: [authUsers.id],
  }),
  ledgerEntries: many(ledgerEntries),
  reversedByTransaction: one(transactions, {
    fields: [transactions.reversedBy],
    references: [transactions.id],
    relationName: "reversed_transaction"
  }),
}));

export const accountBalancesRelations = relations(accountBalances, ({ one }) => ({
  account: one(accounts, {
    fields: [accountBalances.accountId],
    references: [accounts.id],
  }),
  user: one(authUsers, {
    fields: [accountBalances.userId],
    references: [authUsers.id],
  }),
}));