"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.events = (0, pg_core_1.pgTable)("events", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    date: (0, pg_core_1.timestamp)("date").notNull(),
    ticketPrice: (0, pg_core_1.numeric)("ticket_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
