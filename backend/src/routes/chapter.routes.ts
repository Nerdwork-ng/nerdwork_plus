import { Router } from "express";
import {
  addChapterView,
  buyChapter,
  createChapter,
  createDraft,
  deleteChapter,
  fetchAllPaidChapters,
  fetchChapterByUniqueCode,
  fetchChapterPagesById,
  fetchChaptersByComicSlugForCreators,
  fetchChaptersByComicSlugForReaders,
  publishDraft,
  toggleChapterLike,
} from "../controller/chapter.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chapters
 *   description: Endpoints for managing comic chapters and drafts
 */

/**
 * @swagger
 * /chapters/create:
 *   post:
 *     summary: Create and publish a new chapter
 *     tags:
 *       - Chapters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                 type: string
 *             required:
 *               - title
 *               - chapterType
 *               - comicId
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *       500:
 *         description: Server error
 */
router.post("/create", createChapter);

/**
 * @swagger
 * /chapters/draft:
 *   post:
 *     summary: Create a draft chapter
 *     tags:
 *       - Chapters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                 type: string
 *             required:
 *               - title
 *               - chapterType
 *               - comicId
 *     responses:
 *       201:
 *         description: Draft created successfully
 *       500:
 *         description: Server error
 */
router.post("/draft", createDraft);

/**
 * @swagger
 * /chapters/by-comic/creator/{slug}:
 *   get:
 *     summary: Fetch all chapters of a comic (for creators)
 *     tags:
 *       - Chapters
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug of the comic
 *     responses:
 *       200:
 *         description: List of all chapters for the comic
 *       404:
 *         description: Comic not found
 *       500:
 *         description: Server error
 */
router.get("/by-comic/creator/:slug", fetchChaptersByComicSlugForCreators);

/**
 * @swagger
 * /chapters/by-comic/reader/{slug}:
 *   get:
 *     summary: Fetch published chapters of a comic (for readers)
 *     tags:
 *       - Chapters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug of the comic
 *     responses:
 *       200:
 *         description: List of published chapters for the comic with payment info
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comic not found
 *       500:
 *         description: Server error
 */
router.get("/by-comic/reader/:slug", fetchChaptersByComicSlugForReaders);

/**
 * @swagger
 * /chapters/by-code/{code}:
 *   get:
 *     summary: Fetch a chapter by unique code
 *     tags:
 *       - Chapters
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique code of the chapter
 *     responses:
 *       200:
 *         description: Chapter details
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Server error
 */
router.get("/by-code/:code", fetchChapterByUniqueCode);

/**
 * @swagger
 * /chapters/pages/{chapterId}:
 *   get:
 *     summary: Fetch chapter pages by chapter ID
 *     tags:
 *       - Chapters
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the chapter
 *     responses:
 *       200:
 *         description: List of page URLs
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Server error
 */
router.get("/pages/:chapterId", fetchChapterPagesById);

/**
 * @swagger
 * /chapters/draft/publish:
 *   post:
 *     summary: Publish a draft chapter
 *     tags:
 *       - Chapters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - draftUniqCode
 *               - comicId
 *             properties:
 *               draftUniqCode:
 *                 type: string
 *               comicId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Draft published successfully
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Server error
 */
router.post("/draft/publish", publishDraft);

/**
 * @swagger
 * /chapters/delete/{code}:
 *   delete:
 *     summary: Delete a chapter by unique code
 *     tags:
 *       - Chapters
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique code of the chapter
 *     responses:
 *       200:
 *         description: Chapter deleted and serial numbers resequenced
 *       404:
 *         description: Chapter or Comic not found
 *       500:
 *         description: Server error
 */
router.delete("/delete/:code", deleteChapter);

/**
 * @swagger
 * /chapters/purchase:
 *   post:
 *     summary: Purchase a comic chapter
 *     description: Allows a reader to purchase a paid chapter using NWT tokens after verifying their PIN.
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nwtAmount
 *               - pin
 *               - chapterId
 *             properties:
 *               nwtAmount:
 *                 type: number
 *                 example: 50
 *               pin:
 *                 type: string
 *                 example: "1234"
 *               chapterId:
 *                 type: string
 *                 example: "chap_abc123"
 *     responses:
 *       200:
 *         description: Chapter purchased successfully
 *       400:
 *         description: Invalid request (e.g., incorrect PIN, insufficient balance)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reader, Chapter, Comic, or Creator not found
 *       500:
 *         description: Internal server error
 */
router.post("/purchase", buyChapter);

/**
 * @swagger
 * /chapters/paid:
 *   get:
 *     summary: Get all paid chapters for a reader
 *     description: Returns a list of all chapters purchased by the authenticated reader.
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of paid chapters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reader not found
 *       500:
 *         description: Internal server error
 */
router.get("/paid", fetchAllPaidChapters);

/**
 * @swagger
 * /chapters/view:
 *   post:
 *     summary: Record a chapter view
 *     description: Records a view for the given chapter by the authenticated reader. If already viewed, it will not add a duplicate entry.
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chapterId
 *             properties:
 *               chapterId:
 *                 type: string
 *                 example: "chap_abc123"
 *     responses:
 *       201:
 *         description: View recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "View recorded"
 *       200:
 *         description: Chapter already viewed by this reader
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reader not found
 *       500:
 *         description: Internal server error
 */
router.post("/view", addChapterView);

/**
 * @swagger
 * /chapters/{chapterId}/like:
 *   post:
 *     summary: Like or unlike a chapter
 *     description: Toggles a like for the given chapter. If already liked, it will be unliked; otherwise, it will be liked.
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the chapter
 *         example: "chap_abc123"
 *     responses:
 *       200:
 *         description: Like status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Chapter liked"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chapterId:
 *                       type: string
 *                       example: "chap_abc123"
 *                     liked:
 *                       type: boolean
 *                       example: true
 *                     likesCount:
 *                       type: number
 *                       example: 42
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reader or Chapter not found
 *       500:
 *         description: Internal server error
 */
router.post("/:chapterId/like", toggleChapterLike);

export default router;
