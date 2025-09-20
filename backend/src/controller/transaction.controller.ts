import { eq, and } from "drizzle-orm";
import { db } from "../config/db";
import { userTransactions } from "../model/userTransaction";
import { creatorTransactions } from "../model/creatorTransaction";
import {
  userProfiles,
  creatorProfile,
  readerProfile,
  paidChapters,
} from "../model/schema";

// ===============================
// USER TRANSACTION FUNCTIONS
// ===============================

/**
 * Create a new user transaction for NWT purchase
 */
export const createUserPurchaseTransaction = async (
  userId: string,
  nwtAmount: number,
  usdAmount: number,
  helioPaymentId: string,
  description?: string
) => {
  try {
    // First get the reader profile ID from user ID
    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, userId));

    if (!reader) {
      throw new Error("Reader profile not found");
    }

    const [transaction] = await db
      .insert(userTransactions)
      .values({
        userId: reader.id, // Use reader.id, not userId
        transactionType: "purchase",
        status: "pending",
        nwtAmount: nwtAmount.toString(),
        usdAmount: usdAmount.toString(),
        description:
          description || `Purchase ${nwtAmount} NWT for $${usdAmount}`,
        helioPaymentId,
      })
      .returning();
    console.log("Created user purchase transaction:", transaction);

    return { success: true, transaction };
  } catch (error) {
    console.error("Error creating user purchase transaction:", error);
    return { success: false, error };
  }
};

/**
 * Update user transaction status (for webhook confirmations)
 */
export const updateUserTransactionStatus = async (
  helioPaymentId: string,
  status: "completed" | "failed" | "refunded",
  blockchainTxHash?: string,
  metadata?: any,
  failureReason?: string
) => {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (blockchainTxHash) updateData.blockchainTxHash = blockchainTxHash;
    if (metadata) updateData.metadata = metadata;
    if (failureReason) updateData.failureReason = failureReason;

    const [updatedTransaction] = await db
      .update(userTransactions)
      .set(updateData)
      .where(eq(userTransactions.helioPaymentId, helioPaymentId))
      .returning();
    console.log("Updated user transaction:", updatedTransaction);
    return { success: true, transaction: updatedTransaction };
  } catch (error) {
    console.error("Error updating user transaction status:", error);
    return { success: false, error };
  }
};

/**
 * Create a spending transaction when user buys content
 */
export const createUserSpendTransaction = async (
  userId: string,
  nwtAmount: number,
  spendCategory:
    | "chapter_unlock"
    | "comic_purchase"
    | "tip_creator"
    | "subscription",
  contentId: string,
  creatorId: string,
  description?: string
) => {
  try {
    const [transaction] = await db
      .insert(userTransactions)
      .values({
        userId,
        transactionType: "spend",
        status: "completed", // Spending is instant
        nwtAmount: nwtAmount.toString(),
        description:
          description || `Spent ${nwtAmount} NWT on ${spendCategory}`,
        spendCategory,
        contentId,
        creatorId,
      })
      .returning();

    return { success: true, transaction };
  } catch (error) {
    console.error("Error creating user spend transaction:", error);
    return { success: false, error };
  }
};

/**
 * Update user wallet balance after successful purchase
 */
export const updateUserWalletBalance = async (
  userId: string,
  nwtAmount: number,
  operation: "add" | "subtract" = "add"
) => {
  try {
    // Get user profile with wallet
    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.id, userId));

    if (!reader) {
      return { success: false, error: "User profile not found" };
    }

    const currentBalance = reader.walletBalance || 0;

    const changeAmount = operation === "add" ? nwtAmount : -nwtAmount;
    const newBalance = currentBalance + changeAmount;

    // Prevent negative balance for spending
    if (operation === "subtract" && newBalance < 0) {
      return { success: false, error: "Insufficient balance" };
    }

    // Update wallet balance
    await db
      .update(readerProfile)
      .set({
        walletBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(readerProfile.id, userId));

    return { success: true, newBalance };
  } catch (error) {
    console.error("Error updating user wallet balance:", error);
    return { success: false, error };
  }
};

// ===============================
// CREATOR TRANSACTION FUNCTIONS
// ===============================

/**
 * Create creator earning transaction when user purchases their content
 */
export const createCreatorEarningTransaction = async (
  creatorId: string,
  grossAmount: number, // What user paid
  platformFeePercentage: number = 0.3, // 30% platform fee
  earningSource:
    | "chapter_purchase"
    | "comic_purchase"
    | "tip_received"
    | "subscription_revenue",
  contentId: string,
  purchaserUserId: string,
  sourceUserTransactionId: string
) => {
  try {
    const platformFee = grossAmount * platformFeePercentage;
    const netAmount = grossAmount - platformFee;

    const [transaction] = await db
      .insert(creatorTransactions)
      .values({
        creatorId,
        transactionType: "earning",
        status: "completed",
        nwtAmount: netAmount.toString(),
        description: `Earned ${netAmount} NWT from ${earningSource}`,
        earningSource,
        contentId,
        purchaserUserId,
        sourceUserTransactionId,
        grossAmount: grossAmount.toString(),
        platformFee: platformFee.toString(),
        platformFeePercentage: platformFeePercentage.toString(),
      })
      .returning();

    return { success: true, transaction, netAmount };
  } catch (error) {
    console.error("Error creating creator earning transaction:", error);
    return { success: false, error };
  }
};

/**
 * Update creator wallet balance after earning
 */
export const updateCreatorWalletBalance = async (
  creatorId: string,
  nwtAmount: number,
  operation: "add" | "subtract" = "add"
) => {
  try {
    // Get creator profile
    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, creatorId));

    if (!creator) {
      return { success: false, error: "Creator profile not found" };
    }

    const currentBalance = creator.walletBalance || 0;
    const changeAmount = operation === "add" ? nwtAmount : -nwtAmount;
    const newBalance = currentBalance + changeAmount;

    // Prevent negative balance
    if (newBalance < 0) {
      return { success: false, error: "Insufficient balance" };
    }

    // Update creator wallet balance
    await db
      .update(creatorProfile)
      .set({
        walletBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(creatorProfile.id, creatorId));

    return { success: true, newBalance };
  } catch (error) {
    console.error("Error updating creator wallet balance:", error);
    return { success: false, error };
  }
};

/**
 * Process content purchase - creates user spend transaction and creator earning transaction
 */
export const processContentPurchase = async (
  readerId: string,
  userId: string,
  creatorId: string,
  contentId: string,
  nwtAmount: number,
  contentType: "chapter_unlock" | "comic_purchase",
  platformFeePercentage: number = 0.3
) => {
  try {
    // Start transaction
    return await db.transaction(async (tx) => {
      // 1. Check user balance
      const balanceCheck = await updateUserWalletBalance(
        readerId,
        nwtAmount,
        "subtract"
      );
      if (!balanceCheck.success) {
        throw new Error(balanceCheck.error as string);
      }

      // 2. Create user spend transaction
      const userTransaction = await createUserSpendTransaction(
        readerId,
        nwtAmount,
        contentType,
        contentId,
        creatorId,
        `Purchased ${contentType} for ${nwtAmount} NWT`
      );

      if (!userTransaction.success) {
        throw new Error("Failed to create user transaction");
      }

      // 3. Create creator earning transaction
      const creatorTransaction = await createCreatorEarningTransaction(
        creatorId,
        nwtAmount,
        platformFeePercentage,
        contentType === "chapter_unlock"
          ? "chapter_purchase"
          : "comic_purchase",
        contentId,
        readerId,
        userTransaction.transaction!.id
      );

      if (!creatorTransaction.success) {
        throw new Error("Failed to create creator transaction");
      }

      // 4. Update creator balance
      const creatorBalanceUpdate = await updateCreatorWalletBalance(
        creatorId,
        creatorTransaction.netAmount!,
        "add"
      );

      if (!creatorBalanceUpdate.success) {
        throw new Error("Failed to update creator balance");
      }

      try {
        await db.insert(paidChapters).values({
          readerId,
          chapterId: contentId,
        });
      } catch (error) {
        console.log("Failed to add to paid chapter", error);
        throw new Error("Failed to add to paid chapters");
      }

      return {
        success: true,
        userTransaction: userTransaction.transaction,
        creatorTransaction: creatorTransaction.transaction,
        userNewBalance: balanceCheck.newBalance,
        creatorNewBalance: creatorBalanceUpdate.newBalance,
      };
    });
  } catch (error) {
    console.error("Error processing content purchase:", error);
    return { success: false, error };
  }
};
