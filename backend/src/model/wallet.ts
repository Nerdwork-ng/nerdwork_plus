import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  json,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./profile";
import { relations } from "drizzle-orm";

export const userWallets = pgTable("user_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfileId: uuid("user_profile_id")
    .notNull()
    .unique() // ✅ Enforce 1:1 by making this unique
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  nwtBalance: integer("nwt_balance").notNull(),
  nwtLockedBalance: integer("nwt_locked_balance").notNull(),
  primaryWalletAddress: text("primary_wallet_address"),
  kycStatus: text("kyc_status").notNull(), // 'none' | 'pending' | 'verified' | 'rejected'
  kycLevel: integer("kyc_level").notNull().default(0),
  spendingLimitDaily: integer("spending_limit_daily"),
  spendingLimitMonthly: integer("spending_limit_monthly"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const walletAddresses = pgTable("wallet_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userWalletId: uuid("user_wallet_id")
    .notNull()
    .references(() => userWallets.id, { onDelete: "cascade" }),
  blockchain: text("blockchain").notNull(), // 'ethereum' | 'polygon' | 'binance' | 'solana'
  address: text("address").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  isPrimary: boolean("is_primary").notNull().default(false),
  label: text("label"),
  addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(),
});

export type InsertUserWallet = typeof userWallets.$inferInsert;
export type SelectUserWallet = typeof userWallets.$inferSelect;

export type InsertWalletAddress = typeof walletAddresses.$inferInsert;
export type SelectWalletAddress = typeof walletAddresses.$inferSelect;

export const userWalletsRelations = relations(userWallets, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [userWallets.userProfileId],
    references: [userProfiles.id],
  }),
}));
