"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLibrary = exports.removeFromLibrary = exports.addToLibrary = exports.getUserJwtFromToken = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const library_1 = require("../model/library");
const profile_1 = require("../model/profile");
const comic_1 = require("../model/comic");
const file_controller_1 = require("./file.controller");
const getUserJwtFromToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized");
    }
    const token = authHeader.split(" ")[1];
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
};
exports.getUserJwtFromToken = getUserJwtFromToken;
// Add a comic to library
const addToLibrary = async (req, res) => {
    try {
        const userId = (0, exports.getUserJwtFromToken)(req);
        const { comicId } = req.body;
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        if (!reader)
            return res.status(404).json({ message: "reader not found" });
        await db_1.db.insert(library_1.library).values({
            readerId: reader.id,
            comicId,
        });
        return res.status(201).json({
            success: true,
            message: "Comic added to library",
        });
    }
    catch (err) {
        console.error("AddToLibrary Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.addToLibrary = addToLibrary;
// Remove a comic from library
const removeFromLibrary = async (req, res) => {
    try {
        const userId = (0, exports.getUserJwtFromToken)(req);
        const { comicId } = req.params;
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        const readerId = reader.id;
        await db_1.db
            .delete(library_1.library)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(library_1.library.readerId, readerId), (0, drizzle_orm_1.eq)(library_1.library.comicId, comicId)));
        return res.json({ success: true, message: "Comic removed from library" });
    }
    catch (err) {
        console.error("RemoveFromLibrary Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.removeFromLibrary = removeFromLibrary;
// Get all comics in user's library
const getLibrary = async (req, res) => {
    try {
        const userId = (0, exports.getUserJwtFromToken)(req);
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        const readerId = reader.id;
        const results = await db_1.db
            .select({
            comicId: library_1.library.comicId,
            title: comic_1.comics.title,
            slug: comic_1.comics.slug,
            coverImage: comic_1.comics.image,
            noOfChapters: comic_1.comics.noOfChapters,
        })
            .from(library_1.library)
            .leftJoin(comic_1.comics, (0, drizzle_orm_1.eq)(library_1.library.comicId, comic_1.comics.id))
            .where((0, drizzle_orm_1.eq)(library_1.library.readerId, readerId));
        const data = results.map((chapter) => ({
            id: chapter.comicId,
            title: chapter.title,
            noOfChapters: chapter.noOfChapters,
            image: (0, file_controller_1.generateFileUrl)(chapter.coverImage),
            slug: chapter.slug,
        }));
        return res.json({ success: true, comics: data });
    }
    catch (err) {
        console.error("GetLibrary Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getLibrary = getLibrary;
