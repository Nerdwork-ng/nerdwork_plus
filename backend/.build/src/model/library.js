"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.library = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const profile_1 = require("./profile");
const comic_1 = require("./comic");
exports.library = (0, pg_core_1.pgTable)("library", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    readerId: (0, pg_core_1.uuid)("reader_id")
        .notNull()
        .references(() => profile_1.readerProfile.id, { onDelete: "cascade" }),
    comicId: (0, pg_core_1.uuid)("comic_id")
        .notNull()
        .references(() => comic_1.comics.id, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: "date" }).notNull().defaultNow(),
});
