"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controller/auth.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * components:
 *   schemas:
 *     GoogleAuthRequest:
 *       type: object
 *       required:
 *         - idToken
 *       properties:
 *         idToken:
 *           type: string
 *           description: Google ID token obtained from the frontend after Google Sign-In
 *           example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc4OT..."
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *             email:
 *               type: string
 *               example: user@example.com
 *             username:
 *               type: string
 *               example: comicfan2024
 *         isNewUser:
 *           type: boolean
 *           description: Whether this is a new signup or an existing login
 *           example: false
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Invalid Google token"
 */
/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Authenticate with Google
 *     description: Sign in with Google. If user exists → logs in. If not → signs up and returns JWT, user info, and isNewUser flag.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleAuthRequest'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid Google token or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/signin", auth_controller_1.googleAuthController);
exports.default = router;
