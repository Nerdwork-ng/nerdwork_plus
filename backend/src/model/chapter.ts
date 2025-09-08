import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { comics, comicStatusEnum } from "./comic";

// Enum for chapter type
export const chapterTypeEnum = pgEnum("chapter_type", ["free", "paid"]);

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  comicId: uuid("comic_id")
    .notNull()
    .references(() => comics.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  chapterNumber: integer("chapter_number").notNull(), // User can reorder
  summary: text("summary"),
  pages: text("pages").array().notNull().default([]), // Array of S3 URLs - user controls order
  pageCount: integer("page_count").notNull().default(0),
  chapterType: chapterTypeEnum("chapter_type").default("free").notNull(),
  price: integer("price").default(0).notNull(),
  chapterStatus: comicStatusEnum("chapter_status").default("draft"),
  isDraft: boolean("is_draft").notNull().default(true), // Starts as draft
  uniqueCode: varchar("unique_code", { length: 4 }).unique().notNull(),
  publishedAt: timestamp("published_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type InsertChapter = typeof chapters.$inferInsert;
export type SelectChapter = typeof chapters.$inferSelect;
