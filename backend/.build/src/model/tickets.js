"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickets = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const profile_1 = require("./profile");
exports.tickets = (0, pg_core_1.pgTable)("tickets", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userProfileId: (0, pg_core_1.uuid)("user_profile_id")
        .notNull()
        .references(() => profile_1.userProfiles.id, { onDelete: "cascade" }),
    eventId: (0, pg_core_1.uuid)("event_id").notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull().default(1),
    status: (0, pg_core_1.text)("status").notNull().default("issued"), // 'issued' | 'cancelled' | 'used'
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: "date" }).notNull().defaultNow(),
});
