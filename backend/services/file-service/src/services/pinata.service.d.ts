interface PinataConfig {
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
}
interface PinataUploadResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}
interface PinataFileResponse extends PinataUploadResponse {
    originalname: string;
    mimetype: string;
}
interface PinataJsonResponse extends PinataUploadResponse {
    metadata: any;
}
declare class PinataService {
    private config;
    constructor(config: PinataConfig);
    uploadFile(fileBuffer: Buffer, filename: string, options?: {
        metadata?: any;
        pinataOptions?: {
            cidVersion?: 0 | 1;
            wrapWithDirectory?: boolean;
        };
    }): Promise<PinataFileResponse>;
    uploadJson(jsonObject: any, options?: {
        metadata?: any;
        pinataOptions?: {
            cidVersion?: 0 | 1;
            wrapWithDirectory?: boolean;
        };
    }): Promise<PinataJsonResponse>;
    unpinFile(ipfsHash: string): Promise<void>;
    getPinnedFiles(options?: {
        status?: 'pinned' | 'unpinned';
        pageLimit?: number;
        pageOffset?: number;
        metadata?: any;
    }): Promise<any>;
    getGatewayUrl(ipfsHash: string, isDedicated?: boolean): string;
    private getMimeType;
}
export default PinataService;
export type { PinataConfig, PinataUploadResponse, PinataFileResponse, PinataJsonResponse };
