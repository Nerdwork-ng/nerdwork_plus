"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeForcomic = exports.deleteComicBySlug = exports.fetchAllComics = exports.fetchComicBySlugForReaders = exports.fetchComicBySlug = exports.fetchAllComicByJwt = exports.createComic = void 0;
exports.getComicSubscribers = getComicSubscribers;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const comic_1 = require("../model/comic");
const profile_1 = require("../model/profile");
const library_1 = require("../model/library");
const file_controller_1 = require("./file.controller");
const chapter_1 = require("../model/chapter");
const library_controller_1 = require("./library.controller");
async function getComicViews(comicId) {
    const [{ totalViews }] = await db_1.db
        .select({
        totalViews: (0, drizzle_orm_1.sql) `COUNT(${chapter_1.chapterViews.id})`,
    })
        .from(chapter_1.chapterViews)
        .innerJoin(chapter_1.chapters, (0, drizzle_orm_1.eq)(chapter_1.chapterViews.chapterId, chapter_1.chapters.id))
        .where((0, drizzle_orm_1.eq)(chapter_1.chapters.comicId, comicId));
    return Number(totalViews) || 0;
}
async function getComicSubscribers(comicId, readerId) {
    // Count likes
    const [{ subscribeCount }] = await db_1.db
        .select({ subscribeCount: (0, drizzle_orm_1.sql) `COUNT(${comic_1.comicSubscribers.id})` })
        .from(comic_1.comicSubscribers)
        .where((0, drizzle_orm_1.eq)(comic_1.comicSubscribers.comicId, comicId));
    let hasSubscribed = false;
    if (readerId) {
        const [existingSubscriber] = await db_1.db
            .select()
            .from(comic_1.comicSubscribers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(comic_1.comicSubscribers.comicId, comicId), (0, drizzle_orm_1.eq)(comic_1.comicSubscribers.readerId, readerId)));
        hasSubscribed = !!existingSubscriber;
    }
    return {
        subscribeCount: Number(subscribeCount) || 0,
        hasSubscribed,
    };
}
async function getComicLikes(comicId) {
    const [{ totalLikes }] = await db_1.db
        .select({
        totalLikes: (0, drizzle_orm_1.sql) `COUNT(${chapter_1.chapterLikes.id})`,
    })
        .from(chapter_1.chapterLikes)
        .innerJoin(chapter_1.chapters, (0, drizzle_orm_1.eq)(chapter_1.chapterLikes.chapterId, chapter_1.chapters.id))
        .where((0, drizzle_orm_1.eq)(chapter_1.chapters.comicId, comicId));
    return Number(totalLikes) || 0;
}
const createComic = async (req, res) => {
    try {
        const { title, language, ageRating, description, image, genre, tags } = req.body;
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const [creator] = await db_1.db
            .select()
            .from(profile_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.userId, userId));
        if (!creator) {
            return res.status(404).json({ message: "User not found" });
        }
        // 🔥 Extract only the file path (if frontend sends full CloudFront URL)
        let imagePath = image;
        if (image && image.startsWith("http")) {
            try {
                const url = new URL(image);
                imagePath = url.pathname.startsWith("/")
                    ? url.pathname.substring(1) // remove leading "/"
                    : url.pathname;
            }
            catch (err) {
                console.warn("Invalid image URL provided, storing raw value:", image);
            }
        }
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${creator.creatorName}`;
        const [comic] = await db_1.db
            .insert(comic_1.comics)
            .values({
            title,
            language,
            ageRating,
            description,
            image: imagePath,
            slug,
            genre,
            tags,
            comicStatus: "draft",
            creatorId: creator.id,
        })
            .returning();
        return res.status(200).json({ comic, slug });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Failed to create comic" });
    }
};
exports.createComic = createComic;
const fetchAllComicByJwt = async (req, res) => {
    try {
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const [creator] = await db_1.db
            .select()
            .from(profile_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.userId, userId));
        if (!creator) {
            return res.status(404).json({ message: "Creator With Jwt not found" });
        }
        const userComics = await db_1.db
            .select()
            .from(comic_1.comics)
            .where((0, drizzle_orm_1.eq)(comic_1.comics.creatorId, creator.id));
        const data = await Promise.all(userComics.map(async (comic) => {
            const { subscribeCount } = await getComicSubscribers(comic.id);
            return {
                id: comic.id,
                title: comic.title,
                language: comic.language,
                ageRating: comic.ageRating,
                noOfChapters: comic.noOfChapters,
                noOfDrafts: comic.noOfDrafts,
                description: comic.description,
                image: (0, file_controller_1.generateFileUrl)(comic.image),
                comicStatus: comic.comicStatus,
                genre: comic.genre,
                tags: comic.tags,
                slug: comic.slug,
                creatorName: creator.creatorName,
                createdAt: comic.createdAt,
                updatedAt: comic.updatedAt,
                viewsCount: await getComicViews(comic.id),
                likesCount: await getComicLikes(comic.id),
                subscribeCount,
            };
        }));
        return res.json({ comics: data });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Failed to fetch comics" });
    }
};
exports.fetchAllComicByJwt = fetchAllComicByJwt;
const fetchComicBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const [comic] = await db_1.db.select().from(comic_1.comics).where((0, drizzle_orm_1.eq)(comic_1.comics.slug, slug));
        if (!comic)
            return res.status(404).json({ message: "Comic not found" });
        const { subscribeCount } = await getComicSubscribers(comic.id);
        const data = {
            id: comic.id,
            title: comic.title,
            language: comic.language,
            ageRating: comic.ageRating,
            noOfChapters: comic.noOfChapters,
            noOfDrafts: comic.noOfDrafts,
            description: comic.description,
            image: (0, file_controller_1.generateFileUrl)(comic.image),
            comicStatus: comic.comicStatus,
            genre: comic.genre,
            tags: comic.tags,
            slug: comic.slug,
            createdAt: comic.createdAt,
            updatedAt: comic.updatedAt,
            viewsCount: await getComicViews(comic.id),
            likesCount: await getComicLikes(comic.id),
            subscribeCount,
        };
        return res.json({ data });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Failed to fetch comic" });
    }
};
exports.fetchComicBySlug = fetchComicBySlug;
const fetchComicBySlugForReaders = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        const [comic] = await db_1.db.select().from(comic_1.comics).where((0, drizzle_orm_1.eq)(comic_1.comics.slug, slug));
        if (!comic)
            return res.status(404).json({ message: "Comic not found" });
        const [creator] = await db_1.db
            .select()
            .from(profile_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.id, comic.creatorId));
        const [libraries] = await db_1.db
            .select()
            .from(library_1.library)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(library_1.library.comicId, comic.id), (0, drizzle_orm_1.eq)(library_1.library.readerId, reader.id)));
        const inLibrary = !!libraries;
        const { subscribeCount, hasSubscribed } = await getComicSubscribers(comic.id, reader.id);
        const data = {
            id: comic.id,
            title: comic.title,
            language: comic.language,
            ageRating: comic.ageRating,
            noOfChapters: comic.noOfChapters,
            noOfDrafts: comic.noOfDrafts,
            description: comic.description,
            image: (0, file_controller_1.generateFileUrl)(comic.image),
            comicStatus: comic.comicStatus,
            genre: comic.genre,
            tags: comic.tags,
            slug: comic.slug,
            createdAt: comic.createdAt,
            updatedAt: comic.updatedAt,
            creatorName: creator.creatorName,
            inLibrary,
            viewsCount: await getComicViews(comic.id),
            likesCount: await getComicLikes(comic.id),
            subscribeCount,
            hasSubscribed,
        };
        return res.json({
            data,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Failed to fetch comic" });
    }
};
exports.fetchComicBySlugForReaders = fetchComicBySlugForReaders;
const fetchAllComics = async (req, res) => {
    try {
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const [reader] = await db_1.db
            .select()
            .from(profile_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.readerProfile.userId, userId));
        if (!reader) {
            return res.status(404).json({ message: "Reader not found" });
        }
        const publishedComics = await db_1.db
            .select()
            .from(comic_1.comics)
            .where((0, drizzle_orm_1.eq)(comic_1.comics.comicStatus, "published"));
        const data = await Promise.all(publishedComics.map(async (chapter) => {
            const [creator] = await db_1.db
                .select()
                .from(profile_1.creatorProfile)
                .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.id, chapter.creatorId));
            const { subscribeCount, hasSubscribed } = await getComicSubscribers(chapter.id, reader.id);
            return {
                ...chapter,
                image: (0, file_controller_1.generateFileUrl)(chapter.image),
                creatorName: creator?.creatorName || "Unknown",
                viewsCount: await getComicViews(chapter.id),
                likesCount: await getComicLikes(chapter.id),
                subscribeCount,
                hasSubscribed,
            };
        }));
        return res.json({ comics: data });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Failed to fetch comics" });
    }
};
exports.fetchAllComics = fetchAllComics;
const deleteComicBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const [comic] = await db_1.db.select().from(comic_1.comics).where((0, drizzle_orm_1.eq)(comic_1.comics.slug, slug));
        if (!comic)
            return res.status(404).json({ message: "Comic not found" });
        await db_1.db.delete(comic_1.comics).where((0, drizzle_orm_1.eq)(comic_1.comics.slug, slug));
        return res.json({ message: "Comic deleted Successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Failed to fetch comic" });
    }
};
exports.deleteComicBySlug = deleteComicBySlug;
const subscribeForcomic = async (req, res) => {
    try {
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const { comicId } = req.params;
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
        const [existingSubscriber] = await db_1.db
            .select()
            .from(comic_1.comicSubscribers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(comic_1.comicSubscribers.comicId, comicId), (0, drizzle_orm_1.eq)(comic_1.comicSubscribers.readerId, reader.id)));
        if (existingSubscriber) {
            // Unlike (delete row)
            await db_1.db
                .delete(comic_1.comicSubscribers)
                .where((0, drizzle_orm_1.eq)(comic_1.comicSubscribers.id, existingSubscriber.id));
            const [{ subscribeCount }] = await db_1.db
                .select({ subscribeCount: (0, drizzle_orm_1.sql) `COUNT(${comic_1.comicSubscribers.id})` })
                .from(comic_1.comicSubscribers)
                .where((0, drizzle_orm_1.eq)(comic_1.comicSubscribers.comicId, comicId));
            return res.status(200).json({
                success: true,
                message: "Comic Unsubscribed",
                data: {
                    comicId: comicId,
                    liked: false,
                    subscribeCount: Number(subscribeCount) || 0,
                },
            });
        }
        else {
            // Like (insert row)
            await db_1.db.insert(comic_1.comicSubscribers).values({
                comicId: comicId,
                readerId: reader.id,
            });
            const [{ subscribeCount }] = await db_1.db
                .select({ subscribeCount: (0, drizzle_orm_1.sql) `COUNT(${comic_1.comicSubscribers.id})` })
                .from(comic_1.comicSubscribers)
                .where((0, drizzle_orm_1.eq)(comic_1.comicSubscribers.comicId, comicId));
            return res.status(200).json({
                success: true,
                message: "Comic Subscribed",
                data: {
                    comicId,
                    Subscribed: true,
                    subscribeCount: Number(subscribeCount) || 0,
                },
            });
        }
    }
    catch (err) {
        console.error("Toggle Subscription Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.subscribeForcomic = subscribeForcomic;
// ✅ Search comics by title
// export const searchComics = async (req, res) => {
//   try {
//     const { q } = req.query;
//     if (!q) return res.status(400).json({ message: "Search query required" });
//     const results = await db
//       .select()
//       .from(comics)
//       .where(ilike(comics.title, `%${q}%`));
//     return res.json({ results });
//   } catch (err) {
//     console.error(err);
//     return res.status(400).json({ message: "Failed to search comics" });
//   }
// };
