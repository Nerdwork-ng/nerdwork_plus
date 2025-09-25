"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLoyaltyPoints = addLoyaltyPoints;
exports.getLoyaltyPoints = getLoyaltyPoints;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../model/schema");
async function addLoyaltyPoints(userId, purchaseAmount) {
    // Example: earn 10 points per purchase, or you can use amount-based logic
    const pointsToAdd = Math.floor(purchaseAmount * 0.1); // 🎉 10% cashback as points
    const existing = await db_1.db
        .select()
        .from(schema_1.loyaltyPoints)
        .where((0, drizzle_orm_1.eq)(schema_1.loyaltyPoints.userId, userId))
        .limit(1);
    if (existing.length > 0) {
        await db_1.db
            .update(schema_1.loyaltyPoints)
            .set({
            points: existing[0].points + pointsToAdd,
            lastUpdated: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.loyaltyPoints.userId, userId));
    }
    else {
        await db_1.db.insert(schema_1.loyaltyPoints).values({
            userId,
            points: pointsToAdd,
        });
    }
}
async function getLoyaltyPoints(userId) {
    const record = await db_1.db
        .select()
        .from(schema_1.loyaltyPoints)
        .where((0, drizzle_orm_1.eq)(schema_1.loyaltyPoints.userId, userId))
        .limit(1);
    return record.length > 0 ? record[0].points : 0;
}
