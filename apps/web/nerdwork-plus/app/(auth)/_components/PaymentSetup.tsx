"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import solflareLogo from "@/assets/creator/solflare.svg";
import phantomLogo from "@/assets/creator/phantom.svg";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Solflare from '@solflare-wallet/sdk';

const wallet = new Solflare();


export function PaymentDetailsForm() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const router = useRouter();
  const [solfareWallet, setSolfareWallet] = useState(false)

  // A function to simulate wallet detection. In a real app, you would
  // use a library like @solana/wallet-adapter to check for installed wallets.
  const walletDetected = (walletName: string) => {
   
    return solfareWallet? true:  false; // or false based on the check
  };

  const handleContinue =async () => {
    console.log("Selected wallet:", selectedWallet);
    const userAddress = await wallet.connect()
    // Proceed to the next step, e.g., connect to the wallet
    toast.info("Proceeding to wallet connection...", userAddress);
    // proceed to update user wallte address

    setTimeout(() => {
      router.push("/creator/comics");
    }, 3000);
  };

  useEffect(() => {
    wallet.detectWallet(1000)
    .then((data)=>{
      console.log(data)
      setSolfareWallet(data)
    })
    wallet.on('connect', () => {
      console.log('connected', wallet!.publicKey!.toString());
  });
  wallet.on('disconnect', () => {
      console.log('disconnected');
  });
  }, [])
  

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

        <Link href={"/creator/comics"}>
          <Button
            variant={"outline"}
            className="mt-4 w-full hover:bg-nerd-default hover:text-nerd-muted"
          >
            Skip
          </Button>
        </Link>
      </div>
    </div>
  );
}
