"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userWalletsRelations = exports.walletAddresses = exports.userWallets = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const profile_1 = require("./profile");
const drizzle_orm_1 = require("drizzle-orm");
exports.userWallets = (0, pg_core_1.pgTable)("user_wallets", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userProfileId: (0, pg_core_1.uuid)("user_profile_id")
        .notNull()
        .unique() // ✅ Enforce 1:1 by making this unique
        .references(() => profile_1.userProfiles.id, { onDelete: "cascade" }),
    nwtBalance: (0, pg_core_1.integer)("nwt_balance").notNull(),
    nwtLockedBalance: (0, pg_core_1.integer)("nwt_locked_balance").notNull(),
    primaryWalletAddress: (0, pg_core_1.text)("primary_wallet_address"),
    kycStatus: (0, pg_core_1.text)("kyc_status").notNull(), // 'none' | 'pending' | 'verified' | 'rejected'
    kycLevel: (0, pg_core_1.integer)("kyc_level").notNull().default(0),
    spendingLimitDaily: (0, pg_core_1.integer)("spending_limit_daily"),
    spendingLimitMonthly: (0, pg_core_1.integer)("spending_limit_monthly"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: "date" }).notNull().defaultNow(),
});
exports.walletAddresses = (0, pg_core_1.pgTable)("wallet_addresses", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userWalletId: (0, pg_core_1.uuid)("user_wallet_id")
        .notNull()
        .references(() => exports.userWallets.id, { onDelete: "cascade" }),
    blockchain: (0, pg_core_1.text)("blockchain").notNull(), // 'ethereum' | 'polygon' | 'binance' | 'solana'
    address: (0, pg_core_1.text)("address").notNull(),
    isVerified: (0, pg_core_1.boolean)("is_verified").notNull().default(false),
    isPrimary: (0, pg_core_1.boolean)("is_primary").notNull().default(false),
    label: (0, pg_core_1.text)("label"),
    addedAt: (0, pg_core_1.timestamp)("added_at", { mode: "date" }).notNull().defaultNow(),
});
exports.userWalletsRelations = (0, drizzle_orm_1.relations)(exports.userWallets, ({ one }) => ({
    userProfile: one(profile_1.userProfiles, {
        fields: [exports.userWallets.userProfileId],
        references: [profile_1.userProfiles.id],
    }),
}));
