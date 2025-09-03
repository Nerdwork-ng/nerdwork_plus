'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '@/lib/wallet';
import { Loader2, Wallet, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface WalletOption {
  name: string;
  icon: string;
  downloadUrl: string;
  available: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    name: 'Phantom',
    icon: '🔮', // Replace with actual Phantom icon if available
    downloadUrl: 'https://phantom.app/',
    available: typeof window !== 'undefined' && !!(window as any).phantom?.solana,
  },
  {
    name: 'Solflare',
    icon: '☀️', // Replace with actual Solflare icon if available
    downloadUrl: 'https://solflare.com/',
    available: typeof window !== 'undefined' && !!(window as any).solflare,
  },
  {
    name: 'Backpack',
    icon: '🎒', // Replace with actual Backpack icon if available
    downloadUrl: 'https://backpack.app/',
    available: typeof window !== 'undefined' && !!(window as any).backpack,
  },
];

interface SolanaWalletConnectProps {
  onConnect?: (walletAddress: string, walletType: string) => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

export function SolanaWalletConnect({ 
  onConnect, 
  onSkip,
  showSkip = true 
}: SolanaWalletConnectProps) {
  const { connectSolanaWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const connectWallet = async (walletName: string) => {
    try {
      setIsConnecting(true);
      setSelectedWallet(walletName);
      setError('');

      let provider: any = null;
      
      // Get the wallet provider
      switch (walletName.toLowerCase()) {
        case 'phantom':
          provider = (window as any).phantom?.solana;
          break;
        case 'solflare':
          provider = (window as any).solflare;
          break;
        case 'backpack':
          provider = (window as any).backpack;
          break;
        default:
          throw new Error('Unsupported wallet');
      }

      if (!provider) {
        throw new Error(`${walletName} wallet not found. Please install it first.`);
      }

      // Request connection
      const response = await provider.connect();
      const walletAddress = response.publicKey.toString();

      // Connect with backend
      const result = await connectSolanaWallet(walletAddress, walletName.toLowerCase());

      if (result.success) {
        onConnect?.(walletAddress, walletName.toLowerCase());
      } else {
        throw new Error(result.error || 'Failed to connect wallet');
      }

    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-[#171719] border-[#292A2E] text-white">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold flex items-center justify-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Solana Wallet
        </CardTitle>
        <CardDescription className="text-[#707073]">
          Connect your Solana wallet to purchase NWT tokens and access Web3 features
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {WALLET_OPTIONS.map((wallet) => (
            <div key={wallet.name}>
              {wallet.available ? (
                <Button
                  onClick={() => connectWallet(wallet.name)}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-between p-4 h-auto bg-[#292A2E] hover:bg-[#3A3B3F] border-[#292A2E] text-white"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <span className="font-medium">{wallet.name}</span>
                  </div>
                  {isConnecting && selectedWallet === wallet.name && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Button>
              ) : (
                <div className="w-full flex items-center justify-between p-4 bg-[#1A1B1E] border border-[#292A2E] rounded-md opacity-75">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl opacity-50">{wallet.icon}</span>
                    <div>
                      <span className="font-medium text-[#707073]">{wallet.name}</span>
                      <p className="text-xs text-[#505053]">Not installed</p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-[#3373D9] hover:text-[#2A5BC7]"
                  >
                    <a
                      href={wallet.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      Install
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showSkip && (
          <div className="pt-4 border-t border-[#292A2E]">
            <Button
              onClick={onSkip}
              variant="ghost"
              className="w-full text-[#707073] hover:text-white"
              disabled={isConnecting}
            >
              Skip for now
            </Button>
            <p className="text-xs text-[#505053] text-center mt-2">
              You can connect your wallet later from your dashboard
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SolanaWalletConnect;