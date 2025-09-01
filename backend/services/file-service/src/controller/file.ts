import { eq, and, desc } from "drizzle-orm";
import { db } from "../config/db.js";
import { files, fileProcessingJobs } from "../model/file.js";
import AWSS3Service from "../services/aws-s3.service.js";
import PinataService from "../services/pinata.service.js";
import multer from 'multer';

// Initialize services
const s3Service = new AWSS3Service({
  region: process.env.AWS_REGION || 'eu-west-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  bucketName: process.env.AWS_S3_BUCKET || '',
  cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
});

const pinataService = new PinataService({
  apiKey: process.env.PINATA_API_KEY || '',
  apiSecret: process.env.PINATA_API_SECRET || '',
  baseUrl: process.env.PINATA_BASE_URL || 'https://api.pinata.cloud',
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and other comic-related files
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/zip', 'application/json',
      'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// Upload file to AWS S3 (standard storage)
export const uploadToS3 = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { category = 'general', purpose = 'storage', isPublic = false, referenceId, referenceType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file provided",
        timestamp: new Date().toISOString()
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    const file = req.file;
    const s3Key = s3Service.generateKey(category, file.originalname, userId);
    
    // Upload to S3
    const s3Result = await s3Service.uploadFile(
      file.buffer, 
      s3Key, 
      file.mimetype,
      {
        metadata: {
          userId,
          category,
          purpose,
          originalName: file.originalname,
        },
        acl: isPublic ? 'public-read' : 'private'
      }
    );

    // Save file record to database
    const [savedFile] = await db
      .insert(files)
      .values({
        userId,
        filename: s3Key.split('/').pop() || file.originalname,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        s3Key,
        s3Bucket: s3Result.bucket,
        s3Url: s3Result.location,
        cdnUrl: s3Result.cdnUrl,
        category,
        purpose,
        referenceId,
        referenceType,
        isPublic: Boolean(isPublic),
        uploadSource: 'web',
        metadata: {
          contentType: file.mimetype,
          uploadedAt: new Date().toISOString(),
        }
      })
      .returning();

    return res.status(200).json({
      success: true,
      data: {
        file: savedFile,
        s3Result
      },
      message: "File uploaded to S3 successfully"
    });
  } catch (error: any) {
    console.error("Upload to S3 error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Upload file to both S3 and IPFS for NFT minting
export const uploadForNFT = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { category = 'nft-asset', nftMetadata, referenceId, referenceType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file provided",
        timestamp: new Date().toISOString()
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    const file = req.file;
    const s3Key = s3Service.generateKey(category, file.originalname, userId);

    // Upload to S3 first (for app usage)
    const s3Result = await s3Service.uploadFile(
      file.buffer, 
      s3Key, 
      file.mimetype,
      {
        metadata: {
          userId,
          category,
          purpose: 'nft-minting',
          originalName: file.originalname,
        },
        acl: 'public-read'
      }
    );

    // Upload to IPFS via Pinata (for NFT)
    const pinataResult = await pinataService.uploadFile(
      file.buffer,
      file.originalname,
      {
        metadata: {
          userId,
          category,
          purpose: 'nft-asset',
          referenceId,
          referenceType,
          ...nftMetadata
        }
      }
    );

    const ipfsUrl = pinataService.getGatewayUrl(pinataResult.IpfsHash, true);

    // Save file record to database
    const [savedFile] = await db
      .insert(files)
      .values({
        userId,
        filename: s3Key.split('/').pop() || file.originalname,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        s3Key,
        s3Bucket: s3Result.bucket,
        s3Url: s3Result.location,
        cdnUrl: s3Result.cdnUrl,
        ipfsHash: pinataResult.IpfsHash,
        ipfsUrl,
        isPinnedToIPFS: true,
        category,
        purpose: 'nft-minting',
        referenceId,
        referenceType,
        isPublic: true,
        uploadSource: 'web',
        metadata: {
          contentType: file.mimetype,
          uploadedAt: new Date().toISOString(),
          ipfsTimestamp: pinataResult.Timestamp,
          ipfsPinSize: pinataResult.PinSize,
          nftMetadata: nftMetadata
        }
      })
      .returning();

    return res.status(200).json({
      success: true,
      data: {
        file: savedFile,
        s3Result,
        ipfsResult: {
          hash: pinataResult.IpfsHash,
          url: ipfsUrl,
          pinSize: pinataResult.PinSize,
          timestamp: pinataResult.Timestamp,
        }
      },
      message: "File uploaded to S3 and IPFS successfully"
    });
  } catch (error: any) {
    console.error("Upload for NFT error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Get presigned upload URL for direct S3 uploads
export const getPresignedUploadUrl = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { filename, contentType, category = 'general', purpose = 'storage' } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        error: "Filename and content type are required",
        timestamp: new Date().toISOString()
      });
    }

    const s3Key = s3Service.generateKey(category, filename, userId);
    const presignedUrl = await s3Service.getPresignedUploadUrl(s3Key, contentType);

    return res.status(200).json({
      success: true,
      data: {
        ...presignedUrl,
        s3Key,
        cdnUrl: s3Service.getPublicUrl(s3Key)
      },
      message: "Presigned upload URL generated successfully"
    });
  } catch (error: any) {
    console.error("Get presigned upload URL error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Get user files
export const getUserFiles = async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const { category, purpose, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    let whereConditions = [eq(files.userId, userId), eq(files.isActive, true)];
    
    if (category) {
      whereConditions.push(eq(files.category, category));
    }
    
    if (purpose) {
      whereConditions.push(eq(files.purpose, purpose));
    }

    const userFiles = await db
      .select()
      .from(files)
      .where(and(...whereConditions))
      .orderBy(desc(files.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    return res.status(200).json({
      success: true,
      data: {
        files: userFiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: userFiles.length === parseInt(limit)
        }
      },
      message: "User files retrieved successfully"
    });
  } catch (error: any) {
    console.error("Get user files error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Get file by ID
export const getFile = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.isActive, true)));

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
        timestamp: new Date().toISOString()
      });
    }

    // Check access permissions
    if (!file.isPublic && file.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: file,
      message: "File retrieved successfully"
    });
  } catch (error: any) {
    console.error("Get file error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Delete file
export const deleteFile = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        timestamp: new Date().toISOString()
      });
    }

    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.userId, userId), eq(files.isActive, true)));

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
        timestamp: new Date().toISOString()
      });
    }

    // Delete from S3 if exists
    if (file.s3Key) {
      try {
        await s3Service.deleteFile(file.s3Key);
      } catch (error) {
        console.error("S3 delete error (continuing):", error);
      }
    }

    // Unpin from IPFS if exists
    if (file.ipfsHash && file.isPinnedToIPFS) {
      try {
        await pinataService.unpinFile(file.ipfsHash);
      } catch (error) {
        console.error("IPFS unpin error (continuing):", error);
      }
    }

    // Mark file as inactive
    await db
      .update(files)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(files.id, id));

    return res.status(200).json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error: any) {
    console.error("Delete file error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};