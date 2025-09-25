"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nft = exports.nftTransactions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const wallet_1 = require("./wallet");
exports.nftTransactions = (0, pg_core_1.pgTable)('nwt_transactions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userWalletId: (0, pg_core_1.uuid)('user_wallet_id')
        .notNull()
        .references(() => wallet_1.userWallets.id, { onDelete: 'cascade' }),
    transactionType: (0, pg_core_1.text)('transaction_type').notNull(), // 'credit' | 'debit'
    category: (0, pg_core_1.text)('category').notNull(), // 'purchase', 'sale', etc.
    amount: (0, pg_core_1.text)('amount').notNull(),
    balanceBefore: (0, pg_core_1.text)('balance_before').notNull(),
    balanceAfter: (0, pg_core_1.text)('balance_after').notNull(),
    referenceId: (0, pg_core_1.text)('reference_id'),
    referenceType: (0, pg_core_1.text)('reference_type'),
    description: (0, pg_core_1.text)('description').notNull(),
    metadata: (0, pg_core_1.json)('metadata'),
    blockchainTxHash: (0, pg_core_1.text)('blockchain_tx_hash'),
    status: (0, pg_core_1.text)('status').notNull(), // 'pending', 'completed', etc.
    processedAt: (0, pg_core_1.timestamp)('processed_at', { mode: 'date' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'date' }).notNull().defaultNow(),
});
exports.nft = (0, pg_core_1.pgTable)('nwt_transactions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    owner: (0, pg_core_1.uuid)('user_wallet_id')
        .notNull()
        .references(() => wallet_1.userWallets.id, { onDelete: 'cascade' }),
    colection: (0, pg_core_1.text)('collection'), // 'credit' | 'debit'
    price: (0, pg_core_1.integer)('price').default(0), // 'purchase', 'sale', etc.
    isLimitedEdition: (0, pg_core_1.boolean)('is_limited_edition').default(false),
    amount: (0, pg_core_1.integer)("amount"),
    metadata: (0, pg_core_1.json)('metadata'),
    status: (0, pg_core_1.text)('status').notNull(), // 'pending', 'completed', etc.
});
