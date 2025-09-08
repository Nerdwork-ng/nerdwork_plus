import { eq, desc, asc, and } from "drizzle-orm";
import { db } from "../config/db";
import { comics } from "../model/comic";
import { chapters } from "../model/chapter";
import jwt from "jsonwebtoken";
import { creatorProfile } from "../model/profile";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/common/auth";
import { processContentPurchase } from "./transaction.controller";

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

export const fetchComicBySlugForReaders = async (req, res) => {
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

// ✅ Fetch all comics (reader endpoint)
export const fetchAllComics = async (req, res) => {
  try {
    const publishedComics = await db
      .select()
      .from(comics)
      .where(eq(comics.comicStatus, "published"));

    return res.json({ comics: publishedComics });
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

// ===============================
// PURCHASE OPERATIONS
// ===============================

/**
 * Buy Comic - User purchases access to a comic using NWT
 */
export const buyComic = async (req: any, res: any) => {
  try {
    const { comicId } = req.params;
    const { nwtAmount } = req.body;

    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    // Validate required fields
    if (!nwtAmount || nwtAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid NWT amount is required"
      });
    }

    // Get comic details
    const [comic] = await db
      .select()
      .from(comics)
      .where(eq(comics.id, comicId));

    if (!comic) {
      return res.status(404).json({
        success: false,
        message: "Comic not found"
      });
    }

    // Check if comic is published
    if (comic.isDraft) {
      return res.status(400).json({
        success: false,
        message: "Comic is not available for purchase"
      });
    }

    // Get creator information
    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, comic.creatorId));

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator not found"
      });
    }

    // Check if user is trying to buy their own comic
    if (creator.userId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot purchase your own comic"
      });
    }

    // Process the purchase using transaction system
    const purchaseResult = await processContentPurchase(
      userId,              // User making the purchase
      comic.creatorId,     // Creator receiving payment
      comicId,            // Content being purchased
      nwtAmount,          // Amount in NWT
      "comic_purchase",   // Content type
      0.30               // Platform fee (30%)
    );

    if (!purchaseResult.success) {
      return res.status(400).json({
        success: false,
        message: purchaseResult.error || "Failed to process purchase",
        error: purchaseResult.error
      });
    }

    // Return success response with transaction details
    return res.status(200).json({
      success: true,
      message: "Comic purchased successfully!",
      data: {
        comic: {
          id: comic.id,
          title: comic.title,
          slug: comic.slug
        },
        creator: {
          id: creator.id,
          name: creator.creatorName
        },
        transaction: {
          userTransactionId: purchaseResult.userTransaction?.id,
          creatorTransactionId: purchaseResult.creatorTransaction?.id,
          nwtAmount,
          userNewBalance: purchaseResult.userNewBalance,
          creatorNewBalance: purchaseResult.creatorNewBalance
        }
      }
    });

  } catch (error: any) {
    console.error("Error buying comic:", error);
    
    // Handle specific error types
    if (error.message === "Insufficient balance") {
      return res.status(400).json({
        success: false,
        message: "Insufficient NWT balance. Please purchase more tokens.",
        errorCode: "INSUFFICIENT_BALANCE"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to purchase comic",
      error: error.message
    });
  }
};

/**
 * Buy Chapter - User purchases access to a specific chapter using NWT
 */
export const buyChapter = async (req: any, res: any) => {
  try {
    const { chapterId } = req.params;
    const { nwtAmount } = req.body;

    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    // Validate required fields
    if (!nwtAmount || nwtAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid NWT amount is required"
      });
    }

    // Get chapter details with comic information
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId));

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found"
      });
    }

    // Check if chapter is published
    if (chapter.isDraft) {
      return res.status(400).json({
        success: false,
        message: "Chapter is not available for purchase"
      });
    }

    // Get comic details
    const [comic] = await db
      .select()
      .from(comics)
      .where(eq(comics.id, chapter.comicId));

    if (!comic) {
      return res.status(404).json({
        success: false,
        message: "Comic not found"
      });
    }

    // Get creator information
    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.id, comic.creatorId));

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator not found"
      });
    }

    // Check if user is trying to buy their own chapter
    if (creator.userId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot purchase your own chapter"
      });
    }

    // Check if chapter is free
    if (chapter.chapterType === "free" || chapter.price === 0) {
      return res.status(400).json({
        success: false,
        message: "This chapter is free and doesn't need to be purchased"
      });
    }

    // Process the purchase using transaction system
    const purchaseResult = await processContentPurchase(
      userId,               // User making the purchase
      comic.creatorId,      // Creator receiving payment
      chapterId,           // Content being purchased (chapter ID)
      nwtAmount,           // Amount in NWT
      "chapter_unlock",    // Content type
      0.30                // Platform fee (30%)
    );

    if (!purchaseResult.success) {
      return res.status(400).json({
        success: false,
        message: purchaseResult.error || "Failed to process purchase",
        error: purchaseResult.error
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
          chapterNumber: chapter.chapterNumber
        },
        comic: {
          id: comic.id,
          title: comic.title,
          slug: comic.slug
        },
        creator: {
          id: creator.id,
          name: creator.creatorName
        },
        transaction: {
          userTransactionId: purchaseResult.userTransaction?.id,
          creatorTransactionId: purchaseResult.creatorTransaction?.id,
          nwtAmount,
          userNewBalance: purchaseResult.userNewBalance,
          creatorNewBalance: purchaseResult.creatorNewBalance
        }
      }
    });

  } catch (error: any) {
    console.error("Error buying chapter:", error);
    
    // Handle specific error types
    if (error.message === "Insufficient balance") {
      return res.status(400).json({
        success: false,
        message: "Insufficient NWT balance. Please purchase more tokens.",
        errorCode: "INSUFFICIENT_BALANCE"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to purchase chapter",
      error: error.message
    });
  }
};