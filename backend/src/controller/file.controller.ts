import { Request, Response } from "express";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "nerdwork-comics";
const CLOUDFRONT_DOMAIN =
  process.env.CLOUDFRONT_DOMAIN || "d3q14soxsgunx0.cloudfront.net";
const CLOUDFRONT_URL = `https://${CLOUDFRONT_DOMAIN}`;

// Helper function to convert S3 key to CloudFront URL
const getCloudFrontUrl = (s3Key: string): string => {
  return `${CLOUDFRONT_URL}/${s3Key}`;
};

// Helper function to generate cache-busting CloudFront URL
const getCloudFrontUrlWithCacheBusting = (s3Key: string): string => {
  const timestamp = Date.now();
  return `${CLOUDFRONT_URL}/${s3Key}?v=${timestamp}`;
};

// Multer configuration for memory storage (files will be uploaded to S3)
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for comics
    files: 20, // Maximum 20 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf", // For comic PDFs
      "application/zip", // For comic archives
      "application/x-zip-compressed",
      "application/x-rar-compressed", // RAR archives
      "application/vnd.comicbook+zip", // CBZ format
      "application/vnd.comicbook-rar", // CBR format
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, PDFs, and comic archives (ZIP, RAR, CBZ, CBR) are allowed."
        )
      );
    }
  },
});

// Helper function to generate S3 key with proper structure
const generateS3Key = (
  userId: string,
  filename: string,
  comicId?: string
): string => {
  const fileExtension = filename.split(".").pop()?.toLowerCase();
  const uniqueId = uuidv4();
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  if (comicId) {
    return `comics/${userId}/${comicId}/${timestamp}-${uniqueId}.${fileExtension}`;
  }
  return `comics/${userId}/${timestamp}-${uniqueId}.${fileExtension}`;
};

// Upload single comic file to S3
export const uploadComicFile = async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const {
      userId,
      title,
      description,
      genre,
      author,
      comicId,
      isPublic = false,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const s3Key = generateS3Key(userId, req.file.originalname, comicId);

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: "public, max-age=31536000", // 1 year cache for comics
      Metadata: {
        userId,
        title: title || req.file.originalname,
        description: description || "",
        genre: genre || "comic",
        author: author || "unknown",
        comicId: comicId || "",
        isPublic: isPublic.toString(),
        uploadDate: new Date().toISOString(),
        originalFileName: req.file.originalname,
      },
    };

    // Set public read if file is public
    if (isPublic === "true" || isPublic === true) {
      uploadParams["ACL"] = "public-read";
    }

    const parallelUploads3 = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    const result = await parallelUploads3.done();

    // Generate CloudFront URL (primary access method)
    const cloudFrontUrl = getCloudFrontUrl(s3Key);

    // Generate signed URL as fallback (for private files)
    let signedUrl = null;
    if (isPublic !== "true" && isPublic !== true) {
      signedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }),
        { expiresIn: 3600 }
      );
    }

    res.json({
      success: true,
      message: "Comic file uploaded successfully",
      data: {
        s3Key,
        s3Location: result.Location,
        cloudFrontUrl, // Primary URL for serving content
        signedUrl, // Fallback for private content
        bucket: BUCKET_NAME,
        isPublic: isPublic === "true" || isPublic === true,
        metadata: {
          userId,
          comicId: comicId || null,
          title: title || req.file.originalname,
          description: description || "",
          genre: genre || "comic",
          author: author || "unknown",
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          originalName: req.file.originalname,
          uploadDate: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Failed to upload comic file",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Upload multiple comic files to S3
export const uploadMultipleComicFiles = async (req: any, res: any) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const {
      userId,
      title,
      description,
      genre,
      author,
      comicId,
      isPublic = false,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const uploadPromises = req.files.map(async (file, index) => {
      const s3Key = generateS3Key(userId, file.originalname, comicId);

      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: "public, max-age=31536000",
        Metadata: {
          userId,
          title: title || `${file.originalname} (${index + 1})`,
          description: description || "",
          genre: genre || "comic",
          author: author || "unknown",
          comicId: comicId || "",
          isPublic: isPublic.toString(),
          uploadDate: new Date().toISOString(),
          originalFileName: file.originalname,
          fileIndex: (index + 1).toString(),
        },
      };

      if (isPublic === "true" || isPublic === true) {
        uploadParams["ACL"] = "public-read";
      }

      const parallelUploads3 = new Upload({
        client: s3Client,
        params: uploadParams,
      });

      const result = await parallelUploads3.done();

      // Generate CloudFront URL
      const cloudFrontUrl = getCloudFrontUrl(s3Key);

      // Generate signed URL for private files
      let signedUrl = null;
      if (isPublic !== "true" && isPublic !== true) {
        signedUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }),
          { expiresIn: 3600 }
        );
      }

      return {
        s3Key,
        s3Location: result.Location,
        cloudFrontUrl,
        signedUrl,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileIndex: index + 1,
      };
    });

    const uploadResults = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: `${uploadResults.length} comic files uploaded successfully`,
      data: {
        files: uploadResults,
        metadata: {
          userId,
          comicId: comicId || null,
          title,
          description,
          genre,
          author,
          totalFiles: uploadResults.length,
          isPublic: isPublic === "true" || isPublic === true,
          uploadDate: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    res.status(500).json({
      error: "Failed to upload comic files",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get comic file URL (CloudFront preferred, signed URL as fallback)
export const getComicFile = async (req: any, res: any) => {
  try {
    const { s3Key } = req.params;
    const { signed = "false" } = req.query;

    if (!s3Key) {
      return res.status(400).json({ error: "S3 key is required" });
    }

    // Check if file exists in S3
    try {
      await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })
      );
    } catch (error) {
      return res.status(404).json({ error: "File not found" });
    }

    // Always provide CloudFront URL for better performance
    const cloudFrontUrl = getCloudFrontUrl(s3Key);

    let signedUrl = null;

    // Generate signed URL if requested or for private files
    if (signed === "true") {
      const expiresIn = parseInt(req.query.expiresIn as string) || 3600;
      signedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }),
        { expiresIn }
      );
    }

    res.json({
      success: true,
      data: {
        s3Key,
        cloudFrontUrl, // Primary URL - fastest delivery
        signedUrl, // Fallback URL with access control
        cdnDomain: CLOUDFRONT_DOMAIN,
        recommendation:
          "Use cloudFrontUrl for public content, signedUrl for private content",
      },
    });
  } catch (error) {
    console.error("Get file error:", error);
    res.status(500).json({
      error: "Failed to get comic file",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update comic file in S3
export const updateComicFile = async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { s3Key } = req.params;
    const { title, description, genre, author, isPublic } = req.body;

    if (!s3Key) {
      return res.status(400).json({ error: "S3 key is required" });
    }

    // Check if file exists
    try {
      await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })
      );
    } catch (error) {
      return res.status(404).json({ error: "Original file not found" });
    }

    // Update the file in S3 (replaces existing file)
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: "public, max-age=31536000",
      Metadata: {
        title: title || req.file.originalname,
        description: description || "",
        genre: genre || "comic",
        author: author || "unknown",
        isPublic: isPublic?.toString() || "false",
        lastUpdated: new Date().toISOString(),
        originalFileName: req.file.originalname,
      },
    };

    if (isPublic === "true" || isPublic === true) {
      uploadParams["ACL"] = "public-read";
    }

    const parallelUploads3 = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    const result = await parallelUploads3.done();

    // Generate cache-busting CloudFront URL for updated content
    const cloudFrontUrl = getCloudFrontUrlWithCacheBusting(s3Key);

    // Generate new signed URL
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }),
      { expiresIn: 3600 }
    );

    res.json({
      success: true,
      message: "Comic file updated successfully",
      data: {
        s3Key,
        s3Location: result.Location,
        cloudFrontUrl, // Cache-busting URL for immediate access
        signedUrl,
        isPublic: isPublic === "true" || isPublic === true,
        metadata: {
          title: title || req.file.originalname,
          description: description || "",
          genre: genre || "comic",
          author: author || "unknown",
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          originalName: req.file.originalname,
          lastUpdated: new Date().toISOString(),
        },
        note: "CloudFront cache may take 5-15 minutes to update globally",
      },
    });
  } catch (error) {
    console.error("Update file error:", error);
    res.status(500).json({
      error: "Failed to update comic file",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete comic file from S3
export const deleteComicFile = async (req: any, res: any) => {
  try {
    const { s3Key } = req.params;

    if (!s3Key) {
      return res.status(400).json({ error: "S3 key is required" });
    }

    // Check if file exists before deletion
    try {
      await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })
      );
    } catch (error) {
      return res.status(404).json({ error: "File not found" });
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));

    res.json({
      success: true,
      message: "Comic file deleted successfully",
      data: {
        s3Key,
        deletedAt: new Date().toISOString(),
        note: "CloudFront cache will expire naturally (may take 24 hours for complete removal)",
      },
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      error: "Failed to delete comic file",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// List user's comic files with CloudFront URLs
export const listUserComicFiles = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { comicId, limit = "100" } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Build prefix based on parameters
    let prefix = `comics/${userId}/`;
    if (comicId) {
      prefix += `${comicId}/`;
    }

    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: Math.min(parseInt(limit as string), 1000), // Cap at 1000
    };

    const command = new ListObjectsV2Command(listParams);
    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return res.json({
        success: true,
        data: {
          files: [],
          count: 0,
          userId,
          comicId: comicId || null,
        },
      });
    }

    // Generate CloudFront URLs and signed URLs for each file
    const filesWithUrls = await Promise.all(
      response.Contents.map(async (object) => {
        if (!object.Key) return null;

        const cloudFrontUrl = getCloudFrontUrl(object.Key);

        // Get metadata to determine if public
        let isPublic = false;
        try {
          const headResult = await s3Client.send(
            new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: object.Key,
            })
          );
          isPublic = headResult.Metadata?.isPublic === "true";
        } catch (error) {
          console.warn(`Could not get metadata for ${object.Key}`);
        }

        // Generate signed URL for private files
        let signedUrl = null;
        if (!isPublic) {
          try {
            signedUrl = await getSignedUrl(
              s3Client,
              new GetObjectCommand({ Bucket: BUCKET_NAME, Key: object.Key }),
              { expiresIn: 3600 }
            );
          } catch (error) {
            console.warn(`Could not generate signed URL for ${object.Key}`);
          }
        }

        return {
          s3Key: object.Key,
          cloudFrontUrl,
          signedUrl,
          lastModified: object.LastModified,
          size: object.Size,
          isPublic,
          fileName: object.Key.split("/").pop(), // Extract filename
        };
      })
    );

    // Filter out any null entries
    const validFiles = filesWithUrls.filter((file) => file !== null);

    res.json({
      success: true,
      data: {
        files: validFiles,
        count: validFiles.length,
        userId,
        comicId: comicId || null,
        cdnDomain: CLOUDFRONT_DOMAIN,
        note: "Use cloudFrontUrl for public files, signedUrl for private files",
      },
    });
  } catch (error) {
    console.error("List files error:", error);
    res.status(500).json({
      error: "Failed to list comic files",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get file metadata and URLs
export const getComicFileInfo = async (req: any, res: any) => {
  try {
    const { s3Key } = req.params;

    if (!s3Key) {
      return res.status(400).json({ error: "S3 key is required" });
    }

    // Get file metadata
    const headCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    const headResult = await s3Client.send(headCommand);

    const isPublic = headResult.Metadata?.isPublic === "true";
    const cloudFrontUrl = getCloudFrontUrl(s3Key);

    let signedUrl = null;
    if (!isPublic) {
      signedUrl = await getSignedUrl(s3Client, headCommand, {
        expiresIn: 3600,
      });
    }

    res.json({
      success: true,
      data: {
        s3Key,
        cloudFrontUrl,
        signedUrl,
        isPublic,
        metadata: {
          contentType: headResult.ContentType,
          contentLength: headResult.ContentLength,
          lastModified: headResult.LastModified,
          cacheControl: headResult.CacheControl,
          ...headResult.Metadata,
        },
        cdnDomain: CLOUDFRONT_DOMAIN,
      },
    });
  } catch (error) {
    console.error("Get file info error:", error);
    if (error instanceof Error && error.name === "NoSuchKey") {
      return res.status(404).json({ error: "File not found" });
    }
    res.status(500).json({
      error: "Failed to get file info",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const uploadToS3 = async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const file = req.file;
    const fileExtension = path.extname(file.originalname);
    const key = `media/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${fileExtension}`;

    // Upload without ACL
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    // Build CloudFront or fallback S3 URL
    const publicUrl = process.env.CLOUDFRONT_DOMAIN
      ? `${process.env.CLOUDFRONT_DOMAIN}/${key}`
      : `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return res.status(200).json({
      success: true,
      url: publicUrl,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
