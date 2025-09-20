import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  pgEnum,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { creatorProfile } from "./profile";
import { userTransactions } from "./userTransaction";

// Creator transaction type - creators earn and withdraw
export const creatorTransactionTypeEnum = pgEnum("creator_transaction_type", [
  "earning", // Earning from user purchases
  "withdrawal", // Withdrawing earnings (cash out)
  "bonus", // Platform bonuses/rewards
]);

// Transaction status
export const creatorTransactionStatusEnum = pgEnum(
  "creator_transaction_status",
  [
    "pending",
    "completed",
    "processing", // For withdrawals being processed
    "failed",
  ]
);

// What content earned money
export const earningSourceEnum = pgEnum("earning_source", [
  "chapter_purchase",
  "comic_purchase",
  "tip_received",
  "subscription_revenue",
  "platform_bonus",
]);

export const creatorTransactions = pgTable("creator_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Creator reference
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => creatorProfile.id, { onDelete: "cascade" }),

  // Transaction info
  transactionType: creatorTransactionTypeEnum("transaction_type").notNull(),
  status: creatorTransactionStatusEnum("status").default("pending").notNull(),

  // Amounts
  nwtAmount: decimal("nwt_amount", { precision: 10, scale: 6 }).notNull(),

  description: text("description").notNull(),

  // For earnings - details about the source
  earningSource: earningSourceEnum("earning_source"),
  contentId: uuid("content_id"), // chapter/comic that was purchased
  purchaserUserId: uuid("purchaser_user_id"), // Who bought the content
  sourceUserTransactionId: uuid("source_user_transaction_id").references(
    () => userTransactions.id
  ), // Link to the user transaction that generated this earning

  // Revenue split info
  grossAmount: decimal("gross_amount", { precision: 10, scale: 6 }), // What user paid
  platformFee: decimal("platform_fee", { precision: 10, scale: 6 }), // Platform cut
  platformFeePercentage: decimal("platform_fee_percentage", {
    precision: 5,
    scale: 4,
  }).default("0.30"), // 30%

  // For withdrawals - payout info
  withdrawalMethod: varchar("withdrawal_method", { length: 100 }), // "bank_transfer", "crypto_wallet", etc.
  withdrawalAddress: text("withdrawal_address"), // Bank account, crypto address, etc.
  withdrawalFee: decimal("withdrawal_fee", { precision: 10, scale: 6 }),
  externalTransactionId: varchar("external_transaction_id", { length: 255 }), // Bank tx ID, blockchain tx hash

  // Processing info
  processedAt: timestamp("processed_at", { mode: "date" }),
  failureReason: text("failure_reason"),

  // Additional data
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type InsertCreatorTransaction = typeof creatorTransactions.$inferInsert;
export type SelectCreatorTransaction = typeof creatorTransactions.$inferSelect;
