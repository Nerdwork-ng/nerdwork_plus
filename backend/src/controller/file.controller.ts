// import s3Service from "../services/aws-s3.service";

// import AWSS3Service from "../services/aws-s3.service";
// // Initialize services
// const s3Service = new AWSS3Service({
//   region: process.env.AWS_REGION || "us-east-1",
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
//   bucketName: process.env.AWS_S3_BUCKET || "",
//   cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
// });
// // Get presigned upload URL for direct S3 uploads
// export const getPresignedUploadUrl = async (req: any, res: any) => {
//   try {
//     const userId = req.userId;
//     const {
//       filename,
//       contentType,
//       category = "general",
//       purpose = "storage",
//     } = req.body;
//     if (!userId) {
//       return res
//         .status(401)
//         .json({
//           success: false,
//           error: "Authentication required",
//           timestamp: new Date().toISOString(),
//         });
//     }
//     if (!filename || !contentType) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           error: "Filename and content type are required",
//           timestamp: new Date().toISOString(),
//         });
//     }
//     const s3Key = s3Service.generateKey(category, filename, userId);
//     const presignedUrl = await s3Service.getPresignedUploadUrl(
//       s3Key,
//       contentType
//     );
//     return res
//       .status(200)
//       .json({
//         success: true,
//         data: { ...presignedUrl, s3Key, cdnUrl: s3Service.getPublicUrl(s3Key) },
//         message: "Presigned upload URL generated successfully",
//       });
//   } catch (error: any) {
//     console.error("Get presigned upload URL error:", error);
//     return res
//       .status(500)
//       .json({
//         success: false,
//         error: "Internal server error",
//         timestamp: new Date().toISOString(),
//       });
//   }
// };

// export const uploadToS3 = async (req: any, res: any) => {
//   try {
//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ success: false, error: "No file uploaded" });
//     }

//     const url = await s3Service.uploadFile(req.file, "media");

//     return res.status(200).json({
//       success: true,
//       url,
//       message: "File uploaded successfully",
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Internal server error",
//     });
//   }
// };
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { db } from "../config/db";
import { creatorProfile } from "../model/profile";
import { eq } from "drizzle-orm";

// S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (req: any, res: any) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "No token provided" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return res.status(403).json({ success: false, error: "Invalid token" });
    }

    const userId = decoded.userId;

    const [creator] = await db
      .select()
      .from(creatorProfile)
      .where(eq(creatorProfile.userId, userId));

    const creatorName = creator.creatorName;

    // 2️⃣ Check file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const file = req.file;
    const fileExtension = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${fileExtension}`;

    // 👇 Organize by creator
    const key = `creators/${creatorName}/${uniqueName}`;

    // 3️⃣ Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    // 4️⃣ Signed CloudFront URL
    const distributionDomain = process.env.CLOUDFRONT_DOMAIN;
    const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;

    const privateKey =
      process.env.CLOUDFRONT_PRIVATE_KEY ||
      fs.readFileSync("./private_key.pem", "utf8");

    let fileUrl: string;
    if (distributionDomain && keyPairId && privateKey) {
      fileUrl = getSignedUrl({
        url: `https://${distributionDomain}/${key}`,
        keyPairId,
        privateKey,
        dateLessThan: new Date(Date.now() + 60 * 60 * 1000),
      });
    } else {
      fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    return res.status(200).json({
      success: true,
      url: fileUrl,
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

const distributionDomain = process.env.CLOUDFRONT_DOMAIN;
const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
const privateKey =
  process.env.CLOUDFRONT_PRIVATE_KEY 
  // || fs.readFileSync("./private_key.pem", "utf8");

/**
 * Generate a CloudFront signed URL (or fallback S3 public URL)
 * @param key S3 object key (e.g. creators/john/123.jpg)
 * @param expiresIn Expiry time in ms (default 1 hour)
 * @returns string - signed URL or direct S3 URL
 */
export const generateFileUrl = (
  key: string,
  expiresIn = 60 * 60 * 1000
): string => {
  if (!key) return "";

  if (distributionDomain && keyPairId && privateKey) {
    return getSignedUrl({
      url: `https://${distributionDomain}/${key}`,
      keyPairId,
      privateKey,
      dateLessThan: new Date(Date.now() + expiresIn),
    });
  }

  // fallback
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

/**
 * Helper to map array of file keys into URLs
 */
export const mapFilesToUrls = (keys: string[] = []): string[] => {
  return keys.map((k) => generateFileUrl(k));
};
