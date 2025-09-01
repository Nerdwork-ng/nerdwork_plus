import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { wallets, transactions, nwtPricing } from "../model/wallet.js";
import HelioService, { type CreatePaymentLinkRequest } from '../services/helio.service.js';

// Initialize Helio service
const helioService = new HelioService({
  apiKey: process.env.HELIO_API_KEY || '',
  baseUrl: process.env.HELIO_BASE_URL || 'https://api.hel.io',
  cluster: process.env.HELIO_CLUSTER as 'devnet' | 'mainnet' || 'devnet',
});

// Get user wallet
export const getWallet = async (req: any, res: any) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    // Get or create wallet
    let [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    if (!wallet) {
      [wallet] = await db
        .insert(wallets)
        .values({ userId })
        .returning();
    }

    return res.status(200).json({
      success: true,
      data: wallet,
      message: "Wallet retrieved successfully"
    });
  } catch (error: any) {
    console.error("Get wallet error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Get transaction history
export const getTransactionHistory = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    let whereConditions = [eq(transactions.userId, userId)];
    if (type) {
      whereConditions.push(eq(transactions.type, type));
    }

    const transactionList = await db
      .select()
      .from(transactions)
      .where(and(...whereConditions))
      .orderBy(desc(transactions.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(transactions)
      .where(and(...whereConditions));

    return res.status(200).json({
      success: true,
      data: {
        transactions: transactionList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].count,
          totalPages: Math.ceil(Number(totalCount[0].count) / parseInt(limit))
        }
      },
      message: "Transaction history retrieved successfully"
    });
  } catch (error: any) {
    console.error("Get transaction history error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Get NWT pricing packages
export const getNwtPricing = async (req: any, res: any) => {
  try {
    const pricingPackages = await db
      .select()
      .from(nwtPricing)
      .where(eq(nwtPricing.isActive, true))
      .orderBy(nwtPricing.displayOrder);

    return res.status(200).json({
      success: true,
      data: pricingPackages,
      message: "NWT pricing retrieved successfully"
    });
  } catch (error: any) {
    console.error("Get NWT pricing error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Create payment link for NWT token purchase
export const createPaymentLink = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { packageId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    // Get pricing package
    const [pricingPackage] = await db
      .select()
      .from(nwtPricing)
      .where(and(eq(nwtPricing.id, packageId), eq(nwtPricing.isActive, true)));

    if (!pricingPackage) {
      return res.status(404).json({
        success: false,
        error: "Pricing package not found",
        timestamp: new Date().toISOString()
      });
    }

    // Get or create wallet
    let [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    if (!wallet) {
      [wallet] = await db
        .insert(wallets)
        .values({ userId })
        .returning();
    }

    // Create Helio payment link
    const paymentLinkRequest: CreatePaymentLinkRequest = {
      productName: `${pricingPackage.nwtAmount} NWT Tokens - ${pricingPackage.packageName}`,
      productDescription: pricingPackage.description || `Purchase ${pricingPackage.nwtAmount} NWT tokens`,
      price: parseFloat(pricingPackage.usdPrice),
      currency: 'USDC',
      receiverWallet: process.env.HELIO_RECEIVER_WALLET || '',
      redirectUrl: process.env.PAYMENT_SUCCESS_URL,
      metadata: {
        userId,
        packageId,
        nwtAmount: pricingPackage.nwtAmount,
        type: 'nwt_purchase'
      }
    };

    const paymentLink = await helioService.createPaymentLink(paymentLinkRequest);

    // Create pending transaction
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        walletId: wallet.id,
        type: 'purchase',
        amount: pricingPackage.nwtAmount,
        description: `Purchased ${pricingPackage.nwtAmount} NWT tokens (${pricingPackage.packageName})`,
        status: 'pending',
        paymentMethod: 'helio',
        externalTransactionId: paymentLink.id,
        metadata: {
          packageId,
          usdPrice: pricingPackage.usdPrice,
          bonusPercentage: pricingPackage.bonusPercentage,
          paymentLink: paymentLink.url
        }
      })
      .returning();

    return res.status(200).json({
      success: true,
      data: {
        transaction,
        paymentLink: {
          id: paymentLink.id,
          url: paymentLink.url,
          qrCode: paymentLink.qrCode,
          status: paymentLink.status
        }
      },
      message: "Payment link created successfully"
    });
  } catch (error: any) {
    console.error("Create payment link error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Check payment status and complete purchase
export const checkPaymentStatus = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { paymentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    // Get transaction by external payment ID
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.externalTransactionId, paymentId)
      ));

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
        timestamp: new Date().toISOString()
      });
    }

    if (transaction.status === 'completed') {
      return res.status(200).json({
        success: true,
        data: { transaction },
        message: "Payment already completed"
      });
    }

    // Check payment status with Helio
    const paymentStatus = await helioService.checkPaymentStatus(paymentId);

    if (paymentStatus.status === 'completed') {
      // Get wallet
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, transaction.walletId));

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update wallet balance
      const newBalance = (parseFloat(wallet.nwtBalance) + parseFloat(transaction.amount)).toFixed(8);
      const newTotalEarned = (parseFloat(wallet.totalEarned) + parseFloat(transaction.amount)).toFixed(8);

      await db
        .update(wallets)
        .set({
          nwtBalance: newBalance,
          totalEarned: newTotalEarned,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));

      // Update transaction status
      await db
        .update(transactions)
        .set({
          status: 'completed',
          metadata: {
            ...transaction.metadata as any,
            transactionHash: paymentStatus.transactionHash,
            paidAt: paymentStatus.paidAt
          },
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, transaction.id));

      const updatedTransaction = { ...transaction, status: 'completed' as const };

      return res.status(200).json({
        success: true,
        data: {
          transaction: updatedTransaction,
          paymentStatus,
          newBalance
        },
        message: "Payment completed successfully"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        transaction,
        paymentStatus
      },
      message: "Payment still pending"
    });
  } catch (error: any) {
    console.error("Check payment status error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Spend NWT tokens
export const spendNwtTokens = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { amount, description, referenceId, referenceType } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    const spendAmount = parseFloat(amount);
    if (spendAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
        timestamp: new Date().toISOString()
      });
    }

    // Get wallet
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
        timestamp: new Date().toISOString()
      });
    }

    const currentBalance = parseFloat(wallet.nwtBalance);
    if (currentBalance < spendAmount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient NWT balance",
        timestamp: new Date().toISOString()
      });
    }

    // Start transaction
    const newBalance = (currentBalance - spendAmount).toFixed(8);
    const newTotalSpent = (parseFloat(wallet.totalSpent) + spendAmount).toFixed(8);

    // Update wallet balance
    await db
      .update(wallets)
      .set({
        nwtBalance: newBalance,
        totalSpent: newTotalSpent,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    // Create spend transaction
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        walletId: wallet.id,
        type: 'spend',
        amount: spendAmount.toFixed(8),
        description,
        referenceId,
        referenceType,
        status: 'completed',
        paymentMethod: 'nwt',
      })
      .returning();

    return res.status(200).json({
      success: true,
      data: {
        transaction,
        newBalance,
        spentAmount: spendAmount
      },
      message: "NWT tokens spent successfully"
    });
  } catch (error: any) {
    console.error("Spend NWT tokens error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Connect Solana wallet
export const connectWallet = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { walletAddress, walletType } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    if (!walletAddress || !walletType) {
      return res.status(400).json({
        success: false,
        error: "Wallet address and type are required",
        timestamp: new Date().toISOString()
      });
    }

    // Get or create wallet
    let [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    if (!wallet) {
      [wallet] = await db
        .insert(wallets)
        .values({ 
          userId,
          connectedWalletAddress: walletAddress,
          walletType
        })
        .returning();
    } else {
      // Update existing wallet with new connection
      await db
        .update(wallets)
        .set({
          connectedWalletAddress: walletAddress,
          walletType,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));
      
      wallet.connectedWalletAddress = walletAddress;
      wallet.walletType = walletType;
    }

    return res.status(200).json({
      success: true,
      data: wallet,
      message: "Wallet connected successfully"
    });
  } catch (error: any) {
    console.error("Connect wallet error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Process Helio webhook
export const processWebhook = async (req: any, res: any) => {
  try {
    const signature = req.headers['x-helio-signature'];
    const payload = req.body;

    // Process webhook payload
    const webhookData = await helioService.processWebhook(payload, signature);

    if (webhookData.status === 'completed') {
      // Find transaction by payment ID
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.externalTransactionId, webhookData.id));

      if (transaction && transaction.status === 'pending') {
        // Get wallet
        const [wallet] = await db
          .select()
          .from(wallets)
          .where(eq(wallets.id, transaction.walletId));

        if (wallet) {
          // Update wallet balance
          const newBalance = (parseFloat(wallet.nwtBalance) + parseFloat(transaction.amount)).toFixed(8);
          const newTotalEarned = (parseFloat(wallet.totalEarned) + parseFloat(transaction.amount)).toFixed(8);

          await db
            .update(wallets)
            .set({
              nwtBalance: newBalance,
              totalEarned: newTotalEarned,
              updatedAt: new Date(),
            })
            .where(eq(wallets.id, wallet.id));

          // Update transaction status
          await db
            .update(transactions)
            .set({
              status: 'completed',
              metadata: {
                ...transaction.metadata as any,
                transactionHash: webhookData.transactionHash,
                paidAt: webhookData.paidAt
              },
              updatedAt: new Date(),
            })
            .where(eq(transactions.id, transaction.id));
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Process webhook error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};