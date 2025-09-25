"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = void 0;
// db/schemas/events.ts
const pg_core_1 = require("drizzle-orm/pg-core");
exports.events = (0, pg_core_1.pgTable)("events", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    organizerId: (0, pg_core_1.uuid)("organizer_id").notNull(), // could link to a userProfileId
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, pg_core_1.varchar)("description", { length: 1000 }),
    location: (0, pg_core_1.varchar)("location", { length: 255 }),
    startTime: (0, pg_core_1.timestamp)("start_time", { withTimezone: true }).notNull(),
    endTime: (0, pg_core_1.timestamp)("end_time", { withTimezone: true }),
    capacity: (0, pg_core_1.integer)("capacity"), // optional, for max tickets
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
