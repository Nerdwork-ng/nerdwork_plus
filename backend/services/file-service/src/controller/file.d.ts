import multer from 'multer';
export declare const upload: multer.Multer;
export declare const uploadToS3: (req: any, res: any) => Promise<any>;
export declare const uploadForNFT: (req: any, res: any) => Promise<any>;
export declare const getPresignedUploadUrl: (req: any, res: any) => Promise<any>;
export declare const getUserFiles: (req: any, res: any) => Promise<any>;
export declare const getFile: (req: any, res: any) => Promise<any>;
export declare const deleteFile: (req: any, res: any) => Promise<any>;
