// src/routes/library.route.ts
import { Router } from "express";
import {
  addToLibrary,
  removeFromLibrary,
  getLibrary,
} from "../controller/library.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Library
 *   description: Manage a user's comic library
 */

/**
 * @swagger
 * /library:
 *   get:
 *     summary: Get all comics in the user's library
 *     description: Fetch all comics saved by the authenticated user in their library.
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of comics in user's library
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 comics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       comicId:
 *                         type: string
 *                         format: uuid
 *                         example: "6a7f1a9a-3a1b-45b1-8a9e-12a7f05d77ad"
 *                       title:
 *                         type: string
 *                         example: "The Last Kingdom"
 *                       slug:
 *                         type: string
 *                         example: "the-last-kingdom"
 *                       coverImage:
 *                         type: string
 *                         example: "cover.png"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", getLibrary);

/**
 * @swagger
 * /library:
 *   post:
 *     summary: Add a comic to the user's library
 *     description: Adds a comic to the authenticated user's library for later reading.
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comicId
 *             properties:
 *               comicId:
 *                 type: string
 *                 format: uuid
 *                 example: "4878476e-098d-4c87-b5ba-b2aedf13f43b"
 *     responses:
 *       201:
 *         description: Comic added successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reader not found
 *       500:
 *         description: Internal server error
 */
router.post("/", addToLibrary);

/**
 * @swagger
 * /library/{comicId}:
 *   delete:
 *     summary: Remove a comic from the user's library
 *     description: Removes a specific comic from the authenticated user's library.
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comicId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the comic to remove
 *     responses:
 *       200:
 *         description: Comic removed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/:comicId", removeFromLibrary);

export default router;
