"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserWalletBalance = exports.getUserProfile = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const profile_1 = require("../model/profile");
/**
 * Service to handle user-related operations across different profile types
 */
/**
 * Get user profile information including wallet balance
 */
const getUserProfile = async (authUserId) => {
    try {
        // First check if user is a creator
        const [creator] = await db_1.db
            .select()
            .from(profile_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.userId, authUserId));
        if (creator) {
            return {
                success: true,
                profileType: 'creator',
                profile: creator,
                walletBalance: creator.walletBalance || 0
            };
        }
        // Check if user is a reader
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, authUserId));
        if (reader) {
            return {
                success: true,
                profileType: 'reader',
                profile: reader,
                walletBalance: reader.walletBalance || 0
            };
        }
        return {
            success: false,
            error: 'No profile found for user'
        };
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        return {
            success: false,
            error
        };
    }
};
exports.getUserProfile = getUserProfile;
/**
 * Update user wallet balance
 */
const updateUserWalletBalance = async (authUserId, nwtAmount, operation = "add") => {
    try {
        const userProfile = await (0, exports.getUserProfile)(authUserId);
        console.log(userProfile);
        if (!userProfile.success) {
            return { success: false, error: "User profile not found" };
        }
        const currentBalance = userProfile.walletBalance;
        const changeAmount = operation === "add" ? nwtAmount : -nwtAmount;
        const newBalance = currentBalance + changeAmount;
        // Prevent negative balance for spending
        if (operation === "subtract" && newBalance < 0) {
            return { success: false, error: "Insufficient balance" };
        }
        // Update the appropriate profile table
        if (userProfile.profileType === 'creator') {
            await db_1.db
                .update(profile_1.creatorProfile)
                .set({
                walletBalance: newBalance,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.userId, authUserId));
        }
        else {
            await db_1.db
                .update(profile_1.readerProfile)
                .set({
                walletBalance: newBalance,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, authUserId));
        }
        return { success: true, newBalance };
    }
    catch (error) {
        console.error("Error updating user wallet balance:", error);
        return { success: false, error };
    }
};
exports.updateUserWalletBalance = updateUserWalletBalance;
