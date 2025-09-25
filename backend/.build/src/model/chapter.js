"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterLikes = exports.chapterViews = exports.paidChapters = exports.chapters = exports.chapterTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const comic_1 = require("./comic"); // assuming you already have comics entity
const profile_1 = require("./profile");
// Enum for chapter type
exports.chapterTypeEnum = (0, pg_core_1.pgEnum)("chapter_type", ["free", "paid"]);
exports.chapters = (0, pg_core_1.pgTable)("chapters", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    chapterType: (0, exports.chapterTypeEnum)("chapter_type").default("free").notNull(),
    price: (0, pg_core_1.doublePrecision)("price").default(0).notNull(),
    summary: (0, pg_core_1.text)("summary"),
    serialNo: (0, pg_core_1.integer)("serial_no").notNull().default(0),
    pages: (0, pg_core_1.text)("pages").array().notNull(),
    chapterStatus: (0, comic_1.comicStatusEnum)("chapter_status").default("draft"),
    comicId: (0, pg_core_1.uuid)("comic_id")
        .notNull()
        .references(() => comic_1.comics.id, { onDelete: "cascade" }),
    uniqueCode: (0, pg_core_1.varchar)("unique_code", { length: 4 }).unique().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.paidChapters = (0, pg_core_1.pgTable)("paid_Chapters", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    readerId: (0, pg_core_1.uuid)("reader_id")
        .notNull()
        .references(() => profile_1.readerProfile.id, { onDelete: "cascade" }),
    chapterId: (0, pg_core_1.uuid)("chapter_id")
        .notNull()
        .references(() => exports.chapters.id, { onDelete: "cascade" }),
    paidAt: (0, pg_core_1.timestamp)("paid_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: "date" }).notNull().defaultNow(),
});
exports.chapterViews = (0, pg_core_1.pgTable)("chapter_views", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    readerId: (0, pg_core_1.uuid)("reader_id")
        .notNull()
        .references(() => profile_1.readerProfile.id, { onDelete: "cascade" }),
    chapterId: (0, pg_core_1.uuid)("chapter_id")
        .notNull()
        .references(() => exports.chapters.id, { onDelete: "cascade" }),
    viewedAt: (0, pg_core_1.timestamp)("viewed_at").defaultNow().notNull(),
});
exports.chapterLikes = (0, pg_core_1.pgTable)("chapter_likes", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    readerId: (0, pg_core_1.uuid)("reader_id")
        .notNull()
        .references(() => profile_1.readerProfile.id, { onDelete: "cascade" }),
    chapterId: (0, pg_core_1.uuid)("chapter_id")
        .notNull()
        .references(() => exports.chapters.id, { onDelete: "cascade" }),
    viewedAt: (0, pg_core_1.timestamp)("viewed_at").defaultNow().notNull(),
});
