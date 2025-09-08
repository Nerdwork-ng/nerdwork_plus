import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../config/db";
import { userTransactions } from "../model/userTransaction";
import { creatorTransactions } from "../model/creatorTransaction";
import { creatorProfile } from "../model/profile";
import { updateUserWalletBalance as updateWalletBalance, getUserProfile } from "../services/userService";
import { chapters } from "../model/chapter";
import { comics } from "../model/comic";
import jwt from "jsonwebtoken";

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
    const [transaction] = await db
      .insert(userTransactions)
      .values({
        userId,
        transactionType: "purchase",
        status: "pending",
        nwtAmount: nwtAmount.toString(),
        usdAmount: usdAmount.toString(),
        description: description || `Purchase ${nwtAmount} NWT for $${usdAmount}`,
        helioPaymentId,
      })
      .returning();

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
  spendCategory: "chapter_unlock" | "comic_purchase" | "tip_creator" | "subscription",
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
        description: description || `Spent ${nwtAmount} NWT on ${spendCategory}`,
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
 * Using the userService to handle different profile types
 */
export const updateUserWalletBalance = updateWalletBalance;

// ===============================
// CREATOR TRANSACTION FUNCTIONS
// ===============================

/**
 * Create creator earning transaction when user purchases their content
 */
export const createCreatorEarningTransaction = async (
  creatorId: string,
  grossAmount: number, // What user paid
  platformFeePercentage: number = 0.30, // 30% platform fee
  earningSource: "chapter_purchase" | "comic_purchase" | "tip_received" | "subscription_revenue",
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

    const currentBalance = parseFloat(creator.walletBalance || "0");
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
        walletBalance: newBalance.toString(),
        updatedAt: new Date()
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
  userId: string,
  creatorId: string,
  contentId: string,
  nwtAmount: number,
  contentType: "chapter_unlock" | "comic_purchase",
  platformFeePercentage: number = 0.30
) => {
  try {
    // Start transaction
    return await db.transaction(async (tx) => {
      // 1. Check user balance
      const balanceCheck = await updateUserWalletBalance(userId, nwtAmount, "subtract");
      if (!balanceCheck.success) {
        throw new Error(balanceCheck.error as string);
      }

      // 2. Create user spend transaction
      const userTransaction = await createUserSpendTransaction(
        userId,
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
        contentType === "chapter_unlock" ? "chapter_purchase" : "comic_purchase",
        contentId,
        userId,
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

// ===============================
// TRANSACTION HISTORY FUNCTIONS
// ===============================

/**
 * Get all user transactions with pagination and filtering
 */
export const getUserTransactionHistory = async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const { 
      page = 1, 
      limit = 10, 
      transactionType, 
      status,
      startDate,
      endDate
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query conditions
    let conditions = [eq(userTransactions.userId, userId)];
    
    if (transactionType) {
      conditions.push(eq(userTransactions.transactionType, transactionType));
    }
    
    if (status) {
      conditions.push(eq(userTransactions.status, status));
    }

    // Get transactions with conditions
    const transactions = await db
      .select()
      .from(userTransactions)
      .where(and(...conditions))
      .orderBy(desc(userTransactions.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Get total count for pagination
    const totalQuery = await db
      .select({ count: sql`count(*)` })
      .from(userTransactions)
      .where(and(...conditions));
    
    const total = totalQuery[0]?.count || 0;
    const totalPages = Math.ceil(Number(total) / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTransactions: Number(total),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error: any) {
    console.error("Error fetching user transaction history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history",
      error: error.message
    });
  }
};

/**
 * Get single transaction by ID
 */
export const getUserTransactionById = async (req: any, res: any) => {
  try {
    const { transactionId } = req.params;
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    // Get transaction and ensure it belongs to the user
    const [transaction] = await db
      .select()
      .from(userTransactions)
      .where(and(
        eq(userTransactions.id, transactionId),
        eq(userTransactions.userId, userId)
      ));

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    // If it's a spend transaction, get additional details about the content
    let contentDetails = null;
    if (transaction.transactionType === "spend" && transaction.contentId) {
      try {
        // Check if it's a chapter or comic purchase
        if (transaction.spendCategory === "chapter_unlock") {
          const [chapter] = await db
            .select({
              id: chapters.id,
              title: chapters.title,
              chapterNumber: chapters.chapterNumber,
              comicId: chapters.comicId
            })
            .from(chapters)
            .where(eq(chapters.id, transaction.contentId));
          
          if (chapter) {
            const [comic] = await db
              .select({
                id: comics.id,
                title: comics.title,
                slug: comics.slug
              })
              .from(comics)
              .where(eq(comics.id, chapter.comicId));
            
            contentDetails = {
              type: "chapter",
              chapter,
              comic
            };
          }
        } else if (transaction.spendCategory === "comic_purchase") {
          const [comic] = await db
            .select({
              id: comics.id,
              title: comics.title,
              slug: comics.slug
            })
            .from(comics)
            .where(eq(comics.id, transaction.contentId));
          
          if (comic) {
            contentDetails = {
              type: "comic",
              comic
            };
          }
        }
      } catch (err) {
        console.warn("Could not fetch content details for transaction:", err);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        transaction,
        contentDetails
      }
    });

  } catch (error: any) {
    console.error("Error fetching transaction by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
      error: error.message
    });
  }
};

/**
 * Get user wallet balance and summary statistics
 */
export const getUserWalletSummary = async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    // Get user profile with wallet balance
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile.success) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    // Get transaction statistics
    const stats = await db
      .select({
        transactionType: userTransactions.transactionType,
        status: userTransactions.status,
        totalAmount: sql`SUM(CAST(${userTransactions.nwtAmount} AS DECIMAL))`,
        count: sql`COUNT(*)`
      })
      .from(userTransactions)
      .where(eq(userTransactions.userId, userId))
      .groupBy(userTransactions.transactionType, userTransactions.status);

    // Calculate summary statistics
    let totalPurchased = 0;
    let totalSpent = 0;
    let pendingPurchases = 0;
    let completedTransactions = 0;

    stats.forEach(stat => {
      const amount = parseFloat(stat.totalAmount?.toString() || '0');
      const count = parseInt(stat.count?.toString() || '0');
      
      if (stat.transactionType === 'purchase') {
        if (stat.status === 'completed') {
          totalPurchased += amount;
        } else if (stat.status === 'pending') {
          pendingPurchases += amount;
        }
      } else if (stat.transactionType === 'spend' && stat.status === 'completed') {
        totalSpent += amount;
      }
      
      if (stat.status === 'completed') {
        completedTransactions += count;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        walletBalance: userProfile.walletBalance,
        profileType: userProfile.profileType,
        summary: {
          totalPurchased: Number(totalPurchased.toFixed(2)),
          totalSpent: Number(totalSpent.toFixed(2)),
          pendingPurchases: Number(pendingPurchases.toFixed(2)),
          completedTransactions,
          netBalance: Number((totalPurchased - totalSpent).toFixed(2))
        },
        statistics: stats
      }
    });

  } catch (error: any) {
    console.error("Error fetching wallet summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet summary",
      error: error.message
    });
  }
};