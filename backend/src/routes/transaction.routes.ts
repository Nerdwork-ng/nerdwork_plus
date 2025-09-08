import { Router } from "express";
import {
  getUserTransactionHistory,
  getUserTransactionById,
  getUserWalletSummary,
} from "../controller/transaction.controller";
import { authenticate } from "../middleware/common/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Transactions
 *     description: User transaction management and history
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         transactionType:
 *           type: string
 *           enum: [purchase, spend, refund]
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         nwtAmount:
 *           type: string
 *           description: NWT amount as decimal string
 *         usdAmount:
 *           type: string
 *           description: USD amount for purchases
 *         description:
 *           type: string
 *         spendCategory:
 *           type: string
 *           enum: [chapter_unlock, comic_purchase, tip_creator, subscription]
 *         contentId:
 *           type: string
 *           format: uuid
 *         creatorId:
 *           type: string
 *           format: uuid
 *         helioPaymentId:
 *           type: string
 *         blockchainTxHash:
 *           type: string
 *         metadata:
 *           type: object
 *         failureReason:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /transactions/history:
 *   get:
 *     summary: Get user transaction history with pagination and filtering
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of transactions per page
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [purchase, spend, refund]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter by transaction status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions up to this date
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalTransactions:
 *                           type: integer
 *                           example: 47
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/history", authenticate, getUserTransactionHistory);

/**
 * @swagger
 * /transactions/{transactionId}:
 *   get:
 *     summary: Get a specific transaction by ID with content details
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the transaction
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *                     contentDetails:
 *                       type: object
 *                       oneOf:
 *                         - type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: "chapter"
 *                             chapter:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 title:
 *                                   type: string
 *                                 chapterNumber:
 *                                   type: integer
 *                                 comicId:
 *                                   type: string
 *                             comic:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 title:
 *                                   type: string
 *                                 slug:
 *                                   type: string
 *                         - type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: "comic"
 *                             comic:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 title:
 *                                   type: string
 *                                 slug:
 *                                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.get("/:transactionId", authenticate, getUserTransactionById);

/**
 * @swagger
 * /transactions/wallet/summary:
 *   get:
 *     summary: Get user wallet balance and transaction summary statistics
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     walletBalance:
 *                       type: number
 *                       example: 150.75
 *                       description: Current NWT balance
 *                     profileType:
 *                       type: string
 *                       enum: [reader, creator]
 *                       example: "reader"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalPurchased:
 *                           type: number
 *                           example: 500.00
 *                           description: Total NWT purchased
 *                         totalSpent:
 *                           type: number
 *                           example: 349.25
 *                           description: Total NWT spent on content
 *                         pendingPurchases:
 *                           type: number
 *                           example: 25.50
 *                           description: NWT from pending purchase transactions
 *                         completedTransactions:
 *                           type: integer
 *                           example: 23
 *                           description: Number of completed transactions
 *                         netBalance:
 *                           type: number
 *                           example: 150.75
 *                           description: Total purchased minus total spent
 *                     statistics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           transactionType:
 *                             type: string
 *                           status:
 *                             type: string
 *                           totalAmount:
 *                             type: string
 *                           count:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User profile not found
 *       500:
 *         description: Server error
 */
router.get("/wallet/summary", authenticate, getUserWalletSummary);

export default router;