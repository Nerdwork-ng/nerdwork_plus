import { Router } from "express";
import {
  createComic,
  publishComic,
  fetchAllComicByJwt,
  fetchComicBySlug,
  createChapter,
  updateChapter,
  publishChapter,
  getComicChapters,
  getChapter,
  deleteChapter,
  fetchAllComics,
  fetchComicBySlugForReaders,
} from "../controller/comic.controller";
import { authenticate } from "../middleware/common/auth";

const router = Router();

// ===============================
// COMIC ROUTES
// ===============================

/**
 * @swagger
 * tags:
 *   - name: Comics
 *     description: Comic creation and management
 *   - name: Chapters
 *     description: Chapter management for comics
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         language:
 *           type: string
 *         ageRating:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *           description: S3 URL for cover image
 *         slug:
 *           type: string
 *         genre:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         isDraft:
 *           type: boolean
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         creatorId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Chapter:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         comicId:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         chapterNumber:
 *           type: integer
 *         description:
 *           type: string
 *         pages:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of S3 URLs for comic pages
 *         pageCount:
 *           type: integer
 *         isDraft:
 *           type: boolean
 *         publishedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /comics/create:
 *   post:
 *     summary: Create a new comic (basic info only)
 *     tags: [Comics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - language
 *               - ageRating
 *               - description
 *               - image
 *               - genre
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My Epic Adventure"
 *               language:
 *                 type: string
 *                 example: "English"
 *               ageRating:
 *                 type: string
 *                 example: "13+"
 *               description:
 *                 type: string
 *                 example: "A thrilling adventure story."
 *               image:
 *                 type: string
 *                 example: "https://s3.../cover.jpg"
 *                 description: Pre-uploaded S3 URL
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["adventure", "fantasy"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["magic", "hero"]
 *     responses:
 *       201:
 *         description: Comic created successfully (as draft)
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authenticate, createComic);

/**
 * @swagger
 * /comics/{comicId}/publish:
 *   patch:
 *     summary: Publish a comic (change from draft to published)
 *     tags: [Comics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comic published successfully
 */
router.patch("/:comicId/publish", authenticate, publishComic);

/**
 * @swagger
 * /comics/mine:
 *   get:
 *     summary: Get creator's comics (drafts and published)
 *     tags: [Comics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of creator's comics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     comics:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comic'
 */
router.get("/mine", authenticate, fetchAllComicByJwt);

/**
 * @swagger
 * /comics/published:
 *   get:
 *     summary: Get all published comics (public endpoint)
 *     tags: [Comics]
 *     responses:
 *       200:
 *         description: List of all published comics
 */
router.get("/published", fetchAllComics);

/**
 * @swagger
 * /comics/{slug}:
 *   get:
 *     summary: Get comic by slug (public endpoint)
 *     tags: [Comics]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comic found
 *       404:
 *         description: Comic not found or is draft
 */
router.get("/:slug", fetchComicBySlug);
router.get("/reader/:slug", fetchComicBySlugForReaders);

// ===============================
// CHAPTER ROUTES
// ===============================

/**
 * @swagger
 * /comics/reader/{slug}:
 *   get:
 *     summary: Fetch a comic by its slug for readers
 *     tags: [Comics]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: The slug of the comic
 *     responses:
 *       200:
 *         description: Comic found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comic:
 *                   $ref: '#/components/schemas/Comic'
 *       404:
 *         description: Comic not found
 *       400:
 *         description: Failed to fetch comic
 */

/**
 * @swagger
 * /comics/all-comics:
 *   get:
 *     summary: Get all chapters for a comic
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: includePages
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *         description: Include page URLs in response
 *     responses:
 *       200:
 *         description: List of chapters
 */
router.get("/:comicId/chapters", getComicChapters);

/**
 * @swagger
 * /comics/chapters/{chapterId}:
 *   get:
 *     summary: Get a single chapter with all pages
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Chapter with pages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     chapter:
 *                       $ref: '#/components/schemas/Chapter'
 */
router.get("/chapters/:chapterId", getChapter);

/**
 * @swagger
 * /comics/chapters/{chapterId}:
 *   put:
 *     summary: Update chapter (reorder pages, change info)
 *     tags: [Chapters]
 *     security:
 * 
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               chapterNumber:
 *                 type: integer
 *               description:
 *                 type: string
 *               pages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Reordered array of S3 URLs
 *     responses:
 *       200:
 *         description: Chapter updated successfully
 */
router.put("/chapters/:chapterId", authenticate, updateChapter);

/**
 * @swagger
 * /comics/chapters/{chapterId}/publish:
 *   patch:
 *     summary: Publish a chapter
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Chapter published successfully
 */

router.patch("/chapters/:chapterId/publish", authenticate, publishChapter);

/**
 * @swagger
 * /comics/chapters/{chapterId}:
 *   delete:
 *     summary: Delete a chapter
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Chapter deleted successfully
 */
router.delete("/chapters/:chapterId", authenticate, deleteChapter);

export default router;