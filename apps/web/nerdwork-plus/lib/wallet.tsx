'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, type Wallet, type NWTPricingPackage, type Transaction } from './api';
import { useAuth } from './auth';

interface WalletContextType {
  wallet: Wallet | null;
  isLoading: boolean;
  nwtBalance: string;
  connectedWalletAddress?: string;
  
  // Pricing & Purchases
  pricingPackages: NWTPricingPackage[];
  loadPricingPackages: () => Promise<void>;
  purchaseNWT: (packageId: string) => Promise<{ success: boolean; paymentUrl?: string; error?: string }>;
  checkPaymentStatus: (paymentId: string) => Promise<{ success: boolean; completed?: boolean; error?: string }>;
  
  // Wallet Connection
  connectSolanaWallet: (walletAddress: string, walletType: string) => Promise<{ success: boolean; error?: string }>;
  
  // Spending
  spendNWT: (amount: number, description: string, referenceId?: string, referenceType?: string) => Promise<{ success: boolean; newBalance?: string; error?: string }>;
  
  // Transactions
  transactions: Transaction[];
  loadTransactionHistory: (page?: number, limit?: number, type?: string) => Promise<void>;
  
  // Actions
  refetchWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pricingPackages, setPricingPackages] = useState<NWTPricingPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const nwtBalance = wallet?.nwtBalance || '0.00000000';
  const connectedWalletAddress = wallet?.connectedWalletAddress;

  useEffect(() => {
    if (isAuthenticated && user) {
      loadWallet();
      loadPricingPackages();
    } else {
      setWallet(null);
      setTransactions([]);
    }
  }, [isAuthenticated, user]);

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getWallet();
      
      if (response.success && response.data) {
        setWallet(response.data);
      } else {
        console.error('Failed to load wallet:', response.error);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPricingPackages = async () => {
    try {
      const response = await apiClient.getNWTPricing();
      
      if (response.success && response.data) {
        setPricingPackages(response.data);
      } else {
        console.error('Failed to load pricing packages:', response.error);
      }
    } catch (error) {
      console.error('Error loading pricing packages:', error);
    }
  };

  const purchaseNWT = async (packageId: string) => {
    try {
      const response = await apiClient.createPaymentLink(packageId);
      
      if (response.success && response.data) {
        const { paymentLink } = response.data;
        return { 
          success: true, 
          paymentUrl: paymentLink.url 
        };
      } else {
        return { 
          success: false, 
          error: response.error || 'Failed to create payment link' 
        };
      }
    } catch (error) {
      console.error('Error purchasing NWT:', error);
      return { 
        success: false, 
        error: 'Network error occurred' 
      };
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const response = await apiClient.checkPaymentStatus(paymentId);
      
      if (response.success && response.data) {
        const { transaction, newBalance } = response.data;
        const completed = transaction.status === 'completed';
        
        if (completed && newBalance) {
          // Update wallet balance
          setWallet(prev => prev ? { ...prev, nwtBalance: newBalance } : null);
          // Reload transaction history
          await loadTransactionHistory();
        }
        
        return { 
          success: true, 
          completed 
        };
      } else {
        return { 
          success: false, 
          error: response.error || 'Failed to check payment status' 
        };
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { 
        success: false, 
        error: 'Network error occurred' 
      };
    }
  };

  const connectSolanaWallet = async (walletAddress: string, walletType: string) => {
    try {
      const response = await apiClient.connectWallet(walletAddress, walletType);
      
      if (response.success && response.data) {
        setWallet(response.data);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Failed to connect wallet' 
        };
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return { 
        success: false, 
        error: 'Network error occurred' 
      };
    }
  };

  const spendNWT = async (
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: string
  ) => {
    try {
      const response = await apiClient.spendNWTTokens(amount, description, referenceId, referenceType);
      
      if (response.success && response.data) {
        const { newBalance } = response.data;
        
        // Update wallet balance
        setWallet(prev => prev ? { ...prev, nwtBalance: newBalance } : null);
        
        // Reload transaction history
        await loadTransactionHistory();
        
        return { 
          success: true, 
          newBalance 
        };
      } else {
        return { 
          success: false, 
          error: response.error || 'Failed to spend NWT tokens' 
        };
      }
    } catch (error) {
      console.error('Error spending NWT:', error);
      return { 
        success: false, 
        error: 'Network error occurred' 
      };
    }
  };

  const loadTransactionHistory = async (page = 1, limit = 20, type?: string) => {
    try {
      const response = await apiClient.getTransactionHistory(page, limit, type);
      
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
      } else {
        console.error('Failed to load transaction history:', response.error);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
    }
  };

  const refetchWallet = async () => {
    await loadWallet();
  };

  const value: WalletContextType = {
    wallet,
    isLoading,
    nwtBalance,
    connectedWalletAddress,
    
    // Pricing & Purchases
    pricingPackages,
    loadPricingPackages,
    purchaseNWT,
    checkPaymentStatus,
    
    // Wallet Connection
    connectSolanaWallet,
    
    // Spending
    spendNWT,
    
    // Transactions
    transactions,
    loadTransactionHistory,
    
    // Actions
    refetchWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;