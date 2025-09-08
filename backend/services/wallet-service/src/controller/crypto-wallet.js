import { eq, and } from "drizzle-orm";
import { db } from "../config/db.js";
import { wallets, transactions, nwtPricing } from "../model/wallet.js";
import HelioService from '../services/helio.service.js';
// Initialize Helio service
const helioService = new HelioService({
    apiKey: process.env.HELIO_API_KEY || '',
    baseUrl: process.env.HELIO_BASE_URL || 'https://api.hel.io',
    cluster: process.env.HELIO_CLUSTER || 'devnet',
});
// Connect crypto wallet
export const connectCryptoWallet = async (req, res) => {
    try {
        const userId = req.userId;
        const { walletAddress, walletType, signature } = req.body;
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
        // TODO: Verify wallet signature here for security
        // For MVP, we'll trust the frontend verification
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
        // Update wallet with crypto wallet info
        [wallet] = await db
            .update(wallets)
            .set({
            connectedWalletAddress: walletAddress,
            walletType,
            updatedAt: new Date(),
        })
            .where(eq(wallets.id, wallet.id))
            .returning();
        return res.status(200).json({
            success: true,
            data: {
                walletId: wallet.id,
                connectedWalletAddress: wallet.connectedWalletAddress,
                walletType: wallet.walletType,
            },
            message: "Crypto wallet connected successfully"
        });
    }
    catch (error) {
        console.error("Connect crypto wallet error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Purchase NWT tokens with crypto via Helio
export const purchaseNwtWithCrypto = async (req, res) => {
    try {
        const userId = req.userId;
        const { packageId, currency = 'USDC', redirectUrl } = req.body;
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
        // Create pending transaction
        const [transaction] = await db
            .insert(transactions)
            .values({
            userId,
            walletId: wallet.id,
            type: 'purchase',
            amount: pricingPackage.nwtAmount,
            description: `Purchase ${pricingPackage.nwtAmount} NWT tokens (${pricingPackage.packageName}) with ${currency}`,
            status: 'pending',
            paymentMethod: 'helio_crypto',
            metadata: {
                packageId,
                currency,
                usdPrice: pricingPackage.usdPrice,
                bonusPercentage: pricingPackage.bonusPercentage,
                paymentProvider: 'helio'
            }
        })
            .returning();
        // Create Helio payment link
        const paymentLinkRequest = {
            productName: `${pricingPackage.packageName} NWT Package`,
            productDescription: `${pricingPackage.nwtAmount} NWT tokens for Nerdwork+ platform`,
            price: parseFloat(pricingPackage.usdPrice),
            currency: currency,
            receiverWallet: process.env.HELIO_RECEIVER_WALLET || '',
            redirectUrl,
            metadata: {
                transactionId: transaction.id,
                userId,
                packageId,
                nwtAmount: pricingPackage.nwtAmount,
            }
        };
        const helioPayment = await helioService.createPaymentLink(paymentLinkRequest);
        // Update transaction with Helio payment ID
        await db
            .update(transactions)
            .set({
            externalTransactionId: helioPayment.id,
            updatedAt: new Date(),
        })
            .where(eq(transactions.id, transaction.id));
        return res.status(200).json({
            success: true,
            data: {
                transaction,
                paymentLink: {
                    url: helioPayment.url,
                    qrCode: helioPayment.qrCode,
                    id: helioPayment.id,
                    status: helioPayment.status,
                }
            },
            message: "Crypto payment link created successfully"
        });
    }
    catch (error) {
        console.error("Purchase NWT with crypto error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Handle Helio webhook for payment confirmation
export const handleHelioWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['helio-signature'];
        const webhookPayload = req.body;
        // Process webhook
        const paymentStatus = await helioService.processWebhook(webhookPayload, webhookSignature);
        if (paymentStatus.status === 'completed') {
            // Find the transaction by external transaction ID
            const [transaction] = await db
                .select()
                .from(transactions)
                .where(eq(transactions.externalTransactionId, paymentStatus.id));
            if (transaction && transaction.status === 'pending') {
                // Get wallet and update balance
                const [wallet] = await db
                    .select()
                    .from(wallets)
                    .where(eq(wallets.id, transaction.walletId));
                if (wallet) {
                    const newBalance = (parseFloat(wallet.nwtBalance) + parseFloat(transaction.amount)).toFixed(8);
                    const newTotalEarned = (parseFloat(wallet.totalEarned) + parseFloat(transaction.amount)).toFixed(8);
                    // Update wallet balance
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
                        metadata: {
                            ...transaction.metadata,
                            transactionHash: paymentStatus.transactionHash,
                            paidAt: paymentStatus.paidAt,
                            confirmedAmount: paymentStatus.amount,
                            confirmedCurrency: paymentStatus.currency,
                        }
                    })
                        .where(eq(transactions.id, transaction.id));
                }
            }
        }
        else if (paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled') {
            // Update transaction status to failed/cancelled
            await db
                .update(transactions)
                .set({
                status: paymentStatus.status,
                updatedAt: new Date(),
            })
                .where(eq(transactions.externalTransactionId, paymentStatus.id));
        }
        return res.status(200).json({
            success: true,
            message: "Webhook processed successfully"
        });
    }
    catch (error) {
        console.error("Handle Helio webhook error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Check crypto payment status
export const checkCryptoPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        // Check payment status with Helio
        const paymentStatus = await helioService.checkPaymentStatus(paymentId);
        // Find associated transaction
        const [transaction] = await db
            .select()
            .from(transactions)
            .where(and(eq(transactions.externalTransactionId, paymentId), eq(transactions.userId, userId)));
        return res.status(200).json({
            success: true,
            data: {
                paymentStatus,
                transaction
            },
            message: "Payment status retrieved successfully"
        });
    }
    catch (error) {
        console.error("Check crypto payment status error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J5cHRvLXdhbGxldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNyeXB0by13YWxsZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDdEMsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3JDLE9BQU8sRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3ZFLE9BQU8sWUFBK0MsTUFBTSw4QkFBOEIsQ0FBQztBQUUzRiwyQkFBMkI7QUFDM0IsTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFZLENBQUM7SUFDcEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLEVBQUU7SUFDdkMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLG9CQUFvQjtJQUMzRCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFxQyxJQUFJLFFBQVE7Q0FDdkUsQ0FBQyxDQUFDO0FBRUgsd0JBQXdCO0FBQ3hCLE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUFHLEtBQUssRUFBRSxHQUFRLEVBQUUsR0FBUSxFQUFFLEVBQUU7SUFDOUQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUMxQixNQUFNLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBRTFELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNaLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEtBQUssRUFBRSx5QkFBeUI7Z0JBQ2hDLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcs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QUFFLFNBQVMsQ0FBQyxFQUNqRCxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FDaEMsQ0FBQyxDQUFDO1FBRUwsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsSUFBSTtZQUNiLElBQUksRUFBRTtnQkFDSixhQUFhO2dCQUNiLFdBQVc7YUFDWjtZQUNELE9BQU8sRUFBRSx1Q0FBdUM7U0FDakQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLHVCQUF1QjtZQUM5QixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztBQUNILENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGVxLCBhbmQgfSBmcm9tIFwiZHJpenpsZS1vcm1cIjtcclxuaW1wb3J0IHsgZGIgfSBmcm9tIFwiLi4vY29uZmlnL2RiLmpzXCI7XHJcbmltcG9ydCB7IHdhbGxldHMsIHRyYW5zYWN0aW9ucywgbnd0UHJpY2luZyB9IGZyb20gXCIuLi9tb2RlbC93YWxsZXQuanNcIjtcclxuaW1wb3J0IEhlbGlvU2VydmljZSwgeyB0eXBlIENyZWF0ZVBheW1lbnRMaW5rUmVxdWVzdCB9IGZyb20gJy4uL3NlcnZpY2VzL2hlbGlvLnNlcnZpY2UuanMnO1xyXG5cclxuLy8gSW5pdGlhbGl6ZSBIZWxpbyBzZXJ2aWNlXHJcbmNvbnN0IGhlbGlvU2VydmljZSA9IG5ldyBIZWxpb1NlcnZpY2Uoe1xyXG4gIGFwaUtleTogcHJvY2Vzcy5lbnYuSEVMSU9fQVBJX0tFWSB8fCAnJyxcclxuICBiYXNlVXJsOiBwcm9jZXNzLmVudi5IRUxJT19CQVNFX1VSTCB8fCAnaHR0cHM6Ly9hcGkuaGVsLmlvJyxcclxuICBjbHVzdGVyOiBwcm9jZXNzLmVudi5IRUxJT19DTFVTVEVSIGFzICdkZXZuZXQnIHwgJ21haW5uZXQnIHx8ICdkZXZuZXQnLFxyXG59KTtcclxuXHJcbi8vIENvbm5lY3QgY3J5cHRvIHdhbGxldFxyXG5leHBvcnQgY29uc3QgY29ubmVjdENyeXB0b1dhbGxldCA9IGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgdXNlcklkID0gcmVxLnVzZXJJZDtcclxuICAgIGNvbnN0IHsgd2FsbGV0QWRkcmVzcywgd2FsbGV0VHlwZSwgc2lnbmF0dXJlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICBpZiAoIXVzZXJJZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiBcIkF1dGhlbnRpY2F0aW9uIHJlcXVpcmVkXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF3YWxsZXRBZGRyZXNzIHx8ICF3YWxsZXRUeXBlKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgZXJyb3I6IFwiV2FsbGV0IGFkZHJlc3MgYW5kIHR5cGUgYXJlIHJlcXVpcmVkXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETzogVmVyaWZ5IHdhbGxldCBzaWduYXR1cmUgaGVyZSBmb3Igc2VjdXJpdHlcclxuICAgIC8vIEZvciBNVlAsIHdlJ2xsIHRydXN0IHRoZSBmcm9udGVuZCB2ZXJpZmljYXRpb25cclxuXHJcbiAgICAvLyBHZXQgb3IgY3JlYXRlIHdhbGxldFxyXG4gICAgbGV0IFt3YWxsZXRdID0gYXdhaXQgZGJcclxuICAgICAgLnNlbGVjdCgpXHJcbiAgICAgIC5mcm9tKHdhbGxldHMpXHJcbiAgICAgIC53aGVyZShlcSh3YWxsZXRzLnVzZXJJZCwgdXNlcklkKSk7XHJcblxyXG4gICAgaWYgKCF3YWxsZXQpIHtcclxuICAgICAgW3dhbGxldF0gPSBhd2FpdCBkYlxyXG4gICAgICAgIC5pbnNlcnQod2FsbGV0cylcclxuICAgICAgICAudmFsdWVzKHsgdXNlcklkIH0pXHJcbiAgICAgICAgLnJldHVybmluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFVwZGF0ZSB3YWxsZXQgd2l0aCBjcnlwdG8gd2FsbGV0IGluZm9cclxuICAgIFt3YWxsZXRdID0gYXdhaXQgZGJcclxuICAgICAgLnVwZGF0ZSh3YWxsZXRzKVxyXG4gICAgICAuc2V0KHtcclxuICAgICAgICBjb25uZWN0ZWRXYWxsZXRBZGRyZXNzOiB3YWxsZXRBZGRyZXNzLFxyXG4gICAgICAgIHdhbGxldFR5cGUsXHJcbiAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxyXG4gICAgICB9KVxyXG4gICAgICAud2hlcmUoZXEod2FsbGV0cy5pZCwgd2FsbGV0LmlkKSlcclxuICAgICAgLnJldHVybmluZygpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IHtcclxuICAgICAgICB3YWxsZXRJZDogd2FsbGV0LmlkLFxyXG4gICAgICAgIGNvbm5lY3RlZFdhbGxldEFkZHJlc3M6IHdhbGxldC5jb25uZWN0ZWRXYWxsZXRBZGRyZXNzLFxyXG4gICAgICAgIHdhbGxldFR5cGU6IHdhbGxldC53YWxsZXRUeXBlLFxyXG4gICAgICB9LFxyXG4gICAgICBtZXNzYWdlOiBcIkNyeXB0byB3YWxsZXQgY29ubmVjdGVkIHN1Y2Nlc3NmdWxseVwiXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiQ29ubmVjdCBjcnlwdG8gd2FsbGV0IGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBQdXJjaGFzZSBOV1QgdG9rZW5zIHdpdGggY3J5cHRvIHZpYSBIZWxpb1xyXG5leHBvcnQgY29uc3QgcHVyY2hhc2VOd3RXaXRoQ3J5cHRvID0gYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcklkO1xyXG4gICAgY29uc3QgeyBwYWNrYWdlSWQsIGN1cnJlbmN5ID0gJ1VTREMnLCByZWRpcmVjdFVybCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgaWYgKCF1c2VySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJBdXRoZW50aWNhdGlvbiByZXF1aXJlZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCBwcmljaW5nIHBhY2thZ2VcclxuICAgIGNvbnN0IFtwcmljaW5nUGFja2FnZV0gPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20obnd0UHJpY2luZylcclxuICAgICAgLndoZXJlKGFuZChlcShud3RQcmljaW5nLmlkLCBwYWNrYWdlSWQpLCBlcShud3RQcmljaW5nLmlzQWN0aXZlLCB0cnVlKSkpO1xyXG5cclxuICAgIGlmICghcHJpY2luZ1BhY2thZ2UpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJQcmljaW5nIHBhY2thZ2Ugbm90IGZvdW5kXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB3YWxsZXRcclxuICAgIGxldCBbd2FsbGV0XSA9IGF3YWl0IGRiXHJcbiAgICAgIC5zZWxlY3QoKVxyXG4gICAgICAuZnJvbSh3YWxsZXRzKVxyXG4gICAgICAud2hlcmUoZXEod2FsbGV0cy51c2VySWQsIHVzZXJJZCkpO1xyXG5cclxuICAgIGlmICghd2FsbGV0KSB7XHJcbiAgICAgIFt3YWxsZXRdID0gYXdhaXQgZGJcclxuICAgICAgICAuaW5zZXJ0KHdhbGxldHMpXHJcbiAgICAgICAgLnZhbHVlcyh7IHVzZXJJZCB9KVxyXG4gICAgICAgIC5yZXR1cm5pbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgcGVuZGluZyB0cmFuc2FjdGlvblxyXG4gICAgY29uc3QgW3RyYW5zYWN0aW9uXSA9IGF3YWl0IGRiXHJcbiAgICAgIC5pbnNlcnQodHJhbnNhY3Rpb25zKVxyXG4gICAgICAudmFsdWVzKHtcclxuICAgICAgICB1c2VySWQsXHJcbiAgICAgICAgd2FsbGV0SWQ6IHdhbGxldC5pZCxcclxuICAgICAgICB0eXBlOiAncHVyY2hhc2UnLFxyXG4gICAgICAgIGFtb3VudDogcHJpY2luZ1BhY2thZ2Uubnd0QW1vdW50LFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgUHVyY2hhc2UgJHtwcmljaW5nUGFja2FnZS5ud3RBbW91bnR9IE5XVCB0b2tlbnMgKCR7cHJpY2luZ1BhY2thZ2UucGFja2FnZU5hbWV9KSB3aXRoICR7Y3VycmVuY3l9YCxcclxuICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcclxuICAgICAgICBwYXltZW50TWV0aG9kOiAnaGVsaW9fY3J5cHRvJyxcclxuICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgcGFja2FnZUlkLFxyXG4gICAgICAgICAgY3VycmVuY3ksXHJcbiAgICAgICAgICB1c2RQcmljZTogcHJpY2luZ1BhY2thZ2UudXNkUHJpY2UsXHJcbiAgICAgICAgICBib251c1BlcmNlbnRhZ2U6IHByaWNpbmdQYWNrYWdlLmJvbnVzUGVyY2VudGFnZSxcclxuICAgICAgICAgIHBheW1lbnRQcm92aWRlcjogJ2hlbGlvJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLnJldHVybmluZygpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBIZWxpbyBwYXltZW50IGxpbmtcclxuICAgIGNvbnN0IHBheW1lbnRMaW5rUmVxdWVzdDogQ3JlYXRlUGF5bWVudExpbmtSZXF1ZXN0ID0ge1xyXG4gICAgICBwcm9kdWN0TmFtZTogYCR7cHJpY2luZ1BhY2thZ2UucGFja2FnZU5hbWV9IE5XVCBQYWNrYWdlYCxcclxuICAgICAgcHJvZHVjdERlc2NyaXB0aW9uOiBgJHtwcmljaW5nUGFja2FnZS5ud3RBbW91bnR9IE5XVCB0b2tlbnMgZm9yIE5lcmR3b3JrKyBwbGF0Zm9ybWAsXHJcbiAgICAgIHByaWNlOiBwYXJzZUZsb2F0KHByaWNpbmdQYWNrYWdlLnVzZFByaWNlKSxcclxuICAgICAgY3VycmVuY3k6IGN1cnJlbmN5IGFzICdVU0RDJyB8ICdTT0wnLFxyXG4gICAgICByZWNlaXZlcldhbGxldDogcHJvY2Vzcy5lbnYuSEVMSU9fUkVDRUlWRVJfV0FMTEVUIHx8ICcnLFxyXG4gICAgICByZWRpcmVjdFVybCxcclxuICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICB0cmFuc2FjdGlvbklkOiB0cmFuc2FjdGlvbi5pZCxcclxuICAgICAgICB1c2VySWQsXHJcbiAgICAgICAgcGFja2FnZUlkLFxyXG4gICAgICAgIG53dEFtb3VudDogcHJpY2luZ1BhY2thZ2Uubnd0QW1vdW50LFxyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGhlbGlvUGF5bWVudCA9IGF3YWl0IGhlbGlvU2VydmljZS5jcmVhdGVQYXltZW50TGluayhwYXltZW50TGlua1JlcXVlc3QpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0cmFuc2FjdGlvbiB3aXRoIEhlbGlvIHBheW1lbnQgSURcclxuICAgIGF3YWl0IGRiXHJcbiAgICAgIC51cGRhdGUodHJhbnNhY3Rpb25zKVxyXG4gICAgICAuc2V0KHtcclxuICAgICAgICBleHRlcm5hbFRyYW5zYWN0aW9uSWQ6IGhlbGlvUGF5bWVudC5pZCxcclxuICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgIH0pXHJcbiAgICAgIC53aGVyZShlcSh0cmFuc2FjdGlvbnMuaWQsIHRyYW5zYWN0aW9uLmlkKSk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgZGF0YToge1xyXG4gICAgICAgIHRyYW5zYWN0aW9uLFxyXG4gICAgICAgIHBheW1lbnRMaW5rOiB7XHJcbiAgICAgICAgICB1cmw6IGhlbGlvUGF5bWVudC51cmwsXHJcbiAgICAgICAgICBxckNvZGU6IGhlbGlvUGF5bWVudC5xckNvZGUsXHJcbiAgICAgICAgICBpZDogaGVsaW9QYXltZW50LmlkLFxyXG4gICAgICAgICAgc3RhdHVzOiBoZWxpb1BheW1lbnQuc3RhdHVzLFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgbWVzc2FnZTogXCJDcnlwdG8gcGF5bWVudCBsaW5rIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5XCJcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJQdXJjaGFzZSBOV1Qgd2l0aCBjcnlwdG8gZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBlcnJvcjogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcclxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEhhbmRsZSBIZWxpbyB3ZWJob29rIGZvciBwYXltZW50IGNvbmZpcm1hdGlvblxyXG5leHBvcnQgY29uc3QgaGFuZGxlSGVsaW9XZWJob29rID0gYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB3ZWJob29rU2lnbmF0dXJlID0gcmVxLmhlYWRlcnNbJ2hlbGlvLXNpZ25hdHVyZSddO1xyXG4gICAgY29uc3Qgd2ViaG9va1BheWxvYWQgPSByZXEuYm9keTtcclxuXHJcbiAgICAvLyBQcm9jZXNzIHdlYmhvb2tcclxuICAgIGNvbnN0IHBheW1lbnRTdGF0dXMgPSBhd2FpdCBoZWxpb1NlcnZpY2UucHJvY2Vzc1dlYmhvb2sod2ViaG9va1BheWxvYWQsIHdlYmhvb2tTaWduYXR1cmUpO1xyXG5cclxuICAgIGlmIChwYXltZW50U3RhdHVzLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpIHtcclxuICAgICAgLy8gRmluZCB0aGUgdHJhbnNhY3Rpb24gYnkgZXh0ZXJuYWwgdHJhbnNhY3Rpb24gSURcclxuICAgICAgY29uc3QgW3RyYW5zYWN0aW9uXSA9IGF3YWl0IGRiXHJcbiAgICAgICAgLnNlbGVjdCgpXHJcbiAgICAgICAgLmZyb20odHJhbnNhY3Rpb25zKVxyXG4gICAgICAgIC53aGVyZShlcSh0cmFuc2FjdGlvbnMuZXh0ZXJuYWxUcmFuc2FjdGlvbklkLCBwYXltZW50U3RhdHVzLmlkKSk7XHJcblxyXG4gICAgICBpZiAodHJhbnNhY3Rpb24gJiYgdHJhbnNhY3Rpb24uc3RhdHVzID09PSAncGVuZGluZycpIHtcclxuICAgICAgICAvLyBHZXQgd2FsbGV0IGFuZCB1cGRhdGUgYmFsYW5jZVxyXG4gICAgICAgIGNvbnN0IFt3YWxsZXRdID0gYXdhaXQgZGJcclxuICAgICAgICAgIC5zZWxlY3QoKVxyXG4gICAgICAgICAgLmZyb20od2FsbGV0cylcclxuICAgICAgICAgIC53aGVyZShlcSh3YWxsZXRzLmlkLCB0cmFuc2FjdGlvbi53YWxsZXRJZCkpO1xyXG5cclxuICAgICAgICBpZiAod2FsbGV0KSB7XHJcbiAgICAgICAgICBjb25zdCBuZXdCYWxhbmNlID0gKHBhcnNlRmxvYXQod2FsbGV0Lm53dEJhbGFuY2UpICsgcGFyc2VGbG9hdCh0cmFuc2FjdGlvbi5hbW91bnQpKS50b0ZpeGVkKDgpO1xyXG4gICAgICAgICAgY29uc3QgbmV3VG90YWxFYXJuZWQgPSAocGFyc2VGbG9hdCh3YWxsZXQudG90YWxFYXJuZWQpICsgcGFyc2VGbG9hdCh0cmFuc2FjdGlvbi5hbW91bnQpKS50b0ZpeGVkKDgpO1xyXG5cclxuICAgICAgICAgIC8vIFVwZGF0ZSB3YWxsZXQgYmFsYW5jZVxyXG4gICAgICAgICAgYXdhaXQgZGJcclxuICAgICAgICAgICAgLnVwZGF0ZSh3YWxsZXRzKVxyXG4gICAgICAgICAgICAuc2V0KHtcclxuICAgICAgICAgICAgICBud3RCYWxhbmNlOiBuZXdCYWxhbmNlLFxyXG4gICAgICAgICAgICAgIHRvdGFsRWFybmVkOiBuZXdUb3RhbEVhcm5lZCxcclxuICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC53aGVyZShlcSh3YWxsZXRzLmlkLCB3YWxsZXQuaWQpKTtcclxuXHJcbiAgICAgICAgICAvLyBVcGRhdGUgdHJhbnNhY3Rpb24gc3RhdHVzXHJcbiAgICAgICAgICBhd2FpdCBkYlxyXG4gICAgICAgICAgICAudXBkYXRlKHRyYW5zYWN0aW9ucylcclxuICAgICAgICAgICAgLnNldCh7XHJcbiAgICAgICAgICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyxcclxuICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgICAgICAgIC4uLnRyYW5zYWN0aW9uLm1ldGFkYXRhIGFzIGFueSxcclxuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uSGFzaDogcGF5bWVudFN0YXR1cy50cmFuc2FjdGlvbkhhc2gsXHJcbiAgICAgICAgICAgICAgICBwYWlkQXQ6IHBheW1lbnRTdGF0dXMucGFpZEF0LFxyXG4gICAgICAgICAgICAgICAgY29uZmlybWVkQW1vdW50OiBwYXltZW50U3RhdHVzLmFtb3VudCxcclxuICAgICAgICAgICAgICAgIGNvbmZpcm1lZEN1cnJlbmN5OiBwYXltZW50U3RhdHVzLmN1cnJlbmN5LFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLndoZXJlKGVxKHRyYW5zYWN0aW9ucy5pZCwgdHJhbnNhY3Rpb24uaWQpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAocGF5bWVudFN0YXR1cy5zdGF0dXMgPT09ICdmYWlsZWQnIHx8IHBheW1lbnRTdGF0dXMuc3RhdHVzID09PSAnY2FuY2VsbGVkJykge1xyXG4gICAgICAvLyBVcGRhdGUgdHJhbnNhY3Rpb24gc3RhdHVzIHRvIGZhaWxlZC9jYW5jZWxsZWRcclxuICAgICAgYXdhaXQgZGJcclxuICAgICAgICAudXBkYXRlKHRyYW5zYWN0aW9ucylcclxuICAgICAgICAuc2V0KHtcclxuICAgICAgICAgIHN0YXR1czogcGF5bWVudFN0YXR1cy5zdGF0dXMsXHJcbiAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgfSlcclxuICAgICAgICAud2hlcmUoZXEodHJhbnNhY3Rpb25zLmV4dGVybmFsVHJhbnNhY3Rpb25JZCwgcGF5bWVudFN0YXR1cy5pZCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6IFwiV2ViaG9vayBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5XCJcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJIYW5kbGUgSGVsaW8gd2ViaG9vayBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLFxyXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gQ2hlY2sgY3J5cHRvIHBheW1lbnQgc3RhdHVzXHJcbmV4cG9ydCBjb25zdCBjaGVja0NyeXB0b1BheW1lbnRTdGF0dXMgPSBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgcGF5bWVudElkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgY29uc3QgdXNlcklkID0gcmVxLnVzZXJJZDtcclxuXHJcbiAgICBpZiAoIXVzZXJJZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiBcIkF1dGhlbnRpY2F0aW9uIHJlcXVpcmVkXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgcGF5bWVudCBzdGF0dXMgd2l0aCBIZWxpb1xyXG4gICAgY29uc3QgcGF5bWVudFN0YXR1cyA9IGF3YWl0IGhlbGlvU2VydmljZS5jaGVja1BheW1lbnRTdGF0dXMocGF5bWVudElkKTtcclxuXHJcbiAgICAvLyBGaW5kIGFzc29jaWF0ZWQgdHJhbnNhY3Rpb25cclxuICAgIGNvbnN0IFt0cmFuc2FjdGlvbl0gPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20odHJhbnNhY3Rpb25zKVxyXG4gICAgICAud2hlcmUoYW5kKFxyXG4gICAgICAgIGVxKHRyYW5zYWN0aW9ucy5leHRlcm5hbFRyYW5zYWN0aW9uSWQsIHBheW1lbnRJZCksXHJcbiAgICAgICAgZXEodHJhbnNhY3Rpb25zLnVzZXJJZCwgdXNlcklkKVxyXG4gICAgICApKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgcGF5bWVudFN0YXR1cyxcclxuICAgICAgICB0cmFuc2FjdGlvblxyXG4gICAgICB9LFxyXG4gICAgICBtZXNzYWdlOiBcIlBheW1lbnQgc3RhdHVzIHJldHJpZXZlZCBzdWNjZXNzZnVsbHlcIlxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkNoZWNrIGNyeXB0byBwYXltZW50IHN0YXR1cyBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLFxyXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgfSk7XHJcbiAgfVxyXG59OyJdfQ==