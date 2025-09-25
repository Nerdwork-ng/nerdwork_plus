"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const file_controller_1 = require("../controller/file.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /file-upload/media:
 *   post:
 *     summary: Upload a media file to AWS S3 (served via CloudFront)
 *     description: >
 *       Receives a media file, uploads it to the configured S3 bucket, and returns a public CloudFront URL.
 *       The returned URL is safe to store in your database and can be used to directly serve the media.
 *     tags:
 *       - File Upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to be uploaded
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   example: "https://cdn.nerdwork/media/1234abcd-image.png"
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *       400:
 *         description: Bad request, no file provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: No file uploaded
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
// Multer memory storage (no disk, file kept in buffer)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
// Endpoint
router.post("/media", upload.single("file"), file_controller_1.uploadToS3);
exports.default = router;
