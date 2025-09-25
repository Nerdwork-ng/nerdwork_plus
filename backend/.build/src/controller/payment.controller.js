"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTransactionByJwtForCreators = exports.fetchTransactionByJwtForReaders = exports.handlePayment = exports.createWebhookForPayment = exports.createPaymentLink = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../model/schema");
const helio_config_1 = require("../config/helio.config");
// const HELIO_API_BASE = "https://api.dev.hel.io/v1";
const HELIO_API_BASE = "https://api.hel.io/v1"; // For production
const HELIO_PUBLIC_KEY = process.env.HELIO_PUBLIC_KEY;
const HELIO_PRIVATE_KEY = process.env.HELIO_PRIVATE_KEY;
const WEBHOOK_REDIRECT_URL = process.env.WEBHOOK_REDIRECT_URL;
const HELIO_WALLET_ID = process.env.HELIO_WALLET_ID;
const HELIO_PCURRENCY = process.env.HELIO_PCURRENCY;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const transaction_controller_1 = require("./transaction.controller");
const userTransaction_1 = require("../model/userTransaction");
const library_controller_1 = require("./library.controller");
const createPaymentLink = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    console.log(userId);
    try {
        const { amount, name, redirectUrl } = req.body;
        if (!amount) {
            return res.status(400).json({
                error: "Missing required fields: amount, currency, name",
            });
        }
        // const currencies = await sdk.currency.getAllCurrencies();
        // return res.status(200).json({
        //     success: true,
        //     currencies
        // });
        // Prepare DTO for Helio
        const createPaylinkDto = {
            name: "NWT_PURCHASE", // Unique name for each payment link
            price: (Number(amount) * 100000).toString(), // Ensure amount is a number
            pricingCurrency: HELIO_PCURRENCY,
            description: `Payment for Nerd Work Token by ${userId} on ${new Date().toISOString()} amount: ${amount} `,
            features: {},
            redirectUrl,
            recipients: [
                {
                    walletId: HELIO_WALLET_ID,
                    currencyId: HELIO_PCURRENCY,
                },
            ],
        };
        // Call Helio SDK
        const helioResponse = await helio_config_1.sdk.paylink.create(createPaylinkDto);
        // Calculate NWT amount (assuming 1 USD = 90.49 NWT based on your frontend calculation)
        const nwtAmount = amount * 100; // This should match your frontend calculation
        // Create user purchase transaction record
        const transactionResult = await (0, transaction_controller_1.createUserPurchaseTransaction)(userId, nwtAmount, amount, // USD amount
        helioResponse.id, `Purchase ${nwtAmount} NWT for $${amount} via Helio`);
        if (!transactionResult.success) {
            console.error("Failed to create transaction record:", transactionResult.error);
            // Continue anyway - we can still process the payment
        }
        console.log("Helio payment created:", helioResponse.id);
        console.log("Transaction record created:", transactionResult);
        res.json({
            success: true,
            payment: helioResponse,
            paylinkId: helioResponse.id,
            transactionId: transactionResult.transaction?.id,
            nwtAmount,
            usdAmount: amount,
        });
    }
    catch (error) {
        console.error("Helio payment link creation error:", error.response?.data || error.message);
        res.status(500).json({
            error: "Failed to create payment link",
            details: error.response?.data || error.message,
        });
    }
};
exports.createPaymentLink = createPaymentLink;
const createWebhookForPayment = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    console.log(userId);
    try {
        const { paymentId } = req.body;
        console.log(paymentId);
        const events = ["CREATED"];
        const webhookPayload = {
            name: "Nerd Work Payment Webhook",
            targetUrl: WEBHOOK_REDIRECT_URL || "http://nerdwork.ng/helio/webhook/handle",
            paylinkId: paymentId,
        };
        const response = await helio_config_1.sdk.paylinkWebhook.createPaylinkWebhook(webhookPayload);
        console.log("Webhook created successfully:", response);
        // add paymet update
        // await db.update(payments)
        //     .set({ webhookId: response.id }) // Add this column if you want to store webhookId
        //     .where(eq(payments.paymentIntentId, paymentId));
        res.json({
            success: true,
            data: response,
        });
    }
    catch (error) {
        console.error("Helio payment webhhok :", error.response?.data || error.message);
        res.status(500).json({
            error: "Failed to create webhook",
            details: error.response?.data || error.message,
        });
    }
};
exports.createWebhookForPayment = createWebhookForPayment;
// // incomming req body
// {
//     transaction: 'BcQK8ibZFXpjQbBNSWGar11Xi85AT21hfaknQB4FJB4HPLtV2mrZbjSZtKeug14crw9qKVgmyWxtJT7G4fBq3WD',
//     data: {
//       content: {},
//       transactionSignature: 'BcQK8ibZFXpjQbBNSWGar11Xi85AT21hfaknQB4FJB4HPLtV2mrZbjSZtKeug14crw9qKVgmyWxtJT7G4fBq3WD',
//       status: 'SUCCESS',
//       statusToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvblNpZ25hdHVyZSI6IkJjUUs4aWJaRlhwalFiQk5TV0dhcjExWGk4NUFUMjFoZmFrblFCNEZKQjRIUEx0VjJtclpialNadEtldWcxNGNydzlxS1ZnbXlXeHRKVDdHNGZCcTNXRCIsInRyYW5zYWN0aW9uSWQiOiI2OGJlNjlkNzVmMTI3ODQzZjFiZjQ1MmQiLCJpYXQiOjE3NTczMDk0MDMsImV4cCI6MTc1NzMxNjYwM30.lXf2-BAlDhJrWytTZGCwK-ehm27Oq7XKtmATtlyAldk'
//     },
//     blockchainSymbol: 'SOL',
//     senderPK: 'FBnExnQQzaowHA3g5VQKV9JKbD4StwnMNz8EymUo9wcT'
//   }
const handlePayment = async (req, res) => {
    try {
        console.log("Webhook received:", req.body);
        const { transaction: txHash, data, blockchainSymbol, senderPK } = req.body;
        if (!data || !data.transactionSignature) {
            console.log("Invalid webhook data received");
            return res.status(400).json({ error: "Invalid webhook data" });
        }
        const { transactionSignature, status, statusToken } = data;
        const transaction = await helio_config_1.sdk.transaction.getTransaction(transactionSignature);
        console.log("Processing webhook:", {
            status,
            transactionSignature,
            blockchainSymbol,
        });
        // Find the transaction by transaction signature or other identifier
        // Note: You'll need to store the transaction signature when creating the payment
        // For now, we'll try to match by metadata or implement a lookup mechanism
        if (status === "SUCCESS") {
            // For successful payments, we need to:
            // 1. Update the transaction status
            // 2. Add NWT to user's wallet
            console.log("Payment successful, processing...");
            // You might need to implement a way to map the blockchain transaction
            // back to your Helio payment ID. For now, this is a placeholder:
            // Example: If you store the transaction signature in metadata
            const updateResult = await (0, transaction_controller_1.updateUserTransactionStatus)(transaction.paylink.id, // Using tx signature as lookup - you may need to adjust this
            "completed", transaction.meta.transactionDataHash, {
                blockchainSymbol: transaction.paymentRequestCurrencySymbol,
                senderPK,
                statusToken,
                webhookData: req.body,
            });
            console.log("Transaction update result:", updateResult);
            if (updateResult.success && updateResult.transaction) {
                // Update user wallet balance
                const balanceResult = await (0, transaction_controller_1.updateUserWalletBalance)(updateResult.transaction.userId, parseFloat(Number(updateResult.transaction.nwtAmount).toFixed(0)), "add");
                console.log("Balance update result:", balanceResult);
                console.log("Transaction completed:", {
                    transactionId: updateResult.transaction.id,
                    balanceUpdated: balanceResult.success,
                    newBalance: balanceResult.newBalance,
                });
            }
        }
        else {
            // Handle failed transactions
            console.log("Payment failed or pending:", status);
            await (0, transaction_controller_1.updateUserTransactionStatus)(transaction.paylink.id, "failed", transaction.meta.transactionDataHash, {
                blockchainSymbol: transaction.paymentRequestCurrencySymbol,
                senderPK,
                statusToken,
                webhookData: req.body,
            }, `Payment failed with status: ${status}`);
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error("Error handling payment webhook:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.handlePayment = handlePayment;
const fetchTransactionByJwtForReaders = async (req, res) => {
    try {
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const [reader] = await db_1.db
            .select()
            .from(schema_1.readerProfile)
            .where((0, drizzle_orm_1.eq)(schema_1.readerProfile.userId, userId));
        if (!reader) {
            return res.status(404).json({ message: "Reader With Jwt not found" });
        }
        const userTransaction = await db_1.db
            .select()
            .from(userTransaction_1.userTransactions)
            .where((0, drizzle_orm_1.eq)(userTransaction_1.userTransactions.userId, reader.id))
            .orderBy((0, drizzle_orm_1.desc)(userTransaction_1.userTransactions.createdAt));
        return res.json({ transaction: userTransaction });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Failed to fetch Transactions" });
    }
};
exports.fetchTransactionByJwtForReaders = fetchTransactionByJwtForReaders;
const fetchTransactionByJwtForCreators = async (req, res) => {
    try {
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const [creator] = await db_1.db
            .select()
            .from(schema_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(schema_1.creatorProfile.userId, userId));
        if (!creator) {
            return res.status(404).json({ message: "Creator With Jwt not found" });
        }
        const creatorTransaction = await db_1.db
            .select()
            .from(schema_1.creatorTransactions)
            .where((0, drizzle_orm_1.eq)(schema_1.creatorTransactions.creatorId, creator.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.creatorTransactions.createdAt));
        return res.json({ transaction: creatorTransaction });
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ message: "Failed to fetch Transactions" });
    }
};
exports.fetchTransactionByJwtForCreators = fetchTransactionByJwtForCreators;
