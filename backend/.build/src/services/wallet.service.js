"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditWallet = creditWallet;
exports.debitWallet = debitWallet;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const wallet_1 = require("../model/wallet");
async function creditWallet(userId, amount) {
    const [wallet] = await db_1.db
        .select()
        .from(wallet_1.userWallets)
        .where((0, drizzle_orm_1.eq)(wallet_1.userWallets.userProfileId, userId));
    if (!wallet) {
        throw new Error("Wallet not found");
    }
    await db_1.db
        .update(wallet_1.userWallets)
        .set({ nwtBalance: (0, drizzle_orm_1.sql) `${wallet_1.userWallets.nwtBalance} + ${amount}` })
        .where((0, drizzle_orm_1.eq)(wallet_1.userWallets.userProfileId, userId));
    return { success: true, newBalance: wallet.nwtBalance + amount };
}
async function debitWallet(userId, amount) {
    const [wallet] = await db_1.db
        .select()
        .from(wallet_1.userWallets)
        .where((0, drizzle_orm_1.eq)(wallet_1.userWallets.userProfileId, userId));
    if (!wallet) {
        throw new Error("Wallet not found");
    }
    if (wallet.nwtBalance < amount) {
        throw new Error("Insufficient funds");
    }
    const newBalance = wallet.nwtBalance - amount;
    await db_1.db
        .update(wallet_1.userWallets)
        .set({ nwtBalance: newBalance })
        .where((0, drizzle_orm_1.eq)(wallet_1.userWallets.userProfileId, userId));
    return { success: true, balance: newBalance };
}
