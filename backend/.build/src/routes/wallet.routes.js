"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/common/auth");
const wallet_controller_1 = require("../controller/wallet.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /wallet/credit:
 *   post:
 *     summary: Credit user wallet
 *     description: Credits the authenticated user's wallet with the specified amount.
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Wallet credited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 newBalance:
 *                   type: number
 *                   example: 500
 *       400:
 *         description: Invalid request (e.g., negative or missing amount)
 *       500:
 *         description: Internal server error
 */
router.post("/wallet/credit", auth_1.authenticate, wallet_controller_1.creditWalletController);
/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     description: Retrieve the current balance of the authenticated user's wallet.
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   example: 1500
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/wallet/balance", auth_1.authenticate, wallet_controller_1.getWalletBalance);
/**
 * @swagger
 * /wallet/debit:
 *   post:
 *     summary: Debit user wallet
 *     tags: [Wallet]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Wallet debited successfully
 */
router.post("/wallet/debit", auth_1.authenticate, wallet_controller_1.debitWalletController);
exports.default = router;
