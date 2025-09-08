import express from "express";
import {
  addCreatorProfile,
  addReaderProfile,
  getCreatorProfile,
  getReaderProfile,
  updateCreatorProfilePin,
  updateReaderProfilePin,
} from "../controller/profile.controller";

const router = express.Router();

/**
 * @route   POST /profile/creator
 * @desc    Create a Creator Profile
 * @access  Private (after signup)
 */
router.post("/creator", addCreatorProfile);

/**
 * @route   POST /profile/reader
 * @desc    Create a Reader Profile
 * @access  Private (after signup)
 */

router.post("/reader", addReaderProfile);

/**
 * @route   GET /profile/creator
 * @desc    Get Creator Profile
 * @access  Private (Jwt required)
 */

router.get("/creator", getCreatorProfile);

/**
 * @route   GET /profile/reader
 * @desc    Get Reader Profile
 * @access  Private (Jwt required)
 */

router.get("/reader", getReaderProfile);

/**
 * @route   PUT /profile/reader/pin
 * @desc    update Reader Profile pin
 * @access  Private (Jwt required)
 */

router.put("/reader/pin", updateReaderProfilePin);

/**
 * @route   PUT /profile/creator/pin
 * @desc    update Creator Profile pin
 * @access  Private (Jwt required)
 */

router.put("/creator/pin", updateCreatorProfilePin);

/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: Endpoints for managing user profiles (creator & reader)
 */

/**
 * @swagger
 * /profile/creator:
 *   post:
 *     summary: Create a creator profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - fullName
 *               - creatorName
 *               - genres
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "2d3f8f2e-45b2-4a90-bc58-bdff26e7e98a"
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               creatorName:
 *                 type: string
 *                 example: "JDComics"
 *               phoneNumber:
 *                 type: string
 *                 example: "+2348012345678"
 *               bio:
 *                 type: string
 *                 example: "Comic creator focusing on sci-fi and fantasy"
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["fantasy", "sci-fi"]
 *     responses:
 *       200:
 *         description: Creator profile successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   $ref: '#/components/schemas/CreatorProfile'
 *       400:
 *         description: Failed to create creator profile
 */

/**
 * @swagger
 * /profile/reader:
 *   post:
 *     summary: Create a reader profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - fullName
 *               - genres
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "5c2f7df9-1d21-49f3-90d6-65b3e94bbfc2"
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["romance", "adventure", "sci-fi"]
 *     responses:
 *       200:
 *         description: Reader profile successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   $ref: '#/components/schemas/ReaderProfile'
 *       400:
 *         description: Failed to create reader profile
 */

/**
 * @swagger
 * /profile/creator:
 *   get:
 *     summary: Get The authenticated creator's profile
 *     description: Retrieves the profile of the logged-in user (creator) based on the JWT provided in the Authorization header.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                   example: creator
 *                 profile:
 *                   type: object
 *                   example:
 *                     id: "uuid"
 *                     userId: "uuid"
 *                     fullName: "John Doe"
 *                     creatorName: "JD Comics"
 *                     phoneNumber: "+2348000000000"
 *                     bio: "Comic creator"
 *                     genres: "fantasy, sci-fi"
 *                     walletType: "phantom"
 *                     walletAddress: "0x1234abcd"
 *                     createdAt: "2025-08-29T12:00:00Z"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Profile not found
 */

/**
 * @swagger
 * /profile/reader:
 *   get:
 *     summary: Get The authenticated reader's profile
 *     description: Retrieves the profile of the logged-in user (reader) based on the JWT provided in the Authorization header.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                   example: creator
 *                 profile:
 *                   type: object
 *                   example:
 *                     id: "uuid"
 *                     userId: "uuid"
 *                     genres: "fantasy, sci-fi"
 *                     walletId: "0x1234abcd"
 *                     createdAt: "2025-08-29T12:00:00Z"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Profile not found
 */

/**
 * @swagger
 * /profile/reader/pin:
 *   put:
 *     summary: Update reader profile PIN
 *     description: Updates the reader profile PIN for the authenticated user. The PIN is securely hashed before storing.
 *     tags:
 *       - Reader Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *                 description: 4+ digit PIN to set for the profile
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: PIN updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "PIN updated successfully"
 *       400:
 *         description: Invalid request (e.g., missing or too short PIN)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "PIN must be at least 4 digits"
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Reader profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile not found"
 */

/**
 * @swagger
 * /profile/creator/pin:
 *   put:
 *     summary: Update reader profile PIN
 *     description: Updates the reader profile PIN for the authenticated user. The PIN is securely hashed before storing.
 *     tags:
 *       - Reader Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *                 description: 4+ digit PIN to set for the profile
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: PIN updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "PIN updated successfully"
 *       400:
 *         description: Invalid request (e.g., missing or too short PIN)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "PIN must be at least 4 digits"
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Reader profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile not found"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatorProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         fullName:
 *           type: string
 *         creatorName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         bio:
 *           type: string
 *         genres:
 *           type: string
 *         walletType:
 *           type: string
 *           nullable: true
 *           example: "solana"
 *         walletAddress:
 *           type: string
 *           nullable: true
 *         pinHash:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ReaderProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         genres:
 *           type: string
 *         walletId:
 *           type: string
 *         pinHash:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default router;
