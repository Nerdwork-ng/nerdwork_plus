"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleChapterLike = exports.addChapterView = exports.fetchAllPaidChapters = exports.buyChapter = exports.deleteChapter = exports.fetchChapterPagesById = exports.publishDraft = exports.fetchChapterByUniqueCode = exports.fetchChaptersByComicSlugForCreators = exports.fetchChaptersByComicSlugForReaders = exports.createDraft = exports.createChapter = void 0;
exports.getChapterLikes = getChapterLikes;
exports.getChapterViews = getChapterViews;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const chapter_1 = require("../model/chapter");
const comic_1 = require("../model/comic");
const profile_1 = require("../model/profile");
const transaction_controller_1 = require("./transaction.controller");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const file_controller_1 = require("./file.controller");
const library_controller_1 = require("./library.controller");
// helper function to strip URL
function extractFilePath(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.pathname.startsWith("/")
            ? urlObj.pathname.slice(1)
            : urlObj.pathname;
    }
    catch (err) {
        // fallback in case url is not a valid URL
        return url;
    }
}
async function getChapterLikes(chapterId, readerId) {
    // Count likes
    const [{ likesCount }] = await db_1.db
        .select({ likesCount: (0, drizzle_orm_1.sql) `COUNT(${chapter_1.chapterLikes.id})` })
        .from(chapter_1.chapterLikes)
        .where((0, drizzle_orm_1.eq)(chapter_1.chapterLikes.chapterId, chapterId));
    let hasLiked = false;
    if (readerId) {
        const [existingLike] = await db_1.db
            .select()
            .from(chapter_1.chapterLikes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(chapter_1.chapterLikes.chapterId, chapterId), (0, drizzle_orm_1.eq)(chapter_1.chapterLikes.readerId, readerId)));
        hasLiked = !!existingLike;
    }
    return {
        likesCount: Number(likesCount) || 0,
        hasLiked,
    };
}
async function getChapterViews(chapterId) {
    // Count likes
    const [{ viewsCount }] = await db_1.db
        .select({ viewsCount: (0, drizzle_orm_1.sql) `COUNT(${chapter_1.chapterViews.id})` })
        .from(chapter_1.chapterViews)
        .where((0, drizzle_orm_1.eq)(chapter_1.chapterViews.chapterId, chapterId));
    return {
        viewsCount: Number(viewsCount) || 0,
    };
}
const createChapter = async (req, res) => {
    try {
        const { title, chapterType, price, summary, pages, comicId } = req.body;
        const finalPrice = chapterType === "free" ? 0 : price;
        const uniqueCode = Math.floor(1000 + Math.random() * 9000).toString();
        // clean up the pages array
        const cleanedPages = Array.isArray(pages)
            ? pages.map((p) => extractFilePath(p))
            : [];
        const [lastChapter] = await db_1.db
            .select({ maxSerial: (0, drizzle_orm_1.sql) `MAX(${chapter_1.chapters.serialNo})` })
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(chapter_1.chapters.comicId, comicId), (0, drizzle_orm_1.eq)(chapter_1.chapters.chapterStatus, "published")));
        const nextSerial = (lastChapter?.maxSerial || 0) + 1;
        const [newChapter] = await db_1.db
            .insert(chapter_1.chapters)
            .values({
            title,
            chapterType,
            price: finalPrice,
            summary,
            chapterStatus: "published",
            pages: cleanedPages,
            serialNo: nextSerial,
            comicId,
            uniqueCode,
        })
            .returning();
        await db_1.db
            .update(comic_1.comics)
            .set({
            noOfChapters: (0, drizzle_orm_1.sql) `${comic_1.comics.noOfChapters} + 1`,
            comicStatus: "published",
        })
            .where((0, drizzle_orm_1.eq)(comic_1.comics.id, comicId));
        return res.status(201).json({
            success: true,
            message: "Chapter created successfully",
            data: newChapter,
        });
    }
    catch (err) {
        console.error("Create Chapter Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.createChapter = createChapter;
const createDraft = async (req, res) => {
    try {
        const { title, chapterType, price, summary, pages, comicId } = req.body;
        const finalPrice = chapterType === "free" ? 0 : price;
        const uniqueCode = Math.floor(1000 + Math.random() * 9000).toString();
        // clean up the pages array
        const cleanedPages = Array.isArray(pages)
            ? pages.map((p) => extractFilePath(p))
            : [];
        const [newChapter] = await db_1.db
            .insert(chapter_1.chapters)
            .values({
            title,
            chapterType,
            price: finalPrice,
            summary,
            pages: cleanedPages,
            comicId,
            chapterStatus: "draft",
            uniqueCode,
        })
            .returning();
        await db_1.db
            .update(comic_1.comics)
            .set({ noOfDrafts: (0, drizzle_orm_1.sql) `${comic_1.comics.noOfDrafts} + 1` })
            .where((0, drizzle_orm_1.eq)(comic_1.comics.id, comicId));
        return res.status(201).json({
            success: true,
            message: "Draft created successfully",
            data: newChapter,
        });
    }
    catch (err) {
        console.error("Create Draft Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.createDraft = createDraft;
const fetchChaptersByComicSlugForReaders = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const [comic] = await db_1.db.select().from(comic_1.comics).where((0, drizzle_orm_1.eq)(comic_1.comics.slug, slug));
        if (!comic) {
            return res
                .status(404)
                .json({ success: false, message: "Comic not found" });
        }
        const [creator] = await db_1.db
            .select()
            .from(profile_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.id, comic.creatorId));
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        const allChapters = await db_1.db
            .select()
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(chapter_1.chapters.comicId, comic.id), (0, drizzle_orm_1.eq)(chapter_1.chapters.chapterStatus, "published")));
        // If logged in, fetch viewed chapters
        // let userViews = new Set();
        // if (readerId) {
        //   const userViewRows = await db
        //     .select({ chapterId: chapterViews.chapterId })
        //     .from(chapterViews)
        //     .where(eq(chapterViews.readerId, readerId));
        //   userViews = new Set(userViewRows.map((row) => row.chapterId));
        // }
        const paid = await db_1.db
            .select({ chapterId: chapter_1.paidChapters.chapterId })
            .from(chapter_1.paidChapters)
            .where((0, drizzle_orm_1.eq)(chapter_1.paidChapters.readerId, reader.id));
        const paidChapterIds = new Set(paid.map((p) => p.chapterId));
        const data = await Promise.all(allChapters.map(async (chapter) => {
            const { likesCount, hasLiked } = await getChapterLikes(chapter.id, reader?.id);
            const { viewsCount } = await getChapterViews(chapter.id);
            return {
                id: chapter.id,
                title: chapter.title,
                chapterType: chapter.chapterType,
                chapterStatus: chapter.chapterStatus,
                price: chapter.price,
                summary: chapter.summary,
                pages: (0, file_controller_1.mapFilesToUrls)(chapter.pages),
                serialNo: chapter.serialNo,
                uniqueCode: chapter.uniqueCode,
                createdAt: chapter.createdAt,
                updatedAt: chapter.updatedAt,
                creatorName: creator.creatorName,
                comicSlug: comic.slug,
                comicTitle: comic.title,
                hasPaid: paidChapterIds.has(chapter.id),
                // hasViewed: userViews.has(chapter.id),
                likesCount,
                viewsCount,
                hasLiked,
            };
        }));
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (err) {
        console.error("Fetch Chapters Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.fetchChaptersByComicSlugForReaders = fetchChaptersByComicSlugForReaders;
const fetchChaptersByComicSlugForCreators = async (req, res) => {
    try {
        const { slug } = req.params;
        const [comic] = await db_1.db.select().from(comic_1.comics).where((0, drizzle_orm_1.eq)(comic_1.comics.slug, slug));
        if (!comic) {
            return res
                .status(404)
                .json({ success: false, message: "Comic not found" });
        }
        const allChapters = await db_1.db
            .select()
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.eq)(chapter_1.chapters.comicId, comic.id));
        const data = await Promise.all(allChapters.map(async (chapter) => {
            const { likesCount } = await getChapterLikes(chapter.id);
            const { viewsCount } = await getChapterViews(chapter.id);
            return {
                id: chapter.id,
                title: chapter.title,
                chapterType: chapter.chapterType,
                chapterStatus: chapter.chapterStatus,
                price: chapter.price,
                summary: chapter.summary,
                pages: (0, file_controller_1.mapFilesToUrls)(chapter.pages),
                serialNo: chapter.serialNo,
                uniqueCode: chapter.uniqueCode,
                createdAt: chapter.createdAt,
                updatedAt: chapter.updatedAt,
                comicSlug: comic.slug,
                comicTitle: comic.title,
                viewsCount,
                likesCount,
            };
        }));
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (err) {
        console.error("Fetch Chapters Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.fetchChaptersByComicSlugForCreators = fetchChaptersByComicSlugForCreators;
const fetchChapterByUniqueCode = async (req, res) => {
    try {
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const { code } = req.params;
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        const [chapter] = await db_1.db
            .select()
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.eq)(chapter_1.chapters.uniqueCode, code));
        if (!chapter) {
            return res
                .status(404)
                .json({ success: false, message: "Chapter not found" });
        }
        const [paid] = await db_1.db
            .select({ chapterId: chapter_1.paidChapters.chapterId })
            .from(chapter_1.paidChapters)
            .where((0, drizzle_orm_1.eq)(chapter_1.paidChapters.readerId, reader.id));
        const hasPaid = !!paid;
        const { likesCount } = await getChapterLikes(chapter.id);
        const { viewsCount } = await getChapterViews(chapter.id);
        const data = {
            id: chapter.id,
            title: chapter.title,
            chapterType: chapter.chapterType,
            chapterStatus: chapter.chapterStatus,
            price: chapter.price,
            summary: chapter.summary,
            pages: (0, file_controller_1.mapFilesToUrls)(chapter.pages),
            serialNo: chapter.serialNo,
            uniqueCode: chapter.uniqueCode,
            createdAt: chapter.createdAt,
            updatedAt: chapter.updatedAt,
            likesCount,
            viewsCount,
            hasPaid,
        };
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (err) {
        console.error("Fetch Chapter by Code Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.fetchChapterByUniqueCode = fetchChapterByUniqueCode;
const publishDraft = async (req, res) => {
    try {
        const { draftUniqCode, comicId } = req.body;
        const [chapter] = await db_1.db
            .select()
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(chapter_1.chapters.uniqueCode, draftUniqCode), (0, drizzle_orm_1.eq)(chapter_1.chapters.comicId, comicId), (0, drizzle_orm_1.eq)(chapter_1.chapters.chapterStatus, "draft")));
        if (!chapter) {
            return res
                .status(404)
                .json({ success: false, message: "Chapter not found" });
        }
        const [lastChapter] = await db_1.db
            .select({ maxSerial: (0, drizzle_orm_1.sql) `MAX(${chapter_1.chapters.serialNo})` })
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(chapter_1.chapters.comicId, comicId), (0, drizzle_orm_1.eq)(chapter_1.chapters.chapterStatus, "published")));
        const nextSerial = (lastChapter?.maxSerial || 0) + 1;
        const [updatedChapter] = await db_1.db
            .update(chapter_1.chapters)
            .set({
            chapterStatus: "published",
            serialNo: nextSerial,
        })
            .where((0, drizzle_orm_1.eq)(chapter_1.chapters.id, chapter.id))
            .returning();
        await db_1.db
            .update(comic_1.comics)
            .set({
            noOfChapters: (0, drizzle_orm_1.sql) `${comic_1.comics.noOfChapters} + 1`,
            noOfDrafts: (0, drizzle_orm_1.sql) `${comic_1.comics.noOfDrafts} - 1`,
            comicStatus: "published",
        })
            .where((0, drizzle_orm_1.eq)(comic_1.comics.id, comicId));
        return res.status(200).json({
            success: true,
            message: "Draft published successfully",
            data: updatedChapter,
        });
    }
    catch (err) {
        console.error("Publish Draft Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.publishDraft = publishDraft;
const fetchChapterPagesById = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const [chapter] = await db_1.db
            .select()
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.eq)(chapter_1.chapters.id, chapterId));
        if (!chapter) {
            return res
                .status(404)
                .json({ success: false, message: "Chapter not found" });
        }
        return res.status(200).json({
            success: true,
            data: (0, file_controller_1.mapFilesToUrls)(chapter.pages),
        });
    }
    catch (err) {
        console.error("Fetch Pages Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.fetchChapterPagesById = fetchChapterPagesById;
const deleteChapter = async (req, res) => {
    try {
        const { code } = req.params;
        const [chapter] = await db_1.db
            .select()
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.eq)(chapter_1.chapters.uniqueCode, code));
        if (!chapter) {
            return res.status(404).json({ message: "Chapter with code not found" });
        }
        const [comic] = await db_1.db
            .select()
            .from(comic_1.comics)
            .where((0, drizzle_orm_1.eq)(comic_1.comics.id, chapter.comicId));
        if (!comic) {
            return res.status(404).json({ message: "comic not found for chapter" });
        }
        await db_1.db.delete(chapter_1.chapters).where((0, drizzle_orm_1.eq)(chapter_1.chapters.uniqueCode, code));
        const publishedChapters = await db_1.db
            .select()
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(chapter_1.chapters.comicId, comic.id), (0, drizzle_orm_1.eq)(chapter_1.chapters.chapterStatus, "published")))
            .orderBy(chapter_1.chapters.serialNo);
        for (let i = 0; i < publishedChapters.length; i++) {
            await db_1.db
                .update(chapter_1.chapters)
                .set({ serialNo: i + 1 })
                .where((0, drizzle_orm_1.eq)(chapter_1.chapters.id, publishedChapters[i].id));
        }
        await db_1.db
            .update(comic_1.comics)
            .set({
            noOfChapters: (0, drizzle_orm_1.sql) `${comic_1.comics.noOfChapters} - 1`,
        })
            .where((0, drizzle_orm_1.eq)(comic_1.comics.id, comic.id));
        return res.status(200).json({
            success: true,
            message: "Chapter deleted and serial numbers resequenced",
        });
    }
    catch (err) {
        console.error("Delete Chapter Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteChapter = deleteChapter;
const buyChapter = async (req, res) => {
    try {
        const { nwtAmount, pin, chapterId } = req.body;
        // Authenticate user
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = decoded.userId;
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, user));
        if (!reader) {
            return res.status(404).json({
                success: false,
                message: "Reader profile not found",
            });
        }
        // ✅ Verify PIN before proceeding
        const isPinValid = await bcrypt_1.default.compare(pin, reader.pinHash);
        if (!isPinValid) {
            return res.status(400).json({
                success: false,
                message: "Incorrect PIN",
            });
        }
        // Validate required fields
        if (!nwtAmount || nwtAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid NWT amount is required",
            });
        }
        // Get chapter details with comic information
        const [chapter] = await db_1.db
            .select()
            .from(chapter_1.chapters)
            .where((0, drizzle_orm_1.eq)(chapter_1.chapters.id, chapterId));
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found",
            });
        }
        // Get comic details
        const [comic] = await db_1.db
            .select()
            .from(comic_1.comics)
            .where((0, drizzle_orm_1.eq)(comic_1.comics.id, chapter.comicId));
        if (!comic) {
            return res.status(404).json({
                success: false,
                message: "Comic not found",
            });
        }
        // Get creator information
        const [creator] = await db_1.db
            .select()
            .from(profile_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.id, comic.creatorId));
        if (!creator) {
            return res.status(404).json({
                success: false,
                message: "Creator not found",
            });
        }
        // Process the purchase using transaction system
        const purchaseResult = await (0, transaction_controller_1.processContentPurchase)(reader.id, reader.fullName, // User making the purchase
        comic.creatorId, // Creator receiving payment
        chapterId, // Content being purchased (chapter ID)
        nwtAmount, // Amount in NWT
        "chapter_unlock", // Content type
        0.3 // Platform fee (30%)
        );
        if (!purchaseResult.success) {
            return res.status(400).json({
                success: false,
                message: purchaseResult || "Failed to process purchase",
                error: purchaseResult,
            });
        }
        // Return success response with transaction details
        return res.status(200).json({
            success: true,
            message: "Chapter purchased successfully!",
            data: {
                chapter: {
                    id: chapter.id,
                    title: chapter.title,
                    chapterNumber: chapter.serialNo,
                },
                comic: {
                    id: comic.id,
                    title: comic.title,
                    slug: comic.slug,
                },
                creator: {
                    id: creator.id,
                    name: creator.creatorName,
                },
                // transaction: {
                //   userTransactionId: purchaseResult.userTransaction?.id,
                //   creatorTransactionId: purchaseResult.creatorTransaction?.id,
                //   nwtAmount,
                //   userNewBalance: purchaseResult.userNewBalance,
                //   creatorNewBalance: purchaseResult.creatorNewBalance,
                // },
            },
        });
    }
    catch (error) {
        console.error("Error buying chapter:", error);
        // Handle specific error types
        if (error.message === "Insufficient balance") {
            return res.status(400).json({
                success: false,
                message: "Insufficient NWT balance. Please purchase more tokens.",
                errorCode: "INSUFFICIENT_BALANCE",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to purchase chapter",
            error: error.message,
        });
    }
};
exports.buyChapter = buyChapter;
const fetchAllPaidChapters = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        if (!reader) {
            return res.status(404).json({ message: "Reader With Jwt not found" });
        }
        const paid = await db_1.db
            .select({
            chapterId: chapter_1.paidChapters.chapterId,
            paidAt: chapter_1.paidChapters.paidAt,
            title: chapter_1.chapters.title,
            serialNo: chapter_1.chapters.serialNo,
            comicId: chapter_1.chapters.comicId,
            comicTitle: comic_1.comics.title,
            comicSlug: comic_1.comics.slug,
            pages: chapter_1.chapters.pages,
        })
            .from(chapter_1.paidChapters)
            .innerJoin(chapter_1.chapters, (0, drizzle_orm_1.eq)(chapter_1.paidChapters.chapterId, chapter_1.chapters.id))
            .innerJoin(comic_1.comics, (0, drizzle_orm_1.eq)(chapter_1.chapters.comicId, comic_1.comics.id))
            .where((0, drizzle_orm_1.eq)(chapter_1.paidChapters.readerId, reader.id));
        const data = paid.map((record) => ({
            chapterId: record.chapterId,
            title: record.title,
            serialNo: record.serialNo,
            comicId: record.comicId,
            comicTitle: record.comicTitle,
            comicSlug: record.comicSlug,
            paidAt: record.paidAt,
            pages: (0, file_controller_1.mapFilesToUrls)(record.pages),
        }));
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (err) {
        console.error("Fetch Paid Chapters Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.fetchAllPaidChapters = fetchAllPaidChapters;
const addChapterView = async (req, res) => {
    try {
        const { chapterId } = req.body;
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        // Check if already viewed
        const existingView = await db_1.db
            .select()
            .from(chapter_1.chapterViews)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(chapter_1.chapterViews.readerId, reader.id), (0, drizzle_orm_1.eq)(chapter_1.chapterViews.chapterId, chapterId)));
        if (existingView.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Already viewed",
            });
        }
        // Insert new view
        await db_1.db.insert(chapter_1.chapterViews).values({
            readerId: reader.id,
            chapterId,
        });
        return res.status(201).json({
            success: true,
            message: "View recorded",
        });
    }
    catch (err) {
        console.error("Add Chapter View Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.addChapterView = addChapterView;
const toggleChapterLike = async (req, res) => {
    try {
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const { chapterId } = req.params;
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        if (!reader) {
            return res
                .status(404)
                .json({ success: false, message: "Reader not found" });
        }
        // check if already liked
        const [existingLike] = await db_1.db
            .select()
            .from(chapter_1.chapterLikes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(chapter_1.chapterLikes.chapterId, chapterId), (0, drizzle_orm_1.eq)(chapter_1.chapterLikes.readerId, reader.id)));
        if (existingLike) {
            // Unlike (delete row)
            await db_1.db.delete(chapter_1.chapterLikes).where((0, drizzle_orm_1.eq)(chapter_1.chapterLikes.id, existingLike.id));
            const [{ likesCount }] = await db_1.db
                .select({ likesCount: (0, drizzle_orm_1.sql) `COUNT(${chapter_1.chapterLikes.id})` })
                .from(chapter_1.chapterLikes)
                .where((0, drizzle_orm_1.eq)(chapter_1.chapterLikes.chapterId, chapterId));
            return res.status(200).json({
                success: true,
                message: "Chapter unliked",
                data: {
                    chapterId: chapterId,
                    liked: false,
                    likesCount: Number(likesCount) || 0,
                },
            });
        }
        else {
            // Like (insert row)
            await db_1.db.insert(chapter_1.chapterLikes).values({
                chapterId: chapterId,
                readerId: reader.id,
            });
            const [{ likesCount }] = await db_1.db
                .select({ likesCount: (0, drizzle_orm_1.sql) `COUNT(${chapter_1.chapterLikes.id})` })
                .from(chapter_1.chapterLikes)
                .where((0, drizzle_orm_1.eq)(chapter_1.chapterLikes.chapterId, chapterId));
            return res.status(200).json({
                success: true,
                message: "Chapter liked",
                data: {
                    chapterId: chapterId,
                    liked: true,
                    likesCount: Number(likesCount) || 0,
                },
            });
        }
    }
    catch (err) {
        console.error("Toggle Like Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.toggleChapterLike = toggleChapterLike;
