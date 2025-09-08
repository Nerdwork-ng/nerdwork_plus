import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { wallets, transactions, paymentMethods, nwtPricing } from "../model/wallet.js";
import Stripe from 'stripe';
import HelioService from '../services/helio.service.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
// Initialize Helio service
const helioService = new HelioService({
    apiKey: process.env.HELIO_API_KEY || '',
    baseUrl: process.env.HELIO_BASE_URL || 'https://api.hel.io',
    cluster: process.env.HELIO_CLUSTER || 'devnet',
});
// Get user wallet
export const getWallet = async (req, res) => {
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
    }
    catch (error) {
        console.error("Get wallet error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Get transaction history
export const getTransactionHistory = async (req, res) => {
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
            .select({ count: sql `count(*)` })
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
    }
    catch (error) {
        console.error("Get transaction history error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Get NWT pricing packages
export const getNwtPricing = async (req, res) => {
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
    }
    catch (error) {
        console.error("Get NWT pricing error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Purchase NWT tokens
export const purchaseNwtTokens = async (req, res) => {
    try {
        const userId = req.userId;
        const { packageId, paymentMethodId } = req.body;
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
        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(pricingPackage.usdPrice) * 100), // Convert to cents
            currency: 'usd',
            payment_method: paymentMethodId,
            confirmation_method: 'manual',
            confirm: true,
            metadata: {
                userId,
                packageId,
                nwtAmount: pricingPackage.nwtAmount,
                type: 'nwt_purchase'
            },
        });
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
            paymentMethod: 'stripe',
            externalTransactionId: paymentIntent.id,
            metadata: {
                packageId,
                usdPrice: pricingPackage.usdPrice,
                bonusPercentage: pricingPackage.bonusPercentage
            }
        })
            .returning();
        if (paymentIntent.status === 'succeeded') {
            // Update wallet balance
            const newBalance = (parseFloat(wallet.nwtBalance) + parseFloat(pricingPackage.nwtAmount)).toFixed(8);
            const newTotalEarned = (parseFloat(wallet.totalEarned) + parseFloat(pricingPackage.nwtAmount)).toFixed(8);
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
                updatedAt: new Date(),
            })
                .where(eq(transactions.id, transaction.id));
        }
        return res.status(200).json({
            success: true,
            data: {
                transaction,
                paymentIntent: {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    clientSecret: paymentIntent.client_secret,
                }
            },
            message: paymentIntent.status === 'succeeded'
                ? "NWT tokens purchased successfully"
                : "Payment processing"
        });
    }
    catch (error) {
        console.error("Purchase NWT tokens error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Spend NWT tokens
export const spendNwtTokens = async (req, res) => {
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
    }
    catch (error) {
        console.error("Spend NWT tokens error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Add payment method
export const addPaymentMethod = async (req, res) => {
    try {
        const userId = req.userId;
        const { paymentMethodId } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        // Retrieve payment method from Stripe
        const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (!stripePaymentMethod) {
            return res.status(400).json({
                success: false,
                error: "Invalid payment method",
                timestamp: new Date().toISOString()
            });
        }
        // Create or get Stripe customer
        let customer;
        const existingCustomer = await stripe.customers.search({
            query: `metadata['userId']:'${userId}'`,
        });
        if (existingCustomer.data.length > 0) {
            customer = existingCustomer.data[0];
        }
        else {
            customer = await stripe.customers.create({
                metadata: { userId }
            });
        }
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
        });
        // Save payment method to database
        const [savedPaymentMethod] = await db
            .insert(paymentMethods)
            .values({
            userId,
            type: stripePaymentMethod.type,
            provider: 'stripe',
            externalId: paymentMethodId,
            last4: stripePaymentMethod.card?.last4 || null,
            brand: stripePaymentMethod.card?.brand || null,
            expiryMonth: stripePaymentMethod.card?.exp_month || null,
            expiryYear: stripePaymentMethod.card?.exp_year || null,
            metadata: {
                customerId: customer.id
            }
        })
            .returning();
        return res.status(200).json({
            success: true,
            data: savedPaymentMethod,
            message: "Payment method added successfully"
        });
    }
    catch (error) {
        console.error("Add payment method error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Get payment methods
export const getPaymentMethods = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        const methods = await db
            .select()
            .from(paymentMethods)
            .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.isActive, true)));
        return res.status(200).json({
            success: true,
            data: methods,
            message: "Payment methods retrieved successfully"
        });
    }
    catch (error) {
        console.error("Get payment methods error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbGV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2FsbGV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDakQsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3JDLE9BQU8sRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUN2RixPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxZQUErQyxNQUFNLDhCQUE4QixDQUFDO0FBRTNGLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLElBQUksRUFBRSxFQUFFO0lBQzdELFVBQVUsRUFBRSxZQUFZO0NBQ3pCLENBQUMsQ0FBQztBQUVILDJCQUEyQjtBQUMzQixNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQztJQUNwQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksRUFBRTtJQUN2QyxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksb0JBQW9CO0lBQzNELE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQXFDLElBQUksUUFBUTtDQUN2RSxDQUFDLENBQUM7QUFFSCxrQkFBa0I7QUFDbEIsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFHLEtBQUssRUFBRSxHQUFRLEVBQUUsR0FBUSxFQUFFLEVBQUU7SUFDcEQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUUxQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFD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QyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFLE9BQU87WUFDYixPQUFPLEVBQUUsd0NBQXdDO1NBQ2xELENBQUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlcSwgZGVzYywgYW5kLCBzcWwgfSBmcm9tIFwiZHJpenpsZS1vcm1cIjtcclxuaW1wb3J0IHsgZGIgfSBmcm9tIFwiLi4vY29uZmlnL2RiLmpzXCI7XHJcbmltcG9ydCB7IHdhbGxldHMsIHRyYW5zYWN0aW9ucywgcGF5bWVudE1ldGhvZHMsIG53dFByaWNpbmcgfSBmcm9tIFwiLi4vbW9kZWwvd2FsbGV0LmpzXCI7XHJcbmltcG9ydCBTdHJpcGUgZnJvbSAnc3RyaXBlJztcclxuaW1wb3J0IEhlbGlvU2VydmljZSwgeyB0eXBlIENyZWF0ZVBheW1lbnRMaW5rUmVxdWVzdCB9IGZyb20gJy4uL3NlcnZpY2VzL2hlbGlvLnNlcnZpY2UuanMnO1xyXG5cclxuY29uc3Qgc3RyaXBlID0gbmV3IFN0cmlwZShwcm9jZXNzLmVudi5TVFJJUEVfU0VDUkVUX0tFWSB8fCAnJywge1xyXG4gIGFwaVZlcnNpb246ICcyMDIzLTEwLTE2JyxcclxufSk7XHJcblxyXG4vLyBJbml0aWFsaXplIEhlbGlvIHNlcnZpY2VcclxuY29uc3QgaGVsaW9TZXJ2aWNlID0gbmV3IEhlbGlvU2VydmljZSh7XHJcbiAgYXBpS2V5OiBwcm9jZXNzLmVudi5IRUxJT19BUElfS0VZIHx8ICcnLFxyXG4gIGJhc2VVcmw6IHByb2Nlc3MuZW52LkhFTElPX0JBU0VfVVJMIHx8ICdodHRwczovL2FwaS5oZWwuaW8nLFxyXG4gIGNsdXN0ZXI6IHByb2Nlc3MuZW52LkhFTElPX0NMVVNURVIgYXMgJ2Rldm5ldCcgfCAnbWFpbm5ldCcgfHwgJ2Rldm5ldCcsXHJcbn0pO1xyXG5cclxuLy8gR2V0IHVzZXIgd2FsbGV0XHJcbmV4cG9ydCBjb25zdCBnZXRXYWxsZXQgPSBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHVzZXJJZCA9IHJlcS51c2VySWQ7XHJcblxyXG4gICAgaWYgKCF1c2VySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJBdXRoZW50aWNhdGlvbiByZXF1aXJlZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCBvciBjcmVhdGUgd2FsbGV0XHJcbiAgICBsZXQgW3dhbGxldF0gPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20od2FsbGV0cylcclxuICAgICAgLndoZXJlKGVxKHdhbGxldHMudXNlcklkLCB1c2VySWQpKTtcclxuXHJcbiAgICBpZiAoIXdhbGxldCkge1xyXG4gICAgICBbd2FsbGV0XSA9IGF3YWl0IGRiXHJcbiAgICAgICAgLmluc2VydCh3YWxsZXRzKVxyXG4gICAgICAgIC52YWx1ZXMoeyB1c2VySWQgfSlcclxuICAgICAgICAucmV0dXJuaW5nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgZGF0YTogd2FsbGV0LFxyXG4gICAgICBtZXNzYWdlOiBcIldhbGxldCByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5XCJcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJHZXQgd2FsbGV0IGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBHZXQgdHJhbnNhY3Rpb24gaGlzdG9yeVxyXG5leHBvcnQgY29uc3QgZ2V0VHJhbnNhY3Rpb25IaXN0b3J5ID0gYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcklkO1xyXG4gICAgY29uc3QgeyBwYWdlID0gMSwgbGltaXQgPSAyMCwgdHlwZSB9ID0gcmVxLnF1ZXJ5O1xyXG4gICAgY29uc3Qgb2Zmc2V0ID0gKHBhcnNlSW50KHBhZ2UpIC0gMSkgKiBwYXJzZUludChsaW1pdCk7XHJcblxyXG4gICAgaWYgKCF1c2VySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJBdXRoZW50aWNhdGlvbiByZXF1aXJlZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCB3aGVyZUNvbmRpdGlvbnMgPSBbZXEodHJhbnNhY3Rpb25zLnVzZXJJZCwgdXNlcklkKV07XHJcbiAgICBpZiAodHlwZSkge1xyXG4gICAgICB3aGVyZUNvbmRpdGlvbnMucHVzaChlcSh0cmFuc2FjdGlvbnMudHlwZSwgdHlwZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyYW5zYWN0aW9uTGlzdCA9IGF3YWl0IGRiXHJcbiAgICAgIC5zZWxlY3QoKVxyXG4gICAgICAuZnJvbSh0cmFuc2FjdGlvbnMpXHJcbiAgICAgIC53aGVyZShhbmQoLi4ud2hlcmVDb25kaXRpb25zKSlcclxuICAgICAgLm9yZGVyQnkoZGVzYyh0cmFuc2FjdGlvbnMuY3JlYXRlZEF0KSlcclxuICAgICAgLmxpbWl0KHBhcnNlSW50KGxpbWl0KSlcclxuICAgICAgLm9mZnNldChvZmZzZXQpO1xyXG5cclxuICAgIGNvbnN0IHRvdGFsQ291bnQgPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KHsgY291bnQ6IHNxbGBjb3VudCgqKWAgfSlcclxuICAgICAgLmZyb20odHJhbnNhY3Rpb25zKVxyXG4gICAgICAud2hlcmUoYW5kKC4uLndoZXJlQ29uZGl0aW9ucykpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IHtcclxuICAgICAgICB0cmFuc2FjdGlvbnM6IHRyYW5zYWN0aW9uTGlzdCxcclxuICAgICAgICBwYWdpbmF0aW9uOiB7XHJcbiAgICAgICAgICBwYWdlOiBwYXJzZUludChwYWdlKSxcclxuICAgICAgICAgIGxpbWl0OiBwYXJzZUludChsaW1pdCksXHJcbiAgICAgICAgICB0b3RhbDogdG90YWxDb3VudFswXS5jb3VudCxcclxuICAgICAgICAgIHRvdGFsUGFnZXM6IE1hdGguY2VpbChOdW1iZXIodG90YWxDb3VudFswXS5jb3VudCkgLyBwYXJzZUludChsaW1pdCkpXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBtZXNzYWdlOiBcIlRyYW5zYWN0aW9uIGhpc3RvcnkgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseVwiXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiR2V0IHRyYW5zYWN0aW9uIGhpc3RvcnkgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBlcnJvcjogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcclxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEdldCBOV1QgcHJpY2luZyBwYWNrYWdlc1xyXG5leHBvcnQgY29uc3QgZ2V0Tnd0UHJpY2luZyA9IGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcHJpY2luZ1BhY2thZ2VzID0gYXdhaXQgZGJcclxuICAgICAgLnNlbGVjdCgpXHJcbiAgICAgIC5mcm9tKG53dFByaWNpbmcpXHJcbiAgICAgIC53aGVyZShlcShud3RQcmljaW5nLmlzQWN0aXZlLCB0cnVlKSlcclxuICAgICAgLm9yZGVyQnkobnd0UHJpY2luZy5kaXNwbGF5T3JkZXIpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IHByaWNpbmdQYWNrYWdlcyxcclxuICAgICAgbWVzc2FnZTogXCJOV1QgcHJpY2luZyByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5XCJcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJHZXQgTldUIHByaWNpbmcgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBlcnJvcjogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcclxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFB1cmNoYXNlIE5XVCB0b2tlbnNcclxuZXhwb3J0IGNvbnN0IHB1cmNoYXNlTnd0VG9rZW5zID0gYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcklkO1xyXG4gICAgY29uc3QgeyBwYWNrYWdlSWQsIHBheW1lbnRNZXRob2RJZCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgaWYgKCF1c2VySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJBdXRoZW50aWNhdGlvbiByZXF1aXJlZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCBwcmljaW5nIHBhY2thZ2VcclxuICAgIGNvbnN0IFtwcmljaW5nUGFja2FnZV0gPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20obnd0UHJpY2luZylcclxuICAgICAgLndoZXJlKGFuZChlcShud3RQcmljaW5nLmlkLCBwYWNrYWdlSWQpLCBlcShud3RQcmljaW5nLmlzQWN0aXZlLCB0cnVlKSkpO1xyXG5cclxuICAgIGlmICghcHJpY2luZ1BhY2thZ2UpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJQcmljaW5nIHBhY2thZ2Ugbm90IGZvdW5kXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB3YWxsZXRcclxuICAgIGxldCBbd2FsbGV0XSA9IGF3YWl0IGRiXHJcbiAgICAgIC5zZWxlY3QoKVxyXG4gICAgICAuZnJvbSh3YWxsZXRzKVxyXG4gICAgICAud2hlcmUoZXEod2FsbGV0cy51c2VySWQsIHVzZXJJZCkpO1xyXG5cclxuICAgIGlmICghd2FsbGV0KSB7XHJcbiAgICAgIFt3YWxsZXRdID0gYXdhaXQgZGJcclxuICAgICAgICAuaW5zZXJ0KHdhbGxldHMpXHJcbiAgICAgICAgLnZhbHVlcyh7IHVzZXJJZCB9KVxyXG4gICAgICAgIC5yZXR1cm5pbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgU3RyaXBlIHBheW1lbnQgaW50ZW50XHJcbiAgICBjb25zdCBwYXltZW50SW50ZW50ID0gYXdhaXQgc3RyaXBlLnBheW1lbnRJbnRlbnRzLmNyZWF0ZSh7XHJcbiAgICAgIGFtb3VudDogTWF0aC5yb3VuZChwYXJzZUZsb2F0KHByaWNpbmdQYWNrYWdlLnVzZFByaWNlKSAqIDEwMCksIC8vIENvbnZlcnQgdG8gY2VudHNcclxuICAgICAgY3VycmVuY3k6ICd1c2QnLFxyXG4gICAgICBwYXltZW50X21ldGhvZDogcGF5bWVudE1ldGhvZElkLFxyXG4gICAgICBjb25maXJtYXRpb25fbWV0aG9kOiAnbWFudWFsJyxcclxuICAgICAgY29uZmlybTogdHJ1ZSxcclxuICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICB1c2VySWQsXHJcbiAgICAgICAgcGFja2FnZUlkLFxyXG4gICAgICAgIG53dEFtb3VudDogcHJpY2luZ1BhY2thZ2Uubnd0QW1vdW50LFxyXG4gICAgICAgIHR5cGU6ICdud3RfcHVyY2hhc2UnXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgcGVuZGluZyB0cmFuc2FjdGlvblxyXG4gICAgY29uc3QgW3RyYW5zYWN0aW9uXSA9IGF3YWl0IGRiXHJcbiAgICAgIC5pbnNlcnQodHJhbnNhY3Rpb25zKVxyXG4gICAgICAudmFsdWVzKHtcclxuICAgICAgICB1c2VySWQsXHJcbiAgICAgICAgd2FsbGV0SWQ6IHdhbGxldC5pZCxcclxuICAgICAgICB0eXBlOiAncHVyY2hhc2UnLFxyXG4gICAgICAgIGFtb3VudDogcHJpY2luZ1BhY2thZ2Uubnd0QW1vdW50LFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgUHVyY2hhc2VkICR7cHJpY2luZ1BhY2thZ2Uubnd0QW1vdW50fSBOV1QgdG9rZW5zICgke3ByaWNpbmdQYWNrYWdlLnBhY2thZ2VOYW1lfSlgLFxyXG4gICAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxyXG4gICAgICAgIHBheW1lbnRNZXRob2Q6ICdzdHJpcGUnLFxyXG4gICAgICAgIGV4dGVybmFsVHJhbnNhY3Rpb25JZDogcGF5bWVudEludGVudC5pZCxcclxuICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgcGFja2FnZUlkLFxyXG4gICAgICAgICAgdXNkUHJpY2U6IHByaWNpbmdQYWNrYWdlLnVzZFByaWNlLFxyXG4gICAgICAgICAgYm9udXNQZXJjZW50YWdlOiBwcmljaW5nUGFja2FnZS5ib251c1BlcmNlbnRhZ2VcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIC5yZXR1cm5pbmcoKTtcclxuXHJcbiAgICBpZiAocGF5bWVudEludGVudC5zdGF0dXMgPT09ICdzdWNjZWVkZWQnKSB7XHJcbiAgICAgIC8vIFVwZGF0ZSB3YWxsZXQgYmFsYW5jZVxyXG4gICAgICBjb25zdCBuZXdCYWxhbmNlID0gKHBhcnNlRmxvYXQod2FsbGV0Lm53dEJhbGFuY2UpICsgcGFyc2VGbG9hdChwcmljaW5nUGFja2FnZS5ud3RBbW91bnQpKS50b0ZpeGVkKDgpO1xyXG4gICAgICBjb25zdCBuZXdUb3RhbEVhcm5lZCA9IChwYXJzZUZsb2F0KHdhbGxldC50b3RhbEVhcm5lZCkgKyBwYXJzZUZsb2F0KHByaWNpbmdQYWNrYWdlLm53dEFtb3VudCkpLnRvRml4ZWQoOCk7XHJcblxyXG4gICAgICBhd2FpdCBkYlxyXG4gICAgICAgIC51cGRhdGUod2FsbGV0cylcclxuICAgICAgICAuc2V0KHtcclxuICAgICAgICAgIG53dEJhbGFuY2U6IG5ld0JhbGFuY2UsXHJcbiAgICAgICAgICB0b3RhbEVhcm5lZDogbmV3VG90YWxFYXJuZWQsXHJcbiAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgfSlcclxuICAgICAgICAud2hlcmUoZXEod2FsbGV0cy5pZCwgd2FsbGV0LmlkKSk7XHJcblxyXG4gICAgICAvLyBVcGRhdGUgdHJhbnNhY3Rpb24gc3RhdHVzXHJcbiAgICAgIGF3YWl0IGRiXHJcbiAgICAgICAgLnVwZGF0ZSh0cmFuc2FjdGlvbnMpXHJcbiAgICAgICAgLnNldCh7XHJcbiAgICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnLFxyXG4gICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLndoZXJlKGVxKHRyYW5zYWN0aW9ucy5pZCwgdHJhbnNhY3Rpb24uaWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgdHJhbnNhY3Rpb24sXHJcbiAgICAgICAgcGF5bWVudEludGVudDoge1xyXG4gICAgICAgICAgaWQ6IHBheW1lbnRJbnRlbnQuaWQsXHJcbiAgICAgICAgICBzdGF0dXM6IHBheW1lbnRJbnRlbnQuc3RhdHVzLFxyXG4gICAgICAgICAgY2xpZW50U2VjcmV0OiBwYXltZW50SW50ZW50LmNsaWVudF9zZWNyZXQsXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBtZXNzYWdlOiBwYXltZW50SW50ZW50LnN0YXR1cyA9PT0gJ3N1Y2NlZWRlZCcgXHJcbiAgICAgICAgPyBcIk5XVCB0b2tlbnMgcHVyY2hhc2VkIHN1Y2Nlc3NmdWxseVwiIFxyXG4gICAgICAgIDogXCJQYXltZW50IHByb2Nlc3NpbmdcIlxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlB1cmNoYXNlIE5XVCB0b2tlbnMgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBlcnJvcjogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcclxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFNwZW5kIE5XVCB0b2tlbnNcclxuZXhwb3J0IGNvbnN0IHNwZW5kTnd0VG9rZW5zID0gYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcklkO1xyXG4gICAgY29uc3QgeyBhbW91bnQsIGRlc2NyaXB0aW9uLCByZWZlcmVuY2VJZCwgcmVmZXJlbmNlVHlwZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgaWYgKCF1c2VySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJBdXRoZW50aWNhdGlvbiByZXF1aXJlZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNwZW5kQW1vdW50ID0gcGFyc2VGbG9hdChhbW91bnQpO1xyXG4gICAgaWYgKHNwZW5kQW1vdW50IDw9IDApIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJJbnZhbGlkIGFtb3VudFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB3YWxsZXRcclxuICAgIGNvbnN0IFt3YWxsZXRdID0gYXdhaXQgZGJcclxuICAgICAgLnNlbGVjdCgpXHJcbiAgICAgIC5mcm9tKHdhbGxldHMpXHJcbiAgICAgIC53aGVyZShlcSh3YWxsZXRzLnVzZXJJZCwgdXNlcklkKSk7XHJcblxyXG4gICAgaWYgKCF3YWxsZXQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJXYWxsZXQgbm90IGZvdW5kXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY3VycmVudEJhbGFuY2UgPSBwYXJzZUZsb2F0KHdhbGxldC5ud3RCYWxhbmNlKTtcclxuICAgIGlmIChjdXJyZW50QmFsYW5jZSA8IHNwZW5kQW1vdW50KSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgZXJyb3I6IFwiSW5zdWZmaWNpZW50IE5XVCBiYWxhbmNlXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RhcnQgdHJhbnNhY3Rpb25cclxuICAgIGNvbnN0IG5ld0JhbGFuY2UgPSAoY3VycmVudEJhbGFuY2UgLSBzcGVuZEFtb3VudCkudG9GaXhlZCg4KTtcclxuICAgIGNvbnN0IG5ld1RvdGFsU3BlbnQgPSAocGFyc2VGbG9hdCh3YWxsZXQudG90YWxTcGVudCkgKyBzcGVuZEFtb3VudCkudG9GaXhlZCg4KTtcclxuXHJcbiAgICAvLyBVcGRhdGUgd2FsbGV0IGJhbGFuY2VcclxuICAgIGF3YWl0IGRiXHJcbiAgICAgIC51cGRhdGUod2FsbGV0cylcclxuICAgICAgLnNldCh7XHJcbiAgICAgICAgbnd0QmFsYW5jZTogbmV3QmFsYW5jZSxcclxuICAgICAgICB0b3RhbFNwZW50OiBuZXdUb3RhbFNwZW50LFxyXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKSxcclxuICAgICAgfSlcclxuICAgICAgLndoZXJlKGVxKHdhbGxldHMuaWQsIHdhbGxldC5pZCkpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBzcGVuZCB0cmFuc2FjdGlvblxyXG4gICAgY29uc3QgW3RyYW5zYWN0aW9uXSA9IGF3YWl0IGRiXHJcbiAgICAgIC5pbnNlcnQodHJhbnNhY3Rpb25zKVxyXG4gICAgICAudmFsdWVzKHtcclxuICAgICAgICB1c2VySWQsXHJcbiAgICAgICAgd2FsbGV0SWQ6IHdhbGxldC5pZCxcclxuICAgICAgICB0eXBlOiAnc3BlbmQnLFxyXG4gICAgICAgIGFtb3VudDogc3BlbmRBbW91bnQudG9GaXhlZCg4KSxcclxuICAgICAgICBkZXNjcmlwdGlvbixcclxuICAgICAgICByZWZlcmVuY2VJZCxcclxuICAgICAgICByZWZlcmVuY2VUeXBlLFxyXG4gICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCcsXHJcbiAgICAgIH0pXHJcbiAgICAgIC5yZXR1cm5pbmcoKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgdHJhbnNhY3Rpb24sXHJcbiAgICAgICAgbmV3QmFsYW5jZSxcclxuICAgICAgICBzcGVudEFtb3VudDogc3BlbmRBbW91bnRcclxuICAgICAgfSxcclxuICAgICAgbWVzc2FnZTogXCJOV1QgdG9rZW5zIHNwZW50IHN1Y2Nlc3NmdWxseVwiXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiU3BlbmQgTldUIHRva2VucyBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLFxyXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gQWRkIHBheW1lbnQgbWV0aG9kXHJcbmV4cG9ydCBjb25zdCBhZGRQYXltZW50TWV0aG9kID0gYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcklkO1xyXG4gICAgY29uc3QgeyBwYXltZW50TWV0aG9kSWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghdXNlcklkKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgZXJyb3I6IFwiQXV0aGVudGljYXRpb24gcmVxdWlyZWRcIixcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZXRyaWV2ZSBwYXltZW50IG1ldGhvZCBmcm9tIFN0cmlwZVxyXG4gICAgY29uc3Qgc3RyaXBlUGF5bWVudE1ldGhvZCA9IGF3YWl0IHN0cmlwZS5wYXltZW50TWV0aG9kcy5yZXRyaWV2ZShwYXltZW50TWV0aG9kSWQpO1xyXG5cclxuICAgIGlmICghc3RyaXBlUGF5bWVudE1ldGhvZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiBcIkludmFsaWQgcGF5bWVudCBtZXRob2RcIixcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgb3IgZ2V0IFN0cmlwZSBjdXN0b21lclxyXG4gICAgbGV0IGN1c3RvbWVyO1xyXG4gICAgY29uc3QgZXhpc3RpbmdDdXN0b21lciA9IGF3YWl0IHN0cmlwZS5jdXN0b21lcnMuc2VhcmNoKHtcclxuICAgICAgcXVlcnk6IGBtZXRhZGF0YVsndXNlcklkJ106JyR7dXNlcklkfSdgLFxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKGV4aXN0aW5nQ3VzdG9tZXIuZGF0YS5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGN1c3RvbWVyID0gZXhpc3RpbmdDdXN0b21lci5kYXRhWzBdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY3VzdG9tZXIgPSBhd2FpdCBzdHJpcGUuY3VzdG9tZXJzLmNyZWF0ZSh7XHJcbiAgICAgICAgbWV0YWRhdGE6IHsgdXNlcklkIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXR0YWNoIHBheW1lbnQgbWV0aG9kIHRvIGN1c3RvbWVyXHJcbiAgICBhd2FpdCBzdHJpcGUucGF5bWVudE1ldGhvZHMuYXR0YWNoKHBheW1lbnRNZXRob2RJZCwge1xyXG4gICAgICBjdXN0b21lcjogY3VzdG9tZXIuaWQsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTYXZlIHBheW1lbnQgbWV0aG9kIHRvIGRhdGFiYXNlXHJcbiAgICBjb25zdCBbc2F2ZWRQYXltZW50TWV0aG9kXSA9IGF3YWl0IGRiXHJcbiAgICAgIC5pbnNlcnQocGF5bWVudE1ldGhvZHMpXHJcbiAgICAgIC52YWx1ZXMoe1xyXG4gICAgICAgIHVzZXJJZCxcclxuICAgICAgICB0eXBlOiBzdHJpcGVQYXltZW50TWV0aG9kLnR5cGUsXHJcbiAgICAgICAgcHJvdmlkZXI6ICdzdHJpcGUnLFxyXG4gICAgICAgIGV4dGVybmFsSWQ6IHBheW1lbnRNZXRob2RJZCxcclxuICAgICAgICBsYXN0NDogc3RyaXBlUGF5bWVudE1ldGhvZC5jYXJkPy5sYXN0NCB8fCBudWxsLFxyXG4gICAgICAgIGJyYW5kOiBzdHJpcGVQYXltZW50TWV0aG9kLmNhcmQ/LmJyYW5kIHx8IG51bGwsXHJcbiAgICAgICAgZXhwaXJ5TW9udGg6IHN0cmlwZVBheW1lbnRNZXRob2QuY2FyZD8uZXhwX21vbnRoIHx8IG51bGwsXHJcbiAgICAgICAgZXhwaXJ5WWVhcjogc3RyaXBlUGF5bWVudE1ldGhvZC5jYXJkPy5leHBfeWVhciB8fCBudWxsLFxyXG4gICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICBjdXN0b21lcklkOiBjdXN0b21lci5pZFxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLnJldHVybmluZygpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IHNhdmVkUGF5bWVudE1ldGhvZCxcclxuICAgICAgbWVzc2FnZTogXCJQYXltZW50IG1ldGhvZCBhZGRlZCBzdWNjZXNzZnVsbHlcIlxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkFkZCBwYXltZW50IG1ldGhvZCBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLFxyXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gR2V0IHBheW1lbnQgbWV0aG9kc1xyXG5leHBvcnQgY29uc3QgZ2V0UGF5bWVudE1ldGhvZHMgPSBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHVzZXJJZCA9IHJlcS51c2VySWQ7XHJcblxyXG4gICAgaWYgKCF1c2VySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJBdXRoZW50aWNhdGlvbiByZXF1aXJlZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1ldGhvZHMgPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20ocGF5bWVudE1ldGhvZHMpXHJcbiAgICAgIC53aGVyZShhbmQoZXEocGF5bWVudE1ldGhvZHMudXNlcklkLCB1c2VySWQpLCBlcShwYXltZW50TWV0aG9kcy5pc0FjdGl2ZSwgdHJ1ZSkpKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiBtZXRob2RzLFxyXG4gICAgICBtZXNzYWdlOiBcIlBheW1lbnQgbWV0aG9kcyByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5XCJcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJHZXQgcGF5bWVudCBtZXRob2RzIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICB9KTtcclxuICB9XHJcbn07Il19