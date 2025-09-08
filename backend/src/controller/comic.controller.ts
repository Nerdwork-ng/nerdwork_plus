import { eq, desc, asc, and } from "drizzle-orm";
import { db } from "../config/db";
import { comics } from "../model/comic";
import { chapters } from "../model/chapter";
import jwt from "jsonwebtoken";
import { creatorProfile } from "../model/profile";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/common/auth";

// ===============================
// COMIC CRUD OPERATIONS
// ===============================

// Create comic (basic info only, no chapters)
export const createComic = async (req:any, res:any) => {
  try {
    const { title, language, ageRating, description, image, genre, tags } = req.body;
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));

    if (!creator) {
      return res.status(404).json({ message: "Creator profile not found" });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${
      creator.creatorName
    }`;

    const [comic] = await db
      .insert(comics)
      .values({
        title,
        language,
        ageRating,
        description,
        image, // Pre-uploaded S3 URL
        slug,
        genre,
        tags,
        comicStatus: "draft",
        creatorId: creator.id,
        isDraft: true, // Always starts as draft
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Comic created successfully",
      data: { comic, slug },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to create comic" });
  }
};

// Publish comic (change from draft to published)
export const publishComic = async (req:any, res:any) => {
  try {
    const { comicId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    // Get creator profile
    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    // Update comic to published
    const [updatedComic] = await db
      .update(comics)
      .set({
        isDraft: false,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(comics.id, comicId))
      .returning();

    if (!updatedComic) {
      return res.status(404).json({ message: "Comic not found" });
    }

    return res.json({
      success: true,
      message: "Comic published successfully",
      data: { comic: updatedComic },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to publish comic" });
  }
};

// Get creator's comics (drafts and published)
export const fetchAllComicByJwt = async (req:any, res:any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));
    
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const userComics = await db
      .select()
      .from(comics)
      .where(eq(comics.creatorId, creator.id))
      .orderBy(desc(comics.createdAt));

    return res.json({
      success: true,
      data: { comics: userComics },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comics" });
  }
};

// Get comic by slug (public endpoint)
export const fetchComicBySlug = async (req: any, res: any) => {
  try {
    const { slug } = req.params;

    const [comic] = await db.select().from(comics).where(eq(comics.slug, slug));

    if (!comic) {
      return res.status(404).json({ message: "Comic not found" });
    }

    // Only return published comics for public access
    if (comic.isDraft) {
      return res.status(404).json({ message: "Comic not found" });
    }

    return res.json({
      success: true,
      data: { comic },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comic" });
  }
};

// Get comic by slug for readers
export const fetchComicBySlugForReaders = async (req: any, res: any) => {
  try {
    const { slug } = req.params;

    const [comic] = await db.select().from(comics).where(eq(comics.slug, slug));
    if (!comic) return res.status(404).json({ message: "Comic not found" });

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, comic.creatorId));

    return res.json({
      data: {
        comic,
        creatorName: creator.creatorName,
        isInLibrary: false,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comic" });
  }
};

// Get all published comics (reader endpoint)
export const fetchAllComics = async (req: any, res: any) => {
  try {
    const publishedComics = await db
      .select()
      .from(comics)
      .where(eq(comics.comicStatus, "published"));

    return res.json({
      success: true,
      data: { comics: publishedComics },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch comics" });
  }
};

// ===============================
// CHAPTER CRUD OPERATIONS
// ===============================

// Create chapter for a comic
export const createChapter = async (req:any, res:any) => {
  try {
    const { comicId } = req.params;
    const { title, chapterNumber, description, pages } = req.body;

    // Verify user owns the comic
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    // Check if comic exists and belongs to creator
    const [comic] = await db
      .select()
      .from(comics)
      .where(eq(comics.id, comicId));

    if (!comic || comic.creatorId !== creator.id) {
      return res.status(404).json({ message: "Comic not found or unauthorized" });
    }

    const [chapter] = await db
      .insert(chapters)
      .values({
        comicId,
        title,
        chapterNumber,
        description: description || null,
        pages: pages || [], // Array of S3 URLs
        pageCount: pages?.length || 0,
        isDraft: true,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: { chapter },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to create chapter" });
  }
};

// Update chapter (reorder pages, update info)
export const updateChapter = async (req:any, res:any) => {
  try {
    const { chapterId } = req.params;
    const { title, chapterNumber, description, pages } = req.body;

    // Verify ownership through comic
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const [updatedChapter] = await db
      .update(chapters)
      .set({
        title: title || undefined,
        chapterNumber: chapterNumber || undefined,
        description: description || undefined,
        pages: pages || undefined,
        pageCount: pages?.length || undefined,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, chapterId))
      .returning();

    if (!updatedChapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    return res.json({
      success: true,
      message: "Chapter updated successfully",
      data: { chapter: updatedChapter },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to update chapter" });
  }
};

// Publish chapter
export const publishChapter = async (req:any, res:any) => {
  try {
    const { chapterId } = req.params;

    const [updatedChapter] = await db
      .update(chapters)
      .set({
        isDraft: false,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, chapterId))
      .returning();

    if (!updatedChapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    return res.json({
      success: true,
      message: "Chapter published successfully",
      data: { chapter: updatedChapter },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to publish chapter" });
  }
};

// Get chapters for a comic
export const getComicChapters = async (req: any, res: any) => {
  try {
    const { comicId } = req.params;
    const { includePages = 'false' } = req.query;

    // Get comic first to check if it exists
    const [comic] = await db
      .select()
      .from(comics)
      .where(eq(comics.id, comicId));

    if (!comic) {
      return res.status(404).json({ message: "Comic not found" });
    }

    let query = db
      .select()
      .from(chapters)
      .where(eq(chapters.comicId, comicId))
      .orderBy(asc(chapters.chapterNumber));

    // For public access, only show published chapters
    const authHeader = req.headers.authorization;
    const isOwner = false; // You can implement owner check here if needed
    
    if (!isOwner) {
      query = db
      .select()
      .from(chapters)
      .where(and(eq(chapters.comicId, comicId), eq(chapters.isDraft, false)))
      .orderBy(asc(chapters.chapterNumber))
    }

    const comicChapters = await query;

    // Optionally exclude pages from response for performance
    if (includePages === 'false') {
      const chaptersWithoutPages = comicChapters.map(chapter => {
        const { pages, ...chapterWithoutPages } = chapter;
        return chapterWithoutPages;
      });
      
      return res.json({
        success: true,
        data: { chapters: chaptersWithoutPages },
      });
    }

    return res.json({
      success: true,
      data: { chapters: comicChapters },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch chapters" });
  }
};

// Get single chapter with all pages
export const getChapter = async (req: any, res: any) => {
  try {
    const { chapterId } = req.params;

    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId));

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // For public access, only show published chapters
    if (chapter.isDraft) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    return res.json({
      success: true,
      data: { chapter },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to fetch chapter" });
  }
};

// Delete chapter
export const deleteChapter = async (req:any, res:any) => {
  try {
    const { chapterId } = req.params;

    const [deletedChapter] = await db
      .delete(chapters)
      .where(eq(chapters.id, chapterId))
      .returning();

    if (!deletedChapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    return res.json({
      success: true,
      message: "Chapter deleted successfully",
      data: { deletedChapter },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Failed to delete chapter" });
  }
};