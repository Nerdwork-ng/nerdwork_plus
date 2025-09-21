"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import solflareLogo from "@/assets/creator/solflare.svg";
// import phantomLogo from "@/assets/creator/phantom.svg";
import { toast } from "sonner";
import Solflare from "@solflare-wallet/sdk";
import { useUserSession } from "@/lib/api/queries";
import { setCreatorAddress } from "@/actions/profile.actions";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const wallet = new Solflare();

export function ConnectWalletModal() {
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const { refetch } = useUserSession();

  // const walletDetected = (walletName: string) => {
  //   console.log(walletName);
  //   return wallet.isConnected;
  // };

  const handleContinue = async () => {
    await wallet.connect();

    if (wallet!.publicKey!.toString()) {
      toast.info("Wallet Detected. Processing...");
    } else {
      toast.info("Wallet not  Connected... ");
    }

    console.log(wallet!.publicKey!.toString());
    try {
      const response = await setCreatorAddress(
        wallet!.publicKey!.toString(),
        selectedWallet
      );
      console.log(response);

      if (!response?.success) {
        toast.error(
          response?.message ?? "An error occurred while submitting the form."
        );
        return;
      }

      await refetch();
      toast.success("Wallet address updated successfully!");
    } catch (err) {
      toast.error("An unexpected error occurred.");
      console.error(err);
    }
  };

  useEffect(() => {
    wallet.on("connect", () => {
      toast.info("Wallet Connected... " + wallet!.publicKey!.toString());
      console.log("connected", wallet!.publicKey!.toString());
    });
    wallet.on("disconnect", () => {
      toast.info("Wallet Disconnected... ");
      console.log("disconnected");
    });
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"secondary"} className="w-fit font-inter">
          Connect Wallet
        </Button>
      </DialogTrigger>
      <div className="flex flex-col items-center justify-center font-inter px-5 text-white">
        <DialogContent className="w-full max-w-sm bg-[#171719] font-inter border-nerd-default text-white">
          <DialogTitle className="text-2xl mb-3 font-bold text-center">
            Setup your payment details
          </DialogTitle>
          <p className="text-sm text-[#707073] text-center">
            If you don&apos;t have a wallet, choose a provider below to setup
            one now
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
              {/* {walletDetected("solflare") && (
                <span className="text-[#D9D9D9] text-sm">Detected</span>
              )} */}
            </div>
            {/* <div
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
            </div> */}
          </div>
          <Button
            onClick={handleContinue}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!selectedWallet}
          >
            Continue
          </Button>
        </DialogContent>
      </div>
    </Dialog>
  );
}
