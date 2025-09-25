"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processContentPurchase = exports.updateCreatorWalletBalance = exports.createCreatorEarningTransaction = exports.updateUserWalletBalance = exports.createUserSpendTransaction = exports.updateUserTransactionStatus = exports.createUserPurchaseTransaction = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const userTransaction_1 = require("../model/userTransaction");
const creatorTransaction_1 = require("../model/creatorTransaction");
const schema_1 = require("../model/schema");
// ===============================
// USER TRANSACTION FUNCTIONS
// ===============================
/**
 * Create a new user transaction for NWT purchase
 */
const createUserPurchaseTransaction = async (userId, nwtAmount, usdAmount, helioPaymentId, description) => {
    try {
        // First get the reader profile ID from user ID
        const [reader] = await db_1.db
            .select()
            .from(schema_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(schema_1.readerProfile.userId, userId));
        if (!reader) {
            throw new Error("Reader profile not found");
        }
        const [transaction] = await db_1.db
            .insert(userTransaction_1.userTransactions)
            .values({
            userId: reader.id, // Use reader.id, not userId
            transactionType: "purchase",
            status: "pending",
            nwtAmount: nwtAmount.toString(),
            usdAmount: usdAmount.toString(),
            description: description || `Purchase ${nwtAmount} NWT for $${usdAmount}`,
            helioPaymentId,
        })
            .returning();
        console.log("Created user purchase transaction:", transaction);
        return { success: true, transaction };
    }
    catch (error) {
        console.error("Error creating user purchase transaction:", error);
        return { success: false, error };
    }
};
exports.createUserPurchaseTransaction = createUserPurchaseTransaction;
/**
 * Update user transaction status (for webhook confirmations)
 */
const updateUserTransactionStatus = async (helioPaymentId, status, blockchainTxHash, metadata, failureReason) => {
    try {
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        if (blockchainTxHash)
            updateData.blockchainTxHash = blockchainTxHash;
        if (metadata)
            updateData.metadata = metadata;
        if (failureReason)
            updateData.failureReason = failureReason;
        const [updatedTransaction] = await db_1.db
            .update(userTransaction_1.userTransactions)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(userTransaction_1.userTransactions.helioPaymentId, helioPaymentId))
            .returning();
        console.log("Updated user transaction:", updatedTransaction);
        return { success: true, transaction: updatedTransaction };
    }
    catch (error) {
        console.error("Error updating user transaction status:", error);
        return { success: false, error };
    }
};
exports.updateUserTransactionStatus = updateUserTransactionStatus;
/**
 * Create a spending transaction when user buys content
 */
const createUserSpendTransaction = async (userId, nwtAmount, spendCategory, contentId, creatorId, description) => {
    try {
        const [transaction] = await db_1.db
            .insert(userTransaction_1.userTransactions)
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
    }
    catch (error) {
        console.error("Error creating user spend transaction:", error);
        return { success: false, error };
    }
};
exports.createUserSpendTransaction = createUserSpendTransaction;
/**
 * Update user wallet balance after successful purchase
 */
const updateUserWalletBalance = async (userId, nwtAmount, operation = "add") => {
    try {
        // Get user profile with wallet
        const [reader] = await db_1.db
            .select()
            .from(schema_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(schema_1.readerProfile.id, userId));
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
        await db_1.db
            .update(schema_1.readerProfile)
            .set({
            walletBalance: newBalance,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.readerProfile.id, userId));
        return { success: true, newBalance };
    }
    catch (error) {
        console.error("Error updating user wallet balance:", error);
        return { success: false, error };
    }
};
exports.updateUserWalletBalance = updateUserWalletBalance;
// ===============================
// CREATOR TRANSACTION FUNCTIONS
// ===============================
/**
 * Create creator earning transaction when user purchases their content
 */
const createCreatorEarningTransaction = async (creatorId, grossAmount, // What user paid
platformFeePercentage = 0.3, // 30% platform fee
earningSource, contentId, purchaserUserId, sourceUserTransactionId) => {
    try {
        const platformFee = grossAmount * platformFeePercentage;
        const netAmount = grossAmount - platformFee;
        const [transaction] = await db_1.db
            .insert(creatorTransaction_1.creatorTransactions)
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
    }
    catch (error) {
        console.error("Error creating creator earning transaction:", error);
        return { success: false, error };
    }
};
exports.createCreatorEarningTransaction = createCreatorEarningTransaction;
/**
 * Update creator wallet balance after earning
 */
const updateCreatorWalletBalance = async (creatorId, nwtAmount, operation = "add") => {
    try {
        // Get creator profile
        const [creator] = await db_1.db
            .select()
            .from(schema_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(schema_1.creatorProfile.id, creatorId));
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
        await db_1.db
            .update(schema_1.creatorProfile)
            .set({
            walletBalance: newBalance,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.creatorProfile.id, creatorId));
        return { success: true, newBalance };
    }
    catch (error) {
        console.error("Error updating creator wallet balance:", error);
        return { success: false, error };
    }
};
exports.updateCreatorWalletBalance = updateCreatorWalletBalance;
/**
 * Process content purchase - creates user spend transaction and creator earning transaction
 */
const processContentPurchase = async (readerId, userId, creatorId, contentId, nwtAmount, contentType, platformFeePercentage = 0.3) => {
    try {
        // Start transaction
        return await db_1.db.transaction(async (tx) => {
            // 1. Check user balance
            const balanceCheck = await (0, exports.updateUserWalletBalance)(readerId, nwtAmount, "subtract");
            if (!balanceCheck.success) {
                throw new Error(balanceCheck.error);
            }
            // 2. Create user spend transaction
            const userTransaction = await (0, exports.createUserSpendTransaction)(readerId, nwtAmount, contentType, contentId, creatorId, `Purchased ${contentType} for ${nwtAmount} NWT`);
            if (!userTransaction.success) {
                throw new Error("Failed to create user transaction");
            }
            // 3. Create creator earning transaction
            const creatorTransaction = await (0, exports.createCreatorEarningTransaction)(creatorId, nwtAmount, platformFeePercentage, contentType === "chapter_unlock"
                ? "chapter_purchase"
                : "comic_purchase", contentId, readerId, userTransaction.transaction.id);
            if (!creatorTransaction.success) {
                throw new Error("Failed to create creator transaction");
            }
            // 4. Update creator balance
            const creatorBalanceUpdate = await (0, exports.updateCreatorWalletBalance)(creatorId, creatorTransaction.netAmount, "add");
            if (!creatorBalanceUpdate.success) {
                throw new Error("Failed to update creator balance");
            }
            try {
                await db_1.db.insert(schema_1.paidChapters).values({
                    readerId,
                    chapterId: contentId,
                });
            }
            catch (error) {
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
    }
    catch (error) {
        console.error("Error processing content purchase:", error);
        return { success: false, error };
    }
};
exports.processContentPurchase = processContentPurchase;
