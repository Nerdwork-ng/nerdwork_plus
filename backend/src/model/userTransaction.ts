import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./profile";

// User transaction type - users can only buy or spend NWT
export const userTransactionTypeEnum = pgEnum("user_transaction_type", [
  "purchase",  // Buying NWT with fiat via Helio
  "spend",     // Spending NWT on content (chapters, comics, etc.)
  "refund",    // Refund from failed purchases
]);

// Transaction status
export const userTransactionStatusEnum = pgEnum("user_transaction_status", [
  "pending",
  "completed", 
  "failed",
  "refunded",
]);

// What the user spent NWT on
export const spendCategoryEnum = pgEnum("spend_category", [
  "chapter_unlock",
  "comic_purchase", 
  "tip_creator",
  "subscription",
]);

export const userTransactions = pgTable("user_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // User reference
  userId: uuid("user_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  
  // Transaction info
  transactionType: userTransactionTypeEnum("transaction_type").notNull(),
  status: userTransactionStatusEnum("status").default("pending").notNull(),
  
  // Amounts
  nwtAmount: decimal("nwt_amount", { precision: 10, scale: 6 }).notNull(),
  usdAmount: decimal("usd_amount", { precision: 10, scale: 2 }), // For purchases only
  
  description: text("description").notNull(),
  
  // For spending transactions - what was purchased
  spendCategory: spendCategoryEnum("spend_category"),
  contentId: uuid("content_id"), // chapter ID, comic ID, etc.
  creatorId: uuid("creator_id"), // Who receives the payment
  
  // For purchase transactions - Helio payment info
  helioPaymentId: varchar("helio_payment_id", { length: 255 }),
  helioWebhookId: varchar("helio_webhook_id", { length: 255 }),
  blockchainTxHash: varchar("blockchain_tx_hash", { length: 255 }),
  
  // Additional data
  metadata: jsonb("metadata"), // Store Helio response, error details, etc.
  failureReason: text("failure_reason"),
  
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type InsertUserTransaction = typeof userTransactions.$inferInsert;
export type SelectUserTransaction = typeof userTransactions.$inferSelect;