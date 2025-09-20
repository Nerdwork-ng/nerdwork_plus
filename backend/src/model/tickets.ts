import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { userProfiles } from "./profile";

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfileId: uuid("user_profile_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("issued"), // 'issued' | 'cancelled' | 'used'
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
