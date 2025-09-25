"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyPoints = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const auth_1 = require("./auth");
exports.loyaltyPoints = (0, pg_core_1.pgTable)("loyalty_points", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => auth_1.authUsers.id), // assuming authUsers table
    points: (0, pg_core_1.integer)("points").notNull().default(0),
    lastUpdated: (0, pg_core_1.timestamp)("last_updated").notNull().defaultNow(),
});
