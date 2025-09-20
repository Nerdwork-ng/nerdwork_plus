import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { readerProfile } from "./profile";
import { comics } from "./comic";

export const library = pgTable("library", {
  id: uuid("id").primaryKey().defaultRandom(),
  readerId: uuid("reader_id")
    .notNull()
    .references(() => readerProfile.id, { onDelete: "cascade" }),

  comicId: uuid("comic_id")
    .notNull()
    .references(() => comics.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
