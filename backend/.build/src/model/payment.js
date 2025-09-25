"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payments = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const wallet_1 = require("./wallet");
exports.payments = (0, pg_core_1.pgTable)('payments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userWalletId: (0, pg_core_1.uuid)('user_wallet_id')
        .notNull()
        .references(() => wallet_1.userWallets.id, { onDelete: 'cascade' }),
    // should payment method type be set in the database
    //   paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
    amount: (0, pg_core_1.text)('amount').notNull(),
    currency: (0, pg_core_1.text)('currency').notNull(),
    nwtAmount: (0, pg_core_1.text)('nwt_amount'),
    exchangeRate: (0, pg_core_1.text)('exchange_rate'),
    webhookId: (0, pg_core_1.text)('webhook_id'), // Helio webhook ID
    paymentIntentId: (0, pg_core_1.text)('payment_intent_id'),
    blockchainTxHash: (0, pg_core_1.text)('blockchain_tx_hash'),
    status: (0, pg_core_1.text)('status').notNull(), // 'pending', 'processing', etc.
    failureReason: (0, pg_core_1.text)('failure_reason'),
    metadata: (0, pg_core_1.json)('metadata').notNull(),
    processedAt: (0, pg_core_1.timestamp)('processed_at', { mode: 'date' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'date' }).notNull().defaultNow(),
});
