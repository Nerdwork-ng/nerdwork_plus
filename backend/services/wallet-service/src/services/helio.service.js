import axios from 'axios';
class HelioService {
    config;
    constructor(config) {
        this.config = config;
    }
    async createPaymentLink(request) {
        try {
            const response = await axios.post(`${this.config.baseUrl}/v1/payments/create`, {
                product: {
                    name: request.productName,
                    description: request.productDescription,
                    image: request.productImage,
                },
                amount: request.price,
                currency: request.currency,
                receiver: request.receiverWallet,
                redirect_url: request.redirectUrl,
                cluster: this.config.cluster,
                metadata: request.metadata,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return {
                id: response.data.id,
                url: response.data.url,
                qrCode: response.data.qr_code,
                status: response.data.status,
            };
        }
        catch (error) {
            console.error('Helio create payment link error:', error.response?.data || error.message);
            throw new Error(`Failed to create payment link: ${error.response?.data?.message || error.message}`);
        }
    }
    async checkPaymentStatus(paymentId) {
        try {
            const response = await axios.get(`${this.config.baseUrl}/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
            });
            return {
                id: response.data.id,
                status: response.data.status,
                transactionHash: response.data.transaction_hash,
                amount: response.data.amount,
                currency: response.data.currency,
                paidAt: response.data.paid_at,
                metadata: response.data.metadata,
            };
        }
        catch (error) {
            console.error('Helio check payment status error:', error.response?.data || error.message);
            throw new Error(`Failed to check payment status: ${error.response?.data?.message || error.message}`);
        }
    }
    async processWebhook(payload, signature) {
        // TODO: Implement webhook signature verification
        // For now, we'll process the webhook payload directly
        return {
            id: payload.id,
            status: payload.status,
            transactionHash: payload.transaction_hash,
            amount: payload.amount,
            currency: payload.currency,
            paidAt: payload.paid_at,
            metadata: payload.metadata,
        };
    }
}
export default HelioService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVsaW8uc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhlbGlvLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBb0MxQixNQUFNLFlBQVk7SUFDUixNQUFNLENBQWM7SUFFNUIsWUFBWSxNQUFtQjtRQUM3QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE9BQWlDO1FBQ3ZELElBQUksQ0FBQztZQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FDL0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8scUJBQXFCLEVBQzNDO2dCQUNFLE9BQU8sRUFBRTtvQkFDUCxJQUFJLEVBQUUsT0FBTyxDQUFDLFdBQVc7b0JBQ3pCLFdBQVcsRUFBRSxPQUFPLENBQUMsa0JBQWtCO29CQUN2QyxLQUFLLEVBQUUsT0FBTyxDQUFDLFlBQVk7aUJBQzVCO2dCQUNELE1BQU0sRUFBRSxPQUFPLENBQUMsS0FBSztnQkFDckIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO2dCQUMxQixRQUFRLEVBQUUsT0FBTyxDQUFDLGNBQWM7Z0JBQ2hDLFlBQVksRUFBRSxPQUFPLENBQUMsV0FBVztnQkFDakMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDNUIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO2FBQzNCLEVBQ0Q7Z0JBQ0UsT0FBTyxFQUFFO29CQUNQLGVBQWUsRUFBRSxVQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO29CQUMvQyxjQUFjLEVBQUUsa0JBQWtCO2lCQUNuQzthQUNGLENBQ0YsQ0FBQztZQUVGLE9BQU87Z0JBQ0wsRUFBRSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDcEIsR0FBRyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRztnQkFDdEIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTztnQkFDN0IsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTTthQUM3QixDQUFDO1FBQ0osQ0FBQztRQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7WUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekYsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3RHLENBQUM7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFNBQWlCO1FBQ3hDLElBQUksQ0FBQztZQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FDOUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sZ0JBQWdCLFNBQVMsRUFBRSxFQUNqRDtnQkFDRSxPQUFPLEVBQUU7b0JBQ1AsZUFBZSxFQUFFLFVBQVUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7aUJBQ2hEO2FBQ0YsQ0FDRixDQUFDO1lBRUYsT0FBTztnQkFDTCxFQUFFLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNwQixNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNO2dCQUM1QixlQUFlLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0I7Z0JBQy9DLE1BQU0sRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU07Z0JBQzVCLFFBQVEsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVE7Z0JBQ2hDLE1BQU0sRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU87Z0JBQzdCLFFBQVEsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVE7YUFDakMsQ0FBQztRQUNKLENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUNBQW1DLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFGLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN2RyxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBWSxFQUFFLFNBQWlCO1FBQ2xELGlEQUFpRDtRQUNqRCxzREFBc0Q7UUFFdEQsT0FBTztZQUNMLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRTtZQUNkLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtZQUN0QixlQUFlLEVBQUUsT0FBTyxDQUFDLGdCQUFnQjtZQUN6QyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07WUFDdEIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1lBQzFCLE1BQU0sRUFBRSxPQUFPLENBQUMsT0FBTztZQUN2QixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7U0FDM0IsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQUVELGVBQWUsWUFBWSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcclxuXHJcbmludGVyZmFjZSBIZWxpb0NvbmZpZyB7XHJcbiAgYXBpS2V5OiBzdHJpbmc7XHJcbiAgYmFzZVVybDogc3RyaW5nO1xyXG4gIGNsdXN0ZXI6ICdkZXZuZXQnIHwgJ21haW5uZXQnO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQ3JlYXRlUGF5bWVudExpbmtSZXF1ZXN0IHtcclxuICBwcm9kdWN0TmFtZTogc3RyaW5nO1xyXG4gIHByb2R1Y3REZXNjcmlwdGlvbjogc3RyaW5nO1xyXG4gIHByb2R1Y3RJbWFnZT86IHN0cmluZztcclxuICBwcmljZTogbnVtYmVyO1xyXG4gIGN1cnJlbmN5OiAnVVNEQycgfCAnU09MJztcclxuICByZWNlaXZlcldhbGxldDogc3RyaW5nO1xyXG4gIHJlZGlyZWN0VXJsPzogc3RyaW5nO1xyXG4gIG1ldGFkYXRhPzogUmVjb3JkPHN0cmluZywgYW55PjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFBheW1lbnRMaW5rUmVzcG9uc2Uge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgdXJsOiBzdHJpbmc7XHJcbiAgcXJDb2RlOiBzdHJpbmc7XHJcbiAgc3RhdHVzOiAncGVuZGluZycgfCAnY29tcGxldGVkJyB8ICdmYWlsZWQnIHwgJ2NhbmNlbGxlZCc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBDaGVja1BheW1lbnRTdGF0dXNSZXNwb25zZSB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBzdGF0dXM6ICdwZW5kaW5nJyB8ICdjb21wbGV0ZWQnIHwgJ2ZhaWxlZCcgfCAnY2FuY2VsbGVkJztcclxuICB0cmFuc2FjdGlvbkhhc2g/OiBzdHJpbmc7XHJcbiAgYW1vdW50OiBudW1iZXI7XHJcbiAgY3VycmVuY3k6IHN0cmluZztcclxuICBwYWlkQXQ/OiBzdHJpbmc7XHJcbiAgbWV0YWRhdGE/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xyXG59XHJcblxyXG5jbGFzcyBIZWxpb1NlcnZpY2Uge1xyXG4gIHByaXZhdGUgY29uZmlnOiBIZWxpb0NvbmZpZztcclxuXHJcbiAgY29uc3RydWN0b3IoY29uZmlnOiBIZWxpb0NvbmZpZykge1xyXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVQYXltZW50TGluayhyZXF1ZXN0OiBDcmVhdGVQYXltZW50TGlua1JlcXVlc3QpOiBQcm9taXNlPFBheW1lbnRMaW5rUmVzcG9uc2U+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChcclxuICAgICAgICBgJHt0aGlzLmNvbmZpZy5iYXNlVXJsfS92MS9wYXltZW50cy9jcmVhdGVgLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHByb2R1Y3Q6IHtcclxuICAgICAgICAgICAgbmFtZTogcmVxdWVzdC5wcm9kdWN0TmFtZSxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IHJlcXVlc3QucHJvZHVjdERlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICBpbWFnZTogcmVxdWVzdC5wcm9kdWN0SW1hZ2UsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYW1vdW50OiByZXF1ZXN0LnByaWNlLFxyXG4gICAgICAgICAgY3VycmVuY3k6IHJlcXVlc3QuY3VycmVuY3ksXHJcbiAgICAgICAgICByZWNlaXZlcjogcmVxdWVzdC5yZWNlaXZlcldhbGxldCxcclxuICAgICAgICAgIHJlZGlyZWN0X3VybDogcmVxdWVzdC5yZWRpcmVjdFVybCxcclxuICAgICAgICAgIGNsdXN0ZXI6IHRoaXMuY29uZmlnLmNsdXN0ZXIsXHJcbiAgICAgICAgICBtZXRhZGF0YTogcmVxdWVzdC5tZXRhZGF0YSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dGhpcy5jb25maWcuYXBpS2V5fWAsXHJcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaWQ6IHJlc3BvbnNlLmRhdGEuaWQsXHJcbiAgICAgICAgdXJsOiByZXNwb25zZS5kYXRhLnVybCxcclxuICAgICAgICBxckNvZGU6IHJlc3BvbnNlLmRhdGEucXJfY29kZSxcclxuICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLmRhdGEuc3RhdHVzLFxyXG4gICAgICB9O1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdIZWxpbyBjcmVhdGUgcGF5bWVudCBsaW5rIGVycm9yOicsIGVycm9yLnJlc3BvbnNlPy5kYXRhIHx8IGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgcGF5bWVudCBsaW5rOiAke2Vycm9yLnJlc3BvbnNlPy5kYXRhPy5tZXNzYWdlIHx8IGVycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBjaGVja1BheW1lbnRTdGF0dXMocGF5bWVudElkOiBzdHJpbmcpOiBQcm9taXNlPENoZWNrUGF5bWVudFN0YXR1c1Jlc3BvbnNlPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLmdldChcclxuICAgICAgICBgJHt0aGlzLmNvbmZpZy5iYXNlVXJsfS92MS9wYXltZW50cy8ke3BheW1lbnRJZH1gLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dGhpcy5jb25maWcuYXBpS2V5fWAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaWQ6IHJlc3BvbnNlLmRhdGEuaWQsXHJcbiAgICAgICAgc3RhdHVzOiByZXNwb25zZS5kYXRhLnN0YXR1cyxcclxuICAgICAgICB0cmFuc2FjdGlvbkhhc2g6IHJlc3BvbnNlLmRhdGEudHJhbnNhY3Rpb25faGFzaCxcclxuICAgICAgICBhbW91bnQ6IHJlc3BvbnNlLmRhdGEuYW1vdW50LFxyXG4gICAgICAgIGN1cnJlbmN5OiByZXNwb25zZS5kYXRhLmN1cnJlbmN5LFxyXG4gICAgICAgIHBhaWRBdDogcmVzcG9uc2UuZGF0YS5wYWlkX2F0LFxyXG4gICAgICAgIG1ldGFkYXRhOiByZXNwb25zZS5kYXRhLm1ldGFkYXRhLFxyXG4gICAgICB9O1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdIZWxpbyBjaGVjayBwYXltZW50IHN0YXR1cyBlcnJvcjonLCBlcnJvci5yZXNwb25zZT8uZGF0YSB8fCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY2hlY2sgcGF5bWVudCBzdGF0dXM6ICR7ZXJyb3IucmVzcG9uc2U/LmRhdGE/Lm1lc3NhZ2UgfHwgZXJyb3IubWVzc2FnZX1gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIHByb2Nlc3NXZWJob29rKHBheWxvYWQ6IGFueSwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPENoZWNrUGF5bWVudFN0YXR1c1Jlc3BvbnNlPiB7XHJcbiAgICAvLyBUT0RPOiBJbXBsZW1lbnQgd2ViaG9vayBzaWduYXR1cmUgdmVyaWZpY2F0aW9uXHJcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCBwcm9jZXNzIHRoZSB3ZWJob29rIHBheWxvYWQgZGlyZWN0bHlcclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaWQ6IHBheWxvYWQuaWQsXHJcbiAgICAgIHN0YXR1czogcGF5bG9hZC5zdGF0dXMsXHJcbiAgICAgIHRyYW5zYWN0aW9uSGFzaDogcGF5bG9hZC50cmFuc2FjdGlvbl9oYXNoLFxyXG4gICAgICBhbW91bnQ6IHBheWxvYWQuYW1vdW50LFxyXG4gICAgICBjdXJyZW5jeTogcGF5bG9hZC5jdXJyZW5jeSxcclxuICAgICAgcGFpZEF0OiBwYXlsb2FkLnBhaWRfYXQsXHJcbiAgICAgIG1ldGFkYXRhOiBwYXlsb2FkLm1ldGFkYXRhLFxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEhlbGlvU2VydmljZTtcclxuZXhwb3J0IHR5cGUgeyBcclxuICBIZWxpb0NvbmZpZywgXHJcbiAgQ3JlYXRlUGF5bWVudExpbmtSZXF1ZXN0LCBcclxuICBQYXltZW50TGlua1Jlc3BvbnNlLCBcclxuICBDaGVja1BheW1lbnRTdGF0dXNSZXNwb25zZSBcclxufTsiXX0=