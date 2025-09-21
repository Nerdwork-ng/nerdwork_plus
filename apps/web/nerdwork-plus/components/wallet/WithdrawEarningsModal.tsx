"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Helio from "@/assets/helio.svg";
import { toast } from "sonner";
import { useUserSession } from "@/lib/api/queries";

const WithdrawEarningsModal = () => {
  const [withdrawAmount, setWithdrawAmount] = React.useState(0);
  const { profile } = useUserSession();
  const creatorProfile = profile?.creatorProfile;

  const usdPerNwt = 0.1;
  const calculateUSD = (amount: number) => amount * usdPerNwt;
  const availableBalance = creatorProfile?.walletBalance; // NWT
  const usdEquivalent = calculateUSD(availableBalance);

  const transactionFee = 0.01; // 1%

  const handleWithdrawAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    setWithdrawAmount(isNaN(value) ? 0 : value);
  };

  const calculateFee = (amount: number) => {
    return amount * transactionFee;
  };

  const calculateTotal = (amount: number) => {
    return amount + calculateFee(amount);
  };

  const amountInNWT = withdrawAmount;
  const amountInUSD = (
    withdrawAmount *
    (usdEquivalent / availableBalance)
  ).toFixed(2);
  const feeNWT = calculateFee(withdrawAmount);
  const totalNWT = calculateTotal(withdrawAmount);

  const handleSubmit = () => {
    // console.log(totalNWT);
    toast.info("Proceeding to Helio for payment...");
  };

  return (
    <div>
      <Dialog>
        <form>
          <DialogTrigger asChild>
            <Button variant={"primary"}>
              <Send /> Withdraw Money
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#171719] font-inter text-white border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl">Withdraw Earnings</DialogTitle>
              <DialogDescription className="text-nerd-muted">
                Choose the amount of money you want to withdraw and continue to
                payment
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className={`py-3 px-3 border border-[#292A2E] rounded-md`}>
                <p>Available Balance</p>
                <p className="text-nerd-muted flex items-center justify-between">
                  {availableBalance ?? 0} NWT{" "}
                  <span>${usdEquivalent.toFixed(2) ?? 0.0}</span>
                </p>
              </div>

              <div
                className={`py-3 px-3 border border-[#292A2E] rounded-md flex items-center justify-between`}
              >
                <div>
                  <p>Solflare (Solana Wallet)</p>
                  <p className="text-nerd-muted">
                    {creatorProfile?.walletAddress?.slice(0, 4)}...
                    {creatorProfile?.walletAddress?.slice(-4)}
                  </p>
                  {!creatorProfile?.walletAddress && (
                    <span className="text-xs text-red-400">
                      Please connect a wallet to enable withdrawal
                    </span>
                  )}
                </div>
                {/* <Button className="bg-nerd-default w-fit">Edit Wallet</Button> */}
              </div>

              <div className="relative flex items-center space-x-2">
                <Input
                  type="number"
                  value={withdrawAmount === 0 ? "" : withdrawAmount}
                  onChange={handleWithdrawAmountChange}
                  placeholder="0 NWT"
                  className="bg-[#1D1E21] border-[#292A2E] text-white placeholder:text-nerd-muted"
                />
                <Button
                  variant="outline"
                  className="bg-transparent text-white"
                  onClick={() => setWithdrawAmount(availableBalance)}
                >
                  Max
                </Button>
              </div>
              <p className="text-sm text-[#E8794A]">
                Minimum amount is 25.00 NWT
              </p>
            </div>
            <div className="space-y-2 text-sm text-nerd-muted border-t pt-4 border-[#292A2E]">
              <div className="flex justify-between">
                <span>USD Amount</span>
                <span className="text-white">${amountInUSD}</span>
              </div>
              <div className="flex justify-between">
                <span>Token Equivalent</span>
                <span className="text-white">{amountInNWT} NWT</span>
              </div>
              <div className="flex justify-between pb-3">
                <span>1% Transaction Fee</span>
                <span className="text-white">{feeNWT} NWT</span>
              </div>
              <div className="flex justify-between border-t border-[#292A2E] pt-3 text-white">
                <span>Total to pay</span>
                <span>{totalNWT} NWT</span>
              </div>
            </div>

            <DialogFooter className="flex !flex-col">
              <Button
                onClick={handleSubmit}
                variant={"primary"}
                className="w-full mt-3"
                disabled={!creatorProfile?.walletAddress}
              >
                Continue to Payment
              </Button>
              <p className="text-xs text-center text-nerd-muted flex items-center justify-center gap-2">
                Powered by Helio{" "}
                <Image src={Helio} width={14} height={14} alt="helio" />
              </p>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </div>
  );
};

export default WithdrawEarningsModal;
