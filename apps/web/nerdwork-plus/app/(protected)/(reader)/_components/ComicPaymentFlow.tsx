"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Chapter } from "@/lib/types";
import NWT from "@/assets/nwt.svg";
import Success from "@/assets/sucess.svg";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import SpinLoader from "@/components/loader";
import { SetPinForm } from "@/app/(protected)/(reader)/_components/SetPinForm";
import { EnterPinForm } from "./EnterPinForm";
import { useUserSession } from "@/lib/api/queries";
import { toast } from "sonner";
import { setReaderPin } from "@/actions/profile.actions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { purchaseChapterComic } from "@/actions/comic.actions";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ModalStep =
  | "form"
  | "setPin"
  | "enterPin"
  | "pinLoading"
  | "loading"
  | "success";

const ComicPaymentFlow = ({
  chapter,
  internal = false,
}: {
  chapter: Chapter;
  internal: boolean;
}) => {
  const [step, setStep] = useState<ModalStep>("form");
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;
  const { profile, refetch } = useUserSession();
  const queryClient = useQueryClient();

  const pathname = usePathname();
  const pathSegments = pathname.split("/");
  const chapterIndex = pathSegments.indexOf("chapter");
  const basePath = internal
    ? pathSegments.slice(0, chapterIndex).join("/")
    : pathname;

  const walletBalance = profile?.readerProfile?.walletBalance;
  const chapterPrice = chapter?.price ?? 0;

  const pinHash = profile?.readerProfile?.pinHash;
  const hasPin = pinHash ? true : false;

  const handleOpenChange = (open: boolean) => {
    if (!open && step !== "loading") {
      setIsOpen(false);
      setStep("form");
    } else if (open) {
      setIsOpen(true);
    }
  };

  const handleContinue = () => {
    if (walletBalance < chapterPrice) return;
    if (hasPin) {
      setStep("enterPin");
    } else {
      setStep("setPin");
    }
  };

  const handleSetPin = async (pin: string) => {
    setStep("pinLoading");
    try {
      const response = await setReaderPin(pin);

      if (!response?.success) {
        toast.error(
          response?.message ?? "An error occurred while submitting the form."
        );
        setStep("setPin");
        return;
      }

      await refetch();
      toast.success("Pin set successfully!");
      setStep("enterPin");
    } catch (err) {
      toast.error("An unexpected error occurred.");
      setStep("setPin");
      console.error(err);
    }
  };

  const handlePinSubmission = async (pin: string) => {
    setStep("loading");
    try {
      const response = await purchaseChapterComic(
        chapterPrice,
        pin,
        chapter.id
      );

      if (!response?.success) {
        toast.error(
          response?.message ?? "An error occurred while submitting the form."
        );
        setStep("enterPin");
        return;
      }

      refetch();
      toast.success("Chapter Purchased Successfully!");
      setStep("success");
      await queryClient.invalidateQueries({
        queryKey: ["reader-transactions"],
      });
    } catch (err) {
      toast.error("An unexpected error occurred.");
      setStep("enterPin");
      console.error(err);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild className="flex justify-center">
          {internal ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"outline"}
                  className="text-center cursor-pointer gap-3 mx-auto hover:bg-nerd-default hover:text-white"
                >
                  <Lock />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unlock Chapter</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant={"outline"}
              className="text-center cursor-pointer gap-2 mx-auto hover:bg-nerd-default hover:text-white"
            >
              Unlock {chapterPrice}
              <Image src={NWT} width={18} height={18} alt="nwt" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="bg-[#1E1E1E] min-w-[275px] text-white font-inter border-none space-y-3 text-sm">
          <DialogHeader className={`${step !== "form" ? "hidden" : ""}`}>
            <DialogTitle className="font-semibold text-2xl">
              Unlock Chapter
            </DialogTitle>
            <DialogDescription className="sr-only">
              Please proceed to unlock the chapter
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Form with Price and Balance */}
          {step === "form" && (
            <section className="space-y-6">
              <div className="flex items-center justify-between font-semibold p-4 border border-[#FFFFFF1A] rounded-[12px]">
                <p>
                  {chapter?.comicTitle} #{chapter?.serialNo}: {chapter?.title}
                </p>
                <p className="flex items-center gap-2">
                  {chapterPrice}{" "}
                  <Image src={NWT} width={14} height={14} alt="nwt" />
                </p>
              </div>
              <div className="space-y-3">
                <p>Your Wallet</p>
                <div className="flex items-center justify-between font-semibold p-4 border border-[#FFFFFF1A] rounded-[12px]">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      {user?.profilePicture && (
                        <AvatarImage
                          src={user?.profilePicture}
                          alt={`${user.email} profile image`}
                        />
                      )}
                      {user?.email && (
                        <AvatarFallback className="uppercase">
                          {user?.email[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <p className="flex flex-col gap-1">
                      {profile?.readerProfile?.walletId}
                      <span className="text-nerd-muted">NWT Balance</span>
                    </p>
                  </div>
                  <p className="flex items-center gap-2">
                    {walletBalance}
                    <Image src={NWT} width={14} height={14} alt="nwt" />
                  </p>
                </div>
              </div>

              {walletBalance < chapterPrice && (
                <p className="text-[#BF6A02]">
                  You do not have enough funds. Buy SOL or deposit from another
                  account
                </p>
              )}

              <Button
                onClick={handleContinue}
                className="w-full"
                variant={"primary"}
                disabled={walletBalance < chapterPrice}
              >
                Continue
              </Button>
            </section>
          )}

          {step === "setPin" && (
            <SetPinForm
              onSetPin={handleSetPin} // This function will move to the loading state
              onBack={() => setStep("form")} // Function to go back to the previous step
            />
          )}

          {step === "enterPin" && (
            <EnterPinForm
              onVerifyPin={handlePinSubmission}
              onBack={() => setStep("form")}
            />
          )}

          {step === "pinLoading" && (
            <div className="flex flex-col items-center text-center py-10 gap-3 max-w-[275px] mx-auto">
              <SpinLoader />
              <p className="font-medium text-xl">Setting Pin</p>
              <p className="text-[#B3B3B3] text-sm">
                Please wait while we setup your pin.
              </p>
            </div>
          )}

          {/* Step 3: Loading Screen */}
          {step === "loading" && (
            <div className="flex flex-col items-center text-center py-10 gap-3 max-w-[275px] mx-auto">
              <SpinLoader />
              <p className="font-medium text-xl">Unlocking Comic</p>
              <p className="text-[#B3B3B3] text-sm">
                Please wait while we process your transaction. It will take no
                more than 30 seconds.
              </p>
            </div>
          )}

          {/* Step 4: Success Screen */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center py-10 gap-3 max-w-[275px] mx-auto">
              <Image src={Success} width={60} height={60} alt="success icon" />
              <p className="font-medium text-xl">Comic unlocked</p>
              <p className="text-[#F5F5F5] text-sm">
                Transaction was successful and comic added to library
              </p>
              <Link href={`${basePath}/chapter/${chapter.uniqueCode}`}>
                <Button className="w-full" variant={"primary"}>
                  Start Reading
                </Button>
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ComicPaymentFlow;
