import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { creatorProfile } from "./profile";

export const comicStatusEnum = pgEnum("comic_status_enum", [
  "published",
  "pending",
  "scheduled",
  "draft",
]);

export const comics = pgTable("comics", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  language: varchar("language", { length: 50 }).notNull(),
  ageRating: varchar("age_rating", { length: 10 }).notNull(),
  noOfChapters: integer("no_of_chapters").notNull().default(0),
  noOfDrafts: integer("no_of_drafts").notNull().default(0),
  description: text("description").notNull(),
  image: text("image_url").notNull(), // Cover image from S3
  comicStatus: comicStatusEnum("comic_status").default("draft"),
  genre: text("genre").array().notNull(),
  tags: text("tags").array(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  isDraft: boolean("is_draft").notNull().default(true), // Starts as draft
  publishedAt: timestamp("published_at", { mode: "date" }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => creatorProfile.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type InsertComic = typeof comics.$inferInsert;
export type SelectComic = typeof comics.$inferSelect;
