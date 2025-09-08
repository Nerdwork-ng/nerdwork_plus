import { Router } from "express";
import { 
  upload,
  uploadComicFile,
  uploadMultipleComicFiles,
  getComicFile,
  updateComicFile,
  deleteComicFile,
  listUserComicFiles,
  getComicFileInfo,
  uploadToS3
} from "../controller/file.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             s3Key:
 *               type: string
 *             cloudFrontUrl:
 *               type: string
 *             signedUrl:
 *               type: string
 *             isPublic:
 *               type: boolean
 *             metadata:
 *               type: object
 */

/**
 * @swagger
 * /file/upload/single:
 *   post:
 *     summary: Upload a single comic file
 *     tags: [File Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - userId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               genre:
 *                 type: string
 *               author:
 *                 type: string
 *               comicId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 */
router.post("/upload/single", upload.single("file"), uploadComicFile);

/**
 * @swagger
 * /file/upload/multiple:
 *   post:
 *     summary: Upload multiple comic files
 *     tags: [File Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *               - userId
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               genre:
 *                 type: string
 *               author:
 *                 type: string
 *               comicId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
router.post("/upload/multiple", upload.array("files", 20), uploadMultipleComicFiles);

/**
 * @swagger
 * /file/upload/s3:
 *   post:
 *     summary: Simple S3 upload (legacy endpoint)
 *     tags: [File Upload]
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
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post("/upload/s3", upload.single("file"), uploadToS3);

/**
 * @swagger
 * /file/get/{s3Key}:
 *   get:
 *     summary: Get comic file URL
 *     tags: [File Access]
 *     parameters:
 *       - in: path
 *         name: s3Key
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: signed
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File URL retrieved successfully
 */
router.get("/get/:s3Key", getComicFile);

/**
 * @swagger
 * /file/info/{s3Key}:
 *   get:
 *     summary: Get comic file information
 *     tags: [File Access]
 *     parameters:
 *       - in: path
 *         name: s3Key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File information retrieved successfully
 */
router.get("/info/:s3Key", getComicFileInfo);

/**
 * @swagger
 * /file/list/{userId}:
 *   get:
 *     summary: List user's comic files
 *     tags: [File Access]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: comicId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Files listed successfully
 */
router.get("/list/:userId", listUserComicFiles);

/**
 * @swagger
 * /file/update/{s3Key}:
 *   put:
 *     summary: Update comic file
 *     tags: [File Management]
 *     parameters:
 *       - in: path
 *         name: s3Key
 *         required: true
 *         schema:
 *           type: string
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               genre:
 *                 type: string
 *               author:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: File updated successfully
 */
router.put("/update/:s3Key", upload.single("file"), updateComicFile);

/**
 * @swagger
 * /file/delete/{s3Key}:
 *   delete:
 *     summary: Delete comic file
 *     tags: [File Management]
 *     parameters:
 *       - in: path
 *         name: s3Key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete("/delete/:s3Key", deleteComicFile);

export default router;
