import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  json
} from 'drizzle-orm/pg-core';
import { authUsers } from './auth.js';

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  nwtBalance: decimal('nwt_balance', { precision: 18, scale: 8 }).notNull().default('0.00000000'),
  totalEarned: decimal('total_earned', { precision: 18, scale: 8 }).notNull().default('0.00000000'),
  totalSpent: decimal('total_spent', { precision: 18, scale: 8 }).notNull().default('0.00000000'),
  connectedWalletAddress: text('connected_wallet_address'), // Solana/Ethereum wallet address
  walletType: text('wallet_type'), // 'phantom', 'solflare', 'metamask', etc.
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'purchase', 'spend', 'earn', 'refund'
  amount: decimal('amount', { precision: 18, scale: 8 }).notNull(),
  description: text('description').notNull(),
  referenceId: text('reference_id'), // Reference to comic purchase, event ticket, etc.
  referenceType: text('reference_type'), // 'comic', 'event', 'ticket', etc.
  status: text('status').notNull().default('completed'), // 'pending', 'completed', 'failed', 'cancelled'
  paymentMethod: text('payment_method'), // 'helio', 'nwt', etc.
  externalTransactionId: text('external_transaction_id'), // Helio payment ID, etc.
  metadata: json('metadata'), // Additional transaction data
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});


export const nwtPricing = pgTable('nwt_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageName: text('package_name').notNull(), // 'starter', 'premium', 'mega'
  nwtAmount: decimal('nwt_amount', { precision: 18, scale: 8 }).notNull(),
  usdPrice: decimal('usd_price', { precision: 10, scale: 2 }).notNull(),
  bonusPercentage: decimal('bonus_percentage', { precision: 5, scale: 2 }).notNull().default('0.00'),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export type InsertWallet = typeof wallets.$inferInsert;
export type SelectWallet = typeof wallets.$inferSelect;

export type InsertTransaction = typeof transactions.$inferInsert;
export type SelectTransaction = typeof transactions.$inferSelect;


export type InsertNwtPricing = typeof nwtPricing.$inferInsert;
export type SelectNwtPricing = typeof nwtPricing.$inferSelect;