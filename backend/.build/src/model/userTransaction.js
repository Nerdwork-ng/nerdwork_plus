"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userTransactions = exports.spendCategoryEnum = exports.userTransactionStatusEnum = exports.userTransactionTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const profile_1 = require("./profile");
// User transaction type - users can only buy or spend NWT
exports.userTransactionTypeEnum = (0, pg_core_1.pgEnum)("user_transaction_type", [
    "purchase", // Buying NWT with fiat via Helio
    "spend", // Spending NWT on content (chapters, comics, etc.)
    "refund", // Refund from failed purchases
]);
// Transaction status
exports.userTransactionStatusEnum = (0, pg_core_1.pgEnum)("user_transaction_status", [
    "pending",
    "completed",
    "failed",
    "refunded",
]);
// What the user spent NWT on
exports.spendCategoryEnum = (0, pg_core_1.pgEnum)("spend_category", [
    "chapter_unlock",
    "comic_purchase",
    "tip_creator",
    "subscription",
]);
exports.userTransactions = (0, pg_core_1.pgTable)("user_transactions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    // User reference
    userId: (0, pg_core_1.uuid)("reader_id")
        .notNull()
        .references(() => profile_1.readerProfile.id, { onDelete: "cascade" }),
    // Transaction info
    transactionType: (0, exports.userTransactionTypeEnum)("transaction_type").notNull(),
    status: (0, exports.userTransactionStatusEnum)("status").default("pending").notNull(),
    // Amounts
    nwtAmount: (0, pg_core_1.decimal)("nwt_amount", { precision: 10, scale: 6 }).notNull(),
    usdAmount: (0, pg_core_1.decimal)("usd_amount", { precision: 10, scale: 2 }), // For purchases only
    description: (0, pg_core_1.text)("description").notNull(),
    // For spending transactions - what was purchased
    spendCategory: (0, exports.spendCategoryEnum)("spend_category"),
    contentId: (0, pg_core_1.uuid)("content_id"), // chapter ID, comic ID, etc.
    creatorId: (0, pg_core_1.uuid)("creator_id"), // Who receives the payment
    // For purchase transactions - Helio payment info
    helioPaymentId: (0, pg_core_1.varchar)("helio_payment_id", { length: 255 }),
    helioWebhookId: (0, pg_core_1.varchar)("helio_webhook_id", { length: 255 }),
    blockchainTxHash: (0, pg_core_1.varchar)("blockchain_tx_hash", { length: 255 }),
    // Additional data
    metadata: (0, pg_core_1.jsonb)("metadata"), // Store Helio response, error details, etc.
    failureReason: (0, pg_core_1.text)("failure_reason"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: "date" }).notNull().defaultNow(),
});
