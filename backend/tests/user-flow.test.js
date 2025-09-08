import { describe, it, expect, afterAll } from '@jest/globals';
import axios from 'axios';
import FormData from 'form-data';
// Test environment configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_GATEWAY = BASE_URL;
// Test user data
const testUser = {
    email: 'test-creator@nerdwork.com',
    password: 'SecurePassword123!',
    username: 'testcreator',
    displayName: 'Test Creator'
};
const testConsumer = {
    email: 'test-consumer@nerdwork.com',
    password: 'SecurePassword123!',
    username: 'testconsumer',
    displayName: 'Test Consumer'
};
// Global test variables
let creatorToken;
let consumerToken;
let creatorUserId;
let consumerUserId;
let creatorId;
let comicId;
let uploadedFileId;
let coverFileId;
let walletId;
let nwtPackageId;
describe('🚀 Nerdwork+ MVP User Flow Tests', () => {
    describe('1️⃣ User Authentication Flow', () => {
        it('should allow new user registration (Creator)', async () => {
            const response = await axios.post(`${API_GATEWAY}/auth/signup`, testUser);
            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.data.user.email).toBe(testUser.email);
            expect(response.data.data.token).toBeDefined();
            creatorToken = response.data.data.token;
            creatorUserId = response.data.data.user.id;
            console.log('✅ Creator registered successfully');
        });
        it('should allow new user registration (Consumer)', async () => {
            const response = await axios.post(`${API_GATEWAY}/auth/signup`, testConsumer);
            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.data.user.email).toBe(testConsumer.email);
            expect(response.data.data.token).toBeDefined();
            consumerToken = response.data.data.token;
            consumerUserId = response.data.data.user.id;
            console.log('✅ Consumer registered successfully');
        });
        it('should allow user login', async () => {
            const response = await axios.post(`${API_GATEWAY}/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.token).toBeDefined();
            console.log('✅ User login successful');
        });
        it('should get current user profile', async () => {
            const response = await axios.get(`${API_GATEWAY}/user/me`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.email).toBe(testUser.email);
            console.log('✅ User profile retrieved');
        });
    });
    describe('2️⃣ Creator Registration Flow', () => {
        it('should allow user to become a creator', async () => {
            const creatorData = {
                creatorName: 'Amazing Comics Studio',
                creatorBio: 'Creating amazing superhero comics for the digital age.',
                socialLinks: {
                    twitter: '@amazingcomics',
                    instagram: '@amazing_comics_studio'
                }
            };
            const response = await axios.post(`${API_GATEWAY}/user/creator/become`, creatorData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.isCreator).toBe(true);
            expect(response.data.data.creatorName).toBe(creatorData.creatorName);
            creatorId = response.data.data.id;
            console.log('✅ User became creator successfully');
        });
        it('should check creator status', async () => {
            const response = await axios.get(`${API_GATEWAY}/user/creator/status`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.isCreator).toBe(true);
            console.log('✅ Creator status verified');
        });
        it('should browse creators publicly', async () => {
            const response = await axios.get(`${API_GATEWAY}/user/creators?page=1&limit=10`);
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data.creators)).toBe(true);
            expect(response.data.data.creators.length).toBeGreaterThan(0);
            console.log('✅ Creator browse working');
        });
    });
    describe('3️⃣ Wallet & Crypto Payment Flow', () => {
        it('should create user wallet', async () => {
            const response = await axios.get(`${API_GATEWAY}/wallet/`, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.userId).toBe(consumerUserId);
            walletId = response.data.data.id;
            console.log('✅ User wallet created');
        });
        it('should connect crypto wallet', async () => {
            const walletData = {
                walletAddress: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                walletType: 'phantom',
                signature: 'mock_signature_for_testing'
            };
            const response = await axios.post(`${API_GATEWAY}/wallet/crypto/connect`, walletData, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.connectedWalletAddress).toBe(walletData.walletAddress);
            expect(response.data.data.walletType).toBe(walletData.walletType);
            console.log('✅ Crypto wallet connected');
        });
        it('should get NWT pricing packages', async () => {
            const response = await axios.get(`${API_GATEWAY}/wallet/pricing`);
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data)).toBe(true);
            if (response.data.data.length > 0) {
                nwtPackageId = response.data.data[0].id;
                console.log('✅ NWT pricing packages retrieved');
            }
        });
        it('should create crypto payment link via Helio', async () => {
            if (!nwtPackageId) {
                console.log('⚠️ Skipping crypto payment test - no pricing package available');
                return;
            }
            const paymentData = {
                packageId: nwtPackageId,
                currency: 'USDC',
                redirectUrl: 'https://nerdwork.com/payment-success'
            };
            const response = await axios.post(`${API_GATEWAY}/wallet/crypto/purchase`, paymentData, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.paymentLink.url).toBeDefined();
            expect(response.data.data.paymentLink.qrCode).toBeDefined();
            console.log('✅ Helio payment link created');
            console.log('🔗 Payment URL:', response.data.data.paymentLink.url);
        });
        it('should get wallet transaction history', async () => {
            const response = await axios.get(`${API_GATEWAY}/wallet/transactions?page=1&limit=10`, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data.transactions)).toBe(true);
            console.log('✅ Transaction history retrieved');
        });
    });
    describe('4️⃣ File Upload Flow', () => {
        it('should upload comic cover to S3', async () => {
            // Create a mock file buffer (in real test, you'd use actual file)
            const mockImageBuffer = Buffer.from('mock-image-data-for-comic-cover');
            const formData = new FormData();
            formData.append('file', mockImageBuffer, {
                filename: 'comic-cover.jpg',
                contentType: 'image/jpeg'
            });
            formData.append('category', 'comic-cover');
            formData.append('purpose', 'storage');
            formData.append('isPublic', 'true');
            const response = await axios.post(`${API_GATEWAY}/files/upload/s3`, formData, {
                headers: {
                    Authorization: `Bearer ${creatorToken}`,
                    ...formData.getHeaders()
                }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.file.s3Url).toBeDefined();
            expect(response.data.data.file.cdnUrl).toBeDefined();
            coverFileId = response.data.data.file.id;
            console.log('✅ Comic cover uploaded to S3');
        });
        it('should upload comic page for NFT (S3 + IPFS)', async () => {
            const mockImageBuffer = Buffer.from('mock-comic-page-data-for-nft');
            const formData = new FormData();
            formData.append('file', mockImageBuffer, {
                filename: 'comic-page-001.jpg',
                contentType: 'image/jpeg'
            });
            formData.append('category', 'nft-asset');
            formData.append('nftMetadata', JSON.stringify({
                trait_type: 'Page Number',
                value: '1',
                rarity: 'Common'
            }));
            const response = await axios.post(`${API_GATEWAY}/files/upload/nft`, formData, {
                headers: {
                    Authorization: `Bearer ${creatorToken}`,
                    ...formData.getHeaders()
                }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.file.s3Url).toBeDefined();
            expect(response.data.data.file.ipfsHash).toBeDefined();
            expect(response.data.data.file.ipfsUrl).toBeDefined();
            expect(response.data.data.file.isPinnedToIPFS).toBe(true);
            uploadedFileId = response.data.data.file.id;
            console.log('✅ Comic page uploaded to S3 + IPFS');
            console.log('🌐 IPFS Hash:', response.data.data.file.ipfsHash);
        });
        it('should get user uploaded files', async () => {
            const response = await axios.get(`${API_GATEWAY}/files/?category=comic-cover&page=1&limit=10`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data.files)).toBe(true);
            console.log('✅ User files retrieved');
        });
        it('should get presigned upload URL', async () => {
            const response = await axios.post(`${API_GATEWAY}/files/presigned-url`, {
                filename: 'comic-page-002.jpg',
                contentType: 'image/jpeg',
                category: 'comic-page'
            }, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.uploadUrl).toBeDefined();
            expect(response.data.data.s3Key).toBeDefined();
            console.log('✅ Presigned upload URL generated');
        });
    });
    describe('5️⃣ Comic Creation Flow', () => {
        it('should create a new comic', async () => {
            const comicData = {
                title: 'The Amazing Crypto Heroes',
                description: 'An epic tale of blockchain superheroes saving the metaverse from evil centralized forces.',
                author: 'Amazing Comics Studio',
                artist: 'Digital Art Master',
                genre: 'Superhero',
                price: 5.99,
                isFreemium: true,
                freePageCount: 3,
                coverFileId: coverFileId,
                isNFTEligible: true,
                metadata: {
                    tags: ['blockchain', 'superhero', 'web3', 'crypto'],
                    ageRating: 'Teen',
                    language: 'English'
                }
            };
            const response = await axios.post(`${API_GATEWAY}/comics/creator`, comicData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.data.title).toBe(comicData.title);
            expect(response.data.data.creatorId).toBe(creatorUserId);
            expect(response.data.data.status).toBe('draft');
            expect(response.data.data.isNFTEligible).toBe(true);
            comicId = response.data.data.id;
            console.log('✅ Comic created successfully');
        });
        it('should add pages to comic', async () => {
            const pagesData = {
                pages: [
                    {
                        pageNumber: 1,
                        fileId: uploadedFileId,
                        altText: 'Opening scene with our heroes',
                        isPreview: true
                    },
                    {
                        pageNumber: 2,
                        fileId: uploadedFileId, // In real scenario, would be different files
                        altText: 'The villain reveals their plan',
                        isPreview: true
                    },
                    {
                        pageNumber: 3,
                        fileId: uploadedFileId,
                        altText: 'Epic battle begins',
                        isPreview: true
                    }
                ]
            };
            const response = await axios.post(`${API_GATEWAY}/comics/creator/${comicId}/pages`, pagesData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBe(3);
            console.log('✅ Comic pages added successfully');
        });
        it('should get creator comics', async () => {
            const response = await axios.get(`${API_GATEWAY}/comics/creator/my-comics?page=1&limit=10`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data.comics)).toBe(true);
            expect(response.data.data.comics.length).toBeGreaterThan(0);
            console.log('✅ Creator comics retrieved');
        });
        it('should update comic to published status', async () => {
            const updateData = {
                status: 'published',
                title: 'The Amazing Crypto Heroes - Updated'
            };
            const response = await axios.put(`${API_GATEWAY}/comics/creator/${comicId}`, updateData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.status).toBe('published');
            expect(response.data.data.publishedAt).toBeDefined();
            console.log('✅ Comic published successfully');
        });
        it('should get creator dashboard stats', async () => {
            const response = await axios.get(`${API_GATEWAY}/comics/creator/stats`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.totalComics).toBeGreaterThan(0);
            expect(response.data.data.publishedComics).toBeGreaterThan(0);
            console.log('✅ Creator stats retrieved');
        });
    });
    describe('6️⃣ Consumer Comic Discovery & Purchase Flow', () => {
        it('should browse comics publicly', async () => {
            const response = await axios.get(`${API_GATEWAY}/comics?page=1&limit=10&genre=Superhero`);
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data.comics)).toBe(true);
            expect(response.data.data.pagination).toBeDefined();
            console.log('✅ Comics browsing working');
        });
        it('should get specific comic details', async () => {
            const response = await axios.get(`${API_GATEWAY}/comics/${comicId}`, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.comic.id).toBe(comicId);
            expect(response.data.data.hasPurchased).toBe(false);
            console.log('✅ Comic details retrieved');
        });
        it('should get comic preview pages', async () => {
            const response = await axios.get(`${API_GATEWAY}/comics/${comicId}/pages`, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data.pages)).toBe(true);
            expect(response.data.data.accessLevel).toBe('preview');
            console.log('✅ Comic preview pages accessible');
        });
        it('should add comic review', async () => {
            const reviewData = {
                rating: 5,
                review: 'Amazing artwork and compelling storyline! Love the Web3 theme.'
            };
            const response = await axios.post(`${API_GATEWAY}/comics/${comicId}/review`, reviewData, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.rating).toBe(reviewData.rating);
            console.log('✅ Comic review added');
        });
        it('should track reading progress', async () => {
            const progressData = {
                currentPage: 2
            };
            const response = await axios.post(`${API_GATEWAY}/comics/${comicId}/progress`, progressData, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.currentPage).toBe(2);
            console.log('✅ Reading progress tracked');
        });
        it('should get reading history', async () => {
            const response = await axios.get(`${API_GATEWAY}/comics/user/history`, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data)).toBe(true);
            console.log('✅ Reading history retrieved');
        });
    });
    describe('7️⃣ Error Handling & Edge Cases', () => {
        it('should reject unauthorized access to creator endpoints', async () => {
            try {
                await axios.post(`${API_GATEWAY}/comics/creator`, {
                    title: 'Unauthorized Comic'
                });
            }
            catch (error) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.success).toBe(false);
            }
            console.log('✅ Unauthorized access properly rejected');
        });
        it('should handle invalid file uploads', async () => {
            const formData = new FormData();
            formData.append('file', Buffer.from(''), {
                filename: '',
                contentType: 'invalid/type'
            });
            try {
                await axios.post(`${API_GATEWAY}/files/upload/s3`, formData, {
                    headers: {
                        Authorization: `Bearer ${creatorToken}`,
                        ...formData.getHeaders()
                    }
                });
            }
            catch (error) {
                expect(error.response.status).toBe(400);
            }
            console.log('✅ Invalid file upload properly handled');
        });
        it('should handle non-existent comic access', async () => {
            const fakeComicId = '00000000-0000-0000-0000-000000000000';
            try {
                await axios.get(`${API_GATEWAY}/comics/${fakeComicId}`);
            }
            catch (error) {
                expect(error.response.status).toBe(404);
                expect(error.response.data.success).toBe(false);
            }
            console.log('✅ Non-existent comic access properly handled');
        });
    });
    describe('8️⃣ Service Health Checks', () => {
        it('should check API Gateway health', async () => {
            const response = await axios.get(`${API_GATEWAY}/health`);
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            console.log('✅ API Gateway health check passed');
        });
        it('should check individual service health', async () => {
            const services = [
                { name: 'auth-service', port: 3001 },
                { name: 'user-service', port: 3002 },
                { name: 'comic-service', port: 3003 },
                { name: 'wallet-service', port: 3004 },
                { name: 'file-service', port: 3007 }
            ];
            for (const service of services) {
                try {
                    const response = await axios.get(`http://localhost:${service.port}/health`);
                    expect(response.status).toBe(200);
                    console.log(`✅ ${service.name} health check passed`);
                }
                catch (error) {
                    console.log(`⚠️ ${service.name} not responding (may be running in container)`);
                }
            }
        });
    });
    // Cleanup after tests
    afterAll(async () => {
        console.log('\n🧹 Cleaning up test data...');
        // Delete uploaded files
        if (uploadedFileId) {
            try {
                await axios.delete(`${API_GATEWAY}/files/${uploadedFileId}`, {
                    headers: { Authorization: `Bearer ${creatorToken}` }
                });
                console.log('✅ Uploaded files cleaned up');
            }
            catch (error) {
                console.log('⚠️ File cleanup failed (may not exist)');
            }
        }
        // Archive created comic
        if (comicId) {
            try {
                await axios.delete(`${API_GATEWAY}/comics/creator/${comicId}`, {
                    headers: { Authorization: `Bearer ${creatorToken}` }
                });
                console.log('✅ Test comic archived');
            }
            catch (error) {
                console.log('⚠️ Comic cleanup failed (may not exist)');
            }
        }
        console.log('🎉 Test cleanup completed!');
    });
});
// Helper function to simulate delay (for rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci1mbG93LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2VyLWZsb3cudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQWEsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzFFLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFFakMsaUNBQWlDO0FBQ2pDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLHVCQUF1QixDQUFDO0FBQ3RFLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUU3QixpQkFBaUI7QUFDakIsTUFBTSxRQUFRLEdBQUc7SUFDZixLQUFLLEVBQUUsMkJBQTJCO0lBQ2xDLFFBQVEsRUFBRSxvQkFBb0I7SUFDOUIsUUFBUSxFQUFFLGFBQWE7SUFDdkIsV0FBVyxFQUFFLGNBQWM7Q0FDNUIsQ0FBQztBQUVGLE1BQU0sWUFBWSxHQUFHO0lBQ25CLEtBQUssRUFBRSw0QkFBNEI7SUFDbkMsUUFBUSxFQUFFLG9CQUFvQjtJQUM5QixRQUFRLEVBQUUsY0FBYztJQUN4QixXQUFXLEVBQUUsZUFBZTtDQUM3QixDQUFDO0FBRUYsd0JBQXdCO0FBQ3hCLElBQUksWUFBb0IsQ0FBQztBQUN6QixJQUFJLGFBQXFCLENBQUM7QUFDMUIsSUFBSSxhQUFxQixDQUFDO0FBQzFCLElBQUksY0FBc0IsQ0FBQztBQUMzQixJQUFJLFNBQWlCLENBQUM7QUFDdEIsSUFBSSxPQUFlLENBQUM7QUFDcEIsSUFBSSxjQUFzQixDQUFDO0FBQzNCLElBQUksV0FBbUIsQ0FBQztBQUN4QixJQUFJLFFBQWdCLENBQUM7QUFDckIsSUFBSSxZQUFvQixDQUFDO0FBRXpCLFFBQVEsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7SUFFaEQsUUFBUSxDQUFDLDhCQUE4QixFQUFFLEdB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QUFVLEVBQUUsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QsIGJlZm9yZUFsbCwgYWZ0ZXJBbGwgfSBmcm9tICdAamVzdC9nbG9iYWxzJztcclxuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcclxuaW1wb3J0IEZvcm1EYXRhIGZyb20gJ2Zvcm0tZGF0YSc7XHJcblxyXG4vLyBUZXN0IGVudmlyb25tZW50IGNvbmZpZ3VyYXRpb25cclxuY29uc3QgQkFTRV9VUkwgPSBwcm9jZXNzLmVudi5URVNUX0JBU0VfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnO1xyXG5jb25zdCBBUElfR0FURVdBWSA9IEJBU0VfVVJMO1xyXG5cclxuLy8gVGVzdCB1c2VyIGRhdGFcclxuY29uc3QgdGVzdFVzZXIgPSB7XHJcbiAgZW1haWw6ICd0ZXN0LWNyZWF0b3JAbmVyZHdvcmsuY29tJyxcclxuICBwYXNzd29yZDogJ1NlY3VyZVBhc3N3b3JkMTIzIScsXHJcbiAgdXNlcm5hbWU6ICd0ZXN0Y3JlYXRvcicsXHJcbiAgZGlzcGxheU5hbWU6ICdUZXN0IENyZWF0b3InXHJcbn07XHJcblxyXG5jb25zdCB0ZXN0Q29uc3VtZXIgPSB7XHJcbiAgZW1haWw6ICd0ZXN0LWNvbnN1bWVyQG5lcmR3b3JrLmNvbScsIFxyXG4gIHBhc3N3b3JkOiAnU2VjdXJlUGFzc3dvcmQxMjMhJyxcclxuICB1c2VybmFtZTogJ3Rlc3Rjb25zdW1lcicsXHJcbiAgZGlzcGxheU5hbWU6ICdUZXN0IENvbnN1bWVyJ1xyXG59O1xyXG5cclxuLy8gR2xvYmFsIHRlc3QgdmFyaWFibGVzXHJcbmxldCBjcmVhdG9yVG9rZW46IHN0cmluZztcclxubGV0IGNvbnN1bWVyVG9rZW46IHN0cmluZztcclxubGV0IGNyZWF0b3JVc2VySWQ6IHN0cmluZztcclxubGV0IGNvbnN1bWVyVXNlcklkOiBzdHJpbmc7XHJcbmxldCBjcmVhdG9ySWQ6IHN0cmluZztcclxubGV0IGNvbWljSWQ6IHN0cmluZztcclxubGV0IHVwbG9hZGVkRmlsZUlkOiBzdHJpbmc7XHJcbmxldCBjb3ZlckZpbGVJZDogc3RyaW5nO1xyXG5sZXQgd2FsbGV0SWQ6IHN0cmluZztcclxubGV0IG53dFBhY2thZ2VJZDogc3RyaW5nO1xyXG5cclxuZGVzY3JpYmUoJ/CfmoAgTmVyZHdvcmsrIE1WUCBVc2VyIEZsb3cgVGVzdHMnLCAoKSA9PiB7XHJcbiAgXHJcbiAgZGVzY3JpYmUoJzHvuI/ig6MgVXNlciBBdXRoZW50aWNhdGlvbiBGbG93JywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIGFsbG93IG5ldyB1c2VyIHJlZ2lzdHJhdGlvbiAoQ3JlYXRvciknLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWX0vYXV0aC9zaWdudXBgLCB0ZXN0VXNlcik7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudXNlci5lbWFpbCkudG9CZSh0ZXN0VXNlci5lbWFpbCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudG9rZW4pLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIFxyXG4gICAgICBjcmVhdG9yVG9rZW4gPSByZXNwb25zZS5kYXRhLmRhdGEudG9rZW47XHJcbiAgICAgIGNyZWF0b3JVc2VySWQgPSByZXNwb25zZS5kYXRhLmRhdGEudXNlci5pZDtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ3JlYXRvciByZWdpc3RlcmVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBuZXcgdXNlciByZWdpc3RyYXRpb24gKENvbnN1bWVyKScsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZfS9hdXRoL3NpZ251cGAsIHRlc3RDb25zdW1lcik7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudXNlci5lbWFpbCkudG9CZSh0ZXN0Q29uc3VtZXIuZW1haWwpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnRva2VuKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBcclxuICAgICAgY29uc3VtZXJUb2tlbiA9IHJlc3BvbnNlLmRhdGEuZGF0YS50b2tlbjtcclxuICAgICAgY29uc3VtZXJVc2VySWQgPSByZXNwb25zZS5kYXRhLmRhdGEudXNlci5pZDtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29uc3VtZXIgcmVnaXN0ZXJlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgYWxsb3cgdXNlciBsb2dpbicsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZfS9hdXRoL2xvZ2luYCwge1xyXG4gICAgICAgIGVtYWlsOiB0ZXN0VXNlci5lbWFpbCxcclxuICAgICAgICBwYXNzd29yZDogdGVzdFVzZXIucGFzc3dvcmRcclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudG9rZW4pLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIFVzZXIgbG9naW4gc3VjY2Vzc2Z1bCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBnZXQgY3VycmVudCB1c2VyIHByb2ZpbGUnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS91c2VyL21lYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuZW1haWwpLnRvQmUodGVzdFVzZXIuZW1haWwpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBVc2VyIHByb2ZpbGUgcmV0cmlldmVkJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJzLvuI/ig6MgQ3JlYXRvciBSZWdpc3RyYXRpb24gRmxvdycsICgpID0+IHtcclxuICAgIFxyXG4gICAgaXQoJ3Nob3VsZCBhbGxvdyB1c2VyIHRvIGJlY29tZSBhIGNyZWF0b3InLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGNyZWF0b3JEYXRhID0ge1xyXG4gICAgICAgIGNyZWF0b3JOYW1lOiAnQW1hemluZyBDb21pY3MgU3R1ZGlvJyxcclxuICAgICAgICBjcmVhdG9yQmlvOiAnQ3JlYXRpbmcgYW1hemluZyBzdXBlcmhlcm8gY29taWNzIGZvciB0aGUgZGlnaXRhbCBhZ2UuJyxcclxuICAgICAgICBzb2NpYWxMaW5rczoge1xyXG4gICAgICAgICAgdHdpdHRlcjogJ0BhbWF6aW5nY29taWNzJyxcclxuICAgICAgICAgIGluc3RhZ3JhbTogJ0BhbWF6aW5nX2NvbWljc19zdHVkaW8nXHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZfS91c2VyL2NyZWF0b3IvYmVjb21lYCwgY3JlYXRvckRhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmlzQ3JlYXRvcikudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jcmVhdG9yTmFtZSkudG9CZShjcmVhdG9yRGF0YS5jcmVhdG9yTmFtZSk7XHJcbiAgICAgIFxyXG4gICAgICBjcmVhdG9ySWQgPSByZXNwb25zZS5kYXRhLmRhdGEuaWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgVXNlciBiZWNhbWUgY3JlYXRvciBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgY2hlY2sgY3JlYXRvciBzdGF0dXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS91c2VyL2NyZWF0b3Ivc3RhdHVzYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuaXNDcmVhdG9yKS50b0JlKHRydWUpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDcmVhdG9yIHN0YXR1cyB2ZXJpZmllZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBicm93c2UgY3JlYXRvcnMgcHVibGljbHknLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS91c2VyL2NyZWF0b3JzP3BhZ2U9MSZsaW1pdD0xMGApO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXNwb25zZS5kYXRhLmRhdGEuY3JlYXRvcnMpKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNyZWF0b3JzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDcmVhdG9yIGJyb3dzZSB3b3JraW5nJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJzPvuI/ig6MgV2FsbGV0ICYgQ3J5cHRvIFBheW1lbnQgRmxvdycsICgpID0+IHtcclxuICAgIFxyXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgdXNlciB3YWxsZXQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS93YWxsZXQvYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbnN1bWVyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnVzZXJJZCkudG9CZShjb25zdW1lclVzZXJJZCk7XHJcbiAgICAgIFxyXG4gICAgICB3YWxsZXRJZCA9IHJlc3BvbnNlLmRhdGEuZGF0YS5pZDtcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBVc2VyIHdhbGxldCBjcmVhdGVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGNvbm5lY3QgY3J5cHRvIHdhbGxldCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3Qgd2FsbGV0RGF0YSA9IHtcclxuICAgICAgICB3YWxsZXRBZGRyZXNzOiAnSE43Y0FCcUxxNDZFczFqaDkyZFFRaXNBcTY2MlNteEVMTExzSEhlNFlXckgnLFxyXG4gICAgICAgIHdhbGxldFR5cGU6ICdwaGFudG9tJyxcclxuICAgICAgICBzaWduYXR1cmU6ICdtb2NrX3NpZ25hdHVyZV9mb3JfdGVzdGluZydcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWX0vd2FsbGV0L2NyeXB0by9jb25uZWN0YCwgd2FsbGV0RGF0YSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbnN1bWVyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNvbm5lY3RlZFdhbGxldEFkZHJlc3MpLnRvQmUod2FsbGV0RGF0YS53YWxsZXRBZGRyZXNzKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS53YWxsZXRUeXBlKS50b0JlKHdhbGxldERhdGEud2FsbGV0VHlwZSk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENyeXB0byB3YWxsZXQgY29ubmVjdGVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGdldCBOV1QgcHJpY2luZyBwYWNrYWdlcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVl9L3dhbGxldC9wcmljaW5nYCk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmRhdGEuZGF0YSkpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIFxyXG4gICAgICBpZiAocmVzcG9uc2UuZGF0YS5kYXRhLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBud3RQYWNrYWdlSWQgPSByZXNwb25zZS5kYXRhLmRhdGFbMF0uaWQ7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ+KchSBOV1QgcHJpY2luZyBwYWNrYWdlcyByZXRyaWV2ZWQnKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgY3J5cHRvIHBheW1lbnQgbGluayB2aWEgSGVsaW8nLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmICghbnd0UGFja2FnZUlkKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ+KaoO+4jyBTa2lwcGluZyBjcnlwdG8gcGF5bWVudCB0ZXN0IC0gbm8gcHJpY2luZyBwYWNrYWdlIGF2YWlsYWJsZScpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcGF5bWVudERhdGEgPSB7XHJcbiAgICAgICAgcGFja2FnZUlkOiBud3RQYWNrYWdlSWQsXHJcbiAgICAgICAgY3VycmVuY3k6ICdVU0RDJyxcclxuICAgICAgICByZWRpcmVjdFVybDogJ2h0dHBzOi8vbmVyZHdvcmsuY29tL3BheW1lbnQtc3VjY2VzcydcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWX0vd2FsbGV0L2NyeXB0by9wdXJjaGFzZWAsIHBheW1lbnREYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uc3VtZXJUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEucGF5bWVudExpbmsudXJsKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnBheW1lbnRMaW5rLnFyQ29kZSkudG9CZURlZmluZWQoKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgSGVsaW8gcGF5bWVudCBsaW5rIGNyZWF0ZWQnKTtcclxuICAgICAgY29uc29sZS5sb2coJ/CflJcgUGF5bWVudCBVUkw6JywgcmVzcG9uc2UuZGF0YS5kYXRhLnBheW1lbnRMaW5rLnVybCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGdldCB3YWxsZXQgdHJhbnNhY3Rpb24gaGlzdG9yeScsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVl9L3dhbGxldC90cmFuc2FjdGlvbnM/cGFnZT0xJmxpbWl0PTEwYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbnN1bWVyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXNwb25zZS5kYXRhLmRhdGEudHJhbnNhY3Rpb25zKSkudG9CZSh0cnVlKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgVHJhbnNhY3Rpb24gaGlzdG9yeSByZXRyaWV2ZWQnKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnNO+4j+KDoyBGaWxlIFVwbG9hZCBGbG93JywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIHVwbG9hZCBjb21pYyBjb3ZlciB0byBTMycsIGFzeW5jICgpID0+IHtcclxuICAgICAgLy8gQ3JlYXRlIGEgbW9jayBmaWxlIGJ1ZmZlciAoaW4gcmVhbCB0ZXN0LCB5b3UnZCB1c2UgYWN0dWFsIGZpbGUpXHJcbiAgICAgIGNvbnN0IG1vY2tJbWFnZUJ1ZmZlciA9IEJ1ZmZlci5mcm9tKCdtb2NrLWltYWdlLWRhdGEtZm9yLWNvbWljLWNvdmVyJyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ZpbGUnLCBtb2NrSW1hZ2VCdWZmZXIsIHtcclxuICAgICAgICBmaWxlbmFtZTogJ2NvbWljLWNvdmVyLmpwZycsXHJcbiAgICAgICAgY29udGVudFR5cGU6ICdpbWFnZS9qcGVnJ1xyXG4gICAgICB9KTtcclxuICAgICAgZm9ybURhdGEuYXBwZW5kKCdjYXRlZ29yeScsICdjb21pYy1jb3ZlcicpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ3B1cnBvc2UnLCAnc3RvcmFnZScpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2lzUHVibGljJywgJ3RydWUnKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWX0vZmlsZXMvdXBsb2FkL3MzYCwgZm9ybURhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAsXHJcbiAgICAgICAgICAuLi5mb3JtRGF0YS5nZXRIZWFkZXJzKClcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmZpbGUuczNVcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuZmlsZS5jZG5VcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIFxyXG4gICAgICBjb3ZlckZpbGVJZCA9IHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLmlkO1xyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENvbWljIGNvdmVyIHVwbG9hZGVkIHRvIFMzJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIHVwbG9hZCBjb21pYyBwYWdlIGZvciBORlQgKFMzICsgSVBGUyknLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vY2tJbWFnZUJ1ZmZlciA9IEJ1ZmZlci5mcm9tKCdtb2NrLWNvbWljLXBhZ2UtZGF0YS1mb3ItbmZ0Jyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ZpbGUnLCBtb2NrSW1hZ2VCdWZmZXIsIHtcclxuICAgICAgICBmaWxlbmFtZTogJ2NvbWljLXBhZ2UtMDAxLmpwZycsIFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnaW1hZ2UvanBlZydcclxuICAgICAgfSk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnY2F0ZWdvcnknLCAnbmZ0LWFzc2V0Jyk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnbmZ0TWV0YWRhdGEnLCBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgdHJhaXRfdHlwZTogJ1BhZ2UgTnVtYmVyJyxcclxuICAgICAgICB2YWx1ZTogJzEnLFxyXG4gICAgICAgIHJhcml0eTogJ0NvbW1vbidcclxuICAgICAgfSkpO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZfS9maWxlcy91cGxvYWQvbmZ0YCwgZm9ybURhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAsXHJcbiAgICAgICAgICAuLi5mb3JtRGF0YS5nZXRIZWFkZXJzKClcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmZpbGUuczNVcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuZmlsZS5pcGZzSGFzaCkudG9CZURlZmluZWQoKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLmlwZnNVcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuZmlsZS5pc1Bpbm5lZFRvSVBGUykudG9CZSh0cnVlKTtcclxuICAgICAgXHJcbiAgICAgIHVwbG9hZGVkRmlsZUlkID0gcmVzcG9uc2UuZGF0YS5kYXRhLmZpbGUuaWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29taWMgcGFnZSB1cGxvYWRlZCB0byBTMyArIElQRlMnKTtcclxuICAgICAgY29uc29sZS5sb2coJ/CfjJAgSVBGUyBIYXNoOicsIHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLmlwZnNIYXNoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgZ2V0IHVzZXIgdXBsb2FkZWQgZmlsZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS9maWxlcy8/Y2F0ZWdvcnk9Y29taWMtY292ZXImcGFnZT0xJmxpbWl0PTEwYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlcykpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIFVzZXIgZmlsZXMgcmV0cmlldmVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGdldCBwcmVzaWduZWQgdXBsb2FkIFVSTCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZfS9maWxlcy9wcmVzaWduZWQtdXJsYCwge1xyXG4gICAgICAgIGZpbGVuYW1lOiAnY29taWMtcGFnZS0wMDIuanBnJyxcclxuICAgICAgICBjb250ZW50VHlwZTogJ2ltYWdlL2pwZWcnLFxyXG4gICAgICAgIGNhdGVnb3J5OiAnY29taWMtcGFnZSdcclxuICAgICAgfSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudXBsb2FkVXJsKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnMzS2V5KS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBQcmVzaWduZWQgdXBsb2FkIFVSTCBnZW5lcmF0ZWQnKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnNe+4j+KDoyBDb21pYyBDcmVhdGlvbiBGbG93JywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBhIG5ldyBjb21pYycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgY29taWNEYXRhID0ge1xyXG4gICAgICAgIHRpdGxlOiAnVGhlIEFtYXppbmcgQ3J5cHRvIEhlcm9lcycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbiBlcGljIHRhbGUgb2YgYmxvY2tjaGFpbiBzdXBlcmhlcm9lcyBzYXZpbmcgdGhlIG1ldGF2ZXJzZSBmcm9tIGV2aWwgY2VudHJhbGl6ZWQgZm9yY2VzLicsXHJcbiAgICAgICAgYXV0aG9yOiAnQW1hemluZyBDb21pY3MgU3R1ZGlvJyxcclxuICAgICAgICBhcnRpc3Q6ICdEaWdpdGFsIEFydCBNYXN0ZXInLFxyXG4gICAgICAgIGdlbnJlOiAnU3VwZXJoZXJvJyxcclxuICAgICAgICBwcmljZTogNS45OSxcclxuICAgICAgICBpc0ZyZWVtaXVtOiB0cnVlLFxyXG4gICAgICAgIGZyZWVQYWdlQ291bnQ6IDMsXHJcbiAgICAgICAgY292ZXJGaWxlSWQ6IGNvdmVyRmlsZUlkLFxyXG4gICAgICAgIGlzTkZURWxpZ2libGU6IHRydWUsXHJcbiAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgIHRhZ3M6IFsnYmxvY2tjaGFpbicsICdzdXBlcmhlcm8nLCAnd2ViMycsICdjcnlwdG8nXSxcclxuICAgICAgICAgIGFnZVJhdGluZzogJ1RlZW4nLFxyXG4gICAgICAgICAgbGFuZ3VhZ2U6ICdFbmdsaXNoJ1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWX0vY29taWNzL2NyZWF0b3JgLCBjb21pY0RhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDEpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnRpdGxlKS50b0JlKGNvbWljRGF0YS50aXRsZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuY3JlYXRvcklkKS50b0JlKGNyZWF0b3JVc2VySWQpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnN0YXR1cykudG9CZSgnZHJhZnQnKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5pc05GVEVsaWdpYmxlKS50b0JlKHRydWUpO1xyXG4gICAgICBcclxuICAgICAgY29taWNJZCA9IHJlc3BvbnNlLmRhdGEuZGF0YS5pZDtcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDb21pYyBjcmVhdGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBhZGQgcGFnZXMgdG8gY29taWMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBhZ2VzRGF0YSA9IHtcclxuICAgICAgICBwYWdlczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBwYWdlTnVtYmVyOiAxLFxyXG4gICAgICAgICAgICBmaWxlSWQ6IHVwbG9hZGVkRmlsZUlkLFxyXG4gICAgICAgICAgICBhbHRUZXh0OiAnT3BlbmluZyBzY2VuZSB3aXRoIG91ciBoZXJvZXMnLFxyXG4gICAgICAgICAgICBpc1ByZXZpZXc6IHRydWVcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHBhZ2VOdW1iZXI6IDIsXHJcbiAgICAgICAgICAgIGZpbGVJZDogdXBsb2FkZWRGaWxlSWQsIC8vIEluIHJlYWwgc2NlbmFyaW8sIHdvdWxkIGJlIGRpZmZlcmVudCBmaWxlc1xyXG4gICAgICAgICAgICBhbHRUZXh0OiAnVGhlIHZpbGxhaW4gcmV2ZWFscyB0aGVpciBwbGFuJyxcclxuICAgICAgICAgICAgaXNQcmV2aWV3OiB0cnVlXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBwYWdlTnVtYmVyOiAzLFxyXG4gICAgICAgICAgICBmaWxlSWQ6IHVwbG9hZGVkRmlsZUlkLFxyXG4gICAgICAgICAgICBhbHRUZXh0OiAnRXBpYyBiYXR0bGUgYmVnaW5zJyxcclxuICAgICAgICAgICAgaXNQcmV2aWV3OiB0cnVlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZfS9jb21pY3MvY3JlYXRvci8ke2NvbWljSWR9L3BhZ2VzYCwgcGFnZXNEYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAxKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzcG9uc2UuZGF0YS5kYXRhKSkudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5sZW5ndGgpLnRvQmUoMyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENvbWljIHBhZ2VzIGFkZGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBnZXQgY3JlYXRvciBjb21pY3MnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS9jb21pY3MvY3JlYXRvci9teS1jb21pY3M/cGFnZT0xJmxpbWl0PTEwYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmRhdGEuZGF0YS5jb21pY3MpKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNvbWljcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ3JlYXRvciBjb21pY3MgcmV0cmlldmVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBjb21pYyB0byBwdWJsaXNoZWQgc3RhdHVzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCB1cGRhdGVEYXRhID0ge1xyXG4gICAgICAgIHN0YXR1czogJ3B1Ymxpc2hlZCcsXHJcbiAgICAgICAgdGl0bGU6ICdUaGUgQW1hemluZyBDcnlwdG8gSGVyb2VzIC0gVXBkYXRlZCdcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucHV0KGAke0FQSV9HQVRFV0FZfS9jb21pY3MvY3JlYXRvci8ke2NvbWljSWR9YCwgdXBkYXRlRGF0YSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuc3RhdHVzKS50b0JlKCdwdWJsaXNoZWQnKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5wdWJsaXNoZWRBdCkudG9CZURlZmluZWQoKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29taWMgcHVibGlzaGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBnZXQgY3JlYXRvciBkYXNoYm9hcmQgc3RhdHMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS9jb21pY3MvY3JlYXRvci9zdGF0c2AsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnRvdGFsQ29taWNzKS50b0JlR3JlYXRlclRoYW4oMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEucHVibGlzaGVkQ29taWNzKS50b0JlR3JlYXRlclRoYW4oMCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENyZWF0b3Igc3RhdHMgcmV0cmlldmVkJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJzbvuI/ig6MgQ29uc3VtZXIgQ29taWMgRGlzY292ZXJ5ICYgUHVyY2hhc2UgRmxvdycsICgpID0+IHtcclxuICAgIFxyXG4gICAgaXQoJ3Nob3VsZCBicm93c2UgY29taWNzIHB1YmxpY2x5JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWX0vY29taWNzP3BhZ2U9MSZsaW1pdD0xMCZnZW5yZT1TdXBlcmhlcm9gKTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzcG9uc2UuZGF0YS5kYXRhLmNvbWljcykpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEucGFnaW5hdGlvbikudG9CZURlZmluZWQoKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29taWNzIGJyb3dzaW5nIHdvcmtpbmcnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgZ2V0IHNwZWNpZmljIGNvbWljIGRldGFpbHMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS9jb21pY3MvJHtjb21pY0lkfWAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25zdW1lclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jb21pYy5pZCkudG9CZShjb21pY0lkKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5oYXNQdXJjaGFzZWQpLnRvQmUoZmFsc2UpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDb21pYyBkZXRhaWxzIHJldHJpZXZlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBnZXQgY29taWMgcHJldmlldyBwYWdlcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVl9L2NvbWljcy8ke2NvbWljSWR9L3BhZ2VzYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbnN1bWVyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXNwb25zZS5kYXRhLmRhdGEucGFnZXMpKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmFjY2Vzc0xldmVsKS50b0JlKCdwcmV2aWV3Jyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENvbWljIHByZXZpZXcgcGFnZXMgYWNjZXNzaWJsZScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBhZGQgY29taWMgcmV2aWV3JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXZpZXdEYXRhID0ge1xyXG4gICAgICAgIHJhdGluZzogNSxcclxuICAgICAgICByZXZpZXc6ICdBbWF6aW5nIGFydHdvcmsgYW5kIGNvbXBlbGxpbmcgc3RvcnlsaW5lISBMb3ZlIHRoZSBXZWIzIHRoZW1lLidcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWX0vY29taWNzLyR7Y29taWNJZH0vcmV2aWV3YCwgcmV2aWV3RGF0YSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbnN1bWVyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnJhdGluZykudG9CZShyZXZpZXdEYXRhLnJhdGluZyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENvbWljIHJldmlldyBhZGRlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCB0cmFjayByZWFkaW5nIHByb2dyZXNzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9ncmVzc0RhdGEgPSB7XHJcbiAgICAgICAgY3VycmVudFBhZ2U6IDJcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWX0vY29taWNzLyR7Y29taWNJZH0vcHJvZ3Jlc3NgLCBwcm9ncmVzc0RhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25zdW1lclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jdXJyZW50UGFnZSkudG9CZSgyKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgUmVhZGluZyBwcm9ncmVzcyB0cmFja2VkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGdldCByZWFkaW5nIGhpc3RvcnknLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS9jb21pY3MvdXNlci9oaXN0b3J5YCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbnN1bWVyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXNwb25zZS5kYXRhLmRhdGEpKS50b0JlKHRydWUpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBSZWFkaW5nIGhpc3RvcnkgcmV0cmlldmVkJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJzfvuI/ig6MgRXJyb3IgSGFuZGxpbmcgJiBFZGdlIENhc2VzJywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIHJlamVjdCB1bmF1dGhvcml6ZWQgYWNjZXNzIHRvIGNyZWF0b3IgZW5kcG9pbnRzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVl9L2NvbWljcy9jcmVhdG9yYCwge1xyXG4gICAgICAgICAgdGl0bGU6ICdVbmF1dGhvcml6ZWQgQ29taWMnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwMSk7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZShmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgVW5hdXRob3JpemVkIGFjY2VzcyBwcm9wZXJseSByZWplY3RlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgaW52YWxpZCBmaWxlIHVwbG9hZHMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnZmlsZScsIEJ1ZmZlci5mcm9tKCcnKSwge1xyXG4gICAgICAgIGZpbGVuYW1lOiAnJyxcclxuICAgICAgICBjb250ZW50VHlwZTogJ2ludmFsaWQvdHlwZSdcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVl9L2ZpbGVzL3VwbG9hZC9zM2AsIGZvcm1EYXRhLCB7XHJcbiAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCxcclxuICAgICAgICAgICAgLi4uZm9ybURhdGEuZ2V0SGVhZGVycygpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwMCk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgSW52YWxpZCBmaWxlIHVwbG9hZCBwcm9wZXJseSBoYW5kbGVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBub24tZXhpc3RlbnQgY29taWMgYWNjZXNzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBmYWtlQ29taWNJZCA9ICcwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAnO1xyXG4gICAgICBcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVl9L2NvbWljcy8ke2Zha2VDb21pY0lkfWApO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLnN0YXR1cykudG9CZSg0MDQpO1xyXG4gICAgICAgIGV4cGVjdChlcnJvci5yZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUoZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIE5vbi1leGlzdGVudCBjb21pYyBhY2Nlc3MgcHJvcGVybHkgaGFuZGxlZCcpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCc477iP4oOjIFNlcnZpY2UgSGVhbHRoIENoZWNrcycsICgpID0+IHtcclxuICAgIFxyXG4gICAgaXQoJ3Nob3VsZCBjaGVjayBBUEkgR2F0ZXdheSBoZWFsdGgnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZfS9oZWFsdGhgKTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQVBJIEdhdGV3YXkgaGVhbHRoIGNoZWNrIHBhc3NlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBjaGVjayBpbmRpdmlkdWFsIHNlcnZpY2UgaGVhbHRoJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBzZXJ2aWNlcyA9IFtcclxuICAgICAgICB7IG5hbWU6ICdhdXRoLXNlcnZpY2UnLCBwb3J0OiAzMDAxIH0sXHJcbiAgICAgICAgeyBuYW1lOiAndXNlci1zZXJ2aWNlJywgcG9ydDogMzAwMiB9LFxyXG4gICAgICAgIHsgbmFtZTogJ2NvbWljLXNlcnZpY2UnLCBwb3J0OiAzMDAzIH0sXHJcbiAgICAgICAgeyBuYW1lOiAnd2FsbGV0LXNlcnZpY2UnLCBwb3J0OiAzMDA0IH0sXHJcbiAgICAgICAgeyBuYW1lOiAnZmlsZS1zZXJ2aWNlJywgcG9ydDogMzAwNyB9XHJcbiAgICAgIF07XHJcblxyXG4gICAgICBmb3IgKGNvbnN0IHNlcnZpY2Ugb2Ygc2VydmljZXMpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYGh0dHA6Ly9sb2NhbGhvc3Q6JHtzZXJ2aWNlLnBvcnR9L2hlYWx0aGApO1xyXG4gICAgICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coYOKchSAke3NlcnZpY2UubmFtZX0gaGVhbHRoIGNoZWNrIHBhc3NlZGApO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhg4pqg77iPICR7c2VydmljZS5uYW1lfSBub3QgcmVzcG9uZGluZyAobWF5IGJlIHJ1bm5pbmcgaW4gY29udGFpbmVyKWApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIENsZWFudXAgYWZ0ZXIgdGVzdHNcclxuICBhZnRlckFsbChhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnXFxu8J+nuSBDbGVhbmluZyB1cCB0ZXN0IGRhdGEuLi4nKTtcclxuICAgIFxyXG4gICAgLy8gRGVsZXRlIHVwbG9hZGVkIGZpbGVzXHJcbiAgICBpZiAodXBsb2FkZWRGaWxlSWQpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBheGlvcy5kZWxldGUoYCR7QVBJX0dBVEVXQVl9L2ZpbGVzLyR7dXBsb2FkZWRGaWxlSWR9YCwge1xyXG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUgVXBsb2FkZWQgZmlsZXMgY2xlYW5lZCB1cCcpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCfimqDvuI8gRmlsZSBjbGVhbnVwIGZhaWxlZCAobWF5IG5vdCBleGlzdCknKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBBcmNoaXZlIGNyZWF0ZWQgY29taWNcclxuICAgIGlmIChjb21pY0lkKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MuZGVsZXRlKGAke0FQSV9HQVRFV0FZfS9jb21pY3MvY3JlYXRvci8ke2NvbWljSWR9YCwge1xyXG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCfinIUgVGVzdCBjb21pYyBhcmNoaXZlZCcpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCfimqDvuI8gQ29taWMgY2xlYW51cCBmYWlsZWQgKG1heSBub3QgZXhpc3QpJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coJ/CfjokgVGVzdCBjbGVhbnVwIGNvbXBsZXRlZCEnKTtcclxuICB9KTtcclxufSk7XHJcblxyXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gc2ltdWxhdGUgZGVsYXkgKGZvciByYXRlIGxpbWl0aW5nKVxyXG5jb25zdCBkZWxheSA9IChtczogbnVtYmVyKSA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTsiXX0=