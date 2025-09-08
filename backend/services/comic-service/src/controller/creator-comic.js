import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "../config/db.js";
import { comics, comicPages, comicPurchases } from "../model/comic.js";
import axios from 'axios';
// Create new comic (creator only)
export const createComic = async (req, res) => {
    try {
        const creatorId = req.userId;
        const { title, description, author, artist, publisher, genre, price = 0, isFreemium = false, freePageCount = 0, coverFileId, isNFTEligible = false, metadata } = req.body;
        if (!creatorId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        // Validate required fields
        if (!title || !genre || !author) {
            return res.status(400).json({
                success: false,
                error: "Title, genre, and author are required",
                timestamp: new Date().toISOString()
            });
        }
        // TODO: Verify user is a creator by checking user service
        // For MVP, we'll trust the authentication
        // Get cover URL from file service if coverFileId is provided
        let coverUrl = null;
        if (coverFileId) {
            try {
                const fileServiceUrl = process.env.FILE_SERVICE_URL || 'http://file-service:3007';
                const fileResponse = await axios.get(`${fileServiceUrl}/api/files/${coverFileId}`, {
                    headers: { Authorization: req.headers.authorization }
                });
                coverUrl = fileResponse.data.data.cdnUrl || fileResponse.data.data.s3Url;
            }
            catch (error) {
                console.error("Error fetching cover file:", error);
            }
        }
        // Create comic
        const [comic] = await db
            .insert(comics)
            .values({
            creatorId,
            title,
            description,
            author,
            artist,
            publisher,
            genre,
            coverUrl,
            coverFileId,
            price: price.toString(),
            isFreemium,
            freePageCount,
            status: 'draft',
            isNFTEligible,
            metadata: metadata || {}
        })
            .returning();
        return res.status(201).json({
            success: true,
            data: comic,
            message: "Comic created successfully"
        });
    }
    catch (error) {
        console.error("Create comic error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Update comic (creator only)
export const updateComic = async (req, res) => {
    try {
        const creatorId = req.userId;
        const { id } = req.params;
        const { title, description, author, artist, publisher, genre, price, isFreemium, freePageCount, coverFileId, status, isNFTEligible, metadata } = req.body;
        if (!creatorId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        // Check if comic exists and belongs to creator
        const [existingComic] = await db
            .select()
            .from(comics)
            .where(and(eq(comics.id, id), eq(comics.creatorId, creatorId)));
        if (!existingComic) {
            return res.status(404).json({
                success: false,
                error: "Comic not found or not owned by creator",
                timestamp: new Date().toISOString()
            });
        }
        // Get cover URL from file service if coverFileId is provided and changed
        let coverUrl = existingComic.coverUrl;
        if (coverFileId && coverFileId !== existingComic.coverFileId) {
            try {
                const fileServiceUrl = process.env.FILE_SERVICE_URL || 'http://file-service:3007';
                const fileResponse = await axios.get(`${fileServiceUrl}/api/files/${coverFileId}`, {
                    headers: { Authorization: req.headers.authorization }
                });
                coverUrl = fileResponse.data.data.cdnUrl || fileResponse.data.data.s3Url;
            }
            catch (error) {
                console.error("Error fetching cover file:", error);
            }
        }
        // Build update data
        const updateData = { updatedAt: new Date() };
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (author !== undefined)
            updateData.author = author;
        if (artist !== undefined)
            updateData.artist = artist;
        if (publisher !== undefined)
            updateData.publisher = publisher;
        if (genre !== undefined)
            updateData.genre = genre;
        if (price !== undefined)
            updateData.price = price.toString();
        if (isFreemium !== undefined)
            updateData.isFreemium = isFreemium;
        if (freePageCount !== undefined)
            updateData.freePageCount = freePageCount;
        if (coverFileId !== undefined) {
            updateData.coverFileId = coverFileId;
            updateData.coverUrl = coverUrl;
        }
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'published' && !existingComic.publishedAt) {
                updateData.publishedAt = new Date();
            }
        }
        if (isNFTEligible !== undefined)
            updateData.isNFTEligible = isNFTEligible;
        if (metadata !== undefined)
            updateData.metadata = metadata;
        // Update comic
        const [updatedComic] = await db
            .update(comics)
            .set(updateData)
            .where(eq(comics.id, id))
            .returning();
        return res.status(200).json({
            success: true,
            data: updatedComic,
            message: "Comic updated successfully"
        });
    }
    catch (error) {
        console.error("Update comic error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Get creator's comics
export const getCreatorComics = async (req, res) => {
    try {
        const creatorId = req.userId;
        const { page = 1, limit = 20, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        if (!creatorId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        let whereConditions = [eq(comics.creatorId, creatorId), eq(comics.isActive, true)];
        if (status) {
            whereConditions.push(eq(comics.status, status));
        }
        const creatorComics = await db
            .select()
            .from(comics)
            .where(and(...whereConditions))
            .orderBy(desc(comics.createdAt))
            .limit(parseInt(limit))
            .offset(offset);
        return res.status(200).json({
            success: true,
            data: {
                comics: creatorComics,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: creatorComics.length === parseInt(limit)
                }
            },
            message: "Creator comics retrieved successfully"
        });
    }
    catch (error) {
        console.error("Get creator comics error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Add pages to comic
export const addComicPages = async (req, res) => {
    try {
        const creatorId = req.userId;
        const { id } = req.params;
        const { pages } = req.body; // Array of page data
        if (!creatorId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        if (!pages || !Array.isArray(pages) || pages.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Pages array is required",
                timestamp: new Date().toISOString()
            });
        }
        // Check if comic exists and belongs to creator
        const [comic] = await db
            .select()
            .from(comics)
            .where(and(eq(comics.id, id), eq(comics.creatorId, creatorId)));
        if (!comic) {
            return res.status(404).json({
                success: false,
                error: "Comic not found or not owned by creator",
                timestamp: new Date().toISOString()
            });
        }
        // Process pages and get file URLs
        const processedPages = [];
        for (const page of pages) {
            let imageUrl = page.imageUrl;
            // If fileId is provided, get URL from file service
            if (page.fileId && !page.imageUrl) {
                try {
                    const fileServiceUrl = process.env.FILE_SERVICE_URL || 'http://file-service:3007';
                    const fileResponse = await axios.get(`${fileServiceUrl}/api/files/${page.fileId}`, {
                        headers: { Authorization: req.headers.authorization }
                    });
                    imageUrl = fileResponse.data.data.cdnUrl || fileResponse.data.data.s3Url;
                }
                catch (error) {
                    console.error("Error fetching page file:", error);
                    continue; // Skip this page if file can't be retrieved
                }
            }
            if (!imageUrl) {
                continue; // Skip pages without valid image URL
            }
            processedPages.push({
                comicId: id,
                pageNumber: page.pageNumber,
                imageUrl,
                fileId: page.fileId || null,
                altText: page.altText || '',
                isPreview: page.isPreview || false,
                ipfsHash: page.ipfsHash || null,
                ipfsUrl: page.ipfsUrl || null,
            });
        }
        if (processedPages.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No valid pages to add",
                timestamp: new Date().toISOString()
            });
        }
        // Insert pages
        const insertedPages = await db
            .insert(comicPages)
            .values(processedPages)
            .returning();
        // Update comic total pages
        const maxPageNumber = Math.max(...processedPages.map(p => p.pageNumber));
        await db
            .update(comics)
            .set({
            totalPages: maxPageNumber,
            updatedAt: new Date(),
        })
            .where(eq(comics.id, id));
        return res.status(201).json({
            success: true,
            data: insertedPages,
            message: "Comic pages added successfully"
        });
    }
    catch (error) {
        console.error("Add comic pages error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Get comic pages (creator view)
export const getComicPages = async (req, res) => {
    try {
        const creatorId = req.userId;
        const { id } = req.params;
        if (!creatorId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        // Check if comic exists and belongs to creator
        const [comic] = await db
            .select()
            .from(comics)
            .where(and(eq(comics.id, id), eq(comics.creatorId, creatorId)));
        if (!comic) {
            return res.status(404).json({
                success: false,
                error: "Comic not found or not owned by creator",
                timestamp: new Date().toISOString()
            });
        }
        // Get all pages for this comic
        const pages = await db
            .select()
            .from(comicPages)
            .where(eq(comicPages.comicId, id))
            .orderBy(asc(comicPages.pageNumber));
        return res.status(200).json({
            success: true,
            data: {
                comic: {
                    id: comic.id,
                    title: comic.title,
                    totalPages: comic.totalPages,
                    status: comic.status,
                },
                pages
            },
            message: "Comic pages retrieved successfully"
        });
    }
    catch (error) {
        console.error("Get comic pages error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Delete comic (creator only)
export const deleteComic = async (req, res) => {
    try {
        const creatorId = req.userId;
        const { id } = req.params;
        if (!creatorId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        // Check if comic exists and belongs to creator
        const [comic] = await db
            .select()
            .from(comics)
            .where(and(eq(comics.id, id), eq(comics.creatorId, creatorId)));
        if (!comic) {
            return res.status(404).json({
                success: false,
                error: "Comic not found or not owned by creator",
                timestamp: new Date().toISOString()
            });
        }
        // Check if comic has any purchases (don't allow deletion if purchased)
        const purchases = await db
            .select()
            .from(comicPurchases)
            .where(eq(comicPurchases.comicId, id))
            .limit(1);
        if (purchases.length > 0) {
            return res.status(400).json({
                success: false,
                error: "Cannot delete comic with existing purchases. Archive it instead.",
                timestamp: new Date().toISOString()
            });
        }
        // Soft delete - mark as inactive
        await db
            .update(comics)
            .set({
            isActive: false,
            status: 'archived',
            updatedAt: new Date(),
        })
            .where(eq(comics.id, id));
        return res.status(200).json({
            success: true,
            message: "Comic deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete comic error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
// Get creator dashboard stats
export const getCreatorStats = async (req, res) => {
    try {
        const creatorId = req.userId;
        if (!creatorId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                timestamp: new Date().toISOString()
            });
        }
        // Get total comics count
        const totalComicsResult = await db
            .select()
            .from(comics)
            .where(and(eq(comics.creatorId, creatorId), eq(comics.isActive, true)));
        const totalComics = totalComicsResult.length;
        const publishedComics = totalComicsResult.filter(c => c.status === 'published').length;
        const draftComics = totalComicsResult.filter(c => c.status === 'draft').length;
        // Get total purchases across all comics
        const purchaseStats = await db
            .select()
            .from(comicPurchases)
            .innerJoin(comics, eq(comicPurchases.comicId, comics.id))
            .where(and(eq(comics.creatorId, creatorId), eq(comics.isActive, true)));
        const totalPurchases = purchaseStats.length;
        const totalRevenue = purchaseStats.reduce((sum, purchase) => sum + parseFloat(purchase.comic_purchases.purchasePrice), 0);
        return res.status(200).json({
            success: true,
            data: {
                totalComics,
                publishedComics,
                draftComics,
                totalPurchases,
                totalRevenue: totalRevenue.toFixed(2),
            },
            message: "Creator stats retrieved successfully"
        });
    }
    catch (error) {
        console.error("Get creator stats error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString()
        });
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRvci1jb21pYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNyZWF0b3ItY29taWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNqRCxPQUFPLEVBQUUsRUFBRSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDckMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDdkUsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBRTFCLGtDQUFrQztBQUNsQyxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsS0FBSyxFQUFFLEdBQVEsRUFBRSxHQUFRLEVBQUUsRUFBRTtJQUN0RCxJQUFJLENBQUM7UUFDSCxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO1FBQzdCLE1BQU0sRUFDSixLQUFLLEVBQ0wsV0FBVyxFQUNYLE1BQU0sRUFDTixNQUFNLEVBQ04sU0FBUyxFQUNULEtBQUssRUFDTCxLQUFLLEdBQUcsQ0FBQyxFQUNULFVBQVUsR0FBRyxLQUFLLEVBQ2xCLGFBQWEsR0FBRyxDQUFDLEVBQ2pCLFdBQVcsRUFDWCxhQUFhLEdBQUcsS0FBSyxFQUNyQixRQUFRLEVBQ1QsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBRWIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLHlCQUF5QjtnQkFDaEMsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2FBQ3BDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCwyQkFBMkI7UUFDM0IsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFD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WUFDRCxPQUFPLEVBQUUsc0NBQXNDO1NBQ2hELENBQUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlcSwgYW5kLCBkZXNjLCBhc2MgfSBmcm9tIFwiZHJpenpsZS1vcm1cIjtcclxuaW1wb3J0IHsgZGIgfSBmcm9tIFwiLi4vY29uZmlnL2RiLmpzXCI7XHJcbmltcG9ydCB7IGNvbWljcywgY29taWNQYWdlcywgY29taWNQdXJjaGFzZXMgfSBmcm9tIFwiLi4vbW9kZWwvY29taWMuanNcIjtcclxuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcclxuXHJcbi8vIENyZWF0ZSBuZXcgY29taWMgKGNyZWF0b3Igb25seSlcclxuZXhwb3J0IGNvbnN0IGNyZWF0ZUNvbWljID0gYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjcmVhdG9ySWQgPSByZXEudXNlcklkO1xyXG4gICAgY29uc3QgeyBcclxuICAgICAgdGl0bGUsIFxyXG4gICAgICBkZXNjcmlwdGlvbiwgXHJcbiAgICAgIGF1dGhvciwgXHJcbiAgICAgIGFydGlzdCwgXHJcbiAgICAgIHB1Ymxpc2hlciwgXHJcbiAgICAgIGdlbnJlLCBcclxuICAgICAgcHJpY2UgPSAwLCBcclxuICAgICAgaXNGcmVlbWl1bSA9IGZhbHNlLCBcclxuICAgICAgZnJlZVBhZ2VDb3VudCA9IDAsXHJcbiAgICAgIGNvdmVyRmlsZUlkLFxyXG4gICAgICBpc05GVEVsaWdpYmxlID0gZmFsc2UsXHJcbiAgICAgIG1ldGFkYXRhIFxyXG4gICAgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmICghY3JlYXRvcklkKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgZXJyb3I6IFwiQXV0aGVudGljYXRpb24gcmVxdWlyZWRcIixcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcclxuICAgIGlmICghdGl0bGUgfHwgIWdlbnJlIHx8ICFhdXRob3IpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJUaXRsZSwgZ2VucmUsIGFuZCBhdXRob3IgYXJlIHJlcXVpcmVkXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETzogVmVyaWZ5IHVzZXIgaXMgYSBjcmVhdG9yIGJ5IGNoZWNraW5nIHVzZXIgc2VydmljZVxyXG4gICAgLy8gRm9yIE1WUCwgd2UnbGwgdHJ1c3QgdGhlIGF1dGhlbnRpY2F0aW9uXHJcblxyXG4gICAgLy8gR2V0IGNvdmVyIFVSTCBmcm9tIGZpbGUgc2VydmljZSBpZiBjb3ZlckZpbGVJZCBpcyBwcm92aWRlZFxyXG4gICAgbGV0IGNvdmVyVXJsID0gbnVsbDtcclxuICAgIGlmIChjb3ZlckZpbGVJZCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGZpbGVTZXJ2aWNlVXJsID0gcHJvY2Vzcy5lbnYuRklMRV9TRVJWSUNFX1VSTCB8fCAnaHR0cDovL2ZpbGUtc2VydmljZTozMDA3JztcclxuICAgICAgICBjb25zdCBmaWxlUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7ZmlsZVNlcnZpY2VVcmx9L2FwaS9maWxlcy8ke2NvdmVyRmlsZUlkfWAsIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbiB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY292ZXJVcmwgPSBmaWxlUmVzcG9uc2UuZGF0YS5kYXRhLmNkblVybCB8fCBmaWxlUmVzcG9uc2UuZGF0YS5kYXRhLnMzVXJsO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmZXRjaGluZyBjb3ZlciBmaWxlOlwiLCBlcnJvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgY29taWNcclxuICAgIGNvbnN0IFtjb21pY10gPSBhd2FpdCBkYlxyXG4gICAgICAuaW5zZXJ0KGNvbWljcylcclxuICAgICAgLnZhbHVlcyh7XHJcbiAgICAgICAgY3JlYXRvcklkLFxyXG4gICAgICAgIHRpdGxlLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uLFxyXG4gICAgICAgIGF1dGhvcixcclxuICAgICAgICBhcnRpc3QsXHJcbiAgICAgICAgcHVibGlzaGVyLFxyXG4gICAgICAgIGdlbnJlLFxyXG4gICAgICAgIGNvdmVyVXJsLFxyXG4gICAgICAgIGNvdmVyRmlsZUlkLFxyXG4gICAgICAgIHByaWNlOiBwcmljZS50b1N0cmluZygpLFxyXG4gICAgICAgIGlzRnJlZW1pdW0sXHJcbiAgICAgICAgZnJlZVBhZ2VDb3VudCxcclxuICAgICAgICBzdGF0dXM6ICdkcmFmdCcsXHJcbiAgICAgICAgaXNORlRFbGlnaWJsZSxcclxuICAgICAgICBtZXRhZGF0YTogbWV0YWRhdGEgfHwge31cclxuICAgICAgfSlcclxuICAgICAgLnJldHVybmluZygpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IGNvbWljLFxyXG4gICAgICBtZXNzYWdlOiBcIkNvbWljIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5XCJcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJDcmVhdGUgY29taWMgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBlcnJvcjogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcclxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFVwZGF0ZSBjb21pYyAoY3JlYXRvciBvbmx5KVxyXG5leHBvcnQgY29uc3QgdXBkYXRlQ29taWMgPSBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNyZWF0b3JJZCA9IHJlcS51c2VySWQ7XHJcbiAgICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgY29uc3QgeyBcclxuICAgICAgdGl0bGUsIFxyXG4gICAgICBkZXNjcmlwdGlvbiwgXHJcbiAgICAgIGF1dGhvciwgXHJcbiAgICAgIGFydGlzdCwgXHJcbiAgICAgIHB1Ymxpc2hlciwgXHJcbiAgICAgIGdlbnJlLCBcclxuICAgICAgcHJpY2UsIFxyXG4gICAgICBpc0ZyZWVtaXVtLCBcclxuICAgICAgZnJlZVBhZ2VDb3VudCxcclxuICAgICAgY292ZXJGaWxlSWQsXHJcbiAgICAgIHN0YXR1cyxcclxuICAgICAgaXNORlRFbGlnaWJsZSxcclxuICAgICAgbWV0YWRhdGEgXHJcbiAgICB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgaWYgKCFjcmVhdG9ySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJBdXRoZW50aWNhdGlvbiByZXF1aXJlZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGNvbWljIGV4aXN0cyBhbmQgYmVsb25ncyB0byBjcmVhdG9yXHJcbiAgICBjb25zdCBbZXhpc3RpbmdDb21pY10gPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20oY29taWNzKVxyXG4gICAgICAud2hlcmUoYW5kKGVxKGNvbWljcy5pZCwgaWQpLCBlcShjb21pY3MuY3JlYXRvcklkLCBjcmVhdG9ySWQpKSk7XHJcblxyXG4gICAgaWYgKCFleGlzdGluZ0NvbWljKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgZXJyb3I6IFwiQ29taWMgbm90IGZvdW5kIG9yIG5vdCBvd25lZCBieSBjcmVhdG9yXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IGNvdmVyIFVSTCBmcm9tIGZpbGUgc2VydmljZSBpZiBjb3ZlckZpbGVJZCBpcyBwcm92aWRlZCBhbmQgY2hhbmdlZFxyXG4gICAgbGV0IGNvdmVyVXJsID0gZXhpc3RpbmdDb21pYy5jb3ZlclVybDtcclxuICAgIGlmIChjb3ZlckZpbGVJZCAmJiBjb3ZlckZpbGVJZCAhPT0gZXhpc3RpbmdDb21pYy5jb3ZlckZpbGVJZCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGZpbGVTZXJ2aWNlVXJsID0gcHJvY2Vzcy5lbnYuRklMRV9TRVJWSUNFX1VSTCB8fCAnaHR0cDovL2ZpbGUtc2VydmljZTozMDA3JztcclxuICAgICAgICBjb25zdCBmaWxlUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoYCR7ZmlsZVNlcnZpY2VVcmx9L2FwaS9maWxlcy8ke2NvdmVyRmlsZUlkfWAsIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbiB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY292ZXJVcmwgPSBmaWxlUmVzcG9uc2UuZGF0YS5kYXRhLmNkblVybCB8fCBmaWxlUmVzcG9uc2UuZGF0YS5kYXRhLnMzVXJsO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmZXRjaGluZyBjb3ZlciBmaWxlOlwiLCBlcnJvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBCdWlsZCB1cGRhdGUgZGF0YVxyXG4gICAgY29uc3QgdXBkYXRlRGF0YTogYW55ID0geyB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkgfTtcclxuICAgIGlmICh0aXRsZSAhPT0gdW5kZWZpbmVkKSB1cGRhdGVEYXRhLnRpdGxlID0gdGl0bGU7XHJcbiAgICBpZiAoZGVzY3JpcHRpb24gIT09IHVuZGVmaW5lZCkgdXBkYXRlRGF0YS5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xyXG4gICAgaWYgKGF1dGhvciAhPT0gdW5kZWZpbmVkKSB1cGRhdGVEYXRhLmF1dGhvciA9IGF1dGhvcjtcclxuICAgIGlmIChhcnRpc3QgIT09IHVuZGVmaW5lZCkgdXBkYXRlRGF0YS5hcnRpc3QgPSBhcnRpc3Q7XHJcbiAgICBpZiAocHVibGlzaGVyICE9PSB1bmRlZmluZWQpIHVwZGF0ZURhdGEucHVibGlzaGVyID0gcHVibGlzaGVyO1xyXG4gICAgaWYgKGdlbnJlICE9PSB1bmRlZmluZWQpIHVwZGF0ZURhdGEuZ2VucmUgPSBnZW5yZTtcclxuICAgIGlmIChwcmljZSAhPT0gdW5kZWZpbmVkKSB1cGRhdGVEYXRhLnByaWNlID0gcHJpY2UudG9TdHJpbmcoKTtcclxuICAgIGlmIChpc0ZyZWVtaXVtICE9PSB1bmRlZmluZWQpIHVwZGF0ZURhdGEuaXNGcmVlbWl1bSA9IGlzRnJlZW1pdW07XHJcbiAgICBpZiAoZnJlZVBhZ2VDb3VudCAhPT0gdW5kZWZpbmVkKSB1cGRhdGVEYXRhLmZyZWVQYWdlQ291bnQgPSBmcmVlUGFnZUNvdW50O1xyXG4gICAgaWYgKGNvdmVyRmlsZUlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdXBkYXRlRGF0YS5jb3ZlckZpbGVJZCA9IGNvdmVyRmlsZUlkO1xyXG4gICAgICB1cGRhdGVEYXRhLmNvdmVyVXJsID0gY292ZXJVcmw7XHJcbiAgICB9XHJcbiAgICBpZiAoc3RhdHVzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdXBkYXRlRGF0YS5zdGF0dXMgPSBzdGF0dXM7XHJcbiAgICAgIGlmIChzdGF0dXMgPT09ICdwdWJsaXNoZWQnICYmICFleGlzdGluZ0NvbWljLnB1Ymxpc2hlZEF0KSB7XHJcbiAgICAgICAgdXBkYXRlRGF0YS5wdWJsaXNoZWRBdCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChpc05GVEVsaWdpYmxlICE9PSB1bmRlZmluZWQpIHVwZGF0ZURhdGEuaXNORlRFbGlnaWJsZSA9IGlzTkZURWxpZ2libGU7XHJcbiAgICBpZiAobWV0YWRhdGEgIT09IHVuZGVmaW5lZCkgdXBkYXRlRGF0YS5tZXRhZGF0YSA9IG1ldGFkYXRhO1xyXG5cclxuICAgIC8vIFVwZGF0ZSBjb21pY1xyXG4gICAgY29uc3QgW3VwZGF0ZWRDb21pY10gPSBhd2FpdCBkYlxyXG4gICAgICAudXBkYXRlKGNvbWljcylcclxuICAgICAgLnNldCh1cGRhdGVEYXRhKVxyXG4gICAgICAud2hlcmUoZXEoY29taWNzLmlkLCBpZCkpXHJcbiAgICAgIC5yZXR1cm5pbmcoKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiB1cGRhdGVkQ29taWMsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ29taWMgdXBkYXRlZCBzdWNjZXNzZnVsbHlcIlxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgY29uc29sZS5lcnJvcihcIlVwZGF0ZSBjb21pYyBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLFxyXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gR2V0IGNyZWF0b3IncyBjb21pY3NcclxuZXhwb3J0IGNvbnN0IGdldENyZWF0b3JDb21pY3MgPSBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNyZWF0b3JJZCA9IHJlcS51c2VySWQ7XHJcbiAgICBjb25zdCB7IHBhZ2UgPSAxLCBsaW1pdCA9IDIwLCBzdGF0dXMgfSA9IHJlcS5xdWVyeTtcclxuICAgIGNvbnN0IG9mZnNldCA9IChwYXJzZUludChwYWdlKSAtIDEpICogcGFyc2VJbnQobGltaXQpO1xyXG5cclxuICAgIGlmICghY3JlYXRvcklkKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgZXJyb3I6IFwiQXV0aGVudGljYXRpb24gcmVxdWlyZWRcIixcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgd2hlcmVDb25kaXRpb25zID0gW2VxKGNvbWljcy5jcmVhdG9ySWQsIGNyZWF0b3JJZCksIGVxKGNvbWljcy5pc0FjdGl2ZSwgdHJ1ZSldO1xyXG4gICAgXHJcbiAgICBpZiAoc3RhdHVzKSB7XHJcbiAgICAgIHdoZXJlQ29uZGl0aW9ucy5wdXNoKGVxKGNvbWljcy5zdGF0dXMsIHN0YXR1cykpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNyZWF0b3JDb21pY3MgPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20oY29taWNzKVxyXG4gICAgICAud2hlcmUoYW5kKC4uLndoZXJlQ29uZGl0aW9ucykpXHJcbiAgICAgIC5vcmRlckJ5KGRlc2MoY29taWNzLmNyZWF0ZWRBdCkpXHJcbiAgICAgIC5saW1pdChwYXJzZUludChsaW1pdCkpXHJcbiAgICAgIC5vZmZzZXQob2Zmc2V0KTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgY29taWNzOiBjcmVhdG9yQ29taWNzLFxyXG4gICAgICAgIHBhZ2luYXRpb246IHtcclxuICAgICAgICAgIHBhZ2U6IHBhcnNlSW50KHBhZ2UpLFxyXG4gICAgICAgICAgbGltaXQ6IHBhcnNlSW50KGxpbWl0KSxcclxuICAgICAgICAgIGhhc01vcmU6IGNyZWF0b3JDb21pY3MubGVuZ3RoID09PSBwYXJzZUludChsaW1pdClcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ3JlYXRvciBjb21pY3MgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseVwiXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiR2V0IGNyZWF0b3IgY29taWNzIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBBZGQgcGFnZXMgdG8gY29taWNcclxuZXhwb3J0IGNvbnN0IGFkZENvbWljUGFnZXMgPSBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNyZWF0b3JJZCA9IHJlcS51c2VySWQ7XHJcbiAgICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gcmVxLmJvZHk7IC8vIEFycmF5IG9mIHBhZ2UgZGF0YVxyXG5cclxuICAgIGlmICghY3JlYXRvcklkKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuanNvbih7XHJcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgZXJyb3I6IFwiQXV0aGVudGljYXRpb24gcmVxdWlyZWRcIixcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXBhZ2VzIHx8ICFBcnJheS5pc0FycmF5KHBhZ2VzKSB8fCBwYWdlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJQYWdlcyBhcnJheSBpcyByZXF1aXJlZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGNvbWljIGV4aXN0cyBhbmQgYmVsb25ncyB0byBjcmVhdG9yXHJcbiAgICBjb25zdCBbY29taWNdID0gYXdhaXQgZGJcclxuICAgICAgLnNlbGVjdCgpXHJcbiAgICAgIC5mcm9tKGNvbWljcylcclxuICAgICAgLndoZXJlKGFuZChlcShjb21pY3MuaWQsIGlkKSwgZXEoY29taWNzLmNyZWF0b3JJZCwgY3JlYXRvcklkKSkpO1xyXG5cclxuICAgIGlmICghY29taWMpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJDb21pYyBub3QgZm91bmQgb3Igbm90IG93bmVkIGJ5IGNyZWF0b3JcIixcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQcm9jZXNzIHBhZ2VzIGFuZCBnZXQgZmlsZSBVUkxzXHJcbiAgICBjb25zdCBwcm9jZXNzZWRQYWdlcyA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBwYWdlIG9mIHBhZ2VzKSB7XHJcbiAgICAgIGxldCBpbWFnZVVybCA9IHBhZ2UuaW1hZ2VVcmw7XHJcbiAgICAgIFxyXG4gICAgICAvLyBJZiBmaWxlSWQgaXMgcHJvdmlkZWQsIGdldCBVUkwgZnJvbSBmaWxlIHNlcnZpY2VcclxuICAgICAgaWYgKHBhZ2UuZmlsZUlkICYmICFwYWdlLmltYWdlVXJsKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IGZpbGVTZXJ2aWNlVXJsID0gcHJvY2Vzcy5lbnYuRklMRV9TRVJWSUNFX1VSTCB8fCAnaHR0cDovL2ZpbGUtc2VydmljZTozMDA3JztcclxuICAgICAgICAgIGNvbnN0IGZpbGVSZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChgJHtmaWxlU2VydmljZVVybH0vYXBpL2ZpbGVzLyR7cGFnZS5maWxlSWR9YCwge1xyXG4gICAgICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb24gfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBpbWFnZVVybCA9IGZpbGVSZXNwb25zZS5kYXRhLmRhdGEuY2RuVXJsIHx8IGZpbGVSZXNwb25zZS5kYXRhLmRhdGEuczNVcmw7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmZXRjaGluZyBwYWdlIGZpbGU6XCIsIGVycm9yKTtcclxuICAgICAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHRoaXMgcGFnZSBpZiBmaWxlIGNhbid0IGJlIHJldHJpZXZlZFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFpbWFnZVVybCkge1xyXG4gICAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHBhZ2VzIHdpdGhvdXQgdmFsaWQgaW1hZ2UgVVJMXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHByb2Nlc3NlZFBhZ2VzLnB1c2goe1xyXG4gICAgICAgIGNvbWljSWQ6IGlkLFxyXG4gICAgICAgIHBhZ2VOdW1iZXI6IHBhZ2UucGFnZU51bWJlcixcclxuICAgICAgICBpbWFnZVVybCxcclxuICAgICAgICBmaWxlSWQ6IHBhZ2UuZmlsZUlkIHx8IG51bGwsXHJcbiAgICAgICAgYWx0VGV4dDogcGFnZS5hbHRUZXh0IHx8ICcnLFxyXG4gICAgICAgIGlzUHJldmlldzogcGFnZS5pc1ByZXZpZXcgfHwgZmFsc2UsXHJcbiAgICAgICAgaXBmc0hhc2g6IHBhZ2UuaXBmc0hhc2ggfHwgbnVsbCxcclxuICAgICAgICBpcGZzVXJsOiBwYWdlLmlwZnNVcmwgfHwgbnVsbCxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHByb2Nlc3NlZFBhZ2VzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiBcIk5vIHZhbGlkIHBhZ2VzIHRvIGFkZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEluc2VydCBwYWdlc1xyXG4gICAgY29uc3QgaW5zZXJ0ZWRQYWdlcyA9IGF3YWl0IGRiXHJcbiAgICAgIC5pbnNlcnQoY29taWNQYWdlcylcclxuICAgICAgLnZhbHVlcyhwcm9jZXNzZWRQYWdlcylcclxuICAgICAgLnJldHVybmluZygpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSBjb21pYyB0b3RhbCBwYWdlc1xyXG4gICAgY29uc3QgbWF4UGFnZU51bWJlciA9IE1hdGgubWF4KC4uLnByb2Nlc3NlZFBhZ2VzLm1hcChwID0+IHAucGFnZU51bWJlcikpO1xyXG4gICAgYXdhaXQgZGJcclxuICAgICAgLnVwZGF0ZShjb21pY3MpXHJcbiAgICAgIC5zZXQoe1xyXG4gICAgICAgIHRvdGFsUGFnZXM6IG1heFBhZ2VOdW1iZXIsXHJcbiAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxyXG4gICAgICB9KVxyXG4gICAgICAud2hlcmUoZXEoY29taWNzLmlkLCBpZCkpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIGRhdGE6IGluc2VydGVkUGFnZXMsXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ29taWMgcGFnZXMgYWRkZWQgc3VjY2Vzc2Z1bGx5XCJcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJBZGQgY29taWMgcGFnZXMgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBlcnJvcjogXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcclxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEdldCBjb21pYyBwYWdlcyAoY3JlYXRvciB2aWV3KVxyXG5leHBvcnQgY29uc3QgZ2V0Q29taWNQYWdlcyA9IGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgY3JlYXRvcklkID0gcmVxLnVzZXJJZDtcclxuICAgIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XHJcblxyXG4gICAgaWYgKCFjcmVhdG9ySWQpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJBdXRoZW50aWNhdGlvbiByZXF1aXJlZFwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGNvbWljIGV4aXN0cyBhbmQgYmVsb25ncyB0byBjcmVhdG9yXHJcbiAgICBjb25zdCBbY29taWNdID0gYXdhaXQgZGJcclxuICAgICAgLnNlbGVjdCgpXHJcbiAgICAgIC5mcm9tKGNvbWljcylcclxuICAgICAgLndoZXJlKGFuZChlcShjb21pY3MuaWQsIGlkKSwgZXEoY29taWNzLmNyZWF0b3JJZCwgY3JlYXRvcklkKSkpO1xyXG5cclxuICAgIGlmICghY29taWMpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJDb21pYyBub3QgZm91bmQgb3Igbm90IG93bmVkIGJ5IGNyZWF0b3JcIixcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgYWxsIHBhZ2VzIGZvciB0aGlzIGNvbWljXHJcbiAgICBjb25zdCBwYWdlcyA9IGF3YWl0IGRiXHJcbiAgICAgIC5zZWxlY3QoKVxyXG4gICAgICAuZnJvbShjb21pY1BhZ2VzKVxyXG4gICAgICAud2hlcmUoZXEoY29taWNQYWdlcy5jb21pY0lkLCBpZCkpXHJcbiAgICAgIC5vcmRlckJ5KGFzYyhjb21pY1BhZ2VzLnBhZ2VOdW1iZXIpKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgY29taWM6IHtcclxuICAgICAgICAgIGlkOiBjb21pYy5pZCxcclxuICAgICAgICAgIHRpdGxlOiBjb21pYy50aXRsZSxcclxuICAgICAgICAgIHRvdGFsUGFnZXM6IGNvbWljLnRvdGFsUGFnZXMsXHJcbiAgICAgICAgICBzdGF0dXM6IGNvbWljLnN0YXR1cyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBhZ2VzXHJcbiAgICAgIH0sXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ29taWMgcGFnZXMgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseVwiXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiR2V0IGNvbWljIHBhZ2VzIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBEZWxldGUgY29taWMgKGNyZWF0b3Igb25seSlcclxuZXhwb3J0IGNvbnN0IGRlbGV0ZUNvbWljID0gYXN5bmMgKHJlcTogYW55LCByZXM6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjcmVhdG9ySWQgPSByZXEudXNlcklkO1xyXG4gICAgY29uc3QgeyBpZCB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgICBpZiAoIWNyZWF0b3JJZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiBcIkF1dGhlbnRpY2F0aW9uIHJlcXVpcmVkXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgY29taWMgZXhpc3RzIGFuZCBiZWxvbmdzIHRvIGNyZWF0b3JcclxuICAgIGNvbnN0IFtjb21pY10gPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20oY29taWNzKVxyXG4gICAgICAud2hlcmUoYW5kKGVxKGNvbWljcy5pZCwgaWQpLCBlcShjb21pY3MuY3JlYXRvcklkLCBjcmVhdG9ySWQpKSk7XHJcblxyXG4gICAgaWYgKCFjb21pYykge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiBcIkNvbWljIG5vdCBmb3VuZCBvciBub3Qgb3duZWQgYnkgY3JlYXRvclwiLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGNvbWljIGhhcyBhbnkgcHVyY2hhc2VzIChkb24ndCBhbGxvdyBkZWxldGlvbiBpZiBwdXJjaGFzZWQpXHJcbiAgICBjb25zdCBwdXJjaGFzZXMgPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20oY29taWNQdXJjaGFzZXMpXHJcbiAgICAgIC53aGVyZShlcShjb21pY1B1cmNoYXNlcy5jb21pY0lkLCBpZCkpXHJcbiAgICAgIC5saW1pdCgxKTtcclxuXHJcbiAgICBpZiAocHVyY2hhc2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBlcnJvcjogXCJDYW5ub3QgZGVsZXRlIGNvbWljIHdpdGggZXhpc3RpbmcgcHVyY2hhc2VzLiBBcmNoaXZlIGl0IGluc3RlYWQuXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU29mdCBkZWxldGUgLSBtYXJrIGFzIGluYWN0aXZlXHJcbiAgICBhd2FpdCBkYlxyXG4gICAgICAudXBkYXRlKGNvbWljcylcclxuICAgICAgLnNldCh7XHJcbiAgICAgICAgaXNBY3RpdmU6IGZhbHNlLFxyXG4gICAgICAgIHN0YXR1czogJ2FyY2hpdmVkJyxcclxuICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgIH0pXHJcbiAgICAgIC53aGVyZShlcShjb21pY3MuaWQsIGlkKSk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZTogXCJDb21pYyBkZWxldGVkIHN1Y2Nlc3NmdWxseVwiXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiRGVsZXRlIGNvbWljIGVycm9yOlwiLCBlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsXHJcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBHZXQgY3JlYXRvciBkYXNoYm9hcmQgc3RhdHNcclxuZXhwb3J0IGNvbnN0IGdldENyZWF0b3JTdGF0cyA9IGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgY3JlYXRvcklkID0gcmVxLnVzZXJJZDtcclxuXHJcbiAgICBpZiAoIWNyZWF0b3JJZCkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xyXG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiBcIkF1dGhlbnRpY2F0aW9uIHJlcXVpcmVkXCIsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHRvdGFsIGNvbWljcyBjb3VudFxyXG4gICAgY29uc3QgdG90YWxDb21pY3NSZXN1bHQgPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20oY29taWNzKVxyXG4gICAgICAud2hlcmUoYW5kKGVxKGNvbWljcy5jcmVhdG9ySWQsIGNyZWF0b3JJZCksIGVxKGNvbWljcy5pc0FjdGl2ZSwgdHJ1ZSkpKTtcclxuXHJcbiAgICBjb25zdCB0b3RhbENvbWljcyA9IHRvdGFsQ29taWNzUmVzdWx0Lmxlbmd0aDtcclxuICAgIGNvbnN0IHB1Ymxpc2hlZENvbWljcyA9IHRvdGFsQ29taWNzUmVzdWx0LmZpbHRlcihjID0+IGMuc3RhdHVzID09PSAncHVibGlzaGVkJykubGVuZ3RoO1xyXG4gICAgY29uc3QgZHJhZnRDb21pY3MgPSB0b3RhbENvbWljc1Jlc3VsdC5maWx0ZXIoYyA9PiBjLnN0YXR1cyA9PT0gJ2RyYWZ0JykubGVuZ3RoO1xyXG5cclxuICAgIC8vIEdldCB0b3RhbCBwdXJjaGFzZXMgYWNyb3NzIGFsbCBjb21pY3NcclxuICAgIGNvbnN0IHB1cmNoYXNlU3RhdHMgPSBhd2FpdCBkYlxyXG4gICAgICAuc2VsZWN0KClcclxuICAgICAgLmZyb20oY29taWNQdXJjaGFzZXMpXHJcbiAgICAgIC5pbm5lckpvaW4oY29taWNzLCBlcShjb21pY1B1cmNoYXNlcy5jb21pY0lkLCBjb21pY3MuaWQpKVxyXG4gICAgICAud2hlcmUoYW5kKGVxKGNvbWljcy5jcmVhdG9ySWQsIGNyZWF0b3JJZCksIGVxKGNvbWljcy5pc0FjdGl2ZSwgdHJ1ZSkpKTtcclxuXHJcbiAgICBjb25zdCB0b3RhbFB1cmNoYXNlcyA9IHB1cmNoYXNlU3RhdHMubGVuZ3RoO1xyXG4gICAgY29uc3QgdG90YWxSZXZlbnVlID0gcHVyY2hhc2VTdGF0cy5yZWR1Y2UoKHN1bSwgcHVyY2hhc2UpID0+IFxyXG4gICAgICBzdW0gKyBwYXJzZUZsb2F0KHB1cmNoYXNlLmNvbWljX3B1cmNoYXNlcy5wdXJjaGFzZVByaWNlKSwgMFxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgdG90YWxDb21pY3MsXHJcbiAgICAgICAgcHVibGlzaGVkQ29taWNzLFxyXG4gICAgICAgIGRyYWZ0Q29taWNzLFxyXG4gICAgICAgIHRvdGFsUHVyY2hhc2VzLFxyXG4gICAgICAgIHRvdGFsUmV2ZW51ZTogdG90YWxSZXZlbnVlLnRvRml4ZWQoMiksXHJcbiAgICAgIH0sXHJcbiAgICAgIG1lc3NhZ2U6IFwiQ3JlYXRvciBzdGF0cyByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5XCJcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJHZXQgY3JlYXRvciBzdGF0cyBlcnJvcjpcIiwgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgIGVycm9yOiBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLFxyXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgfSk7XHJcbiAgfVxyXG59OyJdfQ==