interface S3Config {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    cloudFrontDomain?: string;
}
interface S3UploadResponse {
    key: string;
    bucket: string;
    location: string;
    cdnUrl?: string;
    size?: number;
    contentType?: string;
}
interface S3PresignedUrlResponse {
    uploadUrl: string;
    key: string;
    expiresIn: number;
}
declare class AWSS3Service {
    private s3Client;
    private config;
    constructor(config: S3Config);
    uploadFile(fileBuffer: Buffer, key: string, contentType?: string, options?: {
        metadata?: {
            [key: string]: string;
        };
        acl?: 'private' | 'public-read' | 'public-read-write';
        cacheControl?: string;
    }): Promise<S3UploadResponse>;
    getPresignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<S3PresignedUrlResponse>;
    getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
    deleteFile(key: string): Promise<void>;
    getFileMetadata(key: string): Promise<any>;
    generateKey(prefix: string, filename: string, userId?: string): string;
    getPublicUrl(key: string): string;
}
export default AWSS3Service;
export type { S3Config, S3UploadResponse, S3PresignedUrlResponse };
