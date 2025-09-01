import { Router } from "express";
import { 
  getWallet, 
  getTransactionHistory, 
  getNwtPricing,
  createPaymentLink,
  checkPaymentStatus,
  spendNwtTokens,
  connectWallet,
  processWebhook
} from "../controller/wallet.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Wallet routes (all require authentication)
router.get("/", authenticate, getWallet);
router.get("/transactions", authenticate, getTransactionHistory);
router.get("/pricing", getNwtPricing); // Public route for pricing
router.post("/connect", authenticate, connectWallet);
router.post("/spend", authenticate, spendNwtTokens);

// Helio payment routes
router.post("/payment-link", authenticate, createPaymentLink);
router.get("/payment/:paymentId/status", authenticate, checkPaymentStatus);

// Webhook routes (no auth required)
router.post("/webhooks/helio", processWebhook);

export default router;