import {
  pgTable,
  text,
  timestamp,
  integer,
  varchar,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { comics, comicStatusEnum } from "./comic"; // assuming you already have comics entity

// Enum for chapter type
export const chapterTypeEnum = pgEnum("chapter_type", ["free", "paid"]);

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  chapterType: chapterTypeEnum("chapter_type").default("free").notNull(),
  price: integer("price").default(0).notNull(),
  summary: text("summary"),
  pages: text("pages").array().notNull(),
  chapterStatus: comicStatusEnum("chapter_status").default("draft"),
  comicId: uuid("comic_id")
    .notNull()
    .references(() => comics.id, { onDelete: "cascade" }),
  uniqueCode: varchar("unique_code", { length: 4 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
