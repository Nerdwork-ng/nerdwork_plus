import { eq, sql } from "drizzle-orm";
import { db } from "../config/db";
import { chapters } from "../model/chapter";
import { comics } from "../model/comic";

// ✅ Create Chapter
export const createChapter = async (req, res) => {
  try {
    const { title, chapterType, price, summary, pages, comicId } = req.body;

    const finalPrice = chapterType === "free" ? 0 : price;

    const uniqueCode = Math.floor(1000 + Math.random() * 9000).toString();

    // insert chapter
    const [newChapter] = await db
      .insert(chapters)
      .values({
        title,
        chapterType,
        price: finalPrice,
        summary,
        chapterStatus: "published",
        pages,
        comicId,
        uniqueCode,
      })
      .returning();

    // increment comic.noOfChapters
    await db
      .update(comics)
      .set({
        noOfChapters: sql`${comics.noOfChapters} + 1`,
        comicStatus: "published",
      })
      .where(eq(comics.id, comicId));

    return res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: newChapter,
    });
  } catch (err: any) {
    console.error("Create Chapter Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createDraft = async (req, res) => {
  try {
    const { title, chapterType, price, summary, pages, comicId } = req.body;

    const finalPrice = chapterType === "free" ? 0 : price;

    const uniqueCode = Math.floor(1000 + Math.random() * 9000).toString();

    // insert chapter
    const [newChapter] = await db
      .insert(chapters)
      .values({
        title,
        chapterType,
        price: finalPrice,
        summary,
        pages,
        comicId,
        chapterStatus: "draft",
        uniqueCode,
      })
      .returning();

    // increment comic.noOfDrafts
    await db
      .update(comics)
      .set({ noOfDrafts: sql`${comics.noOfDrafts} + 1` })
      .where(eq(comics.id, comicId));

    return res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: newChapter,
    });
  } catch (err: any) {
    console.error("Create Chapter Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Fetch all chapters by Comic Slug
export const fetchChaptersByComicSlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [comic] = await db.select().from(comics).where(eq(comics.slug, slug));
    if (!comic) {
      return res
        .status(404)
        .json({ success: false, message: "Comic not found" });
    }

    const [allChapters] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.comicId, comic.id));

    console.log("All chapter", allChapters);

    return res.status(200).json({
      success: true,
      data: allChapters,
    });
  } catch (err: any) {
    console.error("Fetch Chapters Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Fetch single chapter by unique 4-digit code
export const fetchChapterByUniqueCode = async (req, res) => {
  try {
    const { code } = req.params;

    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.uniqueCode, code));

    if (!chapter) {
      return res
        .status(404)
        .json({ success: false, message: "Chapter not found" });
    }

    return res.status(200).json({
      success: true,
      data: chapter,
    });
  } catch (err: any) {
    console.error("Fetch Chapter by Code Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Fetch chapter pages by chapter ID
export const fetchChapterPagesById = async (req, res) => {
  try {
    const { chapterId } = req.params;

    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId));

    if (!chapter) {
      return res
        .status(404)
        .json({ success: false, message: "Chapter not found" });
    }

    return res.status(200).json({
      success: true,
      data: chapter.pages,
    });
  } catch (err: any) {
    console.error("Fetch Pages Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
