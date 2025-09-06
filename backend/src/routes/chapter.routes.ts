import { Router } from "express";
import {
  createChapter,
  createDraft,
  fetchChapterByUniqueCode,
  fetchChapterPagesById,
  fetchChaptersByComicSlug,
} from "../controller/chapter.controller";

const router = Router();

router.post("/create", createChapter);
router.get("/by-comic/:slug", fetchChaptersByComicSlug);
router.get("/by-code/:code", fetchChapterByUniqueCode);
router.get("/pages/:chapterId", fetchChapterPagesById);
router.post("/draft", createDraft);

/**
 * @swagger
 * tags:
 *   name: Chapters
 *   description: Endpoints for managing comic chapters and drafts
 *
 * /chapters/create:
 *   post:
 *     summary: Create a new chapter
 *     description: Creates a new chapter for a comic, assigns a unique 4-digit code, and increments the comic's chapter count.
 *     tags: [Chapters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - chapterType
 *               - comicId
 *               - pages
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Chapter 1: The Beginning"
 *               chapterType:
 *                 type: string
 *                 enum: [free, paid]
 *                 example: "paid"
 *               price:
 *                 type: number
 *                 example: 500
 *               summary:
 *                 type: string
 *                 example: "This is the intro chapter to the comic."
 *               pages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["page1.png", "page2.png"]
 *               comicId:
 *                 type: uuid
 *                 example: "4878476e-098d-4c87-b5ba-b2aedf13f43b"
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 *
 * /chapters/draft:
 *   post:
 *     summary: Save a chapter as draft
 *     description: Creates a draft chapter that can later be published. Increments the comic's draft count.
 *     tags: [Chapters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - chapterType
 *               - comicId
 *               - pages
 *             properties:
 *               title:
 *                 type: string
 *               chapterType:
 *                 type: string
 *                 enum: [free, paid]
 *               price:
 *                 type: number
 *               summary:
 *                 type: string
 *               pages:
 *                 type: array
 *                 items:
 *                   type: string
 *               comicId:
 *                 type: uuid
 *     responses:
 *       201:
 *         description: Draft chapter created successfully
 *       500:
 *         description: Internal server error
 *
 * /chapters/by-comic/{slug}:
 *   get:
 *     summary: Get all chapters by comic slug
 *     description: Fetches all chapters that belong to a given comic, identified by its slug.
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: The slug of the comic
 *     responses:
 *       200:
 *         description: List of chapters
 *       404:
 *         description: Comic not found
 *       500:
 *         description: Internal server error
 *
 * /chapters/by-code/{code}:
 *   get:
 *     summary: Get a chapter by unique code
 *     description: Fetch a single chapter using its unique 4-digit code.
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: The unique 4-digit code of the chapter
 *     responses:
 *       200:
 *         description: Chapter details
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Internal server error
 *
 * /chapters/pages/{chapterId}:
 *   get:
 *     summary: Get chapter pages by chapter ID
 *     description: Fetches all pages of a chapter using its ID.
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         schema:
 *           type: uuid
 *         required: true
 *         description: The ID of the chapter
 *     responses:
 *       200:
 *         description: List of chapter pages
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Internal server error
 */

export default router;
