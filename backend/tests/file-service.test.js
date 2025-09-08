import { describe, it, expect, beforeAll } from '@jest/globals';
import axios from 'axios';
import FormData from 'form-data';
const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || 'http://localhost:3007';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
describe('📁 File Service Tests', () => {
    let testUserToken;
    let testUserId;
    let uploadedFileId;
    let nftFileId;
    let presignedUploadData;
    const testUser = {
        email: `test-file-${Date.now()}@nerdwork.com`,
        password: 'SecureTestPassword123!',
        username: `fileuser${Date.now()}`
    };
    beforeAll(async () => {
        // Create test user
        const signupResponse = await axios.post(`${API_GATEWAY_URL}/auth/signup`, testUser);
        testUserToken = signupResponse.data.data.token;
        testUserId = signupResponse.data.data.user.id;
        console.log('🔧 Test user created for file tests');
    });
    describe('File Upload to S3', () => {
        it('should upload image file to S3 successfully', async () => {
            // Create a mock image file
            const mockImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
            const formData = new FormData();
            formData.append('file', mockImageData, {
                filename: 'test-comic-cover.png',
                contentType: 'image/png'
            });
            formData.append('category', 'comic-cover');
            formData.append('purpose', 'storage');
            formData.append('isPublic', 'true');
            formData.append('referenceId', 'test-comic-123');
            formData.append('referenceType', 'comic');
            const response = await axios.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                headers: {
                    Authorization: `Bearer ${testUserToken}`,
                    ...formData.getHeaders()
                }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.file.userId).toBe(testUserId);
            expect(response.data.data.file.originalName).toBe('test-comic-cover.png');
            expect(response.data.data.file.mimetype).toBe('image/png');
            expect(response.data.data.file.category).toBe('comic-cover');
            expect(response.data.data.file.s3Url).toBeDefined();
            expect(response.data.data.file.cdnUrl).toBeDefined();
            expect(response.data.data.file.s3Key).toBeDefined();
            uploadedFileId = response.data.data.file.id;
            console.log('✅ Image file uploaded to S3 successfully');
        });
        it('should handle different file types', async () => {
            const testFiles = [
                { name: 'test.jpg', type: 'image/jpeg', data: Buffer.from('fake-jpeg-data') },
                { name: 'test.gif', type: 'image/gif', data: Buffer.from('fake-gif-data') },
                { name: 'test.pdf', type: 'application/pdf', data: Buffer.from('fake-pdf-data') }
            ];
            for (const file of testFiles) {
                const formData = new FormData();
                formData.append('file', file.data, {
                    filename: file.name,
                    contentType: file.type
                });
                formData.append('category', 'general');
                const response = await axios.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                    headers: {
                        Authorization: `Bearer ${testUserToken}`,
                        ...formData.getHeaders()
                    }
                });
                expect(response.status).toBe(200);
                expect(response.data.data.file.mimetype).toBe(file.type);
                expect(response.data.data.file.originalName).toBe(file.name);
            }
            console.log('✅ Multiple file types handled successfully');
        });
        it('should reject unsupported file types', async () => {
            const formData = new FormData();
            formData.append('file', Buffer.from('fake-exe-data'), {
                filename: 'virus.exe',
                contentType: 'application/x-executable'
            });
            formData.append('category', 'general');
            try {
                await axios.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                    headers: {
                        Authorization: `Bearer ${testUserToken}`,
                        ...formData.getHeaders()
                    }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.success).toBe(false);
            }
            console.log('✅ Unsupported file types properly rejected');
        });
        it('should enforce file size limits', async () => {
            // Create a large mock file (over 50MB)
            const largeFileData = Buffer.alloc(51 * 1024 * 1024, 'a'); // 51MB
            const formData = new FormData();
            formData.append('file', largeFileData, {
                filename: 'huge-file.txt',
                contentType: 'text/plain'
            });
            try {
                await axios.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                    headers: {
                        Authorization: `Bearer ${testUserToken}`,
                        ...formData.getHeaders()
                    }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.error).toContain('File size too large');
            }
            console.log('✅ File size limits enforced');
        });
    });
    describe('File Upload for NFT (S3 + IPFS)', () => {
        it('should upload file to both S3 and IPFS', async () => {
            const mockNFTImage = Buffer.from('fake-nft-image-data-for-blockchain-storage');
            const formData = new FormData();
            formData.append('file', mockNFTImage, {
                filename: 'exclusive-comic-page-nft.jpg',
                contentType: 'image/jpeg'
            });
            formData.append('category', 'nft-asset');
            formData.append('referenceId', 'comic-page-001');
            formData.append('referenceType', 'comic-page');
            formData.append('nftMetadata', JSON.stringify({
                name: 'Exclusive Comic Page #001',
                description: 'First page of The Amazing Crypto Heroes series',
                attributes: [
                    { trait_type: 'Rarity', value: 'Legendary' },
                    { trait_type: 'Page Number', value: '1' },
                    { trait_type: 'Series', value: 'Crypto Heroes' }
                ]
            }));
            const response = await axios.post(`${API_GATEWAY_URL}/files/upload/nft`, formData, {
                headers: {
                    Authorization: `Bearer ${testUserToken}`,
                    ...formData.getHeaders()
                }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            const fileData = response.data.data.file;
            expect(fileData.s3Url).toBeDefined();
            expect(fileData.ipfsHash).toBeDefined();
            expect(fileData.ipfsUrl).toBeDefined();
            expect(fileData.isPinnedToIPFS).toBe(true);
            expect(fileData.purpose).toBe('nft-minting');
            expect(fileData.category).toBe('nft-asset');
            const ipfsData = response.data.data.ipfsResult;
            expect(ipfsData.hash).toBeDefined();
            expect(ipfsData.url).toBeDefined();
            expect(ipfsData.pinSize).toBeGreaterThan(0);
            nftFileId = fileData.id;
            console.log('✅ File uploaded to both S3 and IPFS successfully');
            console.log(`📎 IPFS Hash: ${fileData.ipfsHash}`);
            console.log(`🔗 IPFS URL: ${fileData.ipfsUrl}`);
        });
        it('should include NFT metadata in file record', async () => {
            if (!nftFileId)
                return;
            const response = await axios.get(`${API_GATEWAY_URL}/files/${nftFileId}`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.data.metadata.nftMetadata).toBeDefined();
            expect(response.data.data.metadata.nftMetadata.name).toContain('Exclusive Comic Page');
            console.log('✅ NFT metadata properly stored');
        });
    });
    describe('Presigned Upload URLs', () => {
        it('should generate presigned upload URL', async () => {
            const requestData = {
                filename: 'direct-upload-test.png',
                contentType: 'image/png',
                category: 'comic-page',
                purpose: 'storage'
            };
            const response = await axios.post(`${API_GATEWAY_URL}/files/presigned-url`, requestData, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.uploadUrl).toBeDefined();
            expect(response.data.data.s3Key).toBeDefined();
            expect(response.data.data.cdnUrl).toBeDefined();
            expect(response.data.data.expiresIn).toBe(3600); // 1 hour default
            presignedUploadData = response.data.data;
            console.log('✅ Presigned upload URL generated successfully');
        });
        it('should validate presigned URL format', async () => {
            expect(presignedUploadData.uploadUrl).toMatch(/^https:\/\/.+\.amazonaws\.com\/.+/);
            expect(presignedUploadData.s3Key).toMatch(/^comic-page\/.+\/\d+_.+_direct-upload-test\.png$/);
            expect(presignedUploadData.cdnUrl).toBeDefined();
            console.log('✅ Presigned URL format validated');
        });
        it('should require authentication for presigned URLs', async () => {
            try {
                await axios.post(`${API_GATEWAY_URL}/files/presigned-url`, {
                    filename: 'test.jpg',
                    contentType: 'image/jpeg'
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(401);
            }
            console.log('✅ Presigned URL properly protected');
        });
    });
    describe('File Management', () => {
        it('should list user files', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/files/?page=1&limit=10`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.data.files)).toBe(true);
            expect(response.data.data.pagination).toBeDefined();
            // All files should belong to the test user
            response.data.data.files.forEach((file) => {
                expect(file.userId).toBe(testUserId);
            });
            console.log('✅ User files listed successfully');
        });
        it('should filter files by category', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/files/?category=comic-cover&page=1&limit=5`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            response.data.data.files.forEach((file) => {
                expect(file.category).toBe('comic-cover');
            });
            console.log('✅ File category filtering working');
        });
        it('should filter files by purpose', async () => {
            const response = await axios.get(`${API_GATEWAY_URL}/files/?purpose=nft-minting&page=1&limit=5`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            response.data.data.files.forEach((file) => {
                expect(file.purpose).toBe('nft-minting');
            });
            console.log('✅ File purpose filtering working');
        });
        it('should get specific file details', async () => {
            if (!uploadedFileId)
                return;
            const response = await axios.get(`${API_GATEWAY_URL}/files/${uploadedFileId}`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data.id).toBe(uploadedFileId);
            expect(response.data.data.userId).toBe(testUserId);
            console.log('✅ Specific file details retrieved');
        });
        it('should handle public file access', async () => {
            if (!uploadedFileId)
                return;
            // Test access without authentication for public file
            const response = await axios.get(`${API_GATEWAY_URL}/files/${uploadedFileId}`);
            expect(response.status).toBe(200);
            expect(response.data.data.isPublic).toBe(true);
            console.log('✅ Public file access working');
        });
        it('should protect private file access', async () => {
            // Upload a private file first
            const formData = new FormData();
            formData.append('file', Buffer.from('private-file-data'), {
                filename: 'private-test.txt',
                contentType: 'text/plain'
            });
            formData.append('category', 'private');
            formData.append('isPublic', 'false');
            const uploadResponse = await axios.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                headers: {
                    Authorization: `Bearer ${testUserToken}`,
                    ...formData.getHeaders()
                }
            });
            const privateFileId = uploadResponse.data.data.file.id;
            // Try to access without authentication
            try {
                await axios.get(`${API_GATEWAY_URL}/files/${privateFileId}`);
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.error).toContain('Access denied');
            }
            console.log('✅ Private file access properly protected');
        });
    });
    describe('File Deletion', () => {
        it('should delete user file', async () => {
            if (!uploadedFileId)
                return;
            const response = await axios.delete(`${API_GATEWAY_URL}/files/${uploadedFileId}`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            console.log('✅ File deleted successfully');
        });
        it('should mark file as inactive after deletion', async () => {
            if (!uploadedFileId)
                return;
            try {
                await axios.get(`${API_GATEWAY_URL}/files/${uploadedFileId}`, {
                    headers: { Authorization: `Bearer ${testUserToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(404);
            }
            console.log('✅ Deleted file properly inaccessible');
        });
        it('should not allow deletion of other users files', async () => {
            // Create another user
            const otherUser = {
                email: `other-file-user-${Date.now()}@nerdwork.com`,
                password: 'SecureTestPassword123!',
                username: `otherfileuser${Date.now()}`
            };
            const otherSignup = await axios.post(`${API_GATEWAY_URL}/auth/signup`, otherUser);
            const otherUserToken = otherSignup.data.data.token;
            if (!nftFileId)
                return;
            try {
                await axios.delete(`${API_GATEWAY_URL}/files/${nftFileId}`, {
                    headers: { Authorization: `Bearer ${otherUserToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(404);
                expect(error.response.data.error).toContain('not found');
            }
            console.log('✅ Cross-user file deletion properly prevented');
        });
    });
    describe('IPFS Integration', () => {
        it('should handle IPFS gateway URLs correctly', async () => {
            if (!nftFileId)
                return;
            const response = await axios.get(`${API_GATEWAY_URL}/files/${nftFileId}`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            const file = response.data.data;
            expect(file.ipfsUrl).toBeDefined();
            expect(file.ipfsHash).toBeDefined();
            // IPFS URL should be properly formatted
            expect(file.ipfsUrl).toMatch(/^https:\/\/.+\/ipfs\/[a-zA-Z0-9]+$/);
            console.log('✅ IPFS URL formatting correct');
        });
        it('should track IPFS pinning status', async () => {
            if (!nftFileId)
                return;
            const response = await axios.get(`${API_GATEWAY_URL}/files/${nftFileId}`, {
                headers: { Authorization: `Bearer ${testUserToken}` }
            });
            expect(response.data.data.isPinnedToIPFS).toBe(true);
            console.log('✅ IPFS pinning status tracked');
        });
    });
    describe('Service Health & Performance', () => {
        it('should respond to health check', async () => {
            const response = await axios.get(`${FILE_SERVICE_URL}/health`);
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.service).toBe('file-service');
            console.log('✅ File service health check passed');
        });
        it('should handle concurrent file uploads', async () => {
            const uploadPromises = Array.from({ length: 3 }, (_, i) => {
                const formData = new FormData();
                formData.append('file', Buffer.from(`concurrent-test-${i}`), {
                    filename: `concurrent-${i}.txt`,
                    contentType: 'text/plain'
                });
                formData.append('category', 'test');
                return axios.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                    headers: {
                        Authorization: `Bearer ${testUserToken}`,
                        ...formData.getHeaders()
                    }
                });
            });
            const responses = await Promise.all(uploadPromises);
            responses.forEach((response, index) => {
                expect(response.status).toBe(200);
                expect(response.data.data.file.originalName).toBe(`concurrent-${index}.txt`);
            });
            console.log('✅ Concurrent file uploads handled successfully');
        });
        it('should maintain reasonable upload response times', async () => {
            const startTime = Date.now();
            const formData = new FormData();
            formData.append('file', Buffer.from('performance-test-data'), {
                filename: 'performance-test.txt',
                contentType: 'text/plain'
            });
            formData.append('category', 'test');
            await axios.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                headers: {
                    Authorization: `Bearer ${testUserToken}`,
                    ...formData.getHeaders()
                }
            });
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
            console.log(`✅ Upload response time: ${responseTime}ms (acceptable)`);
        });
    });
    describe('Error Handling', () => {
        it('should handle missing file in upload', async () => {
            const formData = new FormData();
            formData.append('category', 'test');
            try {
                await axios.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                    headers: {
                        Authorization: `Bearer ${testUserToken}`,
                        ...formData.getHeaders()
                    }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.error).toContain('No file provided');
            }
            console.log('✅ Missing file properly handled');
        });
        it('should handle invalid file IDs', async () => {
            try {
                await axios.get(`${API_GATEWAY_URL}/files/invalid-file-id-123`, {
                    headers: { Authorization: `Bearer ${testUserToken}` }
                });
                throw new Error('Should have failed');
            }
            catch (error) {
                expect(error.response.status).toBe(404);
            }
            console.log('✅ Invalid file IDs properly handled');
        });
        it('should handle network interruptions gracefully', async () => {
            // Test with a very small timeout to simulate network issues
            const axiosInstance = axios.create({ timeout: 1 });
            try {
                const formData = new FormData();
                formData.append('file', Buffer.alloc(1024 * 1024), {
                    filename: 'timeout-test.bin',
                    contentType: 'application/octet-stream'
                });
                await axiosInstance.post(`${API_GATEWAY_URL}/files/upload/s3`, formData, {
                    headers: {
                        Authorization: `Bearer ${testUserToken}`,
                        ...formData.getHeaders()
                    }
                });
            }
            catch (error) {
                expect(error.code).toBe('ECONNABORTED');
            }
            console.log('✅ Network interruptions handled gracefully');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmaWxlLXNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzFFLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQztBQUMxQixPQUFPLFFBQVEsTUFBTSxXQUFXLENBQUM7QUFFakMsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLHVCQUF1QixDQUFDO0FBQ2pGLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLHVCQUF1QixDQUFDO0FBRS9FLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsSUFBSSxhQUFxQixDQUFDO0lBQzFCLElBQUksVUFBa0IsQ0FBQztJQUN2QixJQUFJLGNBQXNCLENBQUM7SUFDM0IsSUFBSSxTQUFpQixDQUFDO0lBQ3RCLElBQUksbUJBQXdCLENBQUM7SUFFN0IsTUFBTSxRQUFRLEdBQUc7UUFDZixLQUFLLEVBQUUsYUFBYSxJQUFJLENBQUMsR0FBRyxFQUFFLGVBQWU7UUFDN0MsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxRQUFRLEVBQUUsV0FBVyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7S0FDbEMsQ0FBQztJQUVGLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNuQixtQkFBbUI7UUFDbkIsTUFBTSxjQUFjLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsZUFBZSxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEYsYUFBYSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUMvQyxVQUFVLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMs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RCxPQUFPLENBQUMsR0FBRyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QsIGJlZm9yZUFsbCwgYWZ0ZXJBbGwgfSBmcm9tICdAamVzdC9nbG9iYWxzJztcclxuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcclxuaW1wb3J0IEZvcm1EYXRhIGZyb20gJ2Zvcm0tZGF0YSc7XHJcblxyXG5jb25zdCBGSUxFX1NFUlZJQ0VfVVJMID0gcHJvY2Vzcy5lbnYuRklMRV9TRVJWSUNFX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDA3JztcclxuY29uc3QgQVBJX0dBVEVXQVlfVVJMID0gcHJvY2Vzcy5lbnYuQVBJX0dBVEVXQVlfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnO1xyXG5cclxuZGVzY3JpYmUoJ/Cfk4EgRmlsZSBTZXJ2aWNlIFRlc3RzJywgKCkgPT4ge1xyXG4gIGxldCB0ZXN0VXNlclRva2VuOiBzdHJpbmc7XHJcbiAgbGV0IHRlc3RVc2VySWQ6IHN0cmluZztcclxuICBsZXQgdXBsb2FkZWRGaWxlSWQ6IHN0cmluZztcclxuICBsZXQgbmZ0RmlsZUlkOiBzdHJpbmc7XHJcbiAgbGV0IHByZXNpZ25lZFVwbG9hZERhdGE6IGFueTtcclxuICBcclxuICBjb25zdCB0ZXN0VXNlciA9IHtcclxuICAgIGVtYWlsOiBgdGVzdC1maWxlLSR7RGF0ZS5ub3coKX1AbmVyZHdvcmsuY29tYCxcclxuICAgIHBhc3N3b3JkOiAnU2VjdXJlVGVzdFBhc3N3b3JkMTIzIScsXHJcbiAgICB1c2VybmFtZTogYGZpbGV1c2VyJHtEYXRlLm5vdygpfWBcclxuICB9O1xyXG5cclxuICBiZWZvcmVBbGwoYXN5bmMgKCkgPT4ge1xyXG4gICAgLy8gQ3JlYXRlIHRlc3QgdXNlclxyXG4gICAgY29uc3Qgc2lnbnVwUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vYXV0aC9zaWdudXBgLCB0ZXN0VXNlcik7XHJcbiAgICB0ZXN0VXNlclRva2VuID0gc2lnbnVwUmVzcG9uc2UuZGF0YS5kYXRhLnRva2VuO1xyXG4gICAgdGVzdFVzZXJJZCA9IHNpZ251cFJlc3BvbnNlLmRhdGEuZGF0YS51c2VyLmlkO1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZygn8J+UpyBUZXN0IHVzZXIgY3JlYXRlZCBmb3IgZmlsZSB0ZXN0cycpO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnRmlsZSBVcGxvYWQgdG8gUzMnLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgdXBsb2FkIGltYWdlIGZpbGUgdG8gUzMgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAvLyBDcmVhdGUgYSBtb2NrIGltYWdlIGZpbGVcclxuICAgICAgY29uc3QgbW9ja0ltYWdlRGF0YSA9IEJ1ZmZlci5mcm9tKCdpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkNBWUFBQUFmRmNTSkFBQUFEVWxFUVZSNDJtTmsrTTlRRHdBRGhnR0FXalI5YXdBQUFBQkpSVTVFcmtKZ2dnPT0nLCAnYmFzZTY0Jyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ZpbGUnLCBtb2NrSW1hZ2VEYXRhLCB7XHJcbiAgICAgICAgZmlsZW5hbWU6ICd0ZXN0LWNvbWljLWNvdmVyLnBuZycsXHJcbiAgICAgICAgY29udGVudFR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgIH0pO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2NhdGVnb3J5JywgJ2NvbWljLWNvdmVyJyk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgncHVycG9zZScsICdzdG9yYWdlJyk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnaXNQdWJsaWMnLCAndHJ1ZScpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ3JlZmVyZW5jZUlkJywgJ3Rlc3QtY29taWMtMTIzJyk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgncmVmZXJlbmNlVHlwZScsICdjb21pYycpO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvdXBsb2FkL3MzYCwgZm9ybURhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gLFxyXG4gICAgICAgICAgLi4uZm9ybURhdGEuZ2V0SGVhZGVycygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLnVzZXJJZCkudG9CZSh0ZXN0VXNlcklkKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLm9yaWdpbmFsTmFtZSkudG9CZSgndGVzdC1jb21pYy1jb3Zlci5wbmcnKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLm1pbWV0eXBlKS50b0JlKCdpbWFnZS9wbmcnKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLmNhdGVnb3J5KS50b0JlKCdjb21pYy1jb3ZlcicpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmZpbGUuczNVcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuZmlsZS5jZG5VcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuZmlsZS5zM0tleSkudG9CZURlZmluZWQoKTtcclxuICAgICAgXHJcbiAgICAgIHVwbG9hZGVkRmlsZUlkID0gcmVzcG9uc2UuZGF0YS5kYXRhLmZpbGUuaWQ7XHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgSW1hZ2UgZmlsZSB1cGxvYWRlZCB0byBTMyBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGRpZmZlcmVudCBmaWxlIHR5cGVzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCB0ZXN0RmlsZXMgPSBbXHJcbiAgICAgICAgeyBuYW1lOiAndGVzdC5qcGcnLCB0eXBlOiAnaW1hZ2UvanBlZycsIGRhdGE6IEJ1ZmZlci5mcm9tKCdmYWtlLWpwZWctZGF0YScpIH0sXHJcbiAgICAgICAgeyBuYW1lOiAndGVzdC5naWYnLCB0eXBlOiAnaW1hZ2UvZ2lmJywgZGF0YTogQnVmZmVyLmZyb20oJ2Zha2UtZ2lmLWRhdGEnKSB9LFxyXG4gICAgICAgIHsgbmFtZTogJ3Rlc3QucGRmJywgdHlwZTogJ2FwcGxpY2F0aW9uL3BkZicsIGRhdGE6IEJ1ZmZlci5mcm9tKCdmYWtlLXBkZi1kYXRhJykgfVxyXG4gICAgICBdO1xyXG5cclxuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIHRlc3RGaWxlcykge1xyXG4gICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XHJcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdmaWxlJywgZmlsZS5kYXRhLCB7XHJcbiAgICAgICAgICBmaWxlbmFtZTogZmlsZS5uYW1lLFxyXG4gICAgICAgICAgY29udGVudFR5cGU6IGZpbGUudHlwZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnY2F0ZWdvcnknLCAnZ2VuZXJhbCcpO1xyXG5cclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy91cGxvYWQvczNgLCBmb3JtRGF0YSwge1xyXG4gICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gLFxyXG4gICAgICAgICAgICAuLi5mb3JtRGF0YS5nZXRIZWFkZXJzKClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLm1pbWV0eXBlKS50b0JlKGZpbGUudHlwZSk7XHJcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLm9yaWdpbmFsTmFtZSkudG9CZShmaWxlLm5hbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIE11bHRpcGxlIGZpbGUgdHlwZXMgaGFuZGxlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgcmVqZWN0IHVuc3VwcG9ydGVkIGZpbGUgdHlwZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnZmlsZScsIEJ1ZmZlci5mcm9tKCdmYWtlLWV4ZS1kYXRhJyksIHtcclxuICAgICAgICBmaWxlbmFtZTogJ3ZpcnVzLmV4ZScsXHJcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi94LWV4ZWN1dGFibGUnXHJcbiAgICAgIH0pO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2NhdGVnb3J5JywgJ2dlbmVyYWwnKTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2ZpbGVzL3VwbG9hZC9zM2AsIGZvcm1EYXRhLCB7XHJcbiAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAsXHJcbiAgICAgICAgICAgIC4uLmZvcm1EYXRhLmdldEhlYWRlcnMoKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwMCk7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZShmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgVW5zdXBwb3J0ZWQgZmlsZSB0eXBlcyBwcm9wZXJseSByZWplY3RlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBlbmZvcmNlIGZpbGUgc2l6ZSBsaW1pdHMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIC8vIENyZWF0ZSBhIGxhcmdlIG1vY2sgZmlsZSAob3ZlciA1ME1CKVxyXG4gICAgICBjb25zdCBsYXJnZUZpbGVEYXRhID0gQnVmZmVyLmFsbG9jKDUxICogMTAyNCAqIDEwMjQsICdhJyk7IC8vIDUxTUJcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnZmlsZScsIGxhcmdlRmlsZURhdGEsIHtcclxuICAgICAgICBmaWxlbmFtZTogJ2h1Z2UtZmlsZS50eHQnLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy91cGxvYWQvczNgLCBmb3JtRGF0YSwge1xyXG4gICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gLFxyXG4gICAgICAgICAgICAuLi5mb3JtRGF0YS5nZXRIZWFkZXJzKClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nob3VsZCBoYXZlIGZhaWxlZCcpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLnN0YXR1cykudG9CZSg0MDApO1xyXG4gICAgICAgIGV4cGVjdChlcnJvci5yZXNwb25zZS5kYXRhLmVycm9yKS50b0NvbnRhaW4oJ0ZpbGUgc2l6ZSB0b28gbGFyZ2UnKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBGaWxlIHNpemUgbGltaXRzIGVuZm9yY2VkJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ0ZpbGUgVXBsb2FkIGZvciBORlQgKFMzICsgSVBGUyknLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgdXBsb2FkIGZpbGUgdG8gYm90aCBTMyBhbmQgSVBGUycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgbW9ja05GVEltYWdlID0gQnVmZmVyLmZyb20oJ2Zha2UtbmZ0LWltYWdlLWRhdGEtZm9yLWJsb2NrY2hhaW4tc3RvcmFnZScpO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcclxuICAgICAgZm9ybURhdGEuYXBwZW5kKCdmaWxlJywgbW9ja05GVEltYWdlLCB7XHJcbiAgICAgICAgZmlsZW5hbWU6ICdleGNsdXNpdmUtY29taWMtcGFnZS1uZnQuanBnJyxcclxuICAgICAgICBjb250ZW50VHlwZTogJ2ltYWdlL2pwZWcnXHJcbiAgICAgIH0pO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2NhdGVnb3J5JywgJ25mdC1hc3NldCcpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ3JlZmVyZW5jZUlkJywgJ2NvbWljLXBhZ2UtMDAxJyk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgncmVmZXJlbmNlVHlwZScsICdjb21pYy1wYWdlJyk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnbmZ0TWV0YWRhdGEnLCBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgbmFtZTogJ0V4Y2x1c2l2ZSBDb21pYyBQYWdlICMwMDEnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRmlyc3QgcGFnZSBvZiBUaGUgQW1hemluZyBDcnlwdG8gSGVyb2VzIHNlcmllcycsXHJcbiAgICAgICAgYXR0cmlidXRlczogW1xyXG4gICAgICAgICAgeyB0cmFpdF90eXBlOiAnUmFyaXR5JywgdmFsdWU6ICdMZWdlbmRhcnknIH0sXHJcbiAgICAgICAgICB7IHRyYWl0X3R5cGU6ICdQYWdlIE51bWJlcicsIHZhbHVlOiAnMScgfSxcclxuICAgICAgICAgIHsgdHJhaXRfdHlwZTogJ1NlcmllcycsIHZhbHVlOiAnQ3J5cHRvIEhlcm9lcycgfVxyXG4gICAgICAgIF1cclxuICAgICAgfSkpO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvdXBsb2FkL25mdGAsIGZvcm1EYXRhLCB7XHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCxcclxuICAgICAgICAgIC4uLmZvcm1EYXRhLmdldEhlYWRlcnMoKVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBmaWxlRGF0YSA9IHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlO1xyXG4gICAgICBleHBlY3QoZmlsZURhdGEuczNVcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChmaWxlRGF0YS5pcGZzSGFzaCkudG9CZURlZmluZWQoKTtcclxuICAgICAgZXhwZWN0KGZpbGVEYXRhLmlwZnNVcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChmaWxlRGF0YS5pc1Bpbm5lZFRvSVBGUykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KGZpbGVEYXRhLnB1cnBvc2UpLnRvQmUoJ25mdC1taW50aW5nJyk7XHJcbiAgICAgIGV4cGVjdChmaWxlRGF0YS5jYXRlZ29yeSkudG9CZSgnbmZ0LWFzc2V0Jyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBpcGZzRGF0YSA9IHJlc3BvbnNlLmRhdGEuZGF0YS5pcGZzUmVzdWx0O1xyXG4gICAgICBleHBlY3QoaXBmc0RhdGEuaGFzaCkudG9CZURlZmluZWQoKTtcclxuICAgICAgZXhwZWN0KGlwZnNEYXRhLnVybCkudG9CZURlZmluZWQoKTtcclxuICAgICAgZXhwZWN0KGlwZnNEYXRhLnBpblNpemUpLnRvQmVHcmVhdGVyVGhhbigwKTtcclxuICAgICAgXHJcbiAgICAgIG5mdEZpbGVJZCA9IGZpbGVEYXRhLmlkO1xyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIEZpbGUgdXBsb2FkZWQgdG8gYm90aCBTMyBhbmQgSVBGUyBzdWNjZXNzZnVsbHknKTtcclxuICAgICAgY29uc29sZS5sb2coYPCfk44gSVBGUyBIYXNoOiAke2ZpbGVEYXRhLmlwZnNIYXNofWApO1xyXG4gICAgICBjb25zb2xlLmxvZyhg8J+UlyBJUEZTIFVSTDogJHtmaWxlRGF0YS5pcGZzVXJsfWApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIE5GVCBtZXRhZGF0YSBpbiBmaWxlIHJlY29yZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgaWYgKCFuZnRGaWxlSWQpIHJldHVybjtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvJHtuZnRGaWxlSWR9YCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLm1ldGFkYXRhLm5mdE1ldGFkYXRhKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLm1ldGFkYXRhLm5mdE1ldGFkYXRhLm5hbWUpLnRvQ29udGFpbignRXhjbHVzaXZlIENvbWljIFBhZ2UnKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgTkZUIG1ldGFkYXRhIHByb3Blcmx5IHN0b3JlZCcpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGRlc2NyaWJlKCdQcmVzaWduZWQgVXBsb2FkIFVSTHMnLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgcHJlc2lnbmVkIHVwbG9hZCBVUkwnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHJlcXVlc3REYXRhID0ge1xyXG4gICAgICAgIGZpbGVuYW1lOiAnZGlyZWN0LXVwbG9hZC10ZXN0LnBuZycsXHJcbiAgICAgICAgY29udGVudFR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgIGNhdGVnb3J5OiAnY29taWMtcGFnZScsXHJcbiAgICAgICAgcHVycG9zZTogJ3N0b3JhZ2UnXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy9wcmVzaWduZWQtdXJsYCwgcmVxdWVzdERhdGEsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS51cGxvYWRVcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuczNLZXkpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEuY2RuVXJsKS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmV4cGlyZXNJbikudG9CZSgzNjAwKTsgLy8gMSBob3VyIGRlZmF1bHRcclxuICAgICAgXHJcbiAgICAgIHByZXNpZ25lZFVwbG9hZERhdGEgPSByZXNwb25zZS5kYXRhLmRhdGE7XHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgUHJlc2lnbmVkIHVwbG9hZCBVUkwgZ2VuZXJhdGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBwcmVzaWduZWQgVVJMIGZvcm1hdCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgZXhwZWN0KHByZXNpZ25lZFVwbG9hZERhdGEudXBsb2FkVXJsKS50b01hdGNoKC9eaHR0cHM6XFwvXFwvLitcXC5hbWF6b25hd3NcXC5jb21cXC8uKy8pO1xyXG4gICAgICBleHBlY3QocHJlc2lnbmVkVXBsb2FkRGF0YS5zM0tleSkudG9NYXRjaCgvXmNvbWljLXBhZ2VcXC8uK1xcL1xcZCtfLitfZGlyZWN0LXVwbG9hZC10ZXN0XFwucG5nJC8pO1xyXG4gICAgICBleHBlY3QocHJlc2lnbmVkVXBsb2FkRGF0YS5jZG5VcmwpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIFByZXNpZ25lZCBVUkwgZm9ybWF0IHZhbGlkYXRlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uIGZvciBwcmVzaWduZWQgVVJMcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvcHJlc2lnbmVkLXVybGAsIHtcclxuICAgICAgICAgIGZpbGVuYW1lOiAndGVzdC5qcGcnLFxyXG4gICAgICAgICAgY29udGVudFR5cGU6ICdpbWFnZS9qcGVnJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwMSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgUHJlc2lnbmVkIFVSTCBwcm9wZXJseSBwcm90ZWN0ZWQnKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnRmlsZSBNYW5hZ2VtZW50JywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIGxpc3QgdXNlciBmaWxlcycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy8/cGFnZT0xJmxpbWl0PTEwYCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnN0YXR1cykudG9CZSgyMDApO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5zdWNjZXNzKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXNwb25zZS5kYXRhLmRhdGEuZmlsZXMpKS50b0JlKHRydWUpO1xyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLnBhZ2luYXRpb24pLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBBbGwgZmlsZXMgc2hvdWxkIGJlbG9uZyB0byB0aGUgdGVzdCB1c2VyXHJcbiAgICAgIHJlc3BvbnNlLmRhdGEuZGF0YS5maWxlcy5mb3JFYWNoKChmaWxlOiBhbnkpID0+IHtcclxuICAgICAgICBleHBlY3QoZmlsZS51c2VySWQpLnRvQmUodGVzdFVzZXJJZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBVc2VyIGZpbGVzIGxpc3RlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgZmlsdGVyIGZpbGVzIGJ5IGNhdGVnb3J5JywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L2ZpbGVzLz9jYXRlZ29yeT1jb21pYy1jb3ZlciZwYWdlPTEmbGltaXQ9NWAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgcmVzcG9uc2UuZGF0YS5kYXRhLmZpbGVzLmZvckVhY2goKGZpbGU6IGFueSkgPT4ge1xyXG4gICAgICAgIGV4cGVjdChmaWxlLmNhdGVnb3J5KS50b0JlKCdjb21pYy1jb3ZlcicpO1xyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgRmlsZSBjYXRlZ29yeSBmaWx0ZXJpbmcgd29ya2luZycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBmaWx0ZXIgZmlsZXMgYnkgcHVycG9zZScsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy8/cHVycG9zZT1uZnQtbWludGluZyZwYWdlPTEmbGltaXQ9NWAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgcmVzcG9uc2UuZGF0YS5kYXRhLmZpbGVzLmZvckVhY2goKGZpbGU6IGFueSkgPT4ge1xyXG4gICAgICAgIGV4cGVjdChmaWxlLnB1cnBvc2UpLnRvQmUoJ25mdC1taW50aW5nJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBGaWxlIHB1cnBvc2UgZmlsdGVyaW5nIHdvcmtpbmcnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgZ2V0IHNwZWNpZmljIGZpbGUgZGV0YWlscycsIGFzeW5jICgpID0+IHtcclxuICAgICAgaWYgKCF1cGxvYWRlZEZpbGVJZCkgcmV0dXJuO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy8ke3VwbG9hZGVkRmlsZUlkfWAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5pZCkudG9CZSh1cGxvYWRlZEZpbGVJZCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLmRhdGEudXNlcklkKS50b0JlKHRlc3RVc2VySWQpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBTcGVjaWZpYyBmaWxlIGRldGFpbHMgcmV0cmlldmVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBwdWJsaWMgZmlsZSBhY2Nlc3MnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmICghdXBsb2FkZWRGaWxlSWQpIHJldHVybjtcclxuXHJcbiAgICAgIC8vIFRlc3QgYWNjZXNzIHdpdGhvdXQgYXV0aGVudGljYXRpb24gZm9yIHB1YmxpYyBmaWxlXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvJHt1cGxvYWRlZEZpbGVJZH1gKTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuZGF0YS5pc1B1YmxpYykudG9CZSh0cnVlKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgUHVibGljIGZpbGUgYWNjZXNzIHdvcmtpbmcnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgcHJvdGVjdCBwcml2YXRlIGZpbGUgYWNjZXNzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAvLyBVcGxvYWQgYSBwcml2YXRlIGZpbGUgZmlyc3RcclxuICAgICAgY29uc3QgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcclxuICAgICAgZm9ybURhdGEuYXBwZW5kKCdmaWxlJywgQnVmZmVyLmZyb20oJ3ByaXZhdGUtZmlsZS1kYXRhJyksIHtcclxuICAgICAgICBmaWxlbmFtZTogJ3ByaXZhdGUtdGVzdC50eHQnLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcclxuICAgICAgfSk7XHJcbiAgICAgIGZvcm1EYXRhLmFwcGVuZCgnY2F0ZWdvcnknLCAncHJpdmF0ZScpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2lzUHVibGljJywgJ2ZhbHNlJyk7XHJcblxyXG4gICAgICBjb25zdCB1cGxvYWRSZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy91cGxvYWQvczNgLCBmb3JtRGF0YSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAsXHJcbiAgICAgICAgICAuLi5mb3JtRGF0YS5nZXRIZWFkZXJzKClcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgcHJpdmF0ZUZpbGVJZCA9IHVwbG9hZFJlc3BvbnNlLmRhdGEuZGF0YS5maWxlLmlkO1xyXG5cclxuICAgICAgLy8gVHJ5IHRvIGFjY2VzcyB3aXRob3V0IGF1dGhlbnRpY2F0aW9uXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvJHtwcml2YXRlRmlsZUlkfWApO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwMyk7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLmRhdGEuZXJyb3IpLnRvQ29udGFpbignQWNjZXNzIGRlbmllZCcpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIFByaXZhdGUgZmlsZSBhY2Nlc3MgcHJvcGVybHkgcHJvdGVjdGVkJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ0ZpbGUgRGVsZXRpb24nLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgZGVsZXRlIHVzZXIgZmlsZScsIGFzeW5jICgpID0+IHtcclxuICAgICAgaWYgKCF1cGxvYWRlZEZpbGVJZCkgcmV0dXJuO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5kZWxldGUoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy8ke3VwbG9hZGVkRmlsZUlkfWAsIHtcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRhdGEuc3VjY2VzcykudG9CZSh0cnVlKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgRmlsZSBkZWxldGVkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBtYXJrIGZpbGUgYXMgaW5hY3RpdmUgYWZ0ZXIgZGVsZXRpb24nLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmICghdXBsb2FkZWRGaWxlSWQpIHJldHVybjtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvJHt1cGxvYWRlZEZpbGVJZH1gLCB7XHJcbiAgICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwNCk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgRGVsZXRlZCBmaWxlIHByb3Blcmx5IGluYWNjZXNzaWJsZScpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgZGVsZXRpb24gb2Ygb3RoZXIgdXNlcnMgZmlsZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIC8vIENyZWF0ZSBhbm90aGVyIHVzZXJcclxuICAgICAgY29uc3Qgb3RoZXJVc2VyID0ge1xyXG4gICAgICAgIGVtYWlsOiBgb3RoZXItZmlsZS11c2VyLSR7RGF0ZS5ub3coKX1AbmVyZHdvcmsuY29tYCxcclxuICAgICAgICBwYXNzd29yZDogJ1NlY3VyZVRlc3RQYXNzd29yZDEyMyEnLFxyXG4gICAgICAgIHVzZXJuYW1lOiBgb3RoZXJmaWxldXNlciR7RGF0ZS5ub3coKX1gXHJcbiAgICAgIH07XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBvdGhlclNpZ251cCA9IGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS9hdXRoL3NpZ251cGAsIG90aGVyVXNlcik7XHJcbiAgICAgIGNvbnN0IG90aGVyVXNlclRva2VuID0gb3RoZXJTaWdudXAuZGF0YS5kYXRhLnRva2VuO1xyXG4gICAgICBcclxuICAgICAgaWYgKCFuZnRGaWxlSWQpIHJldHVybjtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MuZGVsZXRlKGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvJHtuZnRGaWxlSWR9YCwge1xyXG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7b3RoZXJVc2VyVG9rZW59YCB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaG91bGQgaGF2ZSBmYWlsZWQnKTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgIGV4cGVjdChlcnJvci5yZXNwb25zZS5zdGF0dXMpLnRvQmUoNDA0KTtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2UuZGF0YS5lcnJvcikudG9Db250YWluKCdub3QgZm91bmQnKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBDcm9zcy11c2VyIGZpbGUgZGVsZXRpb24gcHJvcGVybHkgcHJldmVudGVkJyk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ0lQRlMgSW50ZWdyYXRpb24nLCAoKSA9PiB7XHJcbiAgICBcclxuICAgIGl0KCdzaG91bGQgaGFuZGxlIElQRlMgZ2F0ZXdheSBVUkxzIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcclxuICAgICAgaWYgKCFuZnRGaWxlSWQpIHJldHVybjtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MuZ2V0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvJHtuZnRGaWxlSWR9YCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgZmlsZSA9IHJlc3BvbnNlLmRhdGEuZGF0YTtcclxuICAgICAgZXhwZWN0KGZpbGUuaXBmc1VybCkudG9CZURlZmluZWQoKTtcclxuICAgICAgZXhwZWN0KGZpbGUuaXBmc0hhc2gpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBJUEZTIFVSTCBzaG91bGQgYmUgcHJvcGVybHkgZm9ybWF0dGVkXHJcbiAgICAgIGV4cGVjdChmaWxlLmlwZnNVcmwpLnRvTWF0Y2goL15odHRwczpcXC9cXC8uK1xcL2lwZnNcXC9bYS16QS1aMC05XSskLyk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIElQRlMgVVJMIGZvcm1hdHRpbmcgY29ycmVjdCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCB0cmFjayBJUEZTIHBpbm5pbmcgc3RhdHVzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBpZiAoIW5mdEZpbGVJZCkgcmV0dXJuO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy8ke25mdEZpbGVJZH1gLCB7XHJcbiAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7dGVzdFVzZXJUb2tlbn1gIH1cclxuICAgICAgfSk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmlzUGlubmVkVG9JUEZTKS50b0JlKHRydWUpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBJUEZTIHBpbm5pbmcgc3RhdHVzIHRyYWNrZWQnKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkZXNjcmliZSgnU2VydmljZSBIZWFsdGggJiBQZXJmb3JtYW5jZScsICgpID0+IHtcclxuICAgIFxyXG4gICAgaXQoJ3Nob3VsZCByZXNwb25kIHRvIGhlYWx0aCBjaGVjaycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7RklMRV9TRVJWSUNFX1VSTH0vaGVhbHRoYCk7XHJcbiAgICAgIFxyXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDIwMCk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XHJcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kYXRhLnNlcnZpY2UpLnRvQmUoJ2ZpbGUtc2VydmljZScpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ+KchSBGaWxlIHNlcnZpY2UgaGVhbHRoIGNoZWNrIHBhc3NlZCcpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgY29uY3VycmVudCBmaWxlIHVwbG9hZHMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHVwbG9hZFByb21pc2VzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogMyB9LCAoXywgaSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XHJcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdmaWxlJywgQnVmZmVyLmZyb20oYGNvbmN1cnJlbnQtdGVzdC0ke2l9YCksIHtcclxuICAgICAgICAgIGZpbGVuYW1lOiBgY29uY3VycmVudC0ke2l9LnR4dGAsXHJcbiAgICAgICAgICBjb250ZW50VHlwZTogJ3RleHQvcGxhaW4nXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdjYXRlZ29yeScsICd0ZXN0Jyk7XHJcblxyXG4gICAgICAgIHJldHVybiBheGlvcy5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvdXBsb2FkL3MzYCwgZm9ybURhdGEsIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCxcclxuICAgICAgICAgICAgLi4uZm9ybURhdGEuZ2V0SGVhZGVycygpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgcmVzcG9uc2VzID0gYXdhaXQgUHJvbWlzZS5hbGwodXBsb2FkUHJvbWlzZXMpO1xyXG4gICAgICBcclxuICAgICAgcmVzcG9uc2VzLmZvckVhY2goKHJlc3BvbnNlLCBpbmRleCkgPT4ge1xyXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5zdGF0dXMpLnRvQmUoMjAwKTtcclxuICAgICAgICBleHBlY3QocmVzcG9uc2UuZGF0YS5kYXRhLmZpbGUub3JpZ2luYWxOYW1lKS50b0JlKGBjb25jdXJyZW50LSR7aW5kZXh9LnR4dGApO1xyXG4gICAgICB9KTtcclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgQ29uY3VycmVudCBmaWxlIHVwbG9hZHMgaGFuZGxlZCBzdWNjZXNzZnVsbHknKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdzaG91bGQgbWFpbnRhaW4gcmVhc29uYWJsZSB1cGxvYWQgcmVzcG9uc2UgdGltZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ZpbGUnLCBCdWZmZXIuZnJvbSgncGVyZm9ybWFuY2UtdGVzdC1kYXRhJyksIHtcclxuICAgICAgICBmaWxlbmFtZTogJ3BlcmZvcm1hbmNlLXRlc3QudHh0JyxcclxuICAgICAgICBjb250ZW50VHlwZTogJ3RleHQvcGxhaW4nXHJcbiAgICAgIH0pO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2NhdGVnb3J5JywgJ3Rlc3QnKTtcclxuXHJcbiAgICAgIGF3YWl0IGF4aW9zLnBvc3QoYCR7QVBJX0dBVEVXQVlfVVJMfS9maWxlcy91cGxvYWQvczNgLCBmb3JtRGF0YSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAsXHJcbiAgICAgICAgICAuLi5mb3JtRGF0YS5nZXRIZWFkZXJzKClcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgY29uc3QgcmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcclxuICAgICAgZXhwZWN0KHJlc3BvbnNlVGltZSkudG9CZUxlc3NUaGFuKDUwMDApOyAvLyBTaG91bGQgY29tcGxldGUgd2l0aGluIDUgc2Vjb25kc1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coYOKchSBVcGxvYWQgcmVzcG9uc2UgdGltZTogJHtyZXNwb25zZVRpbWV9bXMgKGFjY2VwdGFibGUpYCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ0Vycm9yIEhhbmRsaW5nJywgKCkgPT4ge1xyXG4gICAgXHJcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBtaXNzaW5nIGZpbGUgaW4gdXBsb2FkJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gICAgICBmb3JtRGF0YS5hcHBlbmQoJ2NhdGVnb3J5JywgJ3Rlc3QnKTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgYXhpb3MucG9zdChgJHtBUElfR0FURVdBWV9VUkx9L2ZpbGVzL3VwbG9hZC9zM2AsIGZvcm1EYXRhLCB7XHJcbiAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAsXHJcbiAgICAgICAgICAgIC4uLmZvcm1EYXRhLmdldEhlYWRlcnMoKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwMCk7XHJcbiAgICAgICAgZXhwZWN0KGVycm9yLnJlc3BvbnNlLmRhdGEuZXJyb3IpLnRvQ29udGFpbignTm8gZmlsZSBwcm92aWRlZCcpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZygn4pyFIE1pc3NpbmcgZmlsZSBwcm9wZXJseSBoYW5kbGVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBpbnZhbGlkIGZpbGUgSURzJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGF4aW9zLmdldChgJHtBUElfR0FURVdBWV9VUkx9L2ZpbGVzL2ludmFsaWQtZmlsZS1pZC0xMjNgLCB7XHJcbiAgICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0ZXN0VXNlclRva2VufWAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU2hvdWxkIGhhdmUgZmFpbGVkJyk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IucmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwNCk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgSW52YWxpZCBmaWxlIElEcyBwcm9wZXJseSBoYW5kbGVkJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBuZXR3b3JrIGludGVycnVwdGlvbnMgZ3JhY2VmdWxseScsIGFzeW5jICgpID0+IHtcclxuICAgICAgLy8gVGVzdCB3aXRoIGEgdmVyeSBzbWFsbCB0aW1lb3V0IHRvIHNpbXVsYXRlIG5ldHdvcmsgaXNzdWVzXHJcbiAgICAgIGNvbnN0IGF4aW9zSW5zdGFuY2UgPSBheGlvcy5jcmVhdGUoeyB0aW1lb3V0OiAxIH0pO1xyXG4gICAgICBcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnZmlsZScsIEJ1ZmZlci5hbGxvYygxMDI0ICogMTAyNCksIHtcclxuICAgICAgICAgIGZpbGVuYW1lOiAndGltZW91dC10ZXN0LmJpbicsXHJcbiAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYXdhaXQgYXhpb3NJbnN0YW5jZS5wb3N0KGAke0FQSV9HQVRFV0FZX1VSTH0vZmlsZXMvdXBsb2FkL3MzYCwgZm9ybURhdGEsIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rlc3RVc2VyVG9rZW59YCxcclxuICAgICAgICAgICAgLi4uZm9ybURhdGEuZ2V0SGVhZGVycygpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICBleHBlY3QoZXJyb3IuY29kZSkudG9CZSgnRUNPTk5BQk9SVEVEJyk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgTmV0d29yayBpbnRlcnJ1cHRpb25zIGhhbmRsZWQgZ3JhY2VmdWxseScpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn0pOyJdfQ==