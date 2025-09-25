"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comicSubscribers = exports.comics = exports.comicStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const profile_1 = require("./profile");
exports.comicStatusEnum = (0, pg_core_1.pgEnum)("comic_status_enum", [
    "published",
    "pending",
    "scheduled",
    "draft",
]);
exports.comics = (0, pg_core_1.pgTable)("comics", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    language: (0, pg_core_1.varchar)("language", { length: 50 }).notNull(),
    ageRating: (0, pg_core_1.varchar)("age_rating", { length: 10 }).notNull(),
    noOfChapters: (0, pg_core_1.integer)("no_of_chapters").notNull().default(0),
    noOfDrafts: (0, pg_core_1.integer)("no_of_drafts").notNull().default(0),
    description: (0, pg_core_1.text)("description").notNull(),
    image: (0, pg_core_1.text)("image_url").notNull(),
    comicStatus: (0, exports.comicStatusEnum)("comic_status").default("draft"),
    genre: (0, pg_core_1.text)("genre").array().notNull(),
    tags: (0, pg_core_1.text)("tags").array(),
    slug: (0, pg_core_1.varchar)("slug", { length: 300 }).notNull().unique(),
    creatorId: (0, pg_core_1.uuid)("creator_id")
        .notNull()
        .references(() => profile_1.creatorProfile.id, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: "date" }).notNull().defaultNow(),
});
exports.comicSubscribers = (0, pg_core_1.pgTable)("comic_subscribers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    readerId: (0, pg_core_1.uuid)("reader_id")
        .notNull()
        .references(() => profile_1.readerProfile.id, { onDelete: "cascade" }),
    comicId: (0, pg_core_1.uuid)("comic_id")
        .notNull()
        .references(() => exports.comics.id, { onDelete: "cascade" }),
    subscribedAt: (0, pg_core_1.timestamp)("subscribed_at").defaultNow().notNull(),
});
