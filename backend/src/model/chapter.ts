import {
  pgTable,
  text,
  timestamp,
  integer,
  varchar,
  pgEnum,
  uuid,
  doublePrecision,
  unique,
} from "drizzle-orm/pg-core";
import { comics, comicStatusEnum } from "./comic"; // assuming you already have comics entity
import { readerProfile } from "./profile";

// Enum for chapter type
export const chapterTypeEnum = pgEnum("chapter_type", ["free", "paid"]);

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  chapterType: chapterTypeEnum("chapter_type").default("free").notNull(),
  price: doublePrecision("price").default(0).notNull(),
  summary: text("summary"),
  serialNo: integer("serial_no").notNull().default(0),
  pages: text("pages").array().notNull(),
  chapterStatus: comicStatusEnum("chapter_status").default("draft"),
  comicId: uuid("comic_id")
    .notNull()
    .references(() => comics.id, { onDelete: "cascade" }),
  uniqueCode: varchar("unique_code", { length: 4 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paidChapters = pgTable("paid_Chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  readerId: uuid("reader_id")
    .notNull()
    .references(() => readerProfile.id, { onDelete: "cascade" }),

  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
  paidAt: timestamp("paid_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const chapterViews = pgTable("chapter_views", {
  id: uuid("id").primaryKey().defaultRandom(),

  readerId: uuid("reader_id")
    .notNull()
    .references(() => readerProfile.id, { onDelete: "cascade" }),

  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),

  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const chapterLikes = pgTable("chapter_likes", {
  id: uuid("id").primaryKey().defaultRandom(),

  readerId: uuid("reader_id")
    .notNull()
    .references(() => readerProfile.id, { onDelete: "cascade" }),

  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),

  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});
