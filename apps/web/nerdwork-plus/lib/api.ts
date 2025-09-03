// API Configuration and Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  authUserId: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  country?: string;
  timezone?: string;
  language: string;
  preferences: any;
  isCreator: boolean;
  creatorName?: string;
  creatorBio?: string;
  socialLinks?: any;
  creatorVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface Wallet {
  id: string;
  userId: string;
  nwtBalance: string;
  totalEarned: string;
  totalSpent: string;
  connectedWalletAddress?: string;
  walletType?: string;
  createdAt: string;
  updatedAt: string;
}

interface NWTPricingPackage {
  id: string;
  packageName: string;
  nwtAmount: string;
  usdPrice: string;
  bonusPercentage?: number;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

interface PaymentLink {
  id: string;
  url: string;
  qrCode: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
}

interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: 'purchase' | 'spend' | 'earn';
  amount: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  externalTransactionId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Try to get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      };

      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
          timestamp: data.timestamp
        };
      }

      return data;
    } catch (error) {
      console.error('Network Error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // Authentication Endpoints
  async signup(email: string, password: string, username: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/auth/me');
  }

  // User Profile Endpoints
  async createUserProfile(profileData: {
    displayName: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    preferences?: any;
    language?: string;
  }): Promise<ApiResponse<UserProfile>> {
    console.log('Creating user profile', profileData);

    return this.request<UserProfile>('/users/users/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/users/users/me');
  }

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/users/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async becomeCreator(creatorData: {
    creatorName: string;
    creatorBio?: string;
    socialLinks?: any;
  }): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/users/users/creator/become', {
      method: 'POST',
      body: JSON.stringify(creatorData),
    });
  }

  async checkCreatorStatus(): Promise<ApiResponse<{ isCreator: boolean }>> {
    return this.request<{ isCreator: boolean }>('/users/users/creator/status');
  }

  // Wallet Endpoints
  async getWallet(): Promise<ApiResponse<Wallet>> {
    return this.request<Wallet>('/wallet');
  }

  async getTransactionHistory(page = 1, limit = 20, type?: string): Promise<ApiResponse<{
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
    });
    
    return this.request(`/wallet/transactions?${params}`);
  }

  async getNWTPricing(): Promise<ApiResponse<NWTPricingPackage[]>> {
    return this.request<NWTPricingPackage[]>('/wallet/pricing');
  }

  async createPaymentLink(packageId: string): Promise<ApiResponse<{
    transaction: Transaction;
    paymentLink: PaymentLink;
  }>> {
    return this.request('/wallet/payment-link', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    });
  }

  async checkPaymentStatus(paymentId: string): Promise<ApiResponse<{
    transaction: Transaction;
    paymentStatus: any;
    newBalance?: string;
  }>> {
    return this.request(`/wallet/payment/${paymentId}/status`);
  }

  async connectWallet(walletAddress: string, walletType: string): Promise<ApiResponse<Wallet>> {
    return this.request<Wallet>('/wallet/connect', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, walletType }),
    });
  }

  async spendNWTTokens(
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string
  ): Promise<ApiResponse<{
    transaction: Transaction;
    newBalance: string;
    spentAmount: number;
  }>> {
    return this.request('/wallet/spend', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        description,
        referenceId,
        referenceType,
      }),
    });
  }

  // Comics Endpoints  
  async getComics(filters?: {
    genre?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (filters?.genre) params.append('genre', filters.genre);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    return this.request(`/comics${query ? `?${query}` : ''}`);
  }

  async getComic(id: string): Promise<ApiResponse<any>> {
    return this.request(`/comics/${id}`);
  }

  async getComicPages(id: string): Promise<ApiResponse<any>> {
    return this.request(`/comics/${id}/pages`);
  }

  async updateReadingProgress(comicId: string, progress: any): Promise<ApiResponse<any>> {
    return this.request(`/comics/${comicId}/progress`, {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }

  // Events Endpoints
  async getEvents(filters?: any): Promise<ApiResponse<any>> {
    const params = new URLSearchParams(filters);
    const query = params.toString();
    return this.request(`/events${query ? `?${query}` : ''}`);
  }

  async getEvent(id: string): Promise<ApiResponse<any>> {
    return this.request(`/events/${id}`);
  }

  async bookEvent(id: string, booking: any): Promise<ApiResponse<any>> {
    return this.request(`/events/${id}/book`, {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type {
  ApiResponse,
  User,
  UserProfile,
  AuthResponse,
  Wallet,
  NWTPricingPackage,
  PaymentLink,
  Transaction,
};