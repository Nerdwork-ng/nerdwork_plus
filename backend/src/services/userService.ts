import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { authUsers } from "../model/auth";
import { creatorProfile, readerProfile } from "../model/profile";

/**
 * Service to handle user-related operations across different profile types
 */

/**
 * Get user profile information including wallet balance
 */
export const getUserProfile = async (authUserId: string) => {
  try {
    // First check if user is a creator
    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, authUserId));

    if (creator) {
      return {
        success: true,
        profileType: 'creator' as const,
        profile: creator,
        walletBalance: creator.walletBalance || 0
      };
    }

    // Check if user is a reader
    const [reader] = await db
      .select()
      .from(readerProfile)
      .where(eq(readerProfile.userId, authUserId));

    if (reader) {
      return {
        success: true,
        profileType: 'reader' as const,
        profile: reader,
        walletBalance: reader.walletBalance || 0
      };
    }

    return {
      success: false,
      error: 'No profile found for user'
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      success: false,
      error
    };
  }
};

/**
 * Update user wallet balance
 */
export const updateUserWalletBalance = async (
  authUserId: string,
  nwtAmount: number,
  operation: "add" | "subtract" = "add"
) => {
  try {
    const userProfile = await getUserProfile(authUserId);
    console.log(userProfile)
    
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
      await db
        .update(creatorProfile)
        .set({ 
          walletBalance: newBalance,
          updatedAt: new Date()
        })
        .where(eq(creatorProfile.userId, authUserId));
    } else {
      await db
        .update(readerProfile)
        .set({ 
          walletBalance: newBalance,
          updatedAt: new Date()
        })
        .where(eq(readerProfile.userId, authUserId));
    }

    return { success: true, newBalance };
  } catch (error) {
    console.error("Error updating user wallet balance:", error);
    return { success: false, error };
  }
};