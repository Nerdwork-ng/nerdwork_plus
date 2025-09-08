import { describe, it, expect, beforeAll } from '@jest/globals';
import axios from 'axios';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:3004';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
describe('💰 Wallet Service Tests', () => {
    let testUserToken;
    let testUserId;
    let walletId;
    let transactionId;
    let paymentMethodId;
    let nwtPackageId;
    const testUser = {
        email: `test-wallet-${Date.now()}@nerdwork.com`,
        password: 'SecureTestPassword123!',
        username: `walletuser${Date.now()}`
    };
    beforeAll(async () => {
        // Create test user
        const signupResponse = await axios.post(`${API_GATEWAY_URL}/auth/signup`, testUser);
        testUserToken = signupResponse.data.data.token;
        testUserId = signupResponse.data.data.user.id;
        console.log('🔧 Test user created for wallet tests');
    });
    describe('Wallet Creation & Management', () => {
        it('should create user wallet automatically', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/wallet/`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.userId).toBe(testUserId);
            expect(response.data.data.nwtBalance).toBe('0.00000000');
            expect(response.data.data.totalEarned).toBe('0.00000000');
            expect(response.data.data.totalSpent).toBe('0.00000000');
            walletId = response.data.data.id;
            console.log('✅ User wallet created/retrieved successfully');
        });
        it('should return same wallet for same user', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/wallet/`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.id).toBe(walletId);
            console.log('✅ Wallet consistency maintained');
        });
        it('should require authentication for wallet access', async () => {
            try {
                await axios.get(`${API_GATEWAY_URL}/wallet/`);
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.success).toBe(false);
            }
            console.log('✅ Wallet access properly protected');
        });
    });
    describe('Crypto Wallet Integration', () => {
        it('should connect crypto wallet successfully', async () => {
            const walletData = {
                walletAddress: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                walletType: 'phantom',
                signature: 'mock_signature_for_testing'
            };
            const response = await axios.post(`${API_GATEWAY_URL}/wallet/crypto/connect`, walletData, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.connectedWalletAddress).toBe(walletData.walletAddress);
            expect(response.data.data.walletType).toBe(walletData.walletType);
            console.log('✅ Crypto wallet connected successfully');
        });
        it('should update existing crypto wallet connection', async () => {
            const newWalletData = {
                walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                walletType: 'solflare',
                signature: 'new_mock_signature'
            };
            const response = await axios.post(`${API_GATEWAY_URL}/wallet/crypto/connect`, newWalletData, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.connectedWalletAddress).toBe(newWalletData.walletAddress);
            expect(response.data.data.walletType).toBe(newWalletData.walletType);
            console.log('✅ Crypto wallet updated successfully');
        });
        it('should reject invalid wallet address', async () => {
            const invalidWalletData = {
                walletAddress: 'invalid_address_format',
                walletType: 'phantom'
            };
            try {
                await axios.post(`${API_GATEWAY_URL}/wallet/crypto/connect`, invalidWalletData, {
                    headers: { Authorization: `Bearer ${testUserToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.success).toBe(false);
            }
            console.log('✅ Invalid wallet address properly rejected');
        });
    });
    describe('NWT Pricing & Packages', () => {
        it('should get NWT pricing packages', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/wallet/pricing`);
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data)).toBe(true);
            if (response.data.data.length > 0) {
                const package1 = response.data.data[0];
                expect(package1.packageName).toBeDefined();
                expect(package1.nwtAmount).toBeDefined();
                expect(package1.usdPrice).toBeDefined();
                expect(package1.isActive).toBe(true);
                nwtPackageId = package1.id;
            }
            console.log('✅ NWT pricing packages retrieved');
        });
        it('should filter active packages only', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/wallet/pricing`);
            const activePackages = response.data.data.filter((pkg) => pkg.isActive);
            expect(response.data.data.length).toBe(activePackages.length);
            console.log('✅ Only active packages returned');
        });
    });
    describe('Helio Crypto Payments', () => {
        it('should create Helio payment link', async () => {
            if (!nwtPackageId) {
                console.log('⚠️ Skipping Helio test - no pricing packages available');
                return;
            }
            const paymentData = {
                packageId: nwtPackageId,
                currency: 'USDC',
                redirectUrl: 'https://nerdwork.com/payment-success'
            };
            const response = await axios.post(`${API_GATEWAY_URL}/wallet/crypto/purchase`, paymentData, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.transaction).toBeDefined();
            expect(response.data.data.paymentLink.url).toBeDefined();
            expect(response.data.data.paymentLink.qrCode).toBeDefined();
            expect(response.data.data.paymentLink.id).toBeDefined();
            transactionId = response.data.data.transaction.id;
            console.log('✅ Helio payment link created successfully');
        });
        it('should handle different crypto currencies', async () => {
            if (!nwtPackageId)
                return;
            const paymentData = {
                packageId: nwtPackageId,
                currency: 'SOL',
                redirectUrl: 'https://nerdwork.com/payment-success'
            };
            const response = await axios.post(`${API_GATEWAY_URL}/wallet/crypto/purchase`, paymentData, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.paymentLink).toBeDefined();
            console.log('✅ SOL payment link created successfully');
        });
        it('should reject invalid package ID', async () => {
            const invalidPaymentData = {
                packageId: '00000000-0000-0000-0000-000000000000',
                currency: 'USDC'
            };
            try {
                await axios.post(`${API_GATEWAY_URL}/wallet/crypto/purchase`, invalidPaymentData, {
                    headers: { Authorization: `Bearer ${testUserToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(404);
                expect(error.response.data.success).toBe(false);
            }
            console.log('✅ Invalid package ID properly rejected');
        });
        it('should simulate Helio webhook processing', async () => {
            if (!transactionId)
                return;
            // Simulate successful payment webhook
            const webhookPayload = {
                id: 'helio_payment_123',
                status: 'completed',
                amount: 10.00,
                currency: 'USDC',
                transaction_hash: '0x1234567890abcdef',
                paid_at: new Date().toISOString(),
                metadata: {
                    transactionId: transactionId
                }
            };
            const response = await axios.post(`${API_GATEWAY_URL}/wallet/webhooks/helio`, webhookPayload, {
                headers: {
                    'helio-signature': 'mock_signature',
                    'Content-Type': 'application/json'
                }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            console.log('✅ Helio webhook processed successfully');
        });
    });
    describe('Traditional Payment Methods', () => {
        it('should purchase NWT tokens with Stripe', async () => {
            if (!nwtPackageId)
                return;
            const purchaseData = {
                packageId: nwtPackageId,
                paymentMethodId: 'pm_card_visa' // Stripe test card
            };
            const response = await axios.post(`${API_GATEWAY_URL}/wallet/purchase`, purchaseData, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.transaction).toBeDefined();
            expect(response.data.data.paymentIntent).toBeDefined();
            console.log('✅ Stripe payment processed successfully');
        });
        it('should add payment method', async () => {
            const paymentMethodData = {
                paymentMethodId: 'pm_card_mastercard'
            };
            const response = await axios.post(`${API_GATEWAY_URL}/wallet/payment-methods`, paymentMethodData, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.externalId).toBe(paymentMethodData.paymentMethodId);
            paymentMethodId = response.data.data.id;
            console.log('✅ Payment method added successfully');
        });
        it('should get user payment methods', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/wallet/payment-methods`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data)).toBe(true);
            if (response.data.data.length > 0) {
                expect(response.data.data[0].userId).toBe(testUserId);
            }
            console.log('✅ Payment methods retrieved successfully');
        });
    });
    describe('NWT Token Management', () => {
        it('should spend NWT tokens', async () => {
            const spendData = {
                amount: '1.50',
                description: 'Comic purchase - The Amazing Crypto Heroes',
                referenceId: 'comic_123',
                referenceType: 'comic'
            };
            const response = await axios.post(`${API_GATEWAY_URL}/wallet/spend`, spendData, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.transaction.type).toBe('spend');
            expect(response.data.data.spentAmount).toBe(1.50);
            console.log('✅ NWT tokens spent successfully');
        });
        it('should reject spending more than balance', async () => {
            const spendData = {
                amount: '1000000.00',
                description: 'Attempt to overspend'
            };
            try {
                await axios.post(`${API_GATEWAY_URL}/wallet/spend`, spendData, {
                    headers: { Authorization: `Bearer ${testUserToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.error).toContain('Insufficient');
            }
            console.log('✅ Overspending properly prevented');
        });
        it('should reject negative spending amounts', async () => {
            const spendData = {
                amount: '-5.00',
                description: 'Negative amount test'
            };
            try {
                await axios.post(`${API_GATEWAY_URL}/wallet/spend`, spendData, {
                    headers: { Authorization: `Bearer ${testUserToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.error).toContain('Invalid amount');
            }
            console.log('✅ Negative amounts properly rejected');
        });
    });
    describe('Transaction History', () => {
        it('should get transaction history', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/wallet/transactions?page=1&limit=10`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data.transactions)).toBe(true);
            expect(response.data.data.pagination).toBeDefined();
            console.log('✅ Transaction history retrieved successfully');
        });
        it('should filter transactions by type', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/wallet/transactions?type=spend&page=1&limit=5`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            // All returned transactions should be of type 'spend'
            response.data.data.transactions.forEach((tx) => {
                expect(tx.type).toBe('spend');
            });
            console.log('✅ Transaction filtering by type working');
        });
        it('should paginate transaction history correctly', async () => {
            const page1 = await axios.get(`${API_GATEWAY_URL}/wallet/transactions?page=1&limit=2`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            const page2 = await axios.get(`${API_GATEWAY_URL}/wallet/transactions?page=2&limit=2`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(page1.data.data.pagination.page).toBe(1);
            expect(page2.data.data.pagination.page).toBe(2);
            // Pages should have different transactions (if there are enough)
            if (page1.data.data.transactions.length > 0 && page2.data.data.transactions.length > 0) {
                expect(page1.data.data.transactions[0].id).not.toBe(page2.data.data.transactions[0].id);
            }
            console.log('✅ Transaction pagination working correctly');
        });
    });
    describe('Service Health & Performance', () => {
        it('should respond to health check', async () => {
            const response = await axios.get(`${WALLET_SERVICE_URL}/health`);
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.service).toBe('wallet-service');
            console.log('✅ Wallet service health check passed');
        });
        it('should handle concurrent wallet operations', async () => {
            const promises = Array.from({ length: 5 }, () => axios.get(`${API_GATEWAY_URL}/wallet/`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            }));
            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.data.data.id).toBe(walletId);
            });
            console.log('✅ Concurrent wallet operations handled successfully');
        });
    });
    describe('Security & Data Integrity', () => {
        it('should maintain accurate balance calculations', async () => {
            const walletResponse = await axios.get(`${API_GATEWAY_URL}/wallet/`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            const wallet = walletResponse.data.data;
            const earned = parseFloat(wallet.totalEarned);
            const spent = parseFloat(wallet.totalSpent);
            const balance = parseFloat(wallet.nwtBalance);
            // Balance should equal earned minus spent
            expect(Math.abs(balance - (earned - spent))).toBeLessThan(0.00000001);
            console.log('✅ Balance calculations accurate');
        });
        it('should not allow access to other users wallets', async () => {
            // Create another test user
            const otherUser = {
                email: `other-user-${Date.now()}@nerdwork.com`,
                password: 'SecureTestPassword123!',
                username: `otheruser${Date.now()}`
            };
            const otherSignup = await axios.post(`${API_GATEWAY_URL}/auth/signup`, otherUser);
            const otherUserToken = otherSignup.data.data.token;
            // Try to access first user's wallet with second user's token
            const response1 = await axios.get(`${API_GATEWAY_URL}/wallet/`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            const response2 = await axios.get(`${API_GATEWAY_URL}/wallet/`, {
                headers: { Authorization: `Bearer ${otherUserToken}` }
            });
            // Should return different wallets
            expect(response1.data.data.id).not.toBe(response2.data.data.id);
            expect(response2.data.data.userId).toBe(otherSignup.data.data.user.id);
            console.log('✅ Wallet isolation maintained between users');
        });
        it('should handle decimal precision correctly', async () => {
            // Test with very small amounts
            const smallSpendData = {
                amount: '0.00000001',
                description: 'Precision test - smallest unit'
            };
            const response = await axios.post(`${API_GATEWAY_URL}/wallet/spend`, smallSpendData, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.spentAmount).toBe(0.00000001);
            console.log('✅ Decimal precision handling correct');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbGV0LXNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhbGxldC1zZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUMxRSxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFFMUIsTUFBTSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLHVCQUF1QixDQUFDO0FBQ3JGLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLHVCQUF1QixDQUFDO0FBRS9FLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7SUFDdkMsSUFBSSxhQUFxQixDQUFDO0lBQzFCLElBQUksVUFBa0IsQ0FBQztJQUN2QixJQUFJLFFBQWdCLENBQUM7SUFDckIsSUFBSSxhQUFxQixDQUFDO0lBQzFCLElBQUksZUFBdUIsQ0FBQztJQUM1QixJQUFJLFlBQW9CLENBQUM7SUFFekIsTUFBTSxRQUFRLEdBQUc7UUFDZixLQUFLLEVBQUUsZUFBZSxJQUFJLENBQUMsR0FBRyxFQUFFLGVBQWU7UUFDL0MsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxRQUFRLEVBQUUsYUFBYSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7S0FDcEMsQ0FBQztJQUVGLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNuQixtQkFBbUI7UUFDbkIsTUFBTSxjQUFjLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsZUFBZSxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEYsYUFBYSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUMvQyxVQUFVLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxD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YWZ0ZXJBbGwgfSBmcm9tICdAamVzdC9nbG9iYWxzJztcclxuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcclxuXHJcbmNvbnN0IFdBTExFVF9TRVJWSUNFX1VSTCA9IHByb2Nlc3MuZW52LldBTExFVF9TRVJWSUNFX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDA0JztcclxuY29uc3QgQVBJX0dBVEVXQVlfVVJMID0gcHJvY2Vzcy5lbnYuQVBJX0dBVEVXQVlfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnO1xyXG5cclxuZGVzY3JpYmUoJ/CfkrAgV2FsbGV0IFNlcnZpY2UgVGVzdHMnLCAoKSA9PiB7XHJcbiAgbGV0IHRlc3RVc2VyVG9rZW46IHN0cmluZztcclxuICBsZXQgdGVzdFVzZXJJZDogc3RyaW5nO1xyXG4gIGxldCB3YWxsZXRJZDogc3RyaW5nO1xyXG4gIGxldCB0cmFuc2FjdGlvbklkOiBzdHJpbmc7XHJcbiAgbGV0IHBheW1lbnRNZXRob2RJZDogc3RyaW5nO1xyXG4gIGxldCBud3RQYWNrYWdlSWQ6IHN0cmluZztcclxuICBcclxuICBjb25zdCB0ZXN0VXNlciA9IHtcclxuICAgIGVtYWlsOiBgdGVzdC13YWxsZXQtJHtEYXRlLm5vdygpfUBuZXJkd29yay5jb21gLFxyXG4gICAgcGFzc3dvcmQ6ICdTZWN1cmVUZXN0UGFzc3dvcmQxMjMhJyxcclxuICAgIHVzZXJuYW1lOiBgd2FsbGV0dXNlciR7RGF0ZS5ub3coKX1gXHJcbiAgfTtcclxuXHJcbiAgYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcclxuICAgIC8vIENyZWF0ZSB0ZXN0IHVzZXJcclxuICAgIGNvbnN0IHNpZ251cFJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2F1dGgvc2lnbnVwYCwgdGVzdFVzZXIpO1xyXG4gICAgdGVzdFVzZXJUb2tlbiA9IHNpZ251cFJlc3BvbnNlLmRhdGEuZGF0YS50b2tlbjtcclxuICAgIHRlc3RVc2VySWQgPSBzaWdudXBSZXNwb25zZS5kYXRhLmRhdGEudXNlci5pZDtcclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coJ/CflKcgVGVzdCB1c2VyIGNyZWF0ZWQgZm9yIHdhbGxldCB0ZXN0cycpO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnV2FsbGV0IENyZWF0aW9uICYgTWFuYWdlbWVudCcsICgpID0+IHtcclxuICAgIFxyXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgdXNlciB3YWxsZXQgYXV0b21hdGljYWxseScsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS93YWxsZXQvYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnVzZXJJZCkudG9CZSh0ZXN0VXNlcklkKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5ud3RCYWxhbmNlKS50b0JlKCcwLjAwMDAwMDAwJyk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudG90YWxFYXJuZWQpLnRvQmUoJzAuMDAwMDAwMDAnKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS50b3RhbFNwZW50KS50b0JlKCcwLjAwMDAwMDAwJyk7XHJcbiAgICAgIFxyXG4gICAgICB3YWxsZXRJZCA9IHJlc3BvbnNlLmRhdGEuZGF0YS5pZDtcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBVc2VyIHdhbGxldCBjcmVhdGVkL3JldHJpZXZlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHNhbWUgd2FsbGV0IGZvciBzYW1lIHVzZXInLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L2AsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5pZCkudG9CZSh3YWxsZXRJZCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIFdhbGxldCBjb25zaXN0ZW5jeSBtYWludGFpbmVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIHJlcXVpcmUgYXV0aGVudGljYXRpb24gZm9yIHdhbGxldCBhY2Nlc3MnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L2ApO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwMSk7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZShmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgV2FsbGV0IGFjY2VzcyBwcm9wZXJseSBwcm90ZWN0ZWQnKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnQ3J5cHRvIFdhbGxldCBJbnRlZ3JhdGlvbicsICgpID0+IHtcclxuICAgIFxyXG4gICAgaXQoJ3Nob3VsZCBjb25uZWN0IGNyeXB0byB3YWxsZXQgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCB3YWxsZXREYXRhID0ge1xyXG4gICAgICAgIHdhbGxldEFkZHJlc3M6ICdITjdjQUJxTHE0NkVzMWpoOTJkUVFpc0FxNjYyU214RUxMTHNISGU0WVdySCcsXHJcbiAgICAgICAgd2FsbGV0VHlwZTogJ3BoYW50b20nLFxyXG4gICAgICAgIHNpZ25hdHVyZTogJ21vY2tfc2lnbmF0dXJlX2Zvcl90ZXN0aW5nJ1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L2NyeXB0by9jb25uZWN0YCwgd2FsbGV0RGF0YSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNvbm5lY3RlZFdhbGxldEFkZHJlc3MpLnRvQmUod2FsbGV0RGF0YS53YWxsZXRBZGRyZXNzKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS53YWxsZXRUeXBlKS50b0JlKHdhbGxldERhdGEud2FsbGV0VHlwZSk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENyeXB0byB3YWxsZXQgY29ubmVjdGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgZXhpc3RpbmcgY3J5cHRvIHdhbGxldCBjb25uZWN0aW9uJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBuZXdXYWxsZXREYXRhID0ge1xyXG4gICAgICAgIHdhbGxldEFkZHJlc3M6ICc5V3pEWHdCYm1rZzhaVGJOTXFVeHZRUkF5clp6RHNHWWRMVkw5ell0QVdXTScsXHJcbiAgICAgICAgd2FsbGV0VHlwZTogJ3NvbGZsYXJlJyxcclxuICAgICAgICBzaWduYXR1cmU6ICduZXdfbW9ja19zaWduYXR1cmUnXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS93YWxsZXQvY3J5cHRvL2Nvbm5lY3RgLCBuZXdXYWxsZXREYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuY29ubmVjdGVkV2FsbGV0QWRkcmVzcykudG9CZShuZXdXYWxsZXREYXRhLndhbGxldEFkZHJlc3MpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLndhbGxldFR5cGUpLnRvQmUobmV3V2FsbGV0RGF0YS53YWxsZXRUeXBlKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ3J5cHRvIHdhbGxldCB1cGRhdGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgaW52YWxpZCB3YWxsZXQgYWRkcmVzcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgaW52YWxpZFdhbGxldERhdGEgPSB7XHJcbiAgICAgICAgd2FsbGV0QWRkcmVzczogJ2ludmFsaWRfYWRkcmVzc19mb3JtYXQnLFxyXG4gICAgICAgIHdhbGxldFR5cGU6ICdwaGFudG9tJ1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L2NyeXB0by9jb25uZWN0YCwgaW52YWxpZFdhbGxldERhdGEsIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaG91bGQgaGF2ZSBmYWlsZWQnKTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgIGV4cGVjdChlcnJvci5yZXNwb25zZS5zdGF0dXMpLnRvQmUoNDAwKTtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKGZhbHNlKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBJbnZhbGlkIHdhbGxldCBhZGRyZXNzIHByb3Blcmx5IHJlamVjdGVkJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ05XVCBQcmljaW5nICYgUGFja2FnZXMnLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgZ2V0IE5XVCBwcmljaW5nIHBhY2thZ2VzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L3dhbGxldC9wcmljaW5nYCk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmRhdGEuZGF0YSkpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAocmVzcG9uc2UuZGF0YS5kYXRhLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjb25zdCBwYWNrYWdlMSA9IHJlc3BvbnNlLmRhdGEuZGF0YVswXTtcclxuICAgICAgICBleHBlY3QocGFja2FnZTEucGFja2FnZU5hbWUpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgICAgZXhwZWN0KHBhY2thZ2UxLm53dEFtb3VudCkudG9CZURlZmluZWQoKTtcclxuICAgICAgICBleHBlY3QocGFja2FnZTEudXNkUHJpY2UpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgICAgZXhwZWN0KHBhY2thZ2UxLmlzQWN0aXZlKS50b0JlKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIG53dFBhY2thZ2VJZCA9IHBhY2thZ2UxLmlkO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIE5XVCBwcmljaW5nIHBhY2thZ2VzIHJldHJpZXZlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBmaWx0ZXIgYWN0aXZlIHBhY2thZ2VzIG9ubHknLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L3ByaWNpbmdgKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IGFjdGl2ZVBhY2thZ2VzID0gcmVzcG9uc2UuZGF0YS5kYXRhLmZpbHRlcigocGtnOiBhbnkpID0+IHBrZy5pc0FjdGl2ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEubGVuZ3RoKS50b0JlKGFjdGl2ZVBhY2thZ2VzLmxlbmd0aCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIE9ubHkgYWN0aXZlIHBhY2thZ2VzIHJldHVybmVkJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ0hlbGlvIENyeXB0byBQYXltZW50cycsICgpID0+IHtcclxuICAgIFxyXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgSGVsaW8gcGF5bWVudCBsaW5rJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBpZiAoIW53dFBhY2thZ2VJZCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCfimqDvuI8gU2tpcHBpbmcgSGVsaW8gdGVzdCAtIG5vIHByaWNpbmcgcGFja2FnZXMgYXZhaWxhYmxlJyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBwYXltZW50RGF0YSA9IHtcclxuICAgICAgICBwYWNrYWdlSWQ6IG53dFBhY2thZ2VJZCxcclxuICAgICAgICBjdXJyZW5jeTogJ1VTREMnLFxyXG4gICAgICAgIHJlZGlyZWN0VXJsOiAnaHR0cHM6Ly9uZXJkd29yay5jb20vcGF5bWVudC1zdWNjZXNzJ1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L2NyeXB0by9wdXJjaGFzZWAsIHBheW1lbnREYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudHJhbnNhY3Rpb24pLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEucGF5bWVudExpbmsudXJsKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnBheW1lbnRMaW5rLnFyQ29kZSkudG9CZURlZmluZWQoKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5wYXltZW50TGluay5pZCkudG9CZURlZmluZWQoKTtcclxuICAgICAgXHJcbiAgICAgIHRyYW5zYWN0aW9uSWQgPSByZXNwb25zZS5kYXRhLmRhdGEudHJhbnNhY3Rpb24uaWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgSGVsaW8gcGF5bWVudCBsaW5rIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBkaWZmZXJlbnQgY3J5cHRvIGN1cnJlbmNpZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmICghbnd0UGFja2FnZUlkKSByZXR1cm47XHJcblxyXG4gICAgICBjb25zdCBwYXltZW50RGF0YSA9IHtcclxuICAgICAgICBwYWNrYWdlSWQ6IG53dFBhY2thZ2VJZCxcclxuICAgICAgICBjdXJyZW5jeTogJ1NPTCcsXHJcbiAgICAgICAgcmVkaXJlY3RVcmw6ICdodHRwczovL25lcmR3b3JrLmNvbS9wYXltZW50LXN1Y2Nlc3MnXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS93YWxsZXQvY3J5cHRvL3B1cmNoYXNlYCwgcGF5bWVudERhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5wYXltZW50TGluaykudG9CZURlZmluZWQoKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgU09MIHBheW1lbnQgbGluayBjcmVhdGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgaW52YWxpZCBwYWNrYWdlIElEJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBpbnZhbGlkUGF5bWVudERhdGEgPSB7XHJcbiAgICAgICAgcGFja2FnZUlkOiAnMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwJyxcclxuICAgICAgICBjdXJyZW5jeTogJ1VTREMnXHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS93YWxsZXQvY3J5cHRvL3B1cmNoYXNlYCwgaW52YWxpZFBheW1lbnREYXRhLCB7XHJcbiAgICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwNCk7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZShmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgSW52YWxpZCBwYWNrYWdlIElEIHByb3Blcmx5IHJlamVjdGVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIHNpbXVsYXRlIEhlbGlvIHdlYmhvb2sgcHJvY2Vzc2luZycsIGFzeW5jICgpID0+IHtcclxuICAgICAgaWYgKCF0cmFuc2FjdGlvbklkKSByZXR1cm47XHJcblxyXG4gICAgICAvLyBTaW11bGF0ZSBzdWNjZXNzZnVsIHBheW1lbnQgd2ViaG9va1xyXG4gICAgICBjb25zdCB3ZWJob29rUGF5bG9hZCA9IHtcclxuICAgICAgICBpZDogJ2hlbGlvX3BheW1lbnRfMTIzJyxcclxuICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnLFxyXG4gICAgICAgIGFtb3VudDogMTAuMDAsXHJcbiAgICAgICAgY3VycmVuY3k6ICdVU0RDJyxcclxuICAgICAgICB0cmFuc2FjdGlvbl9oYXNoOiAnMHgxMjM0NTY3ODkwYWJjZGVmJyxcclxuICAgICAgICBwYWlkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgIHRyYW5zYWN0aW9uSWQ6IHRyYW5zYWN0aW9uSWRcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS93YWxsZXQvd2ViaG9va3MvaGVsaW9gLCB3ZWJob29rUGF5bG9hZCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICdoZWxpby1zaWduYXR1cmUnOiAnbW9ja19zaWduYXR1cmUnLFxyXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIEhlbGlvIHdlYmhvb2sgcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCdUcmFkaXRpb25hbCBQYXltZW50IE1ldGhvZHMnLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgcHVyY2hhc2UgTldUIHRva2VucyB3aXRoIFN0cmlwZScsIGFzeW5jICgpID0+IHtcclxuICAgICAgaWYgKCFud3RQYWNrYWdlSWQpIHJldHVybjtcclxuXHJcbiAgICAgIGNvbnN0IHB1cmNoYXNlRGF0YSA9IHtcclxuICAgICAgICBwYWNrYWdlSWQ6IG53dFBhY2thZ2VJZCxcclxuICAgICAgICBwYXltZW50TWV0aG9kSWQ6ICdwbV9jYXJkX3Zpc2EnIC8vIFN0cmlwZSB0ZXN0IGNhcmRcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L3dhbGxldC9wdXJjaGFzZWAsIHB1cmNoYXNlRGF0YSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnRyYW5zYWN0aW9uKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnBheW1lbnRJbnRlbnQpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIFN0cmlwZSBwYXltZW50IHByb2Nlc3NlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgYWRkIHBheW1lbnQgbWV0aG9kJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBwYXltZW50TWV0aG9kRGF0YSA9IHtcclxuICAgICAgICBwYXltZW50TWV0aG9kSWQ6ICdwbV9jYXJkX21hc3RlcmNhcmQnXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS93YWxsZXQvcGF5bWVudC1tZXRob2RzYCwgcGF5bWVudE1ldGhvZERhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5leHRlcm5hbElkKS50b0JlKHBheW1lbnRNZXRob2REYXRhLnBheW1lbnRNZXRob2RJZCk7XHJcbiAgICAgIFxyXG4gICAgICBwYXltZW50TWV0aG9kSWQgPSByZXNwb25zZS5kYXRhLmRhdGEuaWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgUGF5bWVudCBtZXRob2QgYWRkZWQgc3VjY2Vzc2Z1bGx5Jyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGdldCB1c2VyIHBheW1lbnQgbWV0aG9kcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS93YWxsZXQvcGF5bWVudC1tZXRob2RzYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXNwb25zZS5kYXRhLmRhdGEpKS50b0JlKHRydWUpO1xyXG4gICAgICBcclxuICAgICAgaWYgKHJlc3BvbnNlLmRhdGEuZGF0YS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YVswXS51c2VySWQpLnRvQmUodGVzdFVzZXJJZCk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgUGF5bWVudCBtZXRob2RzIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnTldUIFRva2VuIE1hbmFnZW1lbnQnLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgc3BlbmQgTldUIHRva2VucycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3Qgc3BlbmREYXRhID0ge1xyXG4gICAgICAgIGFtb3VudDogJzEuNTAnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29taWMgcHVyY2hhc2UgLSBUaGUgQW1hemluZyBDcnlwdG8gSGVyb2VzJyxcclxuICAgICAgICByZWZlcmVuY2VJZDogJ2NvbWljXzEyMycsXHJcbiAgICAgICAgcmVmZXJlbmNlVHlwZTogJ2NvbWljJ1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L3NwZW5kYCwgc3BlbmREYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudHJhbnNhY3Rpb24udHlwZSkudG9CZSgnc3BlbmQnKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5zcGVudEFtb3VudCkudG9CZSgxLjUwKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgTldUIHRva2VucyBzcGVudCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgcmVqZWN0IHNwZW5kaW5nIG1vcmUgdGhhbiBiYWxhbmNlJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBzcGVuZERhdGEgPSB7XHJcbiAgICAgICAgYW1vdW50OiAnMTAwMDAwMC4wMCcsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdBdHRlbXB0IHRvIG92ZXJzcGVuZCdcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L3dhbGxldC9zcGVuZGAsIHNwZW5kRGF0YSwge1xyXG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nob3VsZCBoYXZlIGZhaWxlZCcpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLnN0YXR1cykudG9CZSg0MDApO1xyXG4gICAgICAgIGV4cGVjdChlcnJvci5yZXNwb25zZS5kYXRhLmVycm9yKS50b0NvbnRhaW4oJ0luc3VmZmljaWVudCcpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIE92ZXJzcGVuZGluZyBwcm9wZXJseSBwcmV2ZW50ZWQnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgcmVqZWN0IG5lZ2F0aXZlIHNwZW5kaW5nIGFtb3VudHMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHNwZW5kRGF0YSA9IHtcclxuICAgICAgICBhbW91bnQ6ICctNS4wMCcsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdOZWdhdGl2ZSBhbW91bnQgdGVzdCdcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L3dhbGxldC9zcGVuZGAsIHNwZW5kRGF0YSwge1xyXG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nob3VsZCBoYXZlIGZhaWxlZCcpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLnN0YXR1cykudG9CZSg0MDApO1xyXG4gICAgICAgIGV4cGVjdChlcnJvci5yZXNwb25zZS5kYXRhLmVycm9yKS50b0NvbnRhaW4oJ0ludmFsaWQgYW1vdW50Jyk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgTmVnYXRpdmUgYW1vdW50cyBwcm9wZXJseSByZWplY3RlZCcpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCdUcmFuc2FjdGlvbiBIaXN0b3J5JywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIGdldCB0cmFuc2FjdGlvbiBoaXN0b3J5JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L3dhbGxldC90cmFuc2FjdGlvbnM/cGFnZT0xJmxpbWl0PTEwYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXNwb25zZS5kYXRhLmRhdGEudHJhbnNhY3Rpb25zKSkudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5wYWdpbmF0aW9uKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBUcmFuc2FjdGlvbiBoaXN0b3J5IHJldHJpZXZlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgZmlsdGVyIHRyYW5zYWN0aW9ucyBieSB0eXBlJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L3dhbGxldC90cmFuc2FjdGlvbnM/dHlwZT1zcGVuZCZwYWdlPTEmbGltaXQ9NWAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgXHJcbiAgICAgIC8vIEFsbCByZXR1cm5lZCB0cmFuc2FjdGlvbnMgc2hvdWxkIGJlIG9mIHR5cGUgJ3NwZW5kJ1xyXG4gICAgICByZXNwb25zZS5kYXRhLmRhdGEudHJhbnNhY3Rpb25zLmZvckVhY2goKHR4OiBhbnkpID0+IHtcclxuICAgICAgICBleHBlY3QodHgudHlwZSkudG9CZSgnc3BlbmQnKTtcclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIFRyYW5zYWN0aW9uIGZpbHRlcmluZyBieSB0eXBlIHdvcmtpbmcnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgcGFnaW5hdGUgdHJhbnNhY3Rpb24gaGlzdG9yeSBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBhZ2UxID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L3RyYW5zYWN0aW9ucz9wYWdlPTEmbGltaXQ9MmAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHBhZ2UyID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L3RyYW5zYWN0aW9ucz9wYWdlPTImbGltaXQ9MmAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChwYWdlMS5kYXRhLmRhdGEucGFnaW5hdGlvbi5wYWdlKS50b0JlKDEpO1xyXG4gICAgICBleHBlY3QocGFnZTIuZGF0YS5kYXRhLnBhZ2luYXRpb24ucGFnZSkudG9CZSgyKTtcclxuICAgICAgXHJcbiAgICAgIC8vIFBhZ2VzIHNob3VsZCBoYXZlIGRpZmZlcmVudCB0cmFuc2FjdGlvbnMgKGlmIHRoZXJlIGFyZSBlbm91Z2gpXHJcbiAgICAgIGlmIChwYWdlMS5kYXRhLmRhdGEudHJhbnNhY3Rpb25zLmxlbmd0aCA+IDAgJiYgcGFnZTIuZGF0YS5kYXRhLnRyYW5zYWN0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgZXhwZWN0KHBhZ2UxLmRhdGEuZGF0YS50cmFuc2FjdGlvbnNbMF0uaWQpLm5vdC50b0JlKHBhZ2UyLmRhdGEuZGF0YS50cmFuc2FjdGlvbnNbMF0uaWQpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIFRyYW5zYWN0aW9uIHBhZ2luYXRpb24gd29ya2luZyBjb3JyZWN0bHknKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnU2VydmljZSBIZWFsdGggJiBQZXJmb3JtYW5jZScsICgpID0+IHtcclxuICAgIFxyXG4gICAgaXQoJ3Nob3VsZCByZXNwb25kIHRvIGhlYWx0aCBjaGVjaycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7V0FMTEVUX1NFUlZJQ0VfVVJMfS9oZWFsdGhgKTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc2VydmljZSkudG9CZSgnd2FsbGV0LXNlcnZpY2UnKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgV2FsbGV0IHNlcnZpY2UgaGVhbHRoIGNoZWNrIHBhc3NlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgY29uY3VycmVudCB3YWxsZXQgb3BlcmF0aW9ucycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiA1IH0sICgpID0+XHJcbiAgICAgICAgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L2AsIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgICAgfSlcclxuICAgICAgKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlcyA9IGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcclxuICAgICAgXHJcbiAgICAgIHJlc3BvbnNlcy5mb3JFYWNoKHJlc3BvbnNlID0+IHtcclxuICAgICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5pZCkudG9CZSh3YWxsZXRJZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDb25jdXJyZW50IHdhbGxldCBvcGVyYXRpb25zIGhhbmRsZWQgc3VjY2Vzc2Z1bGx5Jyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ1NlY3VyaXR5ICYgRGF0YSBJbnRlZ3JpdHknLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgbWFpbnRhaW4gYWNjdXJhdGUgYmFsYW5jZSBjYWxjdWxhdGlvbnMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHdhbGxldFJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L2AsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IHdhbGxldCA9IHdhbGxldFJlc3BvbnNlLmRhdGEuZGF0YTtcclxuICAgICAgY29uc3QgZWFybmVkID0gcGFyc2VGbG9hdCh3YWxsZXQudG90YWxFYXJuZWQpO1xyXG4gICAgICBjb25zdCBzcGVudCA9IHBhcnNlRmxvYXQod2FsbGV0LnRvdGFsU3BlbnQpO1xyXG4gICAgICBjb25zdCBiYWxhbmNlID0gcGFyc2VGbG9hdCh3YWxsZXQubnd0QmFsYW5jZSk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBCYWxhbmNlIHNob3VsZCBlcXVhbCBlYXJuZWQgbWludXMgc3BlbnRcclxuICAgICAgZXhwZWN0KE1hdGguYWJzKGJhbGFuY2UgLSAoZWFybmVkIC0gc3BlbnQpKSkudG9CZUxlc3NUaGFuKDAuMDAwMDAwMDEpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBCYWxhbmNlIGNhbGN1bGF0aW9ucyBhY2N1cmF0ZScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgYWNjZXNzIHRvIG90aGVyIHVzZXJzIHdhbGxldHMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIC8vIENyZWF0ZSBhbm90aGVyIHRlc3QgdXNlclxyXG4gICAgICBjb25zdCBvdGhlclVzZXIgPSB7XHJcbiAgICAgICAgZW1haWw6IGBvdGhlci11c2VyLSR7RGF0ZS5ub3coKX1AbmVyZHdvcmsuY29tYCxcclxuICAgICAgICBwYXNzd29yZDogJ1NlY3VyZVRlc3RQYXNzd29yZDEyMyEnLFxyXG4gICAgICAgIHVzZXJuYW1lOiBgb3RoZXJ1c2VyJHtEYXRlLm5vdygpfWBcclxuICAgICAgfTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IG90aGVyU2lnbnVwID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2F1dGgvc2lnbnVwYCwgb3RoZXJVc2VyKTtcclxuICAgICAgY29uc3Qgb3RoZXJVc2VyVG9rZW4gPSBvdGhlclNpZ251cC5kYXRhLmRhdGEudG9rZW47XHJcbiAgICAgIFxyXG4gICAgICAvLyBUcnkgdG8gYWNjZXNzIGZpcnN0IHVzZXIncyB3YWxsZXQgd2l0aCBzZWNvbmQgdXNlcidzIHRva2VuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlMSA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L3dhbGxldC9gLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCByZXNwb25zZTIgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS93YWxsZXQvYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke290aGVyVXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIC8vIFNob3VsZCByZXR1cm4gZGlmZmVyZW50IHdhbGxldHNcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlMS5kYXRhLmRhdGEuaWQpLm5vdC50b0JlKHJlc3BvbnNlMi5kYXRhLmRhdGEuaWQpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UyLmRhdGEuZGF0YS51c2VySWQpLnRvQmUob3RoZXJTaWdudXAuZGF0YS5kYXRhLnVzZXIuaWQpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBXYWxsZXQgaXNvbGF0aW9uIG1haW50YWluZWQgYmV0d2VlbiB1c2VycycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZGVjaW1hbCBwcmVjaXNpb24gY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAvLyBUZXN0IHdpdGggdmVyeSBzbWFsbCBhbW91bnRzXHJcbiAgICAgIGNvbnN0IHNtYWxsU3BlbmREYXRhID0ge1xyXG4gICAgICAgIGFtb3VudDogJzAuMDAwMDAwMDEnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlY2lzaW9uIHRlc3QgLSBzbWFsbGVzdCB1bml0J1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vd2FsbGV0L3NwZW5kYCwgc21hbGxTcGVuZERhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5zcGVudEFtb3VudCkudG9CZSgwLjAwMDAwMDAxKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgRGVjaW1hbCBwcmVjaXNpb24gaGFuZGxpbmcgY29ycmVjdCcpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn0pOyJdfQ==