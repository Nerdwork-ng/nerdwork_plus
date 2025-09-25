"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
class AWSS3Service {
    constructor() {
        this.s3 = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || "eu-west-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
        });
        console.log("region", process.env.AWS_REGION);
        this.bucketName = process.env.S3_BUCKET_NAME || "";
        this.cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
        console.log("bucketName", this.bucketName);
    }
    async uploadFile(file, folder = "uploads") {
        const fileKey = `${folder}/${(0, uuid_1.v4)()}-${file.originalname}`;
        await this.s3.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        return this.cloudFrontDomain
            ? `https://${this.cloudFrontDomain}/${fileKey}`
            : `https://${this.bucketName}.s3.amazonaws.com/${fileKey}`;
    }
}
exports.default = new AWSS3Service();
