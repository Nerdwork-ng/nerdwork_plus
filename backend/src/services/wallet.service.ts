import { eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { userWallets } from "../model/wallet";

export async function creditWallet(userId: string, amount: number) {
  const [wallet] = await db.select().from(userWallets).where(eq(userWallets.userProfileId, userId)).limit(1);
  

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  await db
    .update(userWallets)
    .set({ nwtBalance: sql`${userWallets.nwtBalance} + ${amount}` })
    .where(eq(userWallets.userProfileId, userId));

  return { success: true, newBalance: wallet.nwtBalance + amount };
}

export async function debitWallet(userId: string, amount: number) {
  const [wallet] = await db.select().from(userWallets).where(eq(userWallets.userProfileId, userId)).limit(1);
   

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.nwtBalance < amount) {
    throw new Error("Insufficient funds");
  }

  const newBalance = wallet.nwtBalance - amount;

  await db
    .update(userWallets)
    .set({ nwtBalance: newBalance })
    .where(eq(userWallets.userProfileId, userId));

  return { success: true, balance: newBalance };
}
