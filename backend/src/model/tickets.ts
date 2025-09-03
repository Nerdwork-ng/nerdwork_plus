import { pgTable, uuid, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { events } from "./event";
import { userProfiles } from "./profile";

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfileId: uuid("user_profile_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("issued"), // 'issued' | 'cancelled' | 'used'
  paymentMethod: text("payment_method").notNull(),
  amount: numeric("amount").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
