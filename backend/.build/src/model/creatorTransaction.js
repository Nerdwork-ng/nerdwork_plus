"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creatorTransactions = exports.earningSourceEnum = exports.creatorTransactionStatusEnum = exports.creatorTransactionTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const profile_1 = require("./profile");
const userTransaction_1 = require("./userTransaction");
// Creator transaction type - creators earn and withdraw
exports.creatorTransactionTypeEnum = (0, pg_core_1.pgEnum)("creator_transaction_type", [
    "earning", // Earning from user purchases
    "withdrawal", // Withdrawing earnings (cash out)
    "bonus", // Platform bonuses/rewards
]);
// Transaction status
exports.creatorTransactionStatusEnum = (0, pg_core_1.pgEnum)("creator_transaction_status", [
    "pending",
    "completed",
    "processing", // For withdrawals being processed
    "failed",
]);
// What content earned money
exports.earningSourceEnum = (0, pg_core_1.pgEnum)("earning_source", [
    "chapter_purchase",
    "comic_purchase",
    "tip_received",
    "subscription_revenue",
    "platform_bonus",
]);
exports.creatorTransactions = (0, pg_core_1.pgTable)("creator_transactions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    // Creator reference
    creatorId: (0, pg_core_1.uuid)("creator_id")
        .notNull()
        .references(() => profile_1.creatorProfile.id, { onDelete: "cascade" }),
    // Transaction info
    transactionType: (0, exports.creatorTransactionTypeEnum)("transaction_type").notNull(),
    status: (0, exports.creatorTransactionStatusEnum)("status").default("pending").notNull(),
    // Amounts
    nwtAmount: (0, pg_core_1.decimal)("nwt_amount", { precision: 10, scale: 6 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    // For earnings - details about the source
    earningSource: (0, exports.earningSourceEnum)("earning_source"),
    contentId: (0, pg_core_1.uuid)("content_id"), // chapter/comic that was purchased
    purchaserUserId: (0, pg_core_1.uuid)("purchaser_user_id"), // Who bought the content
    sourceUserTransactionId: (0, pg_core_1.uuid)("source_user_transaction_id").references(() => userTransaction_1.userTransactions.id), // Link to the user transaction that generated this earning
    // Revenue split info
    grossAmount: (0, pg_core_1.decimal)("gross_amount", { precision: 10, scale: 6 }), // What user paid
    platformFee: (0, pg_core_1.decimal)("platform_fee", { precision: 10, scale: 6 }), // Platform cut
    platformFeePercentage: (0, pg_core_1.decimal)("platform_fee_percentage", {
        precision: 5,
        scale: 4,
    }).default("0.30"), // 30%
    // For withdrawals - payout info
    withdrawalMethod: (0, pg_core_1.varchar)("withdrawal_method", { length: 100 }), // "bank_transfer", "crypto_wallet", etc.
    withdrawalAddress: (0, pg_core_1.text)("withdrawal_address"), // Bank account, crypto address, etc.
    withdrawalFee: (0, pg_core_1.decimal)("withdrawal_fee", { precision: 10, scale: 6 }),
    externalTransactionId: (0, pg_core_1.varchar)("external_transaction_id", { length: 255 }), // Bank tx ID, blockchain tx hash
    // Processing info
    processedAt: (0, pg_core_1.timestamp)("processed_at", { mode: "date" }),
    failureReason: (0, pg_core_1.text)("failure_reason"),
    // Additional data
    metadata: (0, pg_core_1.jsonb)("metadata"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: "date" }).notNull().defaultNow(),
});
