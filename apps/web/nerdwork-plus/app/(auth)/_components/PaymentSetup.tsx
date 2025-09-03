"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import solflareLogo from "@/assets/creator/solflare.svg";
import phantomLogo from "@/assets/creator/phantom.svg";
import Solflare from '@solflare-wallet/sdk';


export function PaymentDetailsForm() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const wallet = new Solflare();
  // A function to simulate wallet detection. In a real app, you would
  // use a library like @solana/wallet-adapter to check for installed wallets.
  const walletDetected = (walletName: string) => {
    // This is a placeholder. You would implement real detection logic here.
    console.log(walletName);
    return true; // or false based on the check
  };

  useEffect(() => {
    wallet.on('connect', () => {
      console.log("Wallet connected");
      setSelectedWallet("solflare");
      setIsConnected(true);
      setWalletAddress(wallet?.publicKey!.toString());
    });
  }, []);

  const handleContinue = async () => {
    console.log("Selected wallet:", selectedWallet);
   if (selectedWallet === "solflare") {
    await wallet.connect();
   }

   if (selectedWallet === "phantom") {
    await (window as any).phantom?.solana.connect();
   }
    // Proceed to the next step, e.g., connect to the wallet
    
  };

  return (
    <div className="flex flex-col items-center justify-center px-5 text-white min-h-[75vh]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl mb-3 font-bold text-center">
          Setup your payment details
        </h1>
        <p className="text-sm text-[#707073] text-center mb-8">
          If you don&apos;t have a wallet, choose a provider below to setup one
          now
        </p>

        <div className="space-y-4 mt-10">
          <div
            className={`py-2 px-3 flex items-center justify-between cursor-pointer transition-colors ${
              selectedWallet === "solflare"
                ? "rounded-[12px] bg-[#25262A]"
                : "hover:bg-neutral-800 rounded-[12px]"
            }`}
            onClick={() => setSelectedWallet("solflare")}
          >
            <div className="flex items-center space-x-4">
              <Image
                src={solflareLogo}
                alt="Solflare Wallet"
                width={32}
                height={32}
              />
              <div className="flex flex-col">
                <span className="text-sm">Solflare Wallet</span>
              </div>
            </div>
            {walletDetected("solflare") && (
              <span className="text-[#D9D9D9] text-sm">Detected</span>
            )}
          </div>

          <div
            className={`py-2 px-3 flex items-center justify-between cursor-pointer transition-colors ${
              selectedWallet === "phantom"
                ? "rounded-[12px] bg-[#25262A]"
                : "hover:bg-neutral-800 rounded-[12px]"
            }`}
            onClick={() => setSelectedWallet("phantom")}
          >
            <div className="flex items-center space-x-4">
              <Image
                src={phantomLogo}
                alt="Phantom Wallet"
                width={32}
                height={32}
              />
              <div className="flex flex-col">
                <span className="text-sm">Phantom Wallet</span>
              </div>
            </div>
            {walletDetected("phantom") && (
              <span className="text-[#D9D9D9] text-sm">Detected</span>
            )}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700"
          disabled={!selectedWallet}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
