"use strict";
// import s3Service from "../services/aws-s3.service";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapFilesToUrls = exports.generateFileUrl = exports.uploadToS3 = void 0;
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
const client_s3_1 = require("@aws-sdk/client-s3");
const cloudfront_signer_1 = require("@aws-sdk/cloudfront-signer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const profile_1 = require("../model/profile");
const drizzle_orm_1 = require("drizzle-orm");
// S3 client
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const uploadToS3 = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res
                .status(401)
                .json({ success: false, error: "No token provided" });
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        catch (err) {
            return res.status(403).json({ success: false, error: "Invalid token" });
        }
        const userId = decoded.userId;
        const [creator] = await db_1.db
            .select()
            .from(profile_1.creatorProfile)
            .where((0, drizzle_orm_1.eq)(profile_1.creatorProfile.userId, userId));
        const creatorName = creator.creatorName;
        // 2️⃣ Check file
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file uploaded",
            });
        }
        const file = req.file;
        const fileExtension = path_1.default.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}${fileExtension}`;
        // 👇 Organize by creator
        const key = `creators/${creatorName}/${uniqueName}`;
        // 3️⃣ Upload to S3
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        await s3Client.send(command);
        // 4️⃣ Signed CloudFront URL
        const distributionDomain = process.env.CLOUDFRONT_DOMAIN;
        const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
        const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY ||
            fs_1.default.readFileSync("./private_key.pem", "utf8");
        let fileUrl;
        if (distributionDomain && keyPairId && privateKey) {
            fileUrl = (0, cloudfront_signer_1.getSignedUrl)({
                url: `https://${distributionDomain}/${key}`,
                keyPairId,
                privateKey,
                dateLessThan: new Date(Date.now() + 60 * 60 * 1000),
            });
        }
        else {
            fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        }
        return res.status(200).json({
            success: true,
            url: fileUrl,
            message: "File uploaded successfully",
        });
    }
    catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.uploadToS3 = uploadToS3;
const distributionDomain = process.env.CLOUDFRONT_DOMAIN;
const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;
// || fs.readFileSync("./private_key.pem", "utf8");
/**
 * Generate a CloudFront signed URL (or fallback S3 public URL)
 * @param key S3 object key (e.g. creators/john/123.jpg)
 * @param expiresIn Expiry time in ms (default 1 hour)
 * @returns string - signed URL or direct S3 URL
 */
const generateFileUrl = (key, expiresIn = 60 * 60 * 1000) => {
    if (!key)
        return "";
    if (distributionDomain && keyPairId && privateKey) {
        return (0, cloudfront_signer_1.getSignedUrl)({
            url: `https://${distributionDomain}/${key}`,
            keyPairId,
            privateKey,
            dateLessThan: new Date(Date.now() + expiresIn),
        });
    }
    // fallback
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
exports.generateFileUrl = generateFileUrl;
/**
 * Helper to map array of file keys into URLs
 */
const mapFilesToUrls = (keys = []) => {
    return keys.map((k) => (0, exports.generateFileUrl)(k));
};
exports.mapFilesToUrls = mapFilesToUrls;
