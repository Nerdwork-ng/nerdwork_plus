interface HelioConfig {
    apiKey: string;
    baseUrl: string;
    cluster: 'devnet' | 'mainnet';
}
interface CreatePaymentLinkRequest {
    productName: string;
    productDescription: string;
    productImage?: string;
    price: number;
    currency: 'USDC' | 'SOL';
    receiverWallet: string;
    redirectUrl?: string;
    metadata?: Record<string, any>;
}
interface PaymentLinkResponse {
    id: string;
    url: string;
    qrCode: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
}
interface CheckPaymentStatusResponse {
    id: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    transactionHash?: string;
    amount: number;
    currency: string;
    paidAt?: string;
    metadata?: Record<string, any>;
}
declare class HelioService {
    private config;
    constructor(config: HelioConfig);
    createPaymentLink(request: CreatePaymentLinkRequest): Promise<PaymentLinkResponse>;
    checkPaymentStatus(paymentId: string): Promise<CheckPaymentStatusResponse>;
    processWebhook(payload: any, signature: string): Promise<CheckPaymentStatusResponse>;
}
export default HelioService;
export type { HelioConfig, CreatePaymentLinkRequest, PaymentLinkResponse, CheckPaymentStatusResponse };
