import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import type { Request } from "express";
class AWSS3Service {
  private s3: S3Client;
  private bucketName: string;
  private cloudFrontDomain?: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || "eu-west-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    this.bucketName = process.env.S3_BUCKET_NAME || "";
    this.cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
  }

  async uploadFile(file: Express.Multer.File, folder = "uploads") {
    const fileKey = `${folder}/${uuidv4()}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return this.cloudFrontDomain
      ? `https://${this.cloudFrontDomain}/${fileKey}`
      : `https://${this.bucketName}.s3.amazonaws.com/${fileKey}`;
  }
}

export default new AWSS3Service();
