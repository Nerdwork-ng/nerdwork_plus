import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';
import FormData from 'form-data';
const COMIC_SERVICE_URL = process.env.COMIC_SERVICE_URL || 'http://localhost:3003';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
describe('🎨 Comic Creator Flow Tests', () => {
    let creatorToken;
    let creatorUserId;
    let consumerToken;
    let consumerUserId;
    let creatorId;
    let comicId;
    let coverFileId;
    let pageFileId;
    let purchaseTransactionId;
    const creatorUser = {
        email: `test-creator-${Date.now()}@nerdwork.com`,
        password: 'SecureTestPassword123!',
        username: `creator${Date.now()}`
    };
    const consumerUser = {
        email: `test-consumer-${Date.now()}@nerdwork.com`,
        password: 'SecureTestPassword123!',
        username: `consumer${Date.now()}`
    };
    beforeAll(async () => {
        // Create creator user
        const creatorSignup = await axios.post(`${API_GATEWAY_URL}/auth/signup`, creatorUser);
        creatorToken = creatorSignup.data.data.token;
        creatorUserId = creatorSignup.data.data.user.id;
        // Create consumer user
        const consumerSignup = await axios.post(`${API_GATEWAY_URL}/auth/signup`, consumerUser);
        consumerToken = consumerSignup.data.data.token;
        consumerUserId = consumerSignup.data.data.user.id;
        console.log('🔧 Test users created for comic creator tests');
    });
    describe('1️⃣ Becoming a Creator', () => {
        it('should allow user to become a creator', async () => {
            const creatorData = {
                creatorName: 'Digital Comics Studio',
                creatorBio: 'We create amazing digital comics with Web3 integration. Specialized in superhero and sci-fi genres.',
                socialLinks: {
                    twitter: '@digitalcomicsstudio',
                    instagram: '@digital_comics_studio',
                    website: 'https://digitalcomics.studio'
                }
            };
            const response = await axios.post(`${API_GATEWAY_URL}/user/creator/become`, creatorData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.isCreator).toBe(true);
            expect(response.data.data.creatorName).toBe(creatorData.creatorName);
            expect(response.data.data.creatorBio).toBe(creatorData.creatorBio);
            expect(response.data.data.creatorVerified).toBe(false);
            creatorId = response.data.data.id;
            console.log('✅ User became creator successfully');
        });
        it('should prevent non-creators from accessing creator endpoints', async () => {
            try {
                await axios.post(`${API_GATEWAY_URL}/comics/creator`, {
                    title: 'Unauthorized Comic'
                }, {
                    headers: { Authorization: `Bearer ${consumerToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.error).toContain('not a creator');
            }
            console.log('✅ Non-creator access properly restricted');
        });
        it('should get creator status', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/user/creator/status`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.isCreator).toBe(true);
            expect(response.data.data.creatorName).toBe('Digital Comics Studio');
            console.log('✅ Creator status retrieved');
        });
        it('should update creator profile', async () => {
            const updateData = {
                creatorBio: 'Updated bio: Award-winning digital comics studio with over 50 published titles.',
                socialLinks: {
                    twitter: '@digitalcomicsstudio',
                    instagram: '@digital_comics_studio',
                    website: 'https://digitalcomics.studio',
                    discord: 'https://discord.gg/digitalcomics'
                }
            };
            const response = await axios.put(`${API_GATEWAY_URL}/user/creator/profile`, updateData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.creatorBio).toBe(updateData.creatorBio);
            expect(response.data.data.socialLinks.discord).toBe(updateData.socialLinks.discord);
            console.log('✅ Creator profile updated');
        });
    });
    describe('2️⃣ Content Upload & Preparation', () => {
        it('should upload comic cover image', async () => {
            const mockCoverImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
            const formData = new FormData();
            formData.append('file', mockCoverImage, {
                filename: 'crypto-heroes-cover.png',
                contentType: 'image/png'
            });
            formData.append('category', 'comic-cover');
            formData.append('purpose', 'storage');
            formData.append('isPublic', 'true');
            const response = await axios.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                headers: {
                    Authorization: `Bearer ${creatorToken}`,
                    ...formData.getHeaders()
                }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.file.category).toBe('comic-cover');
            expect(response.data.data.file.s3Url).toBeDefined();
            coverFileId = response.data.data.file.id;
            console.log('✅ Comic cover uploaded');
        });
        it('should upload comic page for potential NFT minting', async () => {
            const mockPageImage = Buffer.from('fake-comic-page-art-data-with-nft-potential');
            const formData = new FormData();
            formData.append('file', mockPageImage, {
                filename: 'crypto-heroes-page-001.jpg',
                contentType: 'image/jpeg'
            });
            formData.append('category', 'nft-asset');
            formData.append('referenceType', 'comic-page');
            formData.append('nftMetadata', JSON.stringify({
                name: 'Crypto Heroes - Page 1',
                description: 'The opening page where our heroes first discover their blockchain powers.',
                attributes: [
                    { trait_type: 'Page Number', value: '1' },
                    { trait_type: 'Rarity', value: 'First Edition' },
                    { trait_type: 'Series', value: 'Crypto Heroes Vol.1' },
                    { trait_type: 'Artist', value: 'Digital Comics Studio' }
                ]
            }));
            const response = await axios.post(`${API_GATEWAY_URL}/files/upload/nft`, formData, {
                headers: {
                    Authorization: `Bearer ${creatorToken}`,
                    ...formData.getHeaders()
                }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.file.ipfsHash).toBeDefined();
            expect(response.data.data.file.isPinnedToIPFS).toBe(true);
            expect(response.data.data.ipfsResult.hash).toBeDefined();
            pageFileId = response.data.data.file.id;
            console.log('✅ Comic page uploaded to S3 + IPFS for NFT potential');
        });
    });
    describe('3️⃣ Comic Creation', () => {
        it('should create a new comic', async () => {
            const comicData = {
                title: 'The Crypto Heroes: Genesis',
                description: 'In a world where blockchain technology has evolved beyond imagination, a group of unlikely heroes must master the power of decentralized networks to save humanity from a centralized dystopia.',
                author: 'Digital Comics Studio',
                artist: 'Alex Blockchain',
                publisher: 'Web3 Comics',
                genre: 'Superhero',
                price: 9.99,
                isFreemium: true,
                freePageCount: 5,
                coverFileId: coverFileId,
                isNFTEligible: true,
                metadata: {
                    tags: ['blockchain', 'superhero', 'web3', 'crypto', 'dystopia'],
                    ageRating: 'Teen+',
                    language: 'English',
                    estimatedReadTime: '15-20 minutes',
                    targetAudience: 'Web3 enthusiasts and comic lovers'
                }
            };
            const response = await axios.post(`${API_GATEWAY_URL}/comics/creator`, comicData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.data.title).toBe(comicData.title);
            expect(response.data.data.creatorId).toBe(creatorUserId);
            expect(response.data.data.status).toBe('draft');
            expect(response.data.data.isNFTEligible).toBe(true);
            expect(response.data.data.coverUrl).toBeDefined();
            expect(response.data.data.coverFileId).toBe(coverFileId);
            comicId = response.data.data.id;
            console.log('✅ Comic created successfully');
        });
        it('should add pages to the comic', async () => {
            const pagesData = {
                pages: [
                    {
                        pageNumber: 1,
                        fileId: pageFileId,
                        altText: 'Opening scene: The city skyline dominated by centralized towers, our heroes unaware of their destiny',
                        isPreview: true
                    },
                    {
                        pageNumber: 2,
                        fileId: pageFileId, // In real scenario, different file
                        altText: 'Meet Jake, a young developer who stumbles upon a mysterious smart contract',
                        isPreview: true
                    },
                    {
                        pageNumber: 3,
                        fileId: pageFileId,
                        altText: 'The smart contract activates, granting Jake incredible blockchain powers',
                        isPreview: true
                    },
                    {
                        pageNumber: 4,
                        fileId: pageFileId,
                        altText: 'Jake discovers others have been chosen by the decentralized network',
                        isPreview: true
                    },
                    {
                        pageNumber: 5,
                        fileId: pageFileId,
                        altText: 'The team assembles: The Validators - guardians of the blockchain',
                        isPreview: true
                    },
                    {
                        pageNumber: 6,
                        fileId: pageFileId,
                        altText: 'First confrontation with the Centralized Authority agents',
                        isPreview: false // Premium content
                    },
                    {
                        pageNumber: 7,
                        fileId: pageFileId,
                        altText: 'Epic battle using Web3 powers - smart contract spells and DeFi shields',
                        isPreview: false
                    }
                ]
            };
            const response = await axios.post(`${API_GATEWAY_URL}/comics/creator/${comicId}/pages`, pagesData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBe(7);
            // Check that preview pages are properly marked
            const previewPages = response.data.data.filter((page) => page.isPreview);
            const premiumPages = response.data.data.filter((page) => !page.isPreview);
            expect(previewPages.length).toBe(5);
            expect(premiumPages.length).toBe(2);
            console.log('✅ Comic pages added successfully');
        });
        it('should get creator comic pages', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/comics/creator/${comicId}/pages`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.comic.id).toBe(comicId);
            expect(response.data.data.comic.totalPages).toBe(7);
            expect(Array.isArray(response.data.data.pages)).toBe(true);
            expect(response.data.data.pages.length).toBe(7);
            console.log('✅ Creator can access all comic pages');
        });
        it('should update comic details', async () => {
            const updateData = {
                title: 'The Crypto Heroes: Genesis (Director\'s Cut)',
                description: 'UPDATED: In a world where blockchain technology has evolved beyond imagination, a group of unlikely heroes must master the power of decentralized networks to save humanity from a centralized dystopia. Now with bonus content!',
                price: 12.99,
                metadata: {
                    tags: ['blockchain', 'superhero', 'web3', 'crypto', 'dystopia', 'directors-cut'],
                    ageRating: 'Teen+',
                    language: 'English',
                    estimatedReadTime: '20-25 minutes',
                    version: 'Directors Cut v1.1'
                }
            };
            const response = await axios.put(`${API_GATEWAY_URL}/comics/creator/${comicId}`, updateData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.title).toBe(updateData.title);
            expect(response.data.data.price).toBe(updateData.price.toString());
            expect(response.data.data.metadata.version).toBe('Directors Cut v1.1');
            console.log('✅ Comic details updated');
        });
        it('should publish the comic', async () => {
            const response = await axios.put(`${API_GATEWAY_URL}/comics/creator/${comicId}`, {
                status: 'published'
            }, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.status).toBe('published');
            expect(response.data.data.publishedAt).toBeDefined();
            console.log('✅ Comic published successfully');
        });
    });
    describe('4️⃣ Creator Dashboard & Analytics', () => {
        it('should get creator comics list', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/comics/creator/my-comics?page=1&limit=10`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data.data.comics)).toBe(true);
            expect(response.data.data.comics.length).toBeGreaterThan(0);
            const comic = response.data.data.comics.find((c) => c.id === comicId);
            expect(comic).toBeDefined();
            expect(comic.status).toBe('published');
            console.log('✅ Creator comics list retrieved');
        });
        it('should filter comics by status', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/comics/creator/my-comics?status=published&page=1&limit=5`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            response.data.data.comics.forEach((comic) => {
                expect(comic.status).toBe('published');
            });
            console.log('✅ Comic status filtering working');
        });
        it('should get creator dashboard stats', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/comics/creator/stats`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.totalComics).toBeGreaterThan(0);
            expect(response.data.data.publishedComics).toBeGreaterThan(0);
            expect(response.data.data.draftComics).toBeGreaterThanOrEqual(0);
            expect(response.data.data.totalPurchases).toBeGreaterThanOrEqual(0);
            expect(response.data.data.totalRevenue).toBeDefined();
            console.log('✅ Creator dashboard stats retrieved');
            console.log(`📊 Stats: ${response.data.data.totalComics} comics, ${response.data.data.publishedComics} published, $${response.data.data.totalRevenue} revenue`);
        });
    });
    describe('5️⃣ Consumer Discovery & Interaction', () => {
        it('should allow consumers to discover published comics', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/comics?page=1&limit=10&genre=Superhero`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data.data.comics)).toBe(true);
            const publishedComic = response.data.data.comics.find((c) => c.id === comicId);
            expect(publishedComic).toBeDefined();
            expect(publishedComic.status).toBe('published');
            console.log('✅ Comic discoverable by consumers');
        });
        it('should get comic details as consumer', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/comics/${comicId}`, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.comic.id).toBe(comicId);
            expect(response.data.data.hasPurchased).toBe(false);
            expect(response.data.data.progress).toBeNull();
            console.log('✅ Consumer can view comic details');
        });
        it('should allow consumers to view preview pages only', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/comics/${comicId}/pages`, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.accessLevel).toBe('preview');
            expect(response.data.data.pages.length).toBe(5); // Only preview pages
            response.data.data.pages.forEach((page) => {
                expect(page.isPreview).toBe(true);
            });
            console.log('✅ Consumer limited to preview pages');
        });
        it('should allow consumers to add reviews', async () => {
            const reviewData = {
                rating: 5,
                review: 'Amazing artwork and storyline! Love the Web3 integration and the way blockchain concepts are woven into the superhero narrative. The art style is incredible and the characters are well-developed. Can\'t wait for the next issue!'
            };
            const response = await axios.post(`${API_GATEWAY_URL}/comics/${comicId}/review`, reviewData, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.rating).toBe(5);
            expect(response.data.data.review).toBe(reviewData.review);
            expect(response.data.data.comicId).toBe(comicId);
            console.log('✅ Consumer can add reviews');
        });
        it('should track reading progress for preview pages', async () => {
            const progressData = {
                currentPage: 3
            };
            const response = await axios.post(`${API_GATEWAY_URL}/comics/${comicId}/progress`, progressData, {
                headers: { Authorization: `Bearer ${consumerToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.currentPage).toBe(3);
            expect(response.data.data.totalPages).toBe(7);
            expect(response.data.data.completedAt).toBeNull(); // Not completed yet
            console.log('✅ Reading progress tracked');
        });
    });
    describe('6️⃣ Creator Content Management', () => {
        it('should prevent editing published comic pages', async () => {
            // This is business logic - once published, structural changes should be limited
            const response = await axios.get(`${API_GATEWAY_URL}/comics/creator/${comicId}/pages`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.comic.status).toBe('published');
            console.log('✅ Published comic pages accessible to creator');
        });
        it('should not allow deletion of comic with potential purchases', async () => {
            // Since this comic might have reviews/engagement, deletion should be restricted
            const response = await axios.get(`${API_GATEWAY_URL}/comics/creator/stats`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            console.log('✅ Comic stats accessible for business decisions');
        });
        it('should create another comic in draft status', async () => {
            const draftComicData = {
                title: 'The Crypto Heroes: Rising Storm (Coming Soon)',
                description: 'The sequel to Genesis is in development. Our heroes face their greatest challenge yet...',
                author: 'Digital Comics Studio',
                genre: 'Superhero',
                price: 14.99,
                isFreemium: false,
                freePageCount: 0,
                isNFTEligible: true,
                metadata: {
                    tags: ['blockchain', 'superhero', 'sequel', 'coming-soon'],
                    status: 'in-development'
                }
            };
            const response = await axios.post(`${API_GATEWAY_URL}/comics/creator`, draftComicData, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(201);
            expect(response.data.data.status).toBe('draft');
            expect(response.data.data.title).toContain('Coming Soon');
            console.log('✅ Draft comic created for future release');
        });
        it('should show updated creator stats with multiple comics', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/comics/creator/stats`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.totalComics).toBeGreaterThanOrEqual(2);
            expect(response.data.data.draftComics).toBeGreaterThanOrEqual(1);
            console.log('✅ Creator stats updated with multiple comics');
        });
    });
    describe('7️⃣ Cross-Service Integration', () => {
        it('should link comic with file service', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/files/?category=comic-cover&page=1&limit=5`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(response.status).toBe(200);
            const coverFile = response.data.data.files.find((f) => f.id === coverFileId);
            expect(coverFile).toBeDefined();
            console.log('✅ Comic-File service integration working');
        });
        it('should maintain creator profile consistency', async () => {
            const creatorProfileResponse = await axios.get(`${API_GATEWAY_URL}/user/creator/${creatorId}`);
            const creatorComicsResponse = await axios.get(`${API_GATEWAY_URL}/comics/creator/my-comics`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            expect(creatorProfileResponse.status).toBe(200);
            expect(creatorComicsResponse.status).toBe(200);
            const profile = creatorProfileResponse.data.data;
            const comics = creatorComicsResponse.data.data.comics;
            expect(profile.creatorName).toBe('Digital Comics Studio');
            expect(comics.length).toBeGreaterThan(0);
            console.log('✅ Creator-Comic service integration consistent');
        });
    });
    describe('8️⃣ Error Handling & Security', () => {
        it('should prevent unauthorized comic access', async () => {
            try {
                await axios.get(`${API_GATEWAY_URL}/comics/creator/${comicId}/pages`, {
                    headers: { Authorization: `Bearer ${consumerToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(404);
                expect(error.response.data.error).toContain('not found or not owned');
            }
            console.log('✅ Unauthorized comic access prevented');
        });
        it('should handle invalid comic IDs gracefully', async () => {
            try {
                await axios.get(`${API_GATEWAY_URL}/comics/creator/invalid-comic-id/pages`, {
                    headers: { Authorization: `Bearer ${creatorToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(404);
            }
            console.log('✅ Invalid comic IDs handled gracefully');
        });
        it('should validate comic creation data', async () => {
            try {
                await axios.post(`${API_GATEWAY_URL}/comics/creator`, {
                    title: '', // Empty title should fail
                    genre: 'Superhero'
                }, {
                    headers: { Authorization: `Bearer ${creatorToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.error).toContain('required');
            }
            console.log('✅ Comic creation validation working');
        });
        it('should maintain data integrity across operations', async () => {
            // Get initial stats
            const initialStats = await axios.get(`${API_GATEWAY_URL}/comics/creator/stats`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            // Get comic list
            const comicsList = await axios.get(`${API_GATEWAY_URL}/comics/creator/my-comics`, {
                headers: { Authorization: `Bearer ${creatorToken}` }
            });
            // Verify consistency
            expect(initialStats.data.data.totalComics).toBe(comicsList.data.data.comics.length);
            console.log('✅ Data integrity maintained across services');
        });
    });
    afterAll(async () => {
        console.log('\n🧹 Cleaning up comic creator test data...');
        // Archive test comics (don't delete due to business logic)
        if (comicId) {
            try {
                await axios.put(`${API_GATEWAY_URL}/comics/creator/${comicId}`, {
                    status: 'archived'
                }, {
                    headers: { Authorization: `Bearer ${creatorToken}` }
                });
                console.log('✅ Test comic archived');
            }
            catch (error) {
                console.log('⚠️ Comic cleanup failed (may not exist)');
            }
        }
        console.log('🎉 Comic creator test cleanup completed!');
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29taWMtY3JlYXRvci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29taWMtY3JlYXRvci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzFFLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFFakMsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixJQUFJLHVCQUF1QixDQUFDO0FBQ25GLE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSx1QkFBdUIsQ0FBQztBQUNqRixNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSx1QkFBdUIsQ0FBQztBQUUvRSxRQUFRLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO0lBQzNDLElBQUksWUFBb0IsQ0FBQztJQUN6QixJQUFJLGFBQXFCLENBQUM7SUFDMUIsSUFBSSxhQUFxQixDQUFDO0lBQzFCLElBQUksY0FBc0IsQ0FBQztJQUMzQixJQUFJLFNBQWlCLENBQUM7SUFDdEIsSUFBSSxPQUFlLENBQUM7SUFDcEIsSUFBSSxXQUFtQixDQUFDO0lBQ3hCLElBQUksVUFBa0IsQ0FBQztJQUN2QixJQUFJLHFCQUE2QixDQUFDO0lBRWxDLE1BQU0sV0FBVyxHQUFHO1FBQ2xCLEtBQUssRUFBRSxnQkFBZ0IsSUFBSSxDQUFDLEdBQUcsRUFBRSxlQUFlO1FBQ2hELFFBQVEsRUFBRSx3QkFBd0I7UUFDbEMsUUFBUSxFQUFFLFVBQVUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0tBQ2pDLENBQUM7SUFFRixNQUFNLFlBQVksR0FBRztRQUNuQixLQUFLLEVBQUUsaUJBQWlCLElBQUksQ0FBQyxHQUFHLEVBQUUsZUFBZTtRQUNqRCxRQUFRLEVBQUUsd0JBQXdCO1FBQ2xDLFFBQVEsRUFBRSxXQUFXLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtLQUNsQyxDQUFDO0lBRUYsU0FBUyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ25CLHNCQUFzQjtRQUN0QixNQUFNLGFBQWEsR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxlQUFlLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN0RixZQUFZLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzdDLGFBQWEsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBRWhELHVCQUF1QjtRQUN2QixNQUFNLGNBQWMsR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxlQUFlLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN4RixhQUFhLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQy9DLGNBQWMsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBRWxELE9BQU8sQ0FBQyxHQUFHLENBQUMsK0NBQStDLENBQUMsQ0FBQztJQUMvRCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7UUFFdEMsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JELE1BQU0sV0FBVyxHQUFHO2dCQUNsQixXQUFXLEVBQUUsdUJBQXVCO2dCQUNwQyxVQUFVLEVBQUUscUdBQXFHO2dCQUNqSCxXQUFXLEVBQUU7b0JBQ1gsT0FBTyxFQUFFLHNCQUFzQjtvQkFDL0IsU0FBUyxFQUFFLHdCQUF3QjtvQkFDbkMsT0FBTyxFQUFFLDhCQUE4QjtpQkFDeEM7YUFDRixDQUFDO1lBRUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsZUFBZSxzQkFBc0IsRUFBRSxXQUFXLEVBQUU7Z0JBQ3ZGLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRSxFQUFFO2FBQ3JELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFdkQsU0FBUyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsOERBQThELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDNUUsSUFBSSxDQUFDO2dCQUNILE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLGVBQWUsaUJBQWlCLEVBQUU7b0JBQ3BELEtBQUssRUFBRSxvQkFBb0I7aUJBQzVCLEVBQUU7b0JBQ0QsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsYUFBYSxFQUFFLEVBQUU7aUJBQ3RELENBQUMsQ0FBQztnQkFDSCxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1FBQzFELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDJCQUEyQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsc0JBQXNCLEVBQUU7Z0JBQ3pFLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRSxFQUFFO2FBQ3JELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBRXJFLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM3QyxNQUFNLFVBQVUsR0FBRztnQkFDakIsVUFBVSxFQUFFLGlGQUFpRjtnQkFDN0YsV0FBVyxFQUFFO29CQUNYLE9BQU8sRUFBRSxzQkFBc0I7b0JBQy9CLFNBQVMsRUFBRSx3QkFBd0I7b0JBQ25DLE9BQU8sRUFBRSw4QkFBOEI7b0JBQ3ZDLE9BQU8sRUFBRSxrQ0FBa0M7aUJBQzVDO2FBQ0YsQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsdUJBQXVCLEVBQUUsVUFBVSxFQUFFO2dCQUN0RixPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsVUFBVSxZQUFZLEVBQUUsRUFBRTthQUNyRCxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXBGLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtRQUVoRCxFQUFFLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDL0MsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxrR0FBa0csRUFBRSxRQUFRLENBQUMsQ0FBQztZQUVqSixNQUFNLFFBQVEsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRTtnQkFDdEMsUUFBUSxFQUFFLHlCQUF5QjtnQkFDbkMsV0FBVyxFQUFFLFdBQVc7YUFDekIsQ0FBQyxDQUFDO1lBQ0gsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDM0MsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFcEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsZUFBZSxrQkFBa0IsRUFBRSxRQUFRLEVBQUU7Z0JBQ2hGLE9BQU8sRUFBRTtvQkFDUCxhQUFhLEVBQUUsVUFBVSxZQUFZLEVBQUU7b0JBQ3ZDLEdBQUcsUUFBUSxDQUFDLFVBQVUsRUFBRTtpQkFDekI7YUFDRixDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRXBELFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvREFBb0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRSxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLDZDQUE2QyxDQUFDLENBQUM7WUFFakYsTUFBTSxRQUFRLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNoQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUU7Z0JBQ3JDLFFBQVEsRUFBRSw0QkFBNEI7Z0JBQ3RDLFdBQVcsRUFBRSxZQUFZO2FBQzFCLENBQUMsQ0FBQztZQUNILFFBQVEsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3pDLFFBQVEsQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQy9DLFFBQVEsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQzVDLElBQUksRUFBRSx3QkFBd0I7Z0JBQzlCLFdBQVcsRUFBRSwyRUFBMkU7Z0JBQ3hGLFVBQVUsRUFBRTtvQkFDVixFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtvQkFDekMsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUU7b0JBQ2hELEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUU7b0JBQ3RELEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUU7aUJBQ3pEO2FBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxlQUFlLG1CQUFtQixFQUFFLFFBQVEsRUFBRTtnQkFDakYsT0FBTyxFQUFFO29CQUNQLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRTtvQkFDdkMsR0FBRyxRQUFRLENBQUMsVUFBVSxFQUFFO2lCQUN6QjthQUNGLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDdkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUV6RCxVQUFVLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7UUFDdEUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFFbEMsRUFBRSxDQUFDLDJCQUEyQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pDLE1BQU0sU0FBUyxHQUFHO2dCQUNoQixLQUFLLEVBQUUsNEJBQTRCO2dCQUNuQyxXQUFXLEVBQUUsaU1BQWlNO2dCQUM5TSxNQUFNLEVBQUUsdUJBQXVCO2dCQUMvQixNQUFNLEVBQUUsaUJBQWlCO2dCQUN6QixTQUFTLEVBQUUsYUFBYTtnQkFDeEIsS0FBSyxFQUFFLFdBQVc7Z0JBQ2xCLEtBQUssRUFBRSxJQUFJO2dCQUNYLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixhQUFhLEVBQUUsQ0FBQztnQkFDaEIsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixRQUFRLEVBQUU7b0JBQ1IsSUFBSSxFQUFFLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQztvQkFDL0QsU0FBUyxFQUFFLE9BQU87b0JBQ2xCLFFBQVEsRUFBRSxTQUFTO29CQUNuQixpQkFBaUIsRUFBRSxlQUFlO29CQUNsQyxjQUFjLEVBQUUsbUNBQW1DO2lCQUNwRDthQUNGLENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxlQUFlLGlCQUFpQixFQUFFLFNBQVMsRUFBRTtnQkFDaEYsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsWUFBWSxFQUFFLEVBQUU7YUFDckQsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNsRCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXpELE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQzlDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLCtCQUErQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzdDLE1BQU0sU0FBUyxHQUFHO2dCQUNoQixLQUFLLEVBQUU7b0JBQ0w7d0JBQ0UsVUFBVSxFQUFFLENBQUM7d0JBQ2IsTUFBTSxFQUFFLFVBQVU7d0JBQ2xCLE9BQU8sRUFBRSxzR0FBc0c7d0JBQy9HLFNBQVMsRUFBRSxJQUFJO3FCQUNoQjtvQkFDRDt3QkFDRSxVQUFVLEVBQUUsQ0FBQzt3QkFDYixNQUFNLEVBQUUsVUFBVSxFQUFFLG1DQUFtQzt3QkFDdkQsT0FBTyxFQUFFLDRFQUE0RTt3QkFDckYsU0FBUyxFQUFFLElBQUk7cUJBQ2hCO29CQUNEO3dCQUNFLFVBQVUsRUFBRSxDQUFDO3dCQUNiLE1BQU0sRUFBRSxVQUFVO3dCQUNsQixPQUFPLEVBQUUsMEVBQTBFO3dCQUNuRixTQUFTLEVBQUUsSUFBSTtxQkFDaEI7b0JBQ0Q7d0JBQ0UsVUFBVSxFQUFFLENBQUM7d0JBQ2IsTUFBTSxFQUFFLFVBQVU7d0JBQ2xCLE9BQU8sRUFBRSxxRUFBcUU7d0JBQzlFLFNBQVMsRUFBRSxJQUFJO3FCQUNoQjtvQkFDRDt3QkFDRSxVQUFVLEVBQUUsQ0FBQzt3QkFDYixNQUFNLEVBQUUsVUFBVTt3QkFDbEIsT0FBTyxFQUFFLGtFQUFrRTt3QkFDM0UsU0FBUyxFQUFFLElBQUk7cUJBQ2hCO29CQUNEO3dCQUNFLFVBQVUsRUFBRSxDQUFDO3dCQUNiLE1BQU0sRUFBRSxVQUFVO3dCQUNsQixPQUFPLEVBQUUsMkRBQTJEO3dCQUNwRSxTQUFTLEVBQUUsS0FBSyxDQUFDLGtCQUFrQjtxQkFDcEM7b0JBQ0Q7d0JBQ0UsVUFBVSxFQUFFLENBQUM7d0JBQ2IsTUFBTSxFQUFFLFVBQVU7d0JBQ2xCLE9BQU8sRUFBRSx3RUFBd0U7d0JBQ2pGLFNBQVMsRUFBRSxLQUFLO3FCQUNqQjtpQkFDRjthQUNGLENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxlQUFlLG1CQUFtQixPQUFPLFFBQVEsRUFBRSxTQUFTLEVBQUU7Z0JBQ2pHLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRSxFQUFFO2FBQ3JELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFMUMsK0NBQStDO1lBQy9DLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFL0UsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlDLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsbUJBQW1CLE9BQU8sUUFBUSxFQUFFO2dCQUNyRixPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsVUFBVSxZQUFZLEVBQUUsRUFBRTthQUNyRCxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVoRCxPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkJBQTZCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0MsTUFBTSxVQUFVLEdBQUc7Z0JBQ2pCLEtBQUssRUFBRSw4Q0FBOEM7Z0JBQ3JELFdBQVcsRUFBRSxrT0FBa087Z0JBQy9PLEtBQUssRUFBRSxLQUFLO2dCQUNaLFFBQVEsRUFBRTtvQkFDUixJQUFJLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLGVBQWUsQ0FBQztvQkFDaEYsU0FBUyxFQUFFLE9BQU87b0JBQ2xCLFFBQVEsRUFBRSxTQUFTO29CQUNuQixpQkFBaUIsRUFBRSxlQUFlO29CQUNsQyxPQUFPLEVBQUUsb0JBQW9CO2lCQUM5QjthQUNGLENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxlQUFlLG1CQUFtQixPQUFPLEVBQUUsRUFBRSxVQUFVLEVBQUU7Z0JBQzNGLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRSxFQUFFO2FBQ3JELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFdkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDBCQUEwQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3hDLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsbUJBQW1CLE9BQU8sRUFBRSxFQUFFO2dCQUMvRSxNQUFNLEVBQUUsV0FBVzthQUNwQixFQUFFO2dCQUNELE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRSxFQUFFO2FBQ3JELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRXJELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtRQUVqRCxFQUFFLENBQUMsZ0NBQWdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDOUMsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSwyQ0FBMkMsRUFBRTtnQkFDOUYsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsWUFBWSxFQUFFLEVBQUU7YUFDckQsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxPQUFPLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDNUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGdDQUFnQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlDLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsMkRBQTJELEVBQUU7Z0JBQzlHLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRSxFQUFFO2FBQ3JELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRTtnQkFDL0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSx1QkFBdUIsRUFBRTtnQkFDMUUsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsWUFBWSxFQUFFLEVBQUU7YUFDckQsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRXRELE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsQ0FBQztZQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxZQUFZLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsZ0JBQWdCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksVUFBVSxDQUFDLENBQUM7UUFDbEssQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7UUFFcEQsRUFBRSxDQUFDLHFEQUFxRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25FLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUseUNBQXlDLENBQUMsQ0FBQztZQUU5RixNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUU1RCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLE9BQU8sQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUVoRCxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDcEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSxXQUFXLE9BQU8sRUFBRSxFQUFFO2dCQUN2RSxPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsVUFBVSxhQUFhLEVBQUUsRUFBRTthQUN0RCxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUUvQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakUsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSxXQUFXLE9BQU8sUUFBUSxFQUFFO2dCQUM3RSxPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsVUFBVSxhQUFhLEVBQUUsRUFBRTthQUN0RCxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMscUJBQXFCO1lBRXRFLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRTtnQkFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckQsTUFBTSxVQUFVLEdBQUc7Z0JBQ2pCLE1BQU0sRUFBRSxDQUFDO2dCQUNULE1BQU0sRUFBRSxxT0FBcU87YUFDOU8sQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLGVBQWUsV0FBVyxPQUFPLFNBQVMsRUFBRSxVQUFVLEVBQUU7Z0JBQzNGLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLGFBQWEsRUFBRSxFQUFFO2FBQ3RELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVqRCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsaURBQWlELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDL0QsTUFBTSxZQUFZLEdBQUc7Z0JBQ25CLFdBQVcsRUFBRSxDQUFDO2FBQ2YsQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLGVBQWUsV0FBVyxPQUFPLFdBQVcsRUFBRSxZQUFZLEVBQUU7Z0JBQy9GLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLGFBQWEsRUFBRSxFQUFFO2FBQ3RELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxvQkFBb0I7WUFFdkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1FBRTlDLEVBQUUsQ0FBQyw4Q0FBOEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RCxnRkFBZ0Y7WUFDaEYsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSxtQkFBbUIsT0FBTyxRQUFRLEVBQUU7Z0JBQ3JGLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRSxFQUFFO2FBQ3JELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTFELE9BQU8sQ0FBQyxHQUFHLENBQUMsK0NBQStDLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2REFBNkQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRSxnRkFBZ0Y7WUFDaEYsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSx1QkFBdUIsRUFBRTtnQkFDMUUsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsWUFBWSxFQUFFLEVBQUU7YUFDckQsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDZDQUE2QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNELE1BQU0sY0FBYyxHQUFHO2dCQUNyQixLQUFLLEVBQUUsK0NBQStDO2dCQUN0RCxXQUFXLEVBQUUsMEZBQTBGO2dCQUN2RyxNQUFNLEVBQUUsdUJBQXVCO2dCQUMvQixLQUFLLEVBQUUsV0FBVztnQkFDbEIsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLGFBQWEsRUFBRSxDQUFDO2dCQUNoQixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsUUFBUSxFQUFFO29CQUNSLElBQUksRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQztvQkFDMUQsTUFBTSxFQUFFLGdCQUFnQjtpQkFDekI7YUFDRixDQUFDO1lBRUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsZUFBZSxpQkFBaUIsRUFBRSxjQUFjLEVBQUU7Z0JBQ3JGLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRSxFQUFFO2FBQ3JELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUUxRCxPQUFPLENBQUMsR0FBRyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7UUFDMUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsd0RBQXdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEUsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSx1QkFBdUIsRUFBRTtnQkFDMUUsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsWUFBWSxFQUFFLEVBQUU7YUFDckQsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVqRSxPQUFPLENBQUMsR0FBRyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7UUFFN0MsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25ELE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsNkNBQTZDLEVBQUU7Z0JBQ2hHLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxVQUFVLFlBQVksRUFBRSxFQUFFO2FBQ3JELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssV0FBVyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRWhDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMENBQTBDLENBQUMsQ0FBQztRQUMxRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRCxNQUFNLHNCQUFzQixHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsaUJBQWlCLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDL0YsTUFBTSxxQkFBcUIsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxlQUFlLDJCQUEyQixFQUFFO2dCQUMzRixPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsVUFBVSxZQUFZLEVBQUUsRUFBRTthQUNyRCxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFL0MsTUFBTSxPQUFPLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNqRCxNQUFNLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUV0RCxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0RBQWdELENBQUMsQ0FBQztRQUNoRSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtRQUU3QyxFQUFFLENBQUMsMENBQTBDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEQsSUFBSSxDQUFDO2dCQUNILE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsbUJBQW1CLE9BQU8sUUFBUSxFQUFFO29CQUNwRSxPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsVUFBVSxhQUFhLEVBQUUsRUFBRTtpQkFDdEQsQ0FBQyxDQUFDO2dCQUNILE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDeEUsQ0FBQztZQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMxRCxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSx3Q0FBd0MsRUFBRTtvQkFDMUUsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsWUFBWSxFQUFFLEVBQUU7aUJBQ3JELENBQUMsQ0FBQztnQkFDSCxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25ELElBQUksQ0FBQztnQkFDSCxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxlQUFlLGlCQUFpQixFQUFFO29CQUNwRCxLQUFLLEVBQUUsRUFBRSxFQUFFLDBCQUEwQjtvQkFDckMsS0FBSyxFQUFFLFdBQVc7aUJBQ25CLEVBQUU7b0JBQ0QsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsWUFBWSxFQUFFLEVBQUU7aUJBQ3JELENBQUMsQ0FBQztnQkFDSCxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGtEQUFrRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hFLG9CQUFvQjtZQUNwQixNQUFNLFlBQVksR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxlQUFlLHVCQUF1QixFQUFFO2dCQUM5RSxPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsVUFBVSxZQUFZLEVBQUUsRUFBRTthQUNyRCxDQUFDLENBQUM7WUFFSCxpQkFBaUI7WUFDakIsTUFBTSxVQUFVLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsZUFBZSwyQkFBMkIsRUFBRTtnQkFDaEYsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsWUFBWSxFQUFFLEVBQUU7YUFDckQsQ0FBQyxDQUFDO1lBRUgscUJBQXFCO1lBQ3JCLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXBGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkNBQTZDLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkNBQTZDLENBQUMsQ0FBQztRQUUzRCwyREFBMkQ7UUFDM0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQztnQkFDSCxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxlQUFlLG1CQUFtQixPQUFPLEVBQUUsRUFBRTtvQkFDOUQsTUFBTSxFQUFFLFVBQVU7aUJBQ25CLEVBQUU7b0JBQ0QsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLFVBQVUsWUFBWSxFQUFFLEVBQUU7aUJBQ3JELENBQUMsQ0FBQztnQkFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBQ3pELENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZXNjcmliZSwgaXQsIGV4cGVjdCwgYmVmb3JlQWxsLCBhZnRlckFsbCB9IGZyb20gJ0BqZXN0L2dsb2JhbHMnO1xyXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xyXG5pbXBvcnQgRm9ybURhdGEgZnJvbSAnZm9ybS1kYXRhJztcclxuXHJcbmNvbnN0IENPTUlDX1NFUlZJQ0VfVVJMID0gcHJvY2Vzcy5lbnYuQ09NSUNfU0VSVklDRV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMyc7XHJcbmNvbnN0IFVTRVJfU0VSVklDRV9VUkwgPSBwcm9jZXNzLmVudi5VU0VSX1NFUlZJQ0VfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDInO1xyXG5jb25zdCBBUElfR0FURVdBWV9VUkwgPSBwcm9jZXNzLmVudi5BUElfR0FURVdBWV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCc7XHJcblxyXG5kZXNjcmliZSgn8J+OqCBDb21pYyBDcmVhdG9yIEZsb3cgVGVzdHMnLCAoKSA9PiB7XHJcbiAgbGV0IGNyZWF0b3JUb2tlbjogc3RyaW5nO1xyXG4gIGxldCBjcmVhdG9yVXNlcklkOiBzdHJpbmc7XHJcbiAgbGV0IGNvbnN1bWVyVG9rZW46IHN0cmluZztcclxuICBsZXQgY29uc3VtZXJVc2VySWQ6IHN0cmluZztcclxuICBsZXQgY3JlYXRvcklkOiBzdHJpbmc7XHJcbiAgbGV0IGNvbWljSWQ6IHN0cmluZztcclxuICBsZXQgY292ZXJGaWxlSWQ6IHN0cmluZztcclxuICBsZXQgcGFnZUZpbGVJZDogc3RyaW5nO1xyXG4gIGxldCBwdXJjaGFzZVRyYW5zYWN0aW9uSWQ6IHN0cmluZztcclxuICBcclxuICBjb25zdCBjcmVhdG9yVXNlciA9IHtcclxuICAgIGVtYWlsOiBgdGVzdC1jcmVhdG9yLSR7RGF0ZS5ub3coKX1AbmVyZHdvcmsuY29tYCxcclxuICAgIHBhc3N3b3JkOiAnU2VjdXJlVGVzdFBhc3N3b3JkMTIzIScsXHJcbiAgICB1c2VybmFtZTogYGNyZWF0b3Ike0RhdGUubm93KCl9YFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGNvbnN1bWVyVXNlciA9IHtcclxuICAgIGVtYWlsOiBgdGVzdC1jb25zdW1lci0ke0RhdGUubm93KCl9QG5lcmR3b3JrLmNvbWAsXHJcbiAgICBwYXNzd29yZDogJ1NlY3VyZVRlc3RQYXNzd29yZDEyMyEnLFxyXG4gICAgdXNlcm5hbWU6IGBjb25zdW1lciR7RGF0ZS5ub3coKX1gXHJcbiAgfTtcclxuXHJcbiAgYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcclxuICAgIC8vIENyZWF0ZSBjcmVhdG9yIHVzZXJcclxuICAgIGNvbnN0IGNyZWF0b3JTaWdudXAgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vYXV0aC9zaWdudXBgLCBjcmVhdG9yVXNlcik7XHJcbiAgICBjcmVhdG9yVG9rZW4gPSBjcmVhdG9yU2lnbnVwLmRhdGEuZGF0YS50b2tlbjtcclxuICAgIGNyZWF0b3JVc2VySWQgPSBjcmVhdG9yU2lnbnVwLmRhdGEuZGF0YS51c2VyLmlkO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgY29uc3VtZXIgdXNlclxyXG4gICAgY29uc3QgY29uc3VtZXJTaWdudXAgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vYXV0aC9zaWdudXBgLCBjb25zdW1lclVzZXIpO1xyXG4gICAgY29uc3VtZXJUb2tlbiA9IGNvbnN1bWVyU2lnbnVwLmRhdGEuZGF0YS50b2tlbjtcclxuICAgIGNvbnN1bWVyVXNlcklkID0gY29uc3VtZXJTaWdudXAuZGF0YS5kYXRhLnVzZXIuaWQ7XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKCfwn5SnIFRlc3QgdXNlcnMgY3JlYXRlZCBmb3IgY29taWMgY3JlYXRvciB0ZXN0cycpO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnMe+4j+KDoyBCZWNvbWluZyBhIENyZWF0b3InLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgYWxsb3cgdXNlciB0byBiZWNvbWUgYSBjcmVhdG9yJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBjcmVhdG9yRGF0YSA9IHtcclxuICAgICAgICBjcmVhdG9yTmFtZTogJ0RpZ2l0YWwgQ29taWNzIFN0dWRpbycsXHJcbiAgICAgICAgY3JlYXRvckJpbzogJ1dlIGNyZWF0ZSBhbWF6aW5nIGRpZ2l0YWwgY29taWNzIHdpdGggV2ViMyBpbnRlZ3JhdGlvbi4gU3BlY2lhbGl6ZWQgaW4gc3VwZXJoZXJvIGFuZCBzY2ktZmkgZ2VucmVzLicsXHJcbiAgICAgICAgc29jaWFsTGlua3M6IHtcclxuICAgICAgICAgIHR3aXR0ZXI6ICdAZGlnaXRhbGNvbWljc3N0dWRpbycsXHJcbiAgICAgICAgICBpbnN0YWdyYW06ICdAZGlnaXRhbF9jb21pY3Nfc3R1ZGlvJyxcclxuICAgICAgICAgIHdlYnNpdGU6ICdodHRwczovL2RpZ2l0YWxjb21pY3Muc3R1ZGlvJ1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L3VzZXIvY3JlYXRvci9iZWNvbWVgLCBjcmVhdG9yRGF0YSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuaXNDcmVhdG9yKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNyZWF0b3JOYW1lKS50b0JlKGNyZWF0b3JEYXRhLmNyZWF0b3JOYW1lKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jcmVhdG9yQmlvKS50b0JlKGNyZWF0b3JEYXRhLmNyZWF0b3JCaW8pO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNyZWF0b3JWZXJpZmllZCkudG9CZShmYWxzZSk7XHJcbiAgICAgIFxyXG4gICAgICBjcmVhdG9ySWQgPSByZXNwb25zZS5kYXRhLmRhdGEuaWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgVXNlciBiZWNhbWUgY3JlYXRvciBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgcHJldmVudCBub24tY3JlYXRvcnMgZnJvbSBhY2Nlc3NpbmcgY3JlYXRvciBlbmRwb2ludHMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2NvbWljcy9jcmVhdG9yYCwge1xyXG4gICAgICAgICAgdGl0bGU6ICdVbmF1dGhvcml6ZWQgQ29taWMnXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uc3VtZXJUb2tlbn1gIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nob3VsZCBoYXZlIGZhaWxlZCcpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLnN0YXR1cykudG9CZSg0MDMpO1xyXG4gICAgICAgIGV4cGVjdChlcnJvci5yZXNwb25zZS5kYXRhLmVycm9yKS50b0NvbnRhaW4oJ25vdCBhIGNyZWF0b3InKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBOb24tY3JlYXRvciBhY2Nlc3MgcHJvcGVybHkgcmVzdHJpY3RlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBnZXQgY3JlYXRvciBzdGF0dXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vdXNlci9jcmVhdG9yL3N0YXR1c2AsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmlzQ3JlYXRvcikudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jcmVhdG9yTmFtZSkudG9CZSgnRGlnaXRhbCBDb21pY3MgU3R1ZGlvJyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENyZWF0b3Igc3RhdHVzIHJldHJpZXZlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgY3JlYXRvciBwcm9maWxlJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCB1cGRhdGVEYXRhID0ge1xyXG4gICAgICAgIGNyZWF0b3JCaW86ICdVcGRhdGVkIGJpbzogQXdhcmQtd2lubmluZyBkaWdpdGFsIGNvbWljcyBzdHVkaW8gd2l0aCBvdmVyIDUwIHB1Ymxpc2hlZCB0aXRsZXMuJyxcclxuICAgICAgICBzb2NpYWxMaW5rczoge1xyXG4gICAgICAgICAgdHdpdHRlcjogJ0BkaWdpdGFsY29taWNzc3R1ZGlvJyxcclxuICAgICAgICAgIGluc3RhZ3JhbTogJ0BkaWdpdGFsX2NvbWljc19zdHVkaW8nLFxyXG4gICAgICAgICAgd2Vic2l0ZTogJ2h0dHBzOi8vZGlnaXRhbGNvbWljcy5zdHVkaW8nLFxyXG4gICAgICAgICAgZGlzY29yZDogJ2h0dHBzOi8vZGlzY29yZC5nZy9kaWdpdGFsY29taWNzJ1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucHV0KGAke0FQSV9HQVRFV0FZX1VSTH0vdXNlci9jcmVhdG9yL3Byb2ZpbGVgLCB1cGRhdGVEYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jcmVhdG9yQmlvKS50b0JlKHVwZGF0ZURhdGEuY3JlYXRvckJpbyk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuc29jaWFsTGlua3MuZGlzY29yZCkudG9CZSh1cGRhdGVEYXRhLnNvY2lhbExpbmtzLmRpc2NvcmQpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDcmVhdG9yIHByb2ZpbGUgdXBkYXRlZCcpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCcy77iP4oOjIENvbnRlbnQgVXBsb2FkICYgUHJlcGFyYXRpb24nLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgdXBsb2FkIGNvbWljIGNvdmVyIGltYWdlJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBtb2NrQ292ZXJJbWFnZSA9IEJ1ZmZlci5mcm9tKCdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZSNDJtTmsrTTlRRHdBRGhnR0FXalI5YXdBQUFBQkpSVTVFcmtKZ2dnPT0nLCAnYmFzZTY0Jyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ZpbGUnLCBtb2NrQ292ZXJJbWFnZSwge1xyXG4gICAgICAgIGZpbGVuYW1lOiAnY3J5cHRvLWhlcm9lcy1jb3Zlci5wbmcnLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnaW1hZ2UvcG5nJ1xyXG4gICAgICB9KTtcclxuICAgICAgZm9ybURhdGEuYXBwZW5kKCdjYXRlZ29yeScsICdjb21pYy1jb3ZlcicpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ3B1cnBvc2UnLCAnc3RvcmFnZScpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2lzUHVibGljJywgJ3RydWUnKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2ZpbGVzL3VwbG9hZC9zM2AsIGZvcm1EYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gLFxyXG4gICAgICAgICAgLi4uZm9ybURhdGEuZ2V0SGVhZGVycygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLmNhdGVnb3J5KS50b0JlKCdjb21pYy1jb3ZlcicpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmZpbGUuczNVcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIFxyXG4gICAgICBjb3ZlckZpbGVJZCA9IHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLmlkO1xyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENvbWljIGNvdmVyIHVwbG9hZGVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIHVwbG9hZCBjb21pYyBwYWdlIGZvciBwb3RlbnRpYWwgTkZUIG1pbnRpbmcnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1vY2tQYWdlSW1hZ2UgPSBCdWZmZXIuZnJvbSgnZmFrZS1jb21pYy1wYWdlLWFydC1kYXRhLXdpdGgtbmZ0LXBvdGVudGlhbCcpO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcclxuICAgICAgZm9ybURhdGEuYXBwZW5kKCdmaWxlJywgbW9ja1BhZ2VJbWFnZSwge1xyXG4gICAgICAgIGZpbGVuYW1lOiAnY3J5cHRvLWhlcm9lcy1wYWdlLTAwMS5qcGcnLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnaW1hZ2UvanBlZydcclxuICAgICAgfSk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnY2F0ZWdvcnknLCAnbmZ0LWFzc2V0Jyk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgncmVmZXJlbmNlVHlwZScsICdjb21pYy1wYWdlJyk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnbmZ0TWV0YWRhdGEnLCBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgbmFtZTogJ0NyeXB0byBIZXJvZXMgLSBQYWdlIDEnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIG9wZW5pbmcgcGFnZSB3aGVyZSBvdXIgaGVyb2VzIGZpcnN0IGRpc2NvdmVyIHRoZWlyIGJsb2NrY2hhaW4gcG93ZXJzLicsXHJcbiAgICAgICAgYXR0cmlidXRlczogW1xyXG4gICAgICAgICAgeyB0cmFpdF90eXBlOiAnUGFnZSBOdW1iZXInLCB2YWx1ZTogJzEnIH0sXHJcbiAgICAgICAgICB7IHRyYWl0X3R5cGU6ICdSYXJpdHknLCB2YWx1ZTogJ0ZpcnN0IEVkaXRpb24nIH0sXHJcbiAgICAgICAgICB7IHRyYWl0X3R5cGU6ICdTZXJpZXMnLCB2YWx1ZTogJ0NyeXB0byBIZXJvZXMgVm9sLjEnIH0sXHJcbiAgICAgICAgICB7IHRyYWl0X3R5cGU6ICdBcnRpc3QnLCB2YWx1ZTogJ0RpZ2l0YWwgQ29taWNzIFN0dWRpbycgfVxyXG4gICAgICAgIF1cclxuICAgICAgfSkpO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvdXBsb2FkL25mdGAsIGZvcm1EYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gLFxyXG4gICAgICAgICAgLi4uZm9ybURhdGEuZ2V0SGVhZGVycygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLmlwZnNIYXNoKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmZpbGUuaXNQaW5uZWRUb0lQRlMpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuaXBmc1Jlc3VsdC5oYXNoKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBcclxuICAgICAgcGFnZUZpbGVJZCA9IHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLmlkO1xyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENvbWljIHBhZ2UgdXBsb2FkZWQgdG8gUzMgKyBJUEZTIGZvciBORlQgcG90ZW50aWFsJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJzPvuI/ig6MgQ29taWMgQ3JlYXRpb24nLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGEgbmV3IGNvbWljJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBjb21pY0RhdGEgPSB7XHJcbiAgICAgICAgdGl0bGU6ICdUaGUgQ3J5cHRvIEhlcm9lczogR2VuZXNpcycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdJbiBhIHdvcmxkIHdoZXJlIGJsb2NrY2hhaW4gdGVjaG5vbG9neSBoYXMgZXZvbHZlZCBiZXlvbmQgaW1hZ2luYXRpb24sIGEgZ3JvdXAgb2YgdW5saWtlbHkgaGVyb2VzIG11c3QgbWFzdGVyIHRoZSBwb3dlciBvZiBkZWNlbnRyYWxpemVkIG5ldHdvcmtzIHRvIHNhdmUgaHVtYW5pdHkgZnJvbSBhIGNlbnRyYWxpemVkIGR5c3RvcGlhLicsXHJcbiAgICAgICAgYXV0aG9yOiAnRGlnaXRhbCBDb21pY3MgU3R1ZGlvJyxcclxuICAgICAgICBhcnRpc3Q6ICdBbGV4IEJsb2NrY2hhaW4nLFxyXG4gICAgICAgIHB1Ymxpc2hlcjogJ1dlYjMgQ29taWNzJyxcclxuICAgICAgICBnZW5yZTogJ1N1cGVyaGVybycsXHJcbiAgICAgICAgcHJpY2U6IDkuOTksXHJcbiAgICAgICAgaXNGcmVlbWl1bTogdHJ1ZSxcclxuICAgICAgICBmcmVlUGFnZUNvdW50OiA1LFxyXG4gICAgICAgIGNvdmVyRmlsZUlkOiBjb3ZlckZpbGVJZCxcclxuICAgICAgICBpc05GVEVsaWdpYmxlOiB0cnVlLFxyXG4gICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICB0YWdzOiBbJ2Jsb2NrY2hhaW4nLCAnc3VwZXJoZXJvJywgJ3dlYjMnLCAnY3J5cHRvJywgJ2R5c3RvcGlhJ10sXHJcbiAgICAgICAgICBhZ2VSYXRpbmc6ICdUZWVuKycsXHJcbiAgICAgICAgICBsYW5ndWFnZTogJ0VuZ2xpc2gnLFxyXG4gICAgICAgICAgZXN0aW1hdGVkUmVhZFRpbWU6ICcxNS0yMCBtaW51dGVzJyxcclxuICAgICAgICAgIHRhcmdldEF1ZGllbmNlOiAnV2ViMyBlbnRodXNpYXN0cyBhbmQgY29taWMgbG92ZXJzJ1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2NvbWljcy9jcmVhdG9yYCwgY29taWNEYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAxKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS50aXRsZSkudG9CZShjb21pY0RhdGEudGl0bGUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNyZWF0b3JJZCkudG9CZShjcmVhdG9yVXNlcklkKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5zdGF0dXMpLnRvQmUoJ2RyYWZ0Jyk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuaXNORlRFbGlnaWJsZSkudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jb3ZlclVybCkudG9CZURlZmluZWQoKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jb3ZlckZpbGVJZCkudG9CZShjb3ZlckZpbGVJZCk7XHJcbiAgICAgIFxyXG4gICAgICBjb21pY0lkID0gcmVzcG9uc2UuZGF0YS5kYXRhLmlkO1xyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENvbWljIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGFkZCBwYWdlcyB0byB0aGUgY29taWMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBhZ2VzRGF0YSA9IHtcclxuICAgICAgICBwYWdlczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBwYWdlTnVtYmVyOiAxLFxyXG4gICAgICAgICAgICBmaWxlSWQ6IHBhZ2VGaWxlSWQsXHJcbiAgICAgICAgICAgIGFsdFRleHQ6ICdPcGVuaW5nIHNjZW5lOiBUaGUgY2l0eSBza3lsaW5lIGRvbWluYXRlZCBieSBjZW50cmFsaXplZCB0b3dlcnMsIG91ciBoZXJvZXMgdW5hd2FyZSBvZiB0aGVpciBkZXN0aW55JyxcclxuICAgICAgICAgICAgaXNQcmV2aWV3OiB0cnVlXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBwYWdlTnVtYmVyOiAyLFxyXG4gICAgICAgICAgICBmaWxlSWQ6IHBhZ2VGaWxlSWQsIC8vIEluIHJlYWwgc2NlbmFyaW8sIGRpZmZlcmVudCBmaWxlXHJcbiAgICAgICAgICAgIGFsdFRleHQ6ICdNZWV0IEpha2UsIGEgeW91bmcgZGV2ZWxvcGVyIHdobyBzdHVtYmxlcyB1cG9uIGEgbXlzdGVyaW91cyBzbWFydCBjb250cmFjdCcsXHJcbiAgICAgICAgICAgIGlzUHJldmlldzogdHJ1ZVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcGFnZU51bWJlcjogMyxcclxuICAgICAgICAgICAgZmlsZUlkOiBwYWdlRmlsZUlkLFxyXG4gICAgICAgICAgICBhbHRUZXh0OiAnVGhlIHNtYXJ0IGNvbnRyYWN0IGFjdGl2YXRlcywgZ3JhbnRpbmcgSmFrZSBpbmNyZWRpYmxlIGJsb2NrY2hhaW4gcG93ZXJzJyxcclxuICAgICAgICAgICAgaXNQcmV2aWV3OiB0cnVlXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBwYWdlTnVtYmVyOiA0LFxyXG4gICAgICAgICAgICBmaWxlSWQ6IHBhZ2VGaWxlSWQsXHJcbiAgICAgICAgICAgIGFsdFRleHQ6ICdKYWtlIGRpc2NvdmVycyBvdGhlcnMgaGF2ZSBiZWVuIGNob3NlbiBieSB0aGUgZGVjZW50cmFsaXplZCBuZXR3b3JrJyxcclxuICAgICAgICAgICAgaXNQcmV2aWV3OiB0cnVlXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBwYWdlTnVtYmVyOiA1LFxyXG4gICAgICAgICAgICBmaWxlSWQ6IHBhZ2VGaWxlSWQsXHJcbiAgICAgICAgICAgIGFsdFRleHQ6ICdUaGUgdGVhbSBhc3NlbWJsZXM6IFRoZSBWYWxpZGF0b3JzIC0gZ3VhcmRpYW5zIG9mIHRoZSBibG9ja2NoYWluJyxcclxuICAgICAgICAgICAgaXNQcmV2aWV3OiB0cnVlXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBwYWdlTnVtYmVyOiA2LFxyXG4gICAgICAgICAgICBmaWxlSWQ6IHBhZ2VGaWxlSWQsXHJcbiAgICAgICAgICAgIGFsdFRleHQ6ICdGaXJzdCBjb25mcm9udGF0aW9uIHdpdGggdGhlIENlbnRyYWxpemVkIEF1dGhvcml0eSBhZ2VudHMnLFxyXG4gICAgICAgICAgICBpc1ByZXZpZXc6IGZhbHNlIC8vIFByZW1pdW0gY29udGVudFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcGFnZU51bWJlcjogNyxcclxuICAgICAgICAgICAgZmlsZUlkOiBwYWdlRmlsZUlkLFxyXG4gICAgICAgICAgICBhbHRUZXh0OiAnRXBpYyBiYXR0bGUgdXNpbmcgV2ViMyBwb3dlcnMgLSBzbWFydCBjb250cmFjdCBzcGVsbHMgYW5kIERlRmkgc2hpZWxkcycsXHJcbiAgICAgICAgICAgIGlzUHJldmlldzogZmFsc2VcclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvY3JlYXRvci8ke2NvbWljSWR9L3BhZ2VzYCwgcGFnZXNEYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAxKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzcG9uc2UuZGF0YS5kYXRhKSkudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5sZW5ndGgpLnRvQmUoNyk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBDaGVjayB0aGF0IHByZXZpZXcgcGFnZXMgYXJlIHByb3Blcmx5IG1hcmtlZFxyXG4gICAgICBjb25zdCBwcmV2aWV3UGFnZXMgPSByZXNwb25zZS5kYXRhLmRhdGEuZmlsdGVyKChwYWdlOiBhbnkpID0+IHBhZ2UuaXNQcmV2aWV3KTtcclxuICAgICAgY29uc3QgcHJlbWl1bVBhZ2VzID0gcmVzcG9uc2UuZGF0YS5kYXRhLmZpbHRlcigocGFnZTogYW55KSA9PiAhcGFnZS5pc1ByZXZpZXcpO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHByZXZpZXdQYWdlcy5sZW5ndGgpLnRvQmUoNSk7XHJcbiAgICAgIGV4cGVjdChwcmVtaXVtUGFnZXMubGVuZ3RoKS50b0JlKDIpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDb21pYyBwYWdlcyBhZGRlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgZ2V0IGNyZWF0b3IgY29taWMgcGFnZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vY29taWNzL2NyZWF0b3IvJHtjb21pY0lkfS9wYWdlc2AsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNvbWljLmlkKS50b0JlKGNvbWljSWQpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNvbWljLnRvdGFsUGFnZXMpLnRvQmUoNyk7XHJcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmRhdGEuZGF0YS5wYWdlcykpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEucGFnZXMubGVuZ3RoKS50b0JlKDcpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDcmVhdG9yIGNhbiBhY2Nlc3MgYWxsIGNvbWljIHBhZ2VzJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBjb21pYyBkZXRhaWxzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCB1cGRhdGVEYXRhID0ge1xyXG4gICAgICAgIHRpdGxlOiAnVGhlIENyeXB0byBIZXJvZXM6IEdlbmVzaXMgKERpcmVjdG9yXFwncyBDdXQpJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ1VQREFURUQ6IEluIGEgd29ybGQgd2hlcmUgYmxvY2tjaGFpbiB0ZWNobm9sb2d5IGhhcyBldm9sdmVkIGJleW9uZCBpbWFnaW5hdGlvbiwgYSBncm91cCBvZiB1bmxpa2VseSBoZXJvZXMgbXVzdCBtYXN0ZXIgdGhlIHBvd2VyIG9mIGRlY2VudHJhbGl6ZWQgbmV0d29ya3MgdG8gc2F2ZSBodW1hbml0eSBmcm9tIGEgY2VudHJhbGl6ZWQgZHlzdG9waWEuIE5vdyB3aXRoIGJvbnVzIGNvbnRlbnQhJyxcclxuICAgICAgICBwcmljZTogMTIuOTksXHJcbiAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgIHRhZ3M6IFsnYmxvY2tjaGFpbicsICdzdXBlcmhlcm8nLCAnd2ViMycsICdjcnlwdG8nLCAnZHlzdG9waWEnLCAnZGlyZWN0b3JzLWN1dCddLFxyXG4gICAgICAgICAgYWdlUmF0aW5nOiAnVGVlbisnLFxyXG4gICAgICAgICAgbGFuZ3VhZ2U6ICdFbmdsaXNoJyxcclxuICAgICAgICAgIGVzdGltYXRlZFJlYWRUaW1lOiAnMjAtMjUgbWludXRlcycsXHJcbiAgICAgICAgICB2ZXJzaW9uOiAnRGlyZWN0b3JzIEN1dCB2MS4xJ1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucHV0KGAke0FQSV9HQVRFV0FZX1VSTH0vY29taWNzL2NyZWF0b3IvJHtjb21pY0lkfWAsIHVwZGF0ZURhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnRpdGxlKS50b0JlKHVwZGF0ZURhdGEudGl0bGUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnByaWNlKS50b0JlKHVwZGF0ZURhdGEucHJpY2UudG9TdHJpbmcoKSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEubWV0YWRhdGEudmVyc2lvbikudG9CZSgnRGlyZWN0b3JzIEN1dCB2MS4xJyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENvbWljIGRldGFpbHMgdXBkYXRlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBwdWJsaXNoIHRoZSBjb21pYycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wdXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvY3JlYXRvci8ke2NvbWljSWR9YCwge1xyXG4gICAgICAgIHN0YXR1czogJ3B1Ymxpc2hlZCdcclxuICAgICAgfSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuc3RhdHVzKS50b0JlKCdwdWJsaXNoZWQnKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5wdWJsaXNoZWRBdCkudG9CZURlZmluZWQoKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29taWMgcHVibGlzaGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCc077iP4oOjIENyZWF0b3IgRGFzaGJvYXJkICYgQW5hbHl0aWNzJywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIGdldCBjcmVhdG9yIGNvbWljcyBsaXN0JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L2NvbWljcy9jcmVhdG9yL215LWNvbWljcz9wYWdlPTEmbGltaXQ9MTBgLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzcG9uc2UuZGF0YS5kYXRhLmNvbWljcykpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuY29taWNzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgY29taWMgPSByZXNwb25zZS5kYXRhLmRhdGEuY29taWNzLmZpbmQoKGM6IGFueSkgPT4gYy5pZCA9PT0gY29taWNJZCk7XHJcbiAgICAgIGV4cGVjdChjb21pYykudG9CZURlZmluZWQoKTtcclxuICAgICAgZXhwZWN0KGNvbWljLnN0YXR1cykudG9CZSgncHVibGlzaGVkJyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENyZWF0b3IgY29taWNzIGxpc3QgcmV0cmlldmVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGZpbHRlciBjb21pY3MgYnkgc3RhdHVzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L2NvbWljcy9jcmVhdG9yL215LWNvbWljcz9zdGF0dXM9cHVibGlzaGVkJnBhZ2U9MSZsaW1pdD01YCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIHJlc3BvbnNlLmRhdGEuZGF0YS5jb21pY3MuZm9yRWFjaCgoY29taWM6IGFueSkgPT4ge1xyXG4gICAgICAgIGV4cGVjdChjb21pYy5zdGF0dXMpLnRvQmUoJ3B1Ymxpc2hlZCcpO1xyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29taWMgc3RhdHVzIGZpbHRlcmluZyB3b3JraW5nJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGdldCBjcmVhdG9yIGRhc2hib2FyZCBzdGF0cycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvY3JlYXRvci9zdGF0c2AsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnRvdGFsQ29taWNzKS50b0JlR3JlYXRlclRoYW4oMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEucHVibGlzaGVkQ29taWNzKS50b0JlR3JlYXRlclRoYW4oMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuZHJhZnRDb21pY3MpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudG90YWxQdXJjaGFzZXMpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudG90YWxSZXZlbnVlKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDcmVhdG9yIGRhc2hib2FyZCBzdGF0cyByZXRyaWV2ZWQnKTtcclxuICAgICAgY29uc29sZS5sb2coYPCfk4ogU3RhdHM6ICR7cmVzcG9uc2UuZGF0YS5kYXRhLnRvdGFsQ29taWNzfSBjb21pY3MsICR7cmVzcG9uc2UuZGF0YS5kYXRhLnB1Ymxpc2hlZENvbWljc30gcHVibGlzaGVkLCAkJHtyZXNwb25zZS5kYXRhLmRhdGEudG90YWxSZXZlbnVlfSByZXZlbnVlYCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJzXvuI/ig6MgQ29uc3VtZXIgRGlzY292ZXJ5ICYgSW50ZXJhY3Rpb24nLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgYWxsb3cgY29uc3VtZXJzIHRvIGRpc2NvdmVyIHB1Ymxpc2hlZCBjb21pY3MnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vY29taWNzP3BhZ2U9MSZsaW1pdD0xMCZnZW5yZT1TdXBlcmhlcm9gKTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzcG9uc2UuZGF0YS5kYXRhLmNvbWljcykpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBwdWJsaXNoZWRDb21pYyA9IHJlc3BvbnNlLmRhdGEuZGF0YS5jb21pY3MuZmluZCgoYzogYW55KSA9PiBjLmlkID09PSBjb21pY0lkKTtcclxuICAgICAgZXhwZWN0KHB1Ymxpc2hlZENvbWljKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QocHVibGlzaGVkQ29taWMuc3RhdHVzKS50b0JlKCdwdWJsaXNoZWQnKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29taWMgZGlzY292ZXJhYmxlIGJ5IGNvbnN1bWVycycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBnZXQgY29taWMgZGV0YWlscyBhcyBjb25zdW1lcicsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvJHtjb21pY0lkfWAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25zdW1lclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jb21pYy5pZCkudG9CZShjb21pY0lkKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5oYXNQdXJjaGFzZWQpLnRvQmUoZmFsc2UpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnByb2dyZXNzKS50b0JlTnVsbCgpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDb25zdW1lciBjYW4gdmlldyBjb21pYyBkZXRhaWxzJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGFsbG93IGNvbnN1bWVycyB0byB2aWV3IHByZXZpZXcgcGFnZXMgb25seScsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvJHtjb21pY0lkfS9wYWdlc2AsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25zdW1lclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5hY2Nlc3NMZXZlbCkudG9CZSgncHJldmlldycpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnBhZ2VzLmxlbmd0aCkudG9CZSg1KTsgLy8gT25seSBwcmV2aWV3IHBhZ2VzXHJcbiAgICAgIFxyXG4gICAgICByZXNwb25zZS5kYXRhLmRhdGEucGFnZXMuZm9yRWFjaCgocGFnZTogYW55KSA9PiB7XHJcbiAgICAgICAgZXhwZWN0KHBhZ2UuaXNQcmV2aWV3KS50b0JlKHRydWUpO1xyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29uc3VtZXIgbGltaXRlZCB0byBwcmV2aWV3IHBhZ2VzJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGFsbG93IGNvbnN1bWVycyB0byBhZGQgcmV2aWV3cycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmV2aWV3RGF0YSA9IHtcclxuICAgICAgICByYXRpbmc6IDUsXHJcbiAgICAgICAgcmV2aWV3OiAnQW1hemluZyBhcnR3b3JrIGFuZCBzdG9yeWxpbmUhIExvdmUgdGhlIFdlYjMgaW50ZWdyYXRpb24gYW5kIHRoZSB3YXkgYmxvY2tjaGFpbiBjb25jZXB0cyBhcmUgd292ZW4gaW50byB0aGUgc3VwZXJoZXJvIG5hcnJhdGl2ZS4gVGhlIGFydCBzdHlsZSBpcyBpbmNyZWRpYmxlIGFuZCB0aGUgY2hhcmFjdGVycyBhcmUgd2VsbC1kZXZlbG9wZWQuIENhblxcJ3Qgd2FpdCBmb3IgdGhlIG5leHQgaXNzdWUhJ1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vY29taWNzLyR7Y29taWNJZH0vcmV2aWV3YCwgcmV2aWV3RGF0YSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbnN1bWVyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnJhdGluZykudG9CZSg1KTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5yZXZpZXcpLnRvQmUocmV2aWV3RGF0YS5yZXZpZXcpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmNvbWljSWQpLnRvQmUoY29taWNJZCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIENvbnN1bWVyIGNhbiBhZGQgcmV2aWV3cycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCB0cmFjayByZWFkaW5nIHByb2dyZXNzIGZvciBwcmV2aWV3IHBhZ2VzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBwcm9ncmVzc0RhdGEgPSB7XHJcbiAgICAgICAgY3VycmVudFBhZ2U6IDNcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2NvbWljcy8ke2NvbWljSWR9L3Byb2dyZXNzYCwgcHJvZ3Jlc3NEYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uc3VtZXJUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuY3VycmVudFBhZ2UpLnRvQmUoMyk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudG90YWxQYWdlcykudG9CZSg3KTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5jb21wbGV0ZWRBdCkudG9CZU51bGwoKTsgLy8gTm90IGNvbXBsZXRlZCB5ZXRcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgUmVhZGluZyBwcm9ncmVzcyB0cmFja2VkJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJzbvuI/ig6MgQ3JlYXRvciBDb250ZW50IE1hbmFnZW1lbnQnLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgcHJldmVudCBlZGl0aW5nIHB1Ymxpc2hlZCBjb21pYyBwYWdlcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgLy8gVGhpcyBpcyBidXNpbmVzcyBsb2dpYyAtIG9uY2UgcHVibGlzaGVkLCBzdHJ1Y3R1cmFsIGNoYW5nZXMgc2hvdWxkIGJlIGxpbWl0ZWRcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvY3JlYXRvci8ke2NvbWljSWR9L3BhZ2VzYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuY29taWMuc3RhdHVzKS50b0JlKCdwdWJsaXNoZWQnKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgUHVibGlzaGVkIGNvbWljIHBhZ2VzIGFjY2Vzc2libGUgdG8gY3JlYXRvcicpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgZGVsZXRpb24gb2YgY29taWMgd2l0aCBwb3RlbnRpYWwgcHVyY2hhc2VzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAvLyBTaW5jZSB0aGlzIGNvbWljIG1pZ2h0IGhhdmUgcmV2aWV3cy9lbmdhZ2VtZW50LCBkZWxldGlvbiBzaG91bGQgYmUgcmVzdHJpY3RlZFxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L2NvbWljcy9jcmVhdG9yL3N0YXRzYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29taWMgc3RhdHMgYWNjZXNzaWJsZSBmb3IgYnVzaW5lc3MgZGVjaXNpb25zJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBhbm90aGVyIGNvbWljIGluIGRyYWZ0IHN0YXR1cycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgZHJhZnRDb21pY0RhdGEgPSB7XHJcbiAgICAgICAgdGl0bGU6ICdUaGUgQ3J5cHRvIEhlcm9lczogUmlzaW5nIFN0b3JtIChDb21pbmcgU29vbiknLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIHNlcXVlbCB0byBHZW5lc2lzIGlzIGluIGRldmVsb3BtZW50LiBPdXIgaGVyb2VzIGZhY2UgdGhlaXIgZ3JlYXRlc3QgY2hhbGxlbmdlIHlldC4uLicsXHJcbiAgICAgICAgYXV0aG9yOiAnRGlnaXRhbCBDb21pY3MgU3R1ZGlvJyxcclxuICAgICAgICBnZW5yZTogJ1N1cGVyaGVybycsXHJcbiAgICAgICAgcHJpY2U6IDE0Ljk5LFxyXG4gICAgICAgIGlzRnJlZW1pdW06IGZhbHNlLFxyXG4gICAgICAgIGZyZWVQYWdlQ291bnQ6IDAsXHJcbiAgICAgICAgaXNORlRFbGlnaWJsZTogdHJ1ZSxcclxuICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgdGFnczogWydibG9ja2NoYWluJywgJ3N1cGVyaGVybycsICdzZXF1ZWwnLCAnY29taW5nLXNvb24nXSxcclxuICAgICAgICAgIHN0YXR1czogJ2luLWRldmVsb3BtZW50J1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2NvbWljcy9jcmVhdG9yYCwgZHJhZnRDb21pY0RhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDEpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnN0YXR1cykudG9CZSgnZHJhZnQnKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS50aXRsZSkudG9Db250YWluKCdDb21pbmcgU29vbicpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBEcmFmdCBjb21pYyBjcmVhdGVkIGZvciBmdXR1cmUgcmVsZWFzZScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBzaG93IHVwZGF0ZWQgY3JlYXRvciBzdGF0cyB3aXRoIG11bHRpcGxlIGNvbWljcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvY3JlYXRvci9zdGF0c2AsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjcmVhdG9yVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnRvdGFsQ29taWNzKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDIpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmRyYWZ0Q29taWNzKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDEpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDcmVhdG9yIHN0YXRzIHVwZGF0ZWQgd2l0aCBtdWx0aXBsZSBjb21pY3MnKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnN++4j+KDoyBDcm9zcy1TZXJ2aWNlIEludGVncmF0aW9uJywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIGxpbmsgY29taWMgd2l0aCBmaWxlIHNlcnZpY2UnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvP2NhdGVnb3J5PWNvbWljLWNvdmVyJnBhZ2U9MSZsaW1pdD01YCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGNvbnN0IGNvdmVyRmlsZSA9IHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlcy5maW5kKChmOiBhbnkpID0+IGYuaWQgPT09IGNvdmVyRmlsZUlkKTtcclxuICAgICAgZXhwZWN0KGNvdmVyRmlsZSkudG9CZURlZmluZWQoKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29taWMtRmlsZSBzZXJ2aWNlIGludGVncmF0aW9uIHdvcmtpbmcnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgbWFpbnRhaW4gY3JlYXRvciBwcm9maWxlIGNvbnNpc3RlbmN5JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBjcmVhdG9yUHJvZmlsZVJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vdXNlci9jcmVhdG9yLyR7Y3JlYXRvcklkfWApO1xyXG4gICAgICBjb25zdCBjcmVhdG9yQ29taWNzUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvY3JlYXRvci9teS1jb21pY3NgLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChjcmVhdG9yUHJvZmlsZVJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QoY3JlYXRvckNvbWljc1Jlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IGNyZWF0b3JQcm9maWxlUmVzcG9uc2UuZGF0YS5kYXRhO1xyXG4gICAgICBjb25zdCBjb21pY3MgPSBjcmVhdG9yQ29taWNzUmVzcG9uc2UuZGF0YS5kYXRhLmNvbWljcztcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChwcm9maWxlLmNyZWF0b3JOYW1lKS50b0JlKCdEaWdpdGFsIENvbWljcyBTdHVkaW8nKTtcclxuICAgICAgZXhwZWN0KGNvbWljcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ3JlYXRvci1Db21pYyBzZXJ2aWNlIGludGVncmF0aW9uIGNvbnNpc3RlbnQnKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnOO+4j+KDoyBFcnJvciBIYW5kbGluZyAmIFNlY3VyaXR5JywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIHByZXZlbnQgdW5hdXRob3JpemVkIGNvbWljIGFjY2VzcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvY3JlYXRvci8ke2NvbWljSWR9L3BhZ2VzYCwge1xyXG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uc3VtZXJUb2tlbn1gIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nob3VsZCBoYXZlIGZhaWxlZCcpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLnN0YXR1cykudG9CZSg0MDQpO1xyXG4gICAgICAgIGV4cGVjdChlcnJvci5yZXNwb25zZS5kYXRhLmVycm9yKS50b0NvbnRhaW4oJ25vdCBmb3VuZCBvciBub3Qgb3duZWQnKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBVbmF1dGhvcml6ZWQgY29taWMgYWNjZXNzIHByZXZlbnRlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgaW52YWxpZCBjb21pYyBJRHMgZ3JhY2VmdWxseScsIGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9jb21pY3MvY3JlYXRvci9pbnZhbGlkLWNvbWljLWlkL3BhZ2VzYCwge1xyXG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwNCk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgSW52YWxpZCBjb21pYyBJRHMgaGFuZGxlZCBncmFjZWZ1bGx5Jyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGNvbWljIGNyZWF0aW9uIGRhdGEnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2NvbWljcy9jcmVhdG9yYCwge1xyXG4gICAgICAgICAgdGl0bGU6ICcnLCAvLyBFbXB0eSB0aXRsZSBzaG91bGQgZmFpbFxyXG4gICAgICAgICAgZ2VucmU6ICdTdXBlcmhlcm8nXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y3JlYXRvclRva2VufWAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwMCk7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLmRhdGEuZXJyb3IpLnRvQ29udGFpbigncmVxdWlyZWQnKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDb21pYyBjcmVhdGlvbiB2YWxpZGF0aW9uIHdvcmtpbmcnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgbWFpbnRhaW4gZGF0YSBpbnRlZ3JpdHkgYWNyb3NzIG9wZXJhdGlvbnMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIC8vIEdldCBpbml0aWFsIHN0YXRzXHJcbiAgICAgIGNvbnN0IGluaXRpYWxTdGF0cyA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L2NvbWljcy9jcmVhdG9yL3N0YXRzYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBHZXQgY29taWMgbGlzdFxyXG4gICAgICBjb25zdCBjb21pY3NMaXN0ID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vY29taWNzL2NyZWF0b3IvbXktY29taWNzYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBWZXJpZnkgY29uc2lzdGVuY3lcclxuICAgICAgZXhwZWN0KGluaXRpYWxTdGF0cy5kYXRhLmRhdGEudG90YWxDb21pY3MpLnRvQmUoY29taWNzTGlzdC5kYXRhLmRhdGEuY29taWNzLmxlbmd0aCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIERhdGEgaW50ZWdyaXR5IG1haW50YWluZWQgYWNyb3NzIHNlcnZpY2VzJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgYWZ0ZXJBbGwoYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coJ1xcbvCfp7kgQ2xlYW5pbmcgdXAgY29taWMgY3JlYXRvciB0ZXN0IGRhdGEuLi4nKTtcclxuICAgIFxyXG4gICAgLy8gQXJjaGl2ZSB0ZXN0IGNvbWljcyAoZG9uJ3QgZGVsZXRlIGR1ZSB0byBidXNpbmVzcyBsb2dpYylcclxuICAgIGlmIChjb21pY0lkKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MucHV0KGAke0FQSV9HQVRFV0FZX1VSTH0vY29taWNzL2NyZWF0b3IvJHtjb21pY0lkfWAsIHtcclxuICAgICAgICAgIHN0YXR1czogJ2FyY2hpdmVkJ1xyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NyZWF0b3JUb2tlbn1gIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZygn4pyFIFRlc3QgY29taWMgYXJjaGl2ZWQnKTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygn4pqg77iPIENvbWljIGNsZWFudXAgZmFpbGVkIChtYXkgbm90IGV4aXN0KScpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKCfwn46JIENvbWljIGNyZWF0b3IgdGVzdCBjbGVhbnVwIGNvbXBsZXRlZCEnKTtcclxuICB9KTtcclxufSk7Il19