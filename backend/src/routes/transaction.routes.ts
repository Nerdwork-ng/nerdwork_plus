import { Router } from "express";
import {
  fetchTransactionByJwtForCreators,
  fetchTransactionByJwtForReaders,
} from "../controller/payment.controller";

const router = Router();

router.get("/reader", fetchTransactionByJwtForReaders);
router.get("/creator", fetchTransactionByJwtForCreators);

/**
 * @swagger
 * /transactions/reader:
 *   get:
 *     summary: Fetch transactions for a reader by JWT
 *     description: Returns all transactions for the authenticated reader using the JWT token.
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched reader transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "txn_12345"
 *                       userId:
 *                         type: string
 *                         example: "reader_1"
 *                       amount:
 *                         type: number
 *                         example: 100
 *                       type:
 *                         type: string
 *                         example: "chapter_unlock"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-04T10:00:00Z"
 *       401:
 *         description: Unauthorized (JWT missing or invalid)
 *       404:
 *         description: Reader With Jwt not found
 *       400:
 *         description: Failed to fetch transactions
 *
 * /transactions/creator:
 *   get:
 *     summary: Fetch transactions for a creator by JWT
 *     description: Returns all transactions for the authenticated creator using the JWT token.
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched creator transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "txn_67890"
 *                       userId:
 *                         type: string
 *                         example: "creator_1"
 *                       amount:
 *                         type: number
 *                         example: 250
 *                       type:
 *                         type: string
 *                         example: "chapter_unlock"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-04T12:30:00Z"
 *       401:
 *         description: Unauthorized (JWT missing or invalid)
 *       404:
 *         description: Creator With Jwt not found
 *       400:
 *         description: Failed to fetch transactions
 */

export default router;
