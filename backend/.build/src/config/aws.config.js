"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAWSConfig = exports.FILE_CONFIG = exports.CLOUDFRONT_CONFIG = exports.S3_CONFIG = exports.AWS_CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env" });
// AWS S3 Configuration
exports.AWS_CONFIG = {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
};
exports.S3_CONFIG = {
    bucketName: process.env.S3_BUCKET_NAME || "nerdwork-comics",
    region: process.env.AWS_REGION || "us-east-1",
};
// CloudFront Configuration
exports.CLOUDFRONT_CONFIG = {
    domain: process.env.CLOUDFRONT_DOMAIN || "dgumbu3t6hn53.cloudfront.net",
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    url: process.env.CLOUDFRONT_DOMAIN
        ? `https://${process.env.CLOUDFRONT_DOMAIN}`
        : "https://dgumbu3t6hn53.cloudfront.net",
};
// File Upload Configuration
exports.FILE_CONFIG = {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "104857600"), // 100MB default
    maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD || "20"), // 20 files default
    allowedFileTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "application/pdf",
        "application/zip",
        "application/x-zip-compressed",
        "application/x-rar-compressed",
        "application/vnd.comicbook+zip",
        "application/vnd.comicbook-rar",
    ],
};
// Validate required environment variables
const requiredEnvVars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
];
const validateAWSConfig = () => {
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required AWS environment variables: ${missing.join(", ")}\n` +
            "Please ensure these are set in your .env.local file:\n" +
            "- AWS_ACCESS_KEY_ID\n" +
            "- AWS_SECRET_ACCESS_KEY\n" +
            "- AWS_REGION (optional, defaults to us-east-1)\n" +
            "- S3_BUCKET_NAME (optional, defaults to nerdwork-comics)\n" +
            "- CLOUDFRONT_DOMAIN (optional, defaults to dgumbu3t6hn53.cloudfront.net)\n" +
            "- CLOUDFRONT_DISTRIBUTION_ID (optional, for cache invalidation)");
    }
};
exports.validateAWSConfig = validateAWSConfig;
